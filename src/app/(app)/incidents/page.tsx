import { requireAuth, isAdmin, isSupervisorOrAbove } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Check, X } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { IncidentFormDialog } from "./incident-form"
import { MarkNotifiedButton, DeleteIncidentButton } from "./incident-actions"

function toDateInput(d: Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

export default async function IncidentsPage() {
  const user = await requireAuth()
  // Incidents are safeguarding records: only supervisors+ may amend them and
  // only admins may delete them (also enforced server-side).
  const canEdit = isSupervisorOrAbove(user.role)
  const canDelete = isAdmin(user.role)

  const [incidents, children] = await Promise.all([
    prisma.incidentLog.findMany({
      where: { organisationId: user.organisationId },
      include: {
        child: true,
        createdBy: true
      },
      orderBy: { date: 'desc' }
    }),
    prisma.child.findMany({
      where: { organisationId: user.organisationId },
      orderBy: { firstName: 'asc' }
    })
  ])

  const childOptions = children.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))

  const notified = incidents.filter(i => i.parentNotified).length
  const notNotified = incidents.filter(i => !i.parentNotified).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Incident & Accident Log</h1>
          <p className="text-gray-600 mt-1">
            Record and manage incidents and accidents
          </p>
        </div>
        <IncidentFormDialog childOptions={childOptions} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{incidents.length}</div>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Parent Notified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{notified}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Not Notified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{notNotified}</div>
            <p className="text-xs text-gray-600 mt-1">Requires action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {incidents.filter(i => {
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                return new Date(i.date) > monthAgo
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No incidents logged</h3>
              <p className="text-gray-600 text-center mb-4">
                Record incidents and accidents when they occur.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`p-4 border-2 rounded-md ${
                    incident.parentNotified ? 'border-gray-200' : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold">
                          {incident.child.firstName} {incident.child.lastName}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{incident.description}</p>
                      {incident.actionTaken && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Action taken:</span> {incident.actionTaken}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{formatDate(incident.date)} at {incident.time}</span>
                        {incident.createdBy && (
                          <span>• Logged by {incident.createdBy.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {incident.parentNotified ? (
                        <Badge variant="success">
                          <Check className="h-3 w-3 mr-1" />
                          Parent notified
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <X className="h-3 w-3 mr-1" />
                          Not notified
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        {!incident.parentNotified && (
                          <MarkNotifiedButton id={incident.id} />
                        )}
                        {canEdit && (
                          <IncidentFormDialog
                            childOptions={childOptions}
                            incident={{
                              id: incident.id,
                              childId: incident.childId,
                              date: toDateInput(incident.date),
                              time: incident.time,
                              description: incident.description,
                              actionTaken: incident.actionTaken,
                              witnesses: incident.witnesses,
                            }}
                          />
                        )}
                        {canDelete && <DeleteIncidentButton id={incident.id} />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
