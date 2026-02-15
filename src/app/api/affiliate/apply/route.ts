import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const applicationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  email: z.string().email("Please enter a valid email address"),
  companyDescription: z
    .string()
    .min(30, "Please provide at least 30 characters describing your audience")
    .max(2000),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = applicationSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Invalid submission"
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { name, email, companyDescription } = parsed.data

    // Prevent duplicate applications from the same email address
    const existing = await prisma.affiliateApplication.findFirst({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      if (existing.status === "APPROVED") {
        return NextResponse.json(
          { error: "This email address is already associated with an approved affiliate partner." },
          { status: 409 }
        )
      }
      if (existing.status === "PENDING") {
        return NextResponse.json(
          { error: "An application from this email address is already under review." },
          { status: 409 }
        )
      }
      // REJECTED — allow reapplication by updating the record
      await prisma.affiliateApplication.update({
        where: { id: existing.id },
        data: {
          name,
          companyDescription,
          status: "PENDING",
          reviewedAt: null,
          reviewedById: null,
          reviewNotes: null,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, reapplication: true })
    }

    await prisma.affiliateApplication.create({
      data: {
        name,
        email: email.toLowerCase(),
        companyDescription,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Affiliate application error:", error)
    return NextResponse.json(
      { error: "Server error. Please try again later." },
      { status: 500 }
    )
  }
}
