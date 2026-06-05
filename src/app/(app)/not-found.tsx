import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <FileQuestion className="h-16 w-16 text-gray-400 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Not found</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        The page or record you&apos;re looking for doesn&apos;t exist, or you may not
        have access to it.
      </p>
      <Link href="/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  )
}
