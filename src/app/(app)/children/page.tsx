import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, User, Calendar, Heart } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default async function ChildrenPage() {
  const user = await requireAuth()

  const children = await prisma.child.findMany({
    where: { organisationId: user.organisationId },
    include: {
      guardians: {
        include: {
          guardian: true
        }
      },
      assignments: {
        include: {
          user: true
        }
      },
      _count: {
        select: {
          attendance: true,
          dailyUpdates: true
        }
      }
    },
    orderBy: {
      firstName: 'asc'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Children</h1>
          <p className="text-gray-600 mt-1">
            Manage children and their information
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Child
        </Button>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No children yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Get started by adding your first child to the system.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => {
            const age = Math.floor(
              (new Date().getTime() - new Date(child.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
            const keyPerson = child.assignments.find(a => a.userId === child.keyPersonId)?.user
            const primaryGuardian = child.guardians.find(g => g.isPrimary)?.guardian

            return (
              <Link key={child.id} href={`/children/${child.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">
                          {child.firstName} {child.lastName}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {age} years old
                        </p>
                      </div>
                      {child.room && (
                        <Badge variant="secondary">{child.room}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        Started: {formatDate(child.startDate)}
                      </span>
                    </div>

                    {keyPerson && (
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          Key person: {keyPerson.name}
                        </span>
                      </div>
                    )}

                    {primaryGuardian && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {primaryGuardian.firstName} {primaryGuardian.lastName}
                        </span>
                      </div>
                    )}

                    {child.guardians.length > 0 && (
                      <div className="pt-2 border-t flex justify-between text-xs text-gray-600">
                        <span>{child.guardians.length} guardian{child.guardians.length > 1 ? 's' : ''}</span>
                        <span>{child._count.dailyUpdates} updates</span>
                      </div>
                    )}

                    {(child.dietaryNeeds || child.medicalNotes) && (
                      <div className="pt-2 space-y-1">
                        {child.dietaryNeeds && (
                          <Badge variant="outline" className="text-xs">
                            Dietary: {child.dietaryNeeds}
                          </Badge>
                        )}
                        {child.medicalNotes && (
                          <Badge variant="warning" className="text-xs block mt-1">
                            Medical notes
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
