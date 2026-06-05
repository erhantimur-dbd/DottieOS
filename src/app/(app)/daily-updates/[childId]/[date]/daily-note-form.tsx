"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Save, Eye, Send } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { compileDailyUpdate } from "@/lib/daily-updates/compile"
import { saveDailyNote, submitForApproval } from "../../actions"

interface Fields {
  wellbeing: string
  meals: string
  naps: string
  toileting: string
  activities: string
  notableEvents: string
}

interface Props {
  childId: string
  childFirstName: string
  childLastName: string
  date: string // yyyy-mm-dd
  organisationName: string
  status: string
  initial: Fields
}

const FIELD_META: { key: keyof Fields; label: string; placeholder: string; hint: string; rows: number }[] = [
  { key: "wellbeing", label: "Wellbeing & Mood", placeholder: "How was the child's mood and general wellbeing today?", hint: 'e.g., "Happy and energetic", "A bit tired but settled well"', rows: 2 },
  { key: "meals", label: "Meals & Snacks", placeholder: "What did the child eat today?", hint: 'e.g., "Ate all breakfast, most of lunch, enjoyed fruit at snack time"', rows: 2 },
  { key: "naps", label: "Naps & Rest", placeholder: "Did the child nap? For how long?", hint: 'e.g., "Slept 2 hours (12:30-14:30)", "No nap today"', rows: 2 },
  { key: "toileting", label: "Toileting", placeholder: "Nappy changes or toilet visits", hint: 'e.g., "3 nappy changes", "2 successful toilet visits"', rows: 2 },
  { key: "activities", label: "Activities", placeholder: "What activities did the child participate in?", hint: 'e.g., "Painting, outdoor play, story time, building blocks"', rows: 3 },
  { key: "notableEvents", label: "Notable Events (Optional)", placeholder: "Any special moments or concerns to share?", hint: 'e.g., "Shared toys nicely with friends", "Enjoyed singing session"', rows: 2 },
]

export function DailyNoteForm({
  childId,
  childFirstName,
  childLastName,
  date,
  organisationName,
  status,
  initial,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [fields, setFields] = useState<Fields>(initial)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }))

  const hasAnyContent = Object.values(fields).some((v) => v.trim())

  const preview = compileDailyUpdate({
    child: { firstName: childFirstName, lastName: childLastName },
    note: { ...fields, date: new Date(`${date}T00:00:00.000Z`) },
    organisationName,
  })

  const handleSave = () =>
    startTransition(async () => {
      const res = await saveDailyNote({ childId, date, ...fields })
      if (res.ok) {
        toast({ variant: "success", title: "Notes saved" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Could not save", description: res.error })
      }
    })

  const handleSubmit = () =>
    startTransition(async () => {
      const save = await saveDailyNote({ childId, date, ...fields })
      if (!save.ok) {
        toast({ variant: "error", title: "Could not save", description: save.error })
        return
      }
      const res = await submitForApproval(childId, date)
      if (res.ok) {
        toast({ variant: "success", title: "Submitted for approval" })
        router.refresh()
      } else {
        toast({ variant: "error", title: "Could not submit", description: res.error })
      }
    })

  const locked = status === "SENT"

  return (
    <>
      <div className="space-y-6">
        {FIELD_META.map((meta) => (
          <div key={meta.key} className="space-y-2">
            <Label htmlFor={meta.key}>{meta.label}</Label>
            <Textarea
              id={meta.key}
              placeholder={meta.placeholder}
              value={fields[meta.key]}
              onChange={set(meta.key)}
              rows={meta.rows}
              disabled={pending || locked}
            />
            <p className="text-xs text-gray-600">{meta.hint}</p>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={pending || locked} className="flex-1 min-w-[140px]">
            <Save className="h-4 w-4 mr-2" />
            {pending ? "Saving…" : "Save Notes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)} disabled={!hasAnyContent}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Message
          </Button>
          {(status === "DRAFT" || status === "MISSED") && (
            <Button type="button" variant="secondary" onClick={handleSubmit} disabled={pending || !hasAnyContent}>
              <Send className="h-4 w-4 mr-2" />
              Submit for Approval
            </Button>
          )}
        </div>
        {locked && (
          <p className="text-sm text-gray-600">
            This update has already been sent and can no longer be edited.
          </p>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
            <DialogDescription>
              This is what guardians will receive, by their preferred channel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Email</p>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 border-2 border-gray-200 rounded-md p-3 font-sans">
                {preview.email}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 mb-1">WhatsApp</p>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 border-2 border-gray-200 rounded-md p-3 font-sans">
                {preview.whatsapp}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
