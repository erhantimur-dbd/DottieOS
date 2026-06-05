import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, CheckCircle, Download } from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import {
  CheckInButton,
  CheckOutButton,
  AttendanceStatusSelect,
} from "./register-actions"
import { RegisterDatePicker } from "./register-date-picker"

/** yyyy-mm-dd string for a given date in UTC terms. */
function toDateStr(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`
}

export default async function RegistersPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const user = await requireAuth()
  const { date: dateParam } = await searchParams

  // Resolve the requested day at UTC midnight to match the @db.Date column.
  const base = dateParam ? new Date(dateParam) : new Date()
  const day = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()))
  const dateStr = toDateStr(day)

  const [children, attendance] = await Promise.all([
    prisma.child.findMany({
      where: { organisationId: user.organisationId },
      orderBy: { firstName: "asc" },
    }),
    prisma.attendance.findMany({
      where: {
        organisationId: user.organisationId,
        date: day,
      },
    }),
  ])

  const attendanceMap = new Map(attendance.map((a) => [a.childId, a]))

  const checkedIn = attendance.filter((a) => a.checkInTime && !a.checkOutTime).length
  const checkedOut = attendance.filter((a) => a.checkOutTime).length
  const notCheckedIn = children.length - attendance.filter((a) => a.checkInTime).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Register</h1>
          <p className="text-gray-600 mt-1">
            Mark children in and out, view attendance history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/attendance?date=${dateStr}`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border-2 border-black bg-white text-sm font-medium hover:bg-black hover:text-white transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <RegisterDatePicker date={dateStr} />
        </div>
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
            <p className="text-xs text-gray-600 mt-1">Collected</p>
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
              <CardTitle>Register</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{formatDate(day)}</p>
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
                const att = attendanceMap.get(child.id)
                const isCheckedIn = att?.checkInTime && !att.checkOutTime
                const isCheckedOut = att?.checkOutTime
                const isNotArrived = !att?.checkInTime
                const status = att?.status ?? "PRESENT"

                return (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-md hover:border-black transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isCheckedOut
                            ? "bg-blue-500"
                            : isCheckedIn
                            ? "bg-green-500"
                            : "bg-gray-300"
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
                      {att?.checkInTime && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">In:</span>{" "}
                          {formatTime(att.checkInTime)}
                        </div>
                      )}
                      {att?.checkOutTime && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Out:</span>{" "}
                          {formatTime(att.checkOutTime)}
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

                      <div className="w-32">
                        <AttendanceStatusSelect
                          childId={child.id}
                          date={dateStr}
                          status={status}
                        />
                      </div>

                      <div className="flex gap-2">
                        {!att?.checkInTime && (
                          <CheckInButton childId={child.id} date={dateStr} />
                        )}
                        {att?.checkInTime && !att.checkOutTime && (
                          <CheckOutButton childId={child.id} date={dateStr} />
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
