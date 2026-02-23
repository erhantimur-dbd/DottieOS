import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Edit, Check, X, Clock, Send } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default async function DailyUpdatesPage() {
  const user = await requireAuth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const children = await prisma.child.findMany({
    where: { organisationId: user.organisationId },
    include: {
      guardians: {
        include: { guardian: true }
      },
      dailyNotes: {
        where: { date: today },
        take: 1
      },
      dailyUpdates: {
        where: { date: today },
        include: {
          approval: {
            include: { approvedBy: true }
          }
        },
        take: 1
      }
    },
    orderBy: { firstName: 'asc' }
  })

  const statusColors: Record<string, { variant: any; icon: any; text: string }> = {
    DRAFT: { variant: 'secondary', icon: Edit, text: 'Draft' },
    NEEDS_APPROVAL: { variant: 'warning', icon: Clock, text: 'Needs Approval' },
    APPROVED: { variant: 'success', icon: Check, text: 'Approved' },
    SENT: { variant: 'default', icon: Send, text: 'Sent' },
    MISSED: { variant: 'danger', icon: X, text: 'Missed' },
    FAILED: { variant: 'danger', icon: X, text: 'Failed' }
  }

  const needsApprovalCount = children.filter(
    c => c.dailyUpdates[0]?.status === 'NEEDS_APPROVAL'
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Updates</h1>
          <p className="text-gray-600 mt-1">
            Manage and send daily updates to parents
          </p>
        </div>
        <div className="flex gap-2">
          {needsApprovalCount > 0 && (
            <Link href="/daily-updates/approval-queue">
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Approval Queue ({needsApprovalCount})
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-4">
        <h3 className="font-semibold mb-1">Today: {formatDate(today)}</h3>
        <p className="text-sm text-gray-700">
          Create daily notes for each child, then approve to send updates at the scheduled time (17:00).
        </p>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No children registered</h3>
            <p className="text-gray-600 text-center mb-4">
              Add children to start creating daily updates.
            </p>
            <Link href="/children">
              <Button>Go to Children</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            const dailyNote = child.dailyNotes[0]
            const dailyUpdate = child.dailyUpdates[0]
            const status = dailyUpdate?.status || 'DRAFT'
            const statusConfig = statusColors[status] || statusColors.DRAFT
            const StatusIcon = statusConfig.icon

            const hasNotes = dailyNote && (
              dailyNote.wellbeing || dailyNote.meals || dailyNote.naps ||
              dailyNote.toileting || dailyNote.activities || dailyNote.notableEvents
            )

            const hasGuardians = child.guardians.length > 0
            const hasContactInfo = child.guardians.some(
              g => g.guardian.email || g.guardian.phone
            )

            return (
              <Card key={child.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {child.firstName} {child.lastName}
                      </CardTitle>
                      {child.room && (
                        <p className="text-sm text-gray-600 mt-1">{child.room}</p>
                      )}
                    </div>
                    <Badge variant={statusConfig.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.text}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!hasGuardians && (
                    <div className="bg-yellow-50 border-2 border-yellow-600 rounded-md p-2 text-xs text-yellow-800">
                      ⚠️ No guardians linked
                    </div>
                  )}

                  {hasGuardians && !hasContactInfo && (
                    <div className="bg-yellow-50 border-2 border-yellow-600 rounded-md p-2 text-xs text-yellow-800">
                      ⚠️ Missing guardian contact info
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Guardians:</span>
                      <span className="font-medium">{child.guardians.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes:</span>
                      <span className={hasNotes ? "text-green-600 font-medium" : "text-gray-400"}>
                        {hasNotes ? 'Complete' : 'Not started'}
                      </span>
                    </div>
                    {dailyUpdate?.approval && (
                      <div className="pt-2 border-t text-xs text-gray-600">
                        Approved by {dailyUpdate.approval.approvedBy.name}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/daily-updates/${child.id}/${today.toISOString().split('T')[0]}`}
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      {hasNotes ? (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Notes
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Create Notes
                        </>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
