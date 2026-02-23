import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Eye, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default async function ApprovalQueuePage() {
  const user = await requireAuth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dailyUpdates = await prisma.dailyUpdate.findMany({
    where: {
      organisationId: user.organisationId,
      date: today,
      status: {
        in: ['NEEDS_APPROVAL', 'APPROVED']
      }
    },
    include: {
      child: {
        include: {
          guardians: {
            include: { guardian: true }
          }
        }
      },
      approval: {
        include: { approvedBy: true }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  const needsApproval = dailyUpdates.filter(u => u.status === 'NEEDS_APPROVAL')
  const approved = dailyUpdates.filter(u => u.status === 'APPROVED')

  // Get the corresponding daily notes
  const dailyNotes = await prisma.dailyNote.findMany({
    where: {
      childId: { in: dailyUpdates.map(u => u.childId) },
      date: today
    }
  })

  const notesMap = new Map(dailyNotes.map(n => [n.childId, n]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/daily-updates">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Approval Queue</h1>
            <p className="text-gray-600 mt-1">
              Review and approve daily updates before sending
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Needs Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{needsApproval.length}</div>
            <p className="text-xs text-gray-600 mt-1">Updates pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approved.length}</div>
            <p className="text-xs text-gray-600 mt-1">Ready to send at 17:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dailyUpdates.length > 0
                ? Math.round((approved.length / dailyUpdates.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {approved.length} of {dailyUpdates.length} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {dailyUpdates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No updates to approve</h3>
            <p className="text-gray-600 text-center mb-4">
              Create daily notes for children to see them here for approval.
            </p>
            <Link href="/daily-updates">
              <Button>Go to Daily Updates</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {needsApproval.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Needs Approval ({needsApproval.length})</h2>
              <div className="space-y-4">
                {needsApproval.map((update) => {
                  const child = update.child
                  const notes = notesMap.get(child.id)
                  const hasContactInfo = child.guardians.some(
                    g => g.guardian.email || g.guardian.phone
                  )

                  return (
                    <Card key={update.id} className="border-2 border-orange-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl">
                              {child.firstName} {child.lastName}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {child.guardians.length} guardian{child.guardians.length !== 1 ? 's' : ''}
                              {child.room && ` • ${child.room}`}
                            </p>
                          </div>
                          <Badge variant="warning">Needs Approval</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!hasContactInfo && (
                          <div className="bg-yellow-50 border-2 border-yellow-600 rounded-md p-3 flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-semibold text-yellow-900 text-sm">Warning</p>
                              <p className="text-sm text-yellow-800">
                                No guardians have email or phone number. Update will not be sent.
                              </p>
                            </div>
                          </div>
                        )}

                        {notes && (
                          <div className="bg-gray-50 border-2 border-gray-200 rounded-md p-4 space-y-3">
                            <h4 className="font-semibold text-sm">Daily Notes Preview</h4>
                            {notes.wellbeing && (
                              <div>
                                <p className="text-xs font-medium text-gray-600">Wellbeing</p>
                                <p className="text-sm">{notes.wellbeing}</p>
                              </div>
                            )}
                            {notes.meals && (
                              <div>
                                <p className="text-xs font-medium text-gray-600">Meals</p>
                                <p className="text-sm">{notes.meals}</p>
                              </div>
                            )}
                            {notes.naps && (
                              <div>
                                <p className="text-xs font-medium text-gray-600">Naps</p>
                                <p className="text-sm">{notes.naps}</p>
                              </div>
                            )}
                            {notes.activities && (
                              <div>
                                <p className="text-xs font-medium text-gray-600">Activities</p>
                                <p className="text-sm">{notes.activities}</p>
                              </div>
                            )}
                            {notes.notableEvents && (
                              <div>
                                <p className="text-xs font-medium text-gray-600">Notable Events</p>
                                <p className="text-sm">{notes.notableEvents}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link
                            href={`/daily-updates/${child.id}/${today.toISOString().split('T')[0]}`}
                            className="flex-1"
                          >
                            <Button variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View & Edit
                            </Button>
                          </Link>
                          <Button className="flex-1">
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {approved.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Approved ({approved.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approved.map((update) => {
                  const child = update.child

                  return (
                    <Card key={update.id} className="border-2 border-green-200">
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
                          <Badge variant="success">
                            <Check className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {update.approval && (
                          <p className="text-sm text-gray-600">
                            By {update.approval.approvedBy.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-600">
                          Will be sent to {child.guardians.length} guardian{child.guardians.length !== 1 ? 's' : ''} at 17:00
                        </p>
                        <Link
                          href={`/daily-updates/${child.id}/${today.toISOString().split('T')[0]}`}
                        >
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
