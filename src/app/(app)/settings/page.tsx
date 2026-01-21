import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings as SettingsIcon, Building, Users, Clock } from "lucide-react"

export default async function SettingsPage() {
  const user = await requireAuth()

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
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Organisation Name</Label>
                <Input
                  id="name"
                  defaultValue={organisation.name}
                  placeholder="e.g. Sunshine Nursery"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  defaultValue={organisation.address || ''}
                  placeholder="Full address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={organisation.email || ''}
                  placeholder="info@nursery.co.uk"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  defaultValue={organisation.phone || ''}
                  placeholder="020 1234 5678"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
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
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleTime">Scheduled Send Time</Label>
              <Input
                id="scheduleTime"
                type="time"
                defaultValue={organisation.dailyUpdateScheduleTime || '17:00'}
              />
              <p className="text-xs text-gray-600">
                Approved daily updates will be sent at this time each day
              </p>
            </div>

            <div className="space-y-2">
              <Label>Send Days</Label>
              <div className="flex gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <Badge
                    key={day}
                    variant={scheduleDays.includes(day) ? 'default' : 'outline'}
                    className="cursor-pointer"
                  >
                    {day}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-600">
                Current: {scheduleDays.join(', ') || 'None selected'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultApprover">Default Approver Role</Label>
              <div className="flex gap-2 items-center">
                <Badge variant="secondary">
                  {organisation.dailyUpdateDefaultApprover || 'SUPERVISOR'}
                </Badge>
                <p className="text-xs text-gray-600">
                  Tasks for approving daily updates will be assigned to this role
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button type="submit">Save Schedule Settings</Button>
            </div>
          </form>
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
                  <Badge variant={
                    orgUser.role === 'OWNER' ? 'default' :
                    orgUser.role === 'ADMIN' ? 'default' :
                    orgUser.role === 'SUPERVISOR' ? 'secondary' :
                    'outline'
                  }>
                    {orgUser.role}
                  </Badge>
                  {orgUser.id === user.id && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
