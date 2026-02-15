import Link from "next/link"
import { CheckCircle2, Mail, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AffiliateSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <span className="text-2xl font-bold">Dottie OS</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 border-2 border-black rounded-full">
              <CheckCircle2 className="h-12 w-12" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4">Application received</h1>
          <p className="text-gray-600 leading-relaxed mb-10">
            Thank you for applying to the Dottie OS affiliate programme. We&apos;ve
            received your application and our team will review it for suitability.
          </p>

          <div className="border-2 border-black rounded-lg divide-y-2 divide-black mb-10 text-left">
            <div className="p-5 flex items-start gap-4">
              <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">What happens next</p>
                <p className="text-sm text-gray-600 mt-1">
                  We review applications within 3–5 business days. If your
                  application is approved, you&apos;ll receive your unique referral
                  code and a partner onboarding guide.
                </p>
              </div>
            </div>
            <div className="p-5 flex items-start gap-4">
              <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Check your inbox</p>
                <p className="text-sm text-gray-600 mt-1">
                  We&apos;ll email you at the address you provided with our decision.
                  Please check your spam folder if you don&apos;t hear from us within
                  5 business days.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/affiliate">
              <Button variant="outline">Back to programme overview</Button>
            </Link>
            <Link href="/login">
              <Button>Log in to Dottie OS</Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Questions?{" "}
            <a href="mailto:partners@dottieos.co.uk" className="underline">
              partners@dottieos.co.uk
            </a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-gray-600">
          &copy; {new Date().getFullYear()} Dottie OS. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
