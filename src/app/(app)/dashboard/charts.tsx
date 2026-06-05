"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

export function AttendanceTrendChart({ data }: { data: { day: string; present: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="present" fill="#000000" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

const PAYMENT_COLORS: Record<string, string> = {
  PAID: "#16a34a",
  UNPAID: "#f59e0b",
  OVERDUE: "#dc2626",
}

export function PaymentsBreakdownChart({ data }: { data: { status: string; amount: number }[] }) {
  const nonZero = data.filter((d) => d.amount > 0)
  if (nonZero.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-16">No invoices yet</p>
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={nonZero} dataKey="amount" nameKey="status" cx="50%" cy="50%" outerRadius={80}>
          {nonZero.map((d) => (
            <Cell key={d.status} fill={PAYMENT_COLORS[d.status] ?? "#666"} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `£${Number(value).toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
