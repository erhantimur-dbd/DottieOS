import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, Eye } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default async function DailyUpdateEditPage({
  params
}: {
  params: Promise<{ childId: string; date: string }>
}) {
  const user = await requireAuth()
  const { childId, date } = await params

  const child = await prisma.child.findUnique({
    where: {
      id: childId,
      organisationId: user.organisationId
    },
    include: {
      guardians: {
        include: { guardian: true }
      }
    }
  })

  if (!child) {
    notFound()
  }

  const updateDate = new Date(date)

  const [dailyNote, dailyUpdate] = await Promise.all([
    prisma.dailyNote.findUnique({
      where: {
        childId_date: {
          childId: child.id,
          date: updateDate
        }
      }
    }),
    prisma.dailyUpdate.findUnique({
      where: {
        childId_date: {
          childId: child.id,
          date: updateDate
        }
      },
      include: {
        approval: {
          include: { approvedBy: true }
        }
      }
    })
  ])

  const statusColors: Record<string, { variant: any; text: string }> = {
    DRAFT: { variant: 'secondary', text: 'Draft' },
    NEEDS_APPROVAL: { variant: 'warning', text: 'Needs Approval' },
    APPROVED: { variant: 'success', text: 'Approved' },
    SENT: { variant: 'default', text: 'Sent' },
    MISSED: { variant: 'danger', text: 'Missed' }
  }

  const status = dailyUpdate?.status || 'DRAFT'
  const statusConfig = statusColors[status] || statusColors.DRAFT

  const hasContactInfo = child.guardians.some(g => g.guardian.email || g.guardian.phone)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/daily-updates">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Daily Update - {child.firstName} {child.lastName}
            </h1>
            <p className="text-gray-600 mt-1">{formatDate(updateDate)}</p>
          </div>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.text}</Badge>
      </div>

      {!hasContactInfo && (
        <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-1">⚠️ Warning</h3>
          <p className="text-sm text-yellow-800">
            No guardians have contact information. This update cannot be sent. Please add guardian email or phone numbers.
          </p>
        </div>
      )}

      {dailyUpdate?.approval && (
        <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-1">✓ Approved</h3>
          <p className="text-sm text-green-800">
            This update was approved by {dailyUpdate.approval.approvedBy.name} on{' '}
            {formatDate(dailyUpdate.approval.approvedAt)}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daily Notes</CardTitle>
          <p className="text-sm text-gray-600">
            Record today&apos;s activities and observations for {child.firstName}
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="wellbeing">Wellbeing & Mood</Label>
              <Textarea
                id="wellbeing"
                placeholder="How was the child's mood and general wellbeing today?"
                defaultValue={dailyNote?.wellbeing || ''}
                rows={2}
              />
              <p className="text-xs text-gray-600">
                e.g., "Happy and energetic", "A bit tired but settled well"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meals">Meals & Snacks</Label>
              <Textarea
                id="meals"
                placeholder="What did the child eat today?"
                defaultValue={dailyNote?.meals || ''}
                rows={2}
              />
              <p className="text-xs text-gray-600">
                e.g., "Ate all breakfast, most of lunch, enjoyed fruit at snack time"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="naps">Naps & Rest</Label>
              <Textarea
                id="naps"
                placeholder="Did the child nap? For how long?"
                defaultValue={dailyNote?.naps || ''}
                rows={2}
              />
              <p className="text-xs text-gray-600">
                e.g., "Slept 2 hours (12:30-14:30)", "No nap today"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="toileting">Toileting</Label>
              <Textarea
                id="toileting"
                placeholder="Nappy changes or toilet visits"
                defaultValue={dailyNote?.toileting || ''}
                rows={2}
              />
              <p className="text-xs text-gray-600">
                e.g., "3 nappy changes", "2 successful toilet visits"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activities">Activities</Label>
              <Textarea
                id="activities"
                placeholder="What activities did the child participate in?"
                defaultValue={dailyNote?.activities || ''}
                rows={3}
              />
              <p className="text-xs text-gray-600">
                e.g., "Painting, outdoor play, story time, building blocks"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notableEvents">Notable Events (Optional)</Label>
              <Textarea
                id="notableEvents"
                placeholder="Any special moments or concerns to share?"
                defaultValue={dailyNote?.notableEvents || ''}
                rows={2}
              />
              <p className="text-xs text-gray-600">
                e.g., "Shared toys nicely with friends", "Enjoyed singing session"
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Notes
              </Button>
              <Button type="button" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview Message
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recipients ({child.guardians.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {child.guardians.length === 0 ? (
            <p className="text-gray-600 text-center py-4">
              No guardians linked to this child
            </p>
          ) : (
            <div className="space-y-3">
              {child.guardians.map(({ guardian, isPrimary }) => (
                <div
                  key={guardian.id}
                  className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-md"
                >
                  <div>
                    <p className="font-medium">
                      {guardian.firstName} {guardian.lastName}
                      {isPrimary && (
                        <Badge variant="default" className="ml-2 text-xs">
                          Primary
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {guardian.email || guardian.phone || 'No contact info'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {guardian.preferredChannel}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-2 border-blue-600">
        <CardHeader>
          <CardTitle className="text-blue-900">How Daily Updates Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Save your daily notes for the child</li>
            <li>Notes are automatically compiled into a message</li>
            <li>A supervisor must approve the update before it can be sent</li>
            <li>Once approved, the update will be sent at the scheduled time (17:00)</li>
            <li>Messages are sent via each guardian&apos;s preferred channel (Email or WhatsApp)</li>
            <li>All sent messages are logged with a complete audit trail</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
