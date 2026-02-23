import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, AlertCircle, CheckCircle, Clock, Plus, Send } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function PaymentsPage() {
  const user = await requireAuth()

  const [invoices, stats] = await Promise.all([
    prisma.paymentInvoice.findMany({
      where: { organisationId: user.organisationId },
      include: {
        child: true
      },
      orderBy: { dueDate: 'desc' }
    }),
    prisma.paymentInvoice.groupBy({
      by: ['status'],
      where: { organisationId: user.organisationId },
      _count: true,
      _sum: { amount: true }
    })
  ])

  const statsMap = new Map(stats.map(s => [s.status, s]))

  const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE')
  const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID')
  const paidInvoices = invoices.filter(i => i.status === 'PAID')

  const overdueAmount = statsMap.get('OVERDUE')?._sum.amount || 0
  const unpaidAmount = statsMap.get('UNPAID')?._sum.amount || 0
  const paidAmount = statsMap.get('PAID')?._sum.amount || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-gray-600 mt-1">
            Track invoices, payments, and chase outstanding balances
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{invoices.length}</div>
            <p className="text-xs text-gray-600 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              £{overdueAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">{overdueInvoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unpaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              £{unpaidAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">{unpaidInvoices.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              £{paidAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">{paidInvoices.length} invoices</p>
          </CardContent>
        </Card>
      </div>

      {overdueInvoices.length > 0 && (
        <Card className="border-2 border-red-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="h-5 w-5" />
                  Chase List - {overdueInvoices.length} Overdue Invoices
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Total overdue: £{overdueAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-red-50 border-2 border-red-200 rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {invoice.child.firstName} {invoice.child.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{invoice.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Due: {formatDate(invoice.dueDate)}
                      {invoice.reminderSentAt && (
                        <span className="ml-2">
                          • Reminder sent {formatDate(invoice.reminderSentAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">
                        £{invoice.amount.toFixed(2)}
                      </p>
                      <Badge variant="danger" className="mt-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1000))} days overdue
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        <Send className="h-4 w-4 mr-2" />
                        Send Reminder
                      </Button>
                      <Button size="sm">
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {unpaidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Unpaid Invoices ({unpaidInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unpaidInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-semibold">
                      {invoice.child.firstName} {invoice.child.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{invoice.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Due: {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        £{invoice.amount.toFixed(2)}
                      </p>
                      <Badge variant="warning" className="mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Unpaid
                      </Badge>
                    </div>
                    <Button size="sm">
                      Mark Paid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {paidInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Paid Invoices ({paidInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paidInvoices.slice(0, 10).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {invoice.child.firstName} {invoice.child.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{invoice.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="font-semibold">£{invoice.amount.toFixed(2)}</p>
                      <p className="text-gray-600">
                        Paid {invoice.paidDate && formatDate(invoice.paidDate)}
                      </p>
                    </div>
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  </div>
                </div>
              ))}
              {paidInvoices.length > 10 && (
                <p className="text-center text-sm text-gray-600 pt-2">
                  And {paidInvoices.length - 10} more...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {invoices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
            <p className="text-gray-600 text-center mb-4">
              Create your first invoice to start tracking payments.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Invoice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
