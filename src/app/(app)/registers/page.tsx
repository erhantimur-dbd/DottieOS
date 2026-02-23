import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, CheckCircle, XCircle, Calendar } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"

export default async function RegistersPage() {
  const user = await requireAuth()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [children, todayAttendance] = await Promise.all([
    prisma.child.findMany({
      where: { organisationId: user.organisationId },
      orderBy: { firstName: 'asc' }
    }),
    prisma.attendance.findMany({
      where: {
        organisationId: user.organisationId,
        date: today
      },
      include: {
        child: true
      }
    })
  ])

  const attendanceMap = new Map(todayAttendance.map(a => [a.childId, a]))

  const checkedIn = todayAttendance.filter(a => a.checkInTime && !a.checkOutTime).length
  const checkedOut = todayAttendance.filter(a => a.checkOutTime).length
  const notCheckedIn = children.length - todayAttendance.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Register</h1>
          <p className="text-gray-600 mt-1">
            Mark children in and out, view attendance history
          </p>
        </div>
        <Button variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          View History
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{children.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Checked In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{checkedIn}</div>
            <p className="text-xs text-gray-600 mt-1">Currently present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Checked Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{checkedOut}</div>
            <p className="text-xs text-gray-600 mt-1">Collected today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Not Arrived
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">{notCheckedIn}</div>
            <p className="text-xs text-gray-600 mt-1">Expected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Today&apos;s Register</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{formatDate(today)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No children registered</h3>
              <p className="text-gray-600 text-center mb-4">
                Add children to start taking attendance.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {children.map((child) => {
                const attendance = attendanceMap.get(child.id)
                const isCheckedIn = attendance?.checkInTime && !attendance.checkOutTime
                const isCheckedOut = attendance?.checkOutTime
                const isNotArrived = !attendance

                return (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-md hover:border-black transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isCheckedOut
                            ? 'bg-blue-500'
                            : isCheckedIn
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {child.firstName} {child.lastName}
                        </p>
                        {child.room && (
                          <p className="text-sm text-gray-600">{child.room}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {attendance?.checkInTime && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">In:</span> {formatTime(attendance.checkInTime)}
                        </div>
                      )}
                      {attendance?.checkOutTime && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Out:</span> {formatTime(attendance.checkOutTime)}
                        </div>
                      )}

                      {isCheckedOut && (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Collected
                        </Badge>
                      )}
                      {isCheckedIn && (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Present
                        </Badge>
                      )}
                      {isNotArrived && (
                        <Badge variant="secondary">Not arrived</Badge>
                      )}

                      <div className="flex gap-2">
                        {!attendance?.checkInTime && (
                          <Button size="sm">
                            Check In
                          </Button>
                        )}
                        {attendance?.checkInTime && !attendance.checkOutTime && (
                          <Button size="sm" variant="outline">
                            Check Out
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
