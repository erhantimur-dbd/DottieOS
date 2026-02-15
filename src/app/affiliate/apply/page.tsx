"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"

export default function AffiliateApplyPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    companyDescription: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.name.trim() || !form.email.trim() || !form.companyDescription.trim()) {
      setError("Please fill in all fields before submitting.")
      return
    }

    if (form.companyDescription.trim().length < 30) {
      setError("Please give a fuller description (at least 30 characters) so we can assess your application.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }

      router.push("/affiliate/apply/success")
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/affiliate" className="text-2xl font-bold">
            Dottie OS
          </Link>
          <Link href="/affiliate" className="text-sm text-gray-600 hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to affiliate programme
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold">Partner application</h1>
          <p className="text-gray-600 mt-3 leading-relaxed">
            Tell us a little about yourself and your audience. We review every
            application to ensure the partnership is a good fit. If approved,
            you&apos;ll receive your referral code and onboarding details by email.
          </p>
        </div>

        {/* What to expect */}
        <div className="border-2 border-black rounded-lg p-5 mb-10 space-y-2">
          <p className="font-semibold text-sm">What happens after you apply?</p>
          <ul className="space-y-2">
            {[
              "We'll review your application, typically within 3–5 business days.",
              "You'll receive an email with our decision.",
              "Approved partners get a unique referral code and onboarding guide.",
              "Start sharing and earning 25% for 12 months per referral.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>
              All fields are required. We do not share your information with
              third parties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                <p className="text-xs text-gray-600">
                  We&apos;ll send our decision and your referral code to this address.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">
                  About you and your audience
                </Label>
                <Textarea
                  id="companyDescription"
                  placeholder="Tell us who you are, what you do, and how you work with childminders or nurseries. For example: 'I run a childminding network in Yorkshire with 200 members' or 'I'm a consultant who helps nurseries prepare for Ofsted inspections.'"
                  value={form.companyDescription}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  rows={6}
                />
                <p className="text-xs text-gray-600">
                  The more detail you provide, the faster we can assess your application.
                  Minimum 30 characters.
                </p>
                {form.companyDescription.length > 0 && (
                  <p className={`text-xs ${form.companyDescription.length < 30 ? "text-red-600" : "text-green-600"}`}>
                    {form.companyDescription.length} characters
                    {form.companyDescription.length < 30 && ` — ${30 - form.companyDescription.length} more needed`}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-600 rounded-md p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Submitting application…"
                  ) : (
                    <>
                      Submit application
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-gray-500">
                  By submitting you agree to our affiliate programme terms.
                  Subject to review and approval.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t-2 border-black mt-8">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <span className="font-bold text-black">Dottie OS</span>
          <span>
            Questions?{" "}
            <a href="mailto:partners@dottieos.co.uk" className="underline">
              partners@dottieos.co.uk
            </a>
          </span>
          <Link href="/affiliate" className="hover:underline">
            Back to programme overview
          </Link>
        </div>
      </footer>
    </div>
  )
}
