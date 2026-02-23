import { requireAuth, isAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BadgePound,
  CalendarDays,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { AffiliateActions } from "./affiliate-actions"

export default async function AffiliatesAdminPage() {
  const user = await requireAuth()

  if (!isAdmin(user.role)) {
    redirect("/settings")
  }

  const [pending, approved, rejected] = await Promise.all([
    prisma.affiliateApplication.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.affiliateApplication.findMany({
      where: { status: "APPROVED" },
      orderBy: { approvedAt: "desc" },
    }),
    prisma.affiliateApplication.findMany({
      where: { status: "REJECTED" },
      orderBy: { reviewedAt: "desc" },
    }),
  ])

  const total = pending.length + approved.length + rejected.length

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Affiliate Applications</h1>
          <p className="text-gray-600 mt-1">
            Review and approve partner applications for the affiliate programme
          </p>
        </div>
        <Link href="/affiliate" target="_blank">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View public page
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{pending.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Approved Partners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approved.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BadgePound className="h-4 w-4" />
              Commission Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">25%</div>
            <p className="text-xs text-gray-600 mt-1">for 12 months</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending applications — most important, shown first */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Pending Review
          {pending.length > 0 && (
            <Badge variant="warning">{pending.length}</Badge>
          )}
        </h2>

        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-600">
              No applications currently awaiting review.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pending.map((app) => (
              <Card key={app.id} className="border-2 border-orange-200">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{app.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <a
                          href={`mailto:${app.email}`}
                          className="hover:underline"
                        >
                          {app.email}
                        </a>
                        {" · "}Applied {formatDate(app.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="warning">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-md p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      About their audience
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {app.companyDescription}
                    </p>
                  </div>
                  <AffiliateActions applicationId={app.id} applicantName={app.name} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Approved partners */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Approved Partners ({approved.length})
        </h2>

        {approved.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-gray-600">
              No approved partners yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {approved.map((app) => (
              <Card key={app.id} className="border-2 border-green-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{app.name}</p>
                      <p className="text-sm text-gray-600">
                        <a href={`mailto:${app.email}`} className="hover:underline">
                          {app.email}
                        </a>
                      </p>
                      {app.reviewNotes && (
                        <p className="text-xs text-gray-500 mt-1">
                          Note: {app.reviewNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {app.referralCode && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Referral code</p>
                          <code className="bg-black text-white text-sm font-mono px-3 py-1 rounded-md">
                            {app.referralCode}
                          </code>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1 justify-end">
                          <CalendarDays className="h-3 w-3" />
                          Approved
                        </p>
                        <p className="text-sm font-medium">
                          {app.approvedAt ? formatDate(app.approvedAt) : "—"}
                        </p>
                      </div>
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Rejected applications (collapsed by default, shown at bottom) */}
      {rejected.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gray-400" />
            Rejected ({rejected.length})
          </h2>
          <div className="space-y-2">
            {rejected.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-md text-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{app.name}</span>
                  <span className="text-gray-500">{app.email}</span>
                  {app.reviewNotes && (
                    <span className="text-gray-500 block mt-0.5">
                      Reason: {app.reviewNotes}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-gray-500 text-xs">
                    {app.reviewedAt ? formatDate(app.reviewedAt) : "—"}
                  </span>
                  <Badge variant="secondary">Rejected</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
