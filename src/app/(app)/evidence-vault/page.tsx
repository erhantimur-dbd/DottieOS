import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle, XCircle, Plus, Upload } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function EvidenceVaultPage() {
  const user = await requireAuth()

  const evidenceItems = await prisma.evidenceItem.findMany({
    where: { organisationId: user.organisationId },
    include: {
      attachments: {
        include: { document: true }
      }
    },
    orderBy: { category: 'asc' }
  })

  const ready = evidenceItems.filter(e => e.status === 'READY').length
  const notReady = evidenceItems.filter(e => e.status === 'NOT_READY').length
  const readinessScore = evidenceItems.length > 0
    ? Math.round((ready / evidenceItems.length) * 100)
    : 0

  const categories = [...new Set(evidenceItems.map(e => e.category))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evidence Vault</h1>
          <p className="text-gray-600 mt-1">
            Inspection readiness and compliance evidence
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Evidence Item
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              readinessScore >= 80 ? 'text-green-600' :
              readinessScore >= 50 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {readinessScore}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Inspection ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{evidenceItems.length}</div>
            <p className="text-xs text-gray-600 mt-1">Evidence items</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{ready}</div>
            <p className="text-xs text-gray-600 mt-1">Complete & current</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Not Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{notReady}</div>
            <p className="text-xs text-gray-600 mt-1">Requires action</p>
          </CardContent>
        </Card>
      </div>

      {readinessScore < 100 && (
        <Card className="bg-orange-50 border-2 border-orange-600">
          <CardHeader>
            <CardTitle className="text-orange-900">Inspection Readiness Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              Your inspection readiness score is {readinessScore}%. You have {notReady} item{notReady !== 1 ? 's' : ''} that need{notReady === 1 ? 's' : ''} attention to be fully inspection-ready.
            </p>
          </CardContent>
        </Card>
      )}

      {categories.map((category) => {
        const items = evidenceItems.filter(e => e.category === category)
        const categoryReady = items.filter(e => e.status === 'READY').length

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{category}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {categoryReady} of {items.length} ready
                  </p>
                </div>
                <Badge variant={categoryReady === items.length ? "success" : "warning"}>
                  {Math.round((categoryReady / items.length) * 100)}% complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border-2 rounded-md ${
                      item.status === 'READY'
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.status === 'READY' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <h4 className="font-semibold">{item.name}</h4>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1 ml-7">{item.description}</p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-1 ml-7">
                            <span className="font-medium">Notes:</span> {item.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-4 ml-7 mt-2 text-sm text-gray-600">
                          <span>{item.attachments.length} attachment{item.attachments.length !== 1 ? 's' : ''}</span>
                          {item.lastReviewedAt && (
                            <span>Last reviewed: {formatDate(item.lastReviewedAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                        {item.status === 'READY' ? (
                          <Badge variant="success">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge variant="danger">
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {evidenceItems.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No evidence items yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Start building your inspection readiness evidence vault.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
