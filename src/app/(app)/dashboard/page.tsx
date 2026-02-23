import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ClipboardCheck,
  CreditCard,
  FileWarning,
  MessageSquare,
  Shield,
  CheckCircle2,
  AlertCircle
} from "lucide-react"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Fetch dashboard metrics
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalChildren,
    todayAttendance,
    overduePayments,
    missingConsents,
    pendingApprovals,
    tasksDueToday,
    evidenceReadiness
  ] = await Promise.all([
    // Total children
    prisma.child.count({
      where: { organisationId: user.organisationId }
    }),
    // Today's attendance
    prisma.attendance.count({
      where: {
        organisationId: user.organisationId,
        date: today,
        status: 'PRESENT'
      }
    }),
    // Overdue payments
    prisma.paymentInvoice.count({
      where: {
        organisationId: user.organisationId,
        status: 'OVERDUE'
      }
    }),
    // Missing/expired consents
    prisma.consentRecord.count({
      where: {
        organisationId: user.organisationId,
        OR: [
          { status: 'MISSING' },
          { status: 'EXPIRED' }
        ]
      }
    }),
    // Daily updates pending approval
    prisma.dailyUpdate.count({
      where: {
        organisationId: user.organisationId,
        date: today,
        status: 'NEEDS_APPROVAL'
      }
    }),
    // Tasks due today
    prisma.task.count({
      where: {
        organisationId: user.organisationId,
        status: { not: 'COMPLETED' },
        dueDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    }),
    // Evidence readiness
    prisma.evidenceItem.findMany({
      where: { organisationId: user.organisationId },
      select: { status: true }
    })
  ])

  const evidenceReady = evidenceReadiness.filter(e => e.status === 'READY').length
  const evidenceTotal = evidenceReadiness.length
  const evidenceScore = evidenceTotal > 0 ? Math.round((evidenceReady / evidenceTotal) * 100) : 0

  const metrics = [
    {
      title: "Total Children",
      value: totalChildren,
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Checked In Today",
      value: `${todayAttendance} / ${totalChildren}`,
      icon: ClipboardCheck,
      color: "text-green-600"
    },
    {
      title: "Overdue Payments",
      value: overduePayments,
      icon: CreditCard,
      color: overduePayments > 0 ? "text-red-600" : "text-gray-600",
      alert: overduePayments > 0
    },
    {
      title: "Missing Consents",
      value: missingConsents,
      icon: FileWarning,
      color: missingConsents > 0 ? "text-orange-600" : "text-gray-600",
      alert: missingConsents > 0
    },
    {
      title: "Updates Pending Approval",
      value: pendingApprovals,
      icon: MessageSquare,
      color: pendingApprovals > 0 ? "text-purple-600" : "text-gray-600",
      alert: pendingApprovals > 0
    },
    {
      title: "Tasks Due Today",
      value: tasksDueToday,
      icon: CheckCircle2,
      color: "text-blue-600"
    },
    {
      title: "Inspection Readiness",
      value: `${evidenceScore}%`,
      icon: Shield,
      color: evidenceScore >= 80 ? "text-green-600" : evidenceScore >= 50 ? "text-orange-600" : "text-red-600",
      subtitle: `${evidenceReady} of ${evidenceTotal} items ready`
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your childcare operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                {metric.alert ? (
                  <AlertCircle className={`h-5 w-5 ${metric.color}`} />
                ) : (
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metric.value}</div>
                {metric.subtitle && (
                  <p className="text-xs text-gray-600 mt-1">{metric.subtitle}</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/registers"
              className="flex items-center justify-between p-3 border-2 border-black rounded-md hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Mark Attendance</span>
              <ClipboardCheck className="h-5 w-5" />
            </a>
            <a
              href="/daily-updates/approval-queue"
              className="flex items-center justify-between p-3 border-2 border-black rounded-md hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Approve Daily Updates</span>
              {pendingApprovals > 0 && (
                <Badge variant="danger">{pendingApprovals}</Badge>
              )}
            </a>
            <a
              href="/payments"
              className="flex items-center justify-between p-3 border-2 border-black rounded-md hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Chase Payments</span>
              {overduePayments > 0 && (
                <Badge variant="danger">{overduePayments}</Badge>
              )}
            </a>
            <a
              href="/tasks"
              className="flex items-center justify-between p-3 border-2 border-black rounded-md hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">View Tasks</span>
              {tasksDueToday > 0 && (
                <Badge variant="warning">{tasksDueToday}</Badge>
              )}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Attendance Records</span>
              <Badge variant={todayAttendance > 0 ? "success" : "secondary"}>
                {todayAttendance > 0 ? "Up to date" : "Not started"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Consent Coverage</span>
              <Badge variant={missingConsents === 0 ? "success" : "danger"}>
                {missingConsents === 0 ? "Complete" : `${missingConsents} missing`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment Status</span>
              <Badge variant={overduePayments === 0 ? "success" : "danger"}>
                {overduePayments === 0 ? "All paid" : `${overduePayments} overdue`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Inspection Readiness</span>
              <Badge variant={evidenceScore >= 80 ? "success" : evidenceScore >= 50 ? "warning" : "danger"}>
                {evidenceScore}% ready
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
