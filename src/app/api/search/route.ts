import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export interface SearchResult {
  type: "Child" | "Guardian" | "Task" | "Incident"
  id: string
  title: string
  subtitle: string
  href: string
}

export async function GET(req: NextRequest) {
  let user
  try {
    user = await requireAuth()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const org = user.organisationId
  const contains = { contains: q, mode: "insensitive" as const }

  const [children, guardians, tasks, incidents] = await Promise.all([
    prisma.child.findMany({
      where: { organisationId: org, OR: [{ firstName: contains }, { lastName: contains }] },
      take: 5,
    }),
    prisma.guardian.findMany({
      where: {
        organisationId: org,
        OR: [{ firstName: contains }, { lastName: contains }, { email: contains }],
      },
      include: { children: { include: { child: true }, take: 1 } },
      take: 5,
    }),
    prisma.task.findMany({
      where: { organisationId: org, title: contains },
      take: 5,
    }),
    prisma.incidentLog.findMany({
      where: { organisationId: org, description: contains },
      include: { child: true },
      take: 5,
    }),
  ])

  const results: SearchResult[] = [
    ...children.map((c) => ({
      type: "Child" as const,
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: c.room ? `Room: ${c.room}` : "Child",
      href: `/children/${c.id}`,
    })),
    ...guardians.map((g) => ({
      type: "Guardian" as const,
      id: g.id,
      title: `${g.firstName} ${g.lastName}`,
      subtitle: g.children[0]?.child
        ? `Guardian of ${g.children[0].child.firstName}`
        : g.relationship,
      href: g.children[0]?.child ? `/children/${g.children[0].child.id}` : "/children",
    })),
    ...tasks.map((t) => ({
      type: "Task" as const,
      id: t.id,
      title: t.title,
      subtitle: `Task • ${t.status}`,
      href: "/tasks",
    })),
    ...incidents.map((i) => ({
      type: "Incident" as const,
      id: i.id,
      title: i.description.slice(0, 60),
      subtitle: `Incident • ${i.child.firstName} ${i.child.lastName}`,
      href: "/incidents",
    })),
  ]

  return NextResponse.json({ results })
}
