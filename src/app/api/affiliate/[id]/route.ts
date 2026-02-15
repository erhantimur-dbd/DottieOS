import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, isAdmin } from "@/lib/auth"
import { z } from "zod"

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reviewNotes: z.string().max(1000).optional(),
})

function generateReferralCode(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(4, "X")
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${base}-${suffix}`
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const parsed = actionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { action, reviewNotes } = parsed.data

    const application = await prisma.affiliateApplication.findUnique({
      where: { id },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending applications can be actioned" },
        { status: 409 }
      )
    }

    if (action === "APPROVE") {
      // Generate a unique referral code, retry if collision
      let referralCode = generateReferralCode(application.name)
      let attempts = 0
      while (attempts < 5) {
        const collision = await prisma.affiliateApplication.findUnique({
          where: { referralCode },
        })
        if (!collision) break
        referralCode = generateReferralCode(application.name)
        attempts++
      }

      await prisma.affiliateApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: user.id,
          reviewNotes: reviewNotes || null,
          referralCode,
          approvedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, referralCode })
    }

    // REJECT
    await prisma.affiliateApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: user.id,
        reviewNotes: reviewNotes || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Affiliate action error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
