import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deliverDailyUpdate } from "@/lib/daily-updates/send"

export const dynamic = "force-dynamic"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function startOfTodayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

/**
 * Scheduled sender for approved daily updates. Intended to run frequently (e.g. hourly
 * via Vercel Cron). For each organisation, once the configured send time has passed on
 * a scheduled day, it delivers every APPROVED update dated today and marks still-unapproved
 * updates for today as MISSED.
 *
 * Secured by a bearer token: Authorization: Bearer $CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = startOfTodayUTC()
  const now = new Date()
  const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes()
  const todayName = DAY_NAMES[now.getUTCDay()]

  const orgs = await prisma.organisation.findMany()
  const results: Record<string, unknown>[] = []

  for (const org of orgs) {
    const scheduleTime = org.dailyUpdateScheduleTime || "17:00"
    const [h, m] = scheduleTime.split(":").map((n) => parseInt(n, 10))
    const scheduleMinutes = (isNaN(h) ? 17 : h) * 60 + (isNaN(m) ? 0 : m)

    let days: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    if (org.dailyUpdateScheduleDays) {
      try {
        const parsed = JSON.parse(org.dailyUpdateScheduleDays)
        if (Array.isArray(parsed) && parsed.length) days = parsed
      } catch {
        /* keep default */
      }
    }

    const isScheduledDay = days.includes(todayName)
    const timeReached = minutesNow >= scheduleMinutes
    if (!isScheduledDay || !timeReached) {
      results.push({ org: org.id, skipped: true, reason: !isScheduledDay ? "not a scheduled day" : "before send time" })
      continue
    }

    const approved = await prisma.dailyUpdate.findMany({
      where: { organisationId: org.id, date: today, status: "APPROVED" },
    })

    let sent = 0
    for (const update of approved) {
      const summary = await deliverDailyUpdate(update.id, { id: null, name: "Scheduled send" })
      if (summary.sent > 0) sent++
    }

    // Anything still not approved by send time is recorded as MISSED.
    const missed = await prisma.dailyUpdate.updateMany({
      where: { organisationId: org.id, date: today, status: { in: ["DRAFT", "NEEDS_APPROVAL"] } },
      data: { status: "MISSED" },
    })

    results.push({ org: org.id, approvedFound: approved.length, sent, missed: missed.count })
  }

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), results })
}
