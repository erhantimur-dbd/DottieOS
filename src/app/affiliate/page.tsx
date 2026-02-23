import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  BadgePound,
  CalendarDays,
  Users,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  HeartHandshake
} from "lucide-react"

const benefits = [
  {
    icon: BadgePound,
    title: "25% Revenue Share",
    description:
      "Earn 25% of every subscription payment made by clients you refer for a full 12 months.",
  },
  {
    icon: CalendarDays,
    title: "12-Month Commission Term",
    description:
      "Your commission runs for 12 months from each client's first payment — not a one-off payout.",
  },
  {
    icon: Users,
    title: "No Cap on Referrals",
    description:
      "Refer as many childminders and nurseries as you like. There is no ceiling on your earnings.",
  },
  {
    icon: BarChart3,
    title: "Clear Tracking",
    description:
      "Every referred client is tracked against your unique referral code so nothing gets missed.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Product",
    description:
      "Dottie OS is built specifically for UK childcare — your referrals get a product that genuinely helps them.",
  },
  {
    icon: Zap,
    title: "Quick Approval",
    description:
      "Applications are reviewed promptly. Approved partners receive their referral code by email.",
  },
]

const steps = [
  {
    number: "01",
    title: "Apply",
    description:
      "Fill in the short application form with your name, email, and a brief description of your audience or business.",
  },
  {
    number: "02",
    title: "Get Approved",
    description:
      "Our team reviews your application for suitability. We'll let you know the decision by email.",
  },
  {
    number: "03",
    title: "Share Your Code",
    description:
      "You receive a unique referral code. Share it with childminders and nurseries in your network.",
  },
  {
    number: "04",
    title: "Earn Commission",
    description:
      "Earn 25% of each referred client's subscription for 12 months, paid out monthly.",
  },
]

const eligibility = [
  "Childcare consultants and advisors",
  "Ofsted preparation coaches",
  "Nursery business coaches",
  "Childminding network co-ordinators",
  "Accountants who work with childcare providers",
  "HR and payroll professionals in the childcare sector",
  "Training providers and CPD organisers",
  "Childcare recruitment agencies",
]

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/login" className="text-2xl font-bold">
            Dottie OS
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/affiliate/apply"
              className="text-sm font-medium hover:underline"
            >
              Apply Now
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b-2 border-black bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 border-2 border-white rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <HeartHandshake className="h-4 w-4" />
            Affiliate Programme
          </div>
          <h1 className="text-5xl font-bold leading-tight max-w-3xl mx-auto">
            Earn 25% for every childcare provider you refer
          </h1>
          <p className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Help UK childminders and nurseries discover Dottie OS — the all-in-one
            admin platform that saves them hours every week. You earn 25% of their
            subscription for a full 12 months.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/affiliate/apply">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-base px-8">
                Apply to become a partner
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <span className="text-gray-400 text-sm">
              Free to join · Subject to approval
            </span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 divide-x-2 divide-black">
          {[
            { value: "25%", label: "Revenue share" },
            { value: "12", label: "Months per referral" },
            { value: "£0", label: "Cost to join" },
            { value: "Monthly", label: "Payout frequency" },
          ].map((stat) => (
            <div key={stat.label} className="text-center px-6 py-2">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold">Why partner with Dottie OS?</h2>
          <p className="text-gray-600 mt-3 max-w-xl mx-auto">
            A straightforward programme with real earning potential for professionals
            who work with UK childcare providers.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <Card key={benefit.title}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 border-2 border-black rounded-md">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-lg">{benefit.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t-2 border-black bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="text-gray-600 mt-3">Four steps from application to earning.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-5xl font-bold text-gray-200 mb-4 leading-none">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Who is this for?</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              We welcome applications from anyone with a genuine audience of UK
              childminders, nurseries, or childcare business owners. We review
              every application individually to make sure the partnership is a
              good fit for both sides.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Applications that do not have a clear childcare audience, or that do
              not meet our partner standards, may not be approved.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
              Typical partner profiles
            </p>
            <ul className="space-y-3">
              {eligibility.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Terms summary */}
      <section className="border-t-2 border-b-2 border-black bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-bold mb-6">Programme Terms at a Glance</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            {[
              ["Commission rate", "25% of net subscription revenue"],
              ["Commission term", "12 months from client's first payment"],
              ["Payout frequency", "Monthly, in arrears"],
              ["Minimum payout", "£25 (rolled over if not met)"],
              ["Tracking method", "Unique referral code per partner"],
              ["Approval", "Subject to review and suitability"],
              ["Programme changes", "30 days' notice for material changes"],
              ["Termination", "Either party may terminate with 30 days' notice"],
              ["Attribution", "First-touch, single code per client"],
            ].map(([term, detail]) => (
              <div key={term} className="border border-white/20 rounded-md p-4">
                <p className="font-semibold text-white">{term}</p>
                <p className="text-gray-300 mt-1">{detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-gray-400 text-xs">
            Full terms and conditions are provided to approved partners. Dottie OS
            reserves the right to update these terms with appropriate notice.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to apply?</h2>
        <p className="text-gray-600 max-w-lg mx-auto mb-8 leading-relaxed">
          Fill in the short form and we&apos;ll review your application. If approved,
          you&apos;ll receive your referral code and partner onboarding details by email.
        </p>
        <Link href="/affiliate/apply">
          <Button size="lg" className="text-base px-8">
            Start your application
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <p className="mt-4 text-sm text-gray-500">
          Questions? Email{" "}
          <a href="mailto:partners@dottieos.co.uk" className="underline">
            partners@dottieos.co.uk
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <span className="font-bold text-black">Dottie OS</span>
          <span>
            &copy; {new Date().getFullYear()} Dottie OS. All rights reserved.
          </span>
          <Link href="/login" className="hover:underline">
            Existing users — log in
          </Link>
        </div>
      </footer>
    </div>
  )
}
