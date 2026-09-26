import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  bar1: '#4C7DF0',
  bar2: '#A98BF5',
  bar3: '#F5B94C',
  line1: '#4C7DF0',
  line2: '#A98BF5',
  line3: '#F5B94C',
}

export function SalesBarChart({ data, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="เครื่องทำความร้อน" stackId="a" fill={COLORS.bar1} radius={[0, 0, 0, 0]} />
        <Bar dataKey="น้ำ" stackId="a" fill={COLORS.bar2} />
        <Bar dataKey="ไฟฟ้า" stackId="a" fill={COLORS.bar3} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ForecastLineChart({ data, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="ยอดขาย" stroke={COLORS.line1} strokeWidth={3} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="เดลิเวอรี" stroke={COLORS.line2} strokeWidth={3} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="หน้าร้าน" stroke={COLORS.line3} strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ยอดขายจริงรายวัน (จากบิลที่ชำระแล้ว)
export function RevenueBarChart({ data, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(v) => [`${Number(v).toLocaleString('th-TH')}฿`, 'ยอดขาย']}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}
        />
        <Bar dataKey="ยอดขาย" fill={COLORS.bar1} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
