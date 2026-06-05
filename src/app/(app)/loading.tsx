import { Loader2 } from "lucide-react"

export default function AppLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
