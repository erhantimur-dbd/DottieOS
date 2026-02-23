import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Mail, Phone, User, Calendar, Heart, AlertCircle } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth()
  const { id } = await params

  const child = await prisma.child.findUnique({
    where: {
      id,
      organisationId: user.organisationId
    },
    include: {
      guardians: {
        include: {
          guardian: true
        },
        orderBy: {
          isPrimary: 'desc'
        }
      },
      assignments: {
        include: {
          user: true
        }
      },
      consentRecords: {
        include: {
          template: true
        }
      },
      attendance: {
        orderBy: {
          date: 'desc'
        },
        take: 10
      },
      paymentInvoices: {
        orderBy: {
          dueDate: 'desc'
        },
        take: 5
      }
    }
  })

  if (!child) {
    notFound()
  }

  const age = Math.floor(
    (new Date().getTime() - new Date(child.dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  )

  const keyPerson = child.assignments.find(a => a.userId === child.keyPersonId)?.user
  const missingConsents = child.consentRecords.filter(c => c.status === 'MISSING' || c.status === 'EXPIRED')
  const overduePayments = child.paymentInvoices.filter(p => p.status === 'OVERDUE')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/children">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {child.firstName} {child.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              {age} years old • Started {formatDate(child.startDate)}
            </p>
          </div>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Details
        </Button>
      </div>

      {(missingConsents.length > 0 || overduePayments.length > 0) && (
        <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Attention Required</h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                {missingConsents.length > 0 && (
                  <li>• {missingConsents.length} consent{missingConsents.length > 1 ? 's' : ''} missing or expired</li>
                )}
                {overduePayments.length > 0 && (
                  <li>• {overduePayments.length} payment{overduePayments.length > 1 ? 's' : ''} overdue</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium">{formatDate(child.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">{formatDate(child.startDate)}</p>
                </div>
                {child.room && (
                  <div>
                    <p className="text-sm text-gray-600">Room/Group</p>
                    <Badge variant="secondary">{child.room}</Badge>
                  </div>
                )}
                {keyPerson && (
                  <div>
                    <p className="text-sm text-gray-600">Key Person</p>
                    <p className="font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      {keyPerson.name}
                    </p>
                  </div>
                )}
              </div>

              {child.dietaryNeeds && (
                <div>
                  <p className="text-sm text-gray-600">Dietary Needs</p>
                  <p className="font-medium">{child.dietaryNeeds}</p>
                </div>
              )}

              {child.medicalNotes && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-md p-3">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">Medical Notes</p>
                  <p className="text-sm">{child.medicalNotes}</p>
                </div>
              )}

              {child.emergencyNotes && (
                <div className="bg-red-50 border-2 border-red-200 rounded-md p-3">
                  <p className="text-sm font-semibold text-red-900 mb-1">Emergency Notes</p>
                  <p className="text-sm">{child.emergencyNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardians & Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {child.guardians.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No guardians linked</p>
              ) : (
                <div className="space-y-4">
                  {child.guardians.map(({ guardian, isPrimary }) => (
                    <div
                      key={guardian.id}
                      className="border-2 border-gray-200 rounded-md p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">
                            {guardian.firstName} {guardian.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{guardian.relationship}</p>
                        </div>
                        {isPrimary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {guardian.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{guardian.email}</span>
                          </div>
                        )}
                        {guardian.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{guardian.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-gray-600">
                            Preferred: {guardian.preferredChannel}
                          </span>
                          <Badge variant={guardian.pickupPermission ? "success" : "secondary"} className="text-xs">
                            {guardian.pickupPermission ? "Pickup allowed" : "No pickup"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Guardians</span>
                <Badge variant="secondary">{child.guardians.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Attendance Records</span>
                <Badge variant="secondary">{child.attendance.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Consents</span>
                <Badge variant={missingConsents.length > 0 ? "warning" : "success"}>
                  {child.consentRecords.length - missingConsents.length}/{child.consentRecords.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payments</span>
                <Badge variant={overduePayments.length > 0 ? "danger" : "success"}>
                  {overduePayments.length > 0 ? `${overduePayments.length} overdue` : 'Up to date'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/registers?child=${child.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  View Attendance
                </Button>
              </Link>
              <Link href={`/daily-updates?child=${child.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  Daily Updates
                </Button>
              </Link>
              <Link href={`/consents?child=${child.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  Manage Consents
                </Button>
              </Link>
              <Link href={`/payments?child=${child.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  View Payments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
