"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react"

interface AffiliateActionsProps {
  applicationId: string
  applicantName: string
}

export function AffiliateActions({ applicationId, applicantName }: AffiliateActionsProps) {
  const router = useRouter()
  const [showNotes, setShowNotes] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isLoading, setIsLoading] = useState<"APPROVE" | "REJECT" | null>(null)
  const [error, setError] = useState("")

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    setIsLoading(action)
    setError("")

    try {
      const res = await fetch(`/api/affiliate/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNotes: reviewNotes.trim() || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong.")
        return
      }

      router.refresh()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Optional notes toggle */}
      <button
        type="button"
        onClick={() => setShowNotes((v) => !v)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
      >
        {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {showNotes ? "Hide" : "Add"} internal review notes (optional)
      </button>

      {showNotes && (
        <div className="space-y-1.5">
          <Label htmlFor={`notes-${applicationId}`} className="text-xs">
            Internal notes — visible to admins only, not shared with applicant
          </Label>
          <Textarea
            id={`notes-${applicationId}`}
            placeholder="e.g. Good audience fit, active in Yorkshire childminding community"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={2}
            className="text-sm"
            disabled={!!isLoading}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => handleAction("APPROVE")}
          disabled={!!isLoading}
          className="flex-1"
        >
          {isLoading === "APPROVE" ? (
            "Approving…"
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve {applicantName.split(" ")[0]}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleAction("REJECT")}
          disabled={!!isLoading}
          className="flex-1"
        >
          {isLoading === "REJECT" ? (
            "Rejecting…"
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
