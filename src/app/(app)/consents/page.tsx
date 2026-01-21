import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileCheck, AlertTriangle, Check, X, Plus } from "lucide-react"

export default async function ConsentsPage() {
  const user = await requireAuth()

  const [children, templates] = await Promise.all([
    prisma.child.findMany({
      where: { organisationId: user.organisationId },
      include: {
        consentRecords: {
          include: { template: true }
        }
      },
      orderBy: { firstName: 'asc' }
    }),
    prisma.consentTemplate.findMany({
      where: { organisationId: user.organisationId }
    })
  ])

  const allConsents = children.flatMap(c => c.consentRecords)
  const missingCount = allConsents.filter(c => c.status === 'MISSING').length
  const expiredCount = allConsents.filter(c => c.status === 'EXPIRED').length
  const signedCount = allConsents.filter(c => c.status === 'SIGNED').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Consents & Documents</h1>
          <p className="text-gray-600 mt-1">
            Manage consent forms and child documents
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Consents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{allConsents.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Signed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{signedCount}</div>
            <p className="text-xs text-gray-600 mt-1">Up to date</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Missing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{missingCount}</div>
            <p className="text-xs text-gray-600 mt-1">Requires action</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{expiredCount}</div>
            <p className="text-xs text-gray-600 mt-1">Needs renewal</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consent Templates ({templates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No templates created</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border-2 border-gray-200 rounded-md"
                >
                  <h4 className="font-semibold">{template.name}</h4>
                  {template.description && (
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  )}
                  <div className="mt-2">
                    <Badge variant={template.requiresExpiry ? "warning" : "secondary"}>
                      {template.requiresExpiry ? 'Requires expiry' : 'No expiry'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent Status by Child</CardTitle>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No children registered</p>
          ) : (
            <div className="space-y-3">
              {children.map((child) => {
                const missing = child.consentRecords.filter(c => c.status === 'MISSING').length
                const expired = child.consentRecords.filter(c => c.status === 'EXPIRED').length
                const hasIssues = missing > 0 || expired > 0

                return (
                  <div
                    key={child.id}
                    className={`p-4 border-2 rounded-md ${
                      hasIssues ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {child.firstName} {child.lastName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {child.consentRecords.length} consent{child.consentRecords.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {missing > 0 && (
                          <Badge variant="danger">
                            <X className="h-3 w-3 mr-1" />
                            {missing} missing
                          </Badge>
                        )}
                        {expired > 0 && (
                          <Badge variant="warning">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {expired} expired
                          </Badge>
                        )}
                        {!hasIssues && (
                          <Badge variant="success">
                            <Check className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
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
