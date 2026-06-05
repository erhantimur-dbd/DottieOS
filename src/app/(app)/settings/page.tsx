import { requireAuth, isAdmin, isOwner } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, Users, Clock, HeartHandshake, ArrowRight } from "lucide-react"
import Link from "next/link"
import {
  OrganisationForm,
  ScheduleForm,
  AddUserDialog,
  UserRoleSelect,
  DeleteUserButton,
} from "./settings-forms"

export default async function SettingsPage() {
  const user = await requireAuth()
  // Only an owner may grant/modify/remove Owner-level access.
  const viewerIsOwner = isOwner(user.role)

  const [organisation, orgUsers] = await Promise.all([
    prisma.organisation.findUnique({
      where: { id: user.organisationId }
    }),
    prisma.user.findMany({
      where: { organisationId: user.organisationId },
      orderBy: { name: 'asc' }
    })
  ])

  if (!organisation) {
    return <div>Organisation not found</div>
  }

  const scheduleDays = organisation.dailyUpdateScheduleDays
    ? JSON.parse(organisation.dailyUpdateScheduleDays)
    : []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your organisation settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organisation Details
          </CardTitle>
          <CardDescription>
            Basic information about your childcare setting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganisationForm
            organisation={{
              name: organisation.name,
              address: organisation.address,
              email: organisation.email,
              phone: organisation.phone,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Updates Schedule
          </CardTitle>
          <CardDescription>
            Configure when daily updates are sent to parents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleForm
            scheduleTime={organisation.dailyUpdateScheduleTime || "17:00"}
            scheduleDays={scheduleDays}
            defaultApprover={organisation.dailyUpdateDefaultApprover || "SUPERVISOR"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({orgUsers.length})
          </CardTitle>
          <CardDescription>
            Manage staff access and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orgUsers.map((orgUser) => (
              <div
                key={orgUser.id}
                className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-md"
              >
                <div>
                  <p className="font-medium">{orgUser.name}</p>
                  <p className="text-sm text-gray-600">{orgUser.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {orgUser.id === user.id ? (
                    <>
                      <Badge variant={
                        orgUser.role === 'OWNER' ? 'default' :
                        orgUser.role === 'ADMIN' ? 'default' :
                        orgUser.role === 'SUPERVISOR' ? 'secondary' :
                        'outline'
                      }>
                        {orgUser.role}
                      </Badge>
                      <Badge variant="outline" className="text-xs">You</Badge>
                    </>
                  ) : (
                    <>
                      <UserRoleSelect userId={orgUser.id} role={orgUser.role} canManageOwner={viewerIsOwner} />
                      {(viewerIsOwner || orgUser.role !== 'OWNER') && (
                        <DeleteUserButton userId={orgUser.id} />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <AddUserDialog canAssignOwner={viewerIsOwner} />
          </div>
        </CardContent>
      </Card>

      {isAdmin(user.role) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5" />
              Affiliate Programme
            </CardTitle>
            <CardDescription>
              Review partner applications and manage your affiliate programme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border-2 border-black rounded-md">
              <div>
                <p className="font-medium">Partner Applications</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Approve or reject affiliate applications · 25% revenue share for 12 months
                </p>
              </div>
              <Link href="/settings/affiliates">
                <Button>
                  Manage Applications
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Public programme page:{" "}
              <Link href="/affiliate" target="_blank" className="underline hover:no-underline">
                /affiliate
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
