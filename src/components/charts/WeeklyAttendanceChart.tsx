"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WeeklyData {
  date: string;
  present: number;
  absent: number;
  percentage: number;
}

interface WeeklyAttendanceChartProps {
  data: WeeklyData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium mb-1">{label}</p>
        <p className="text-emerald-400 text-sm">
          Present: {payload[0]?.value || 0}
        </p>
        <p className="text-red-400 text-sm">
          Absent: {payload[1]?.value || 0}
        </p>
        <p className="text-cyan-400 text-sm font-medium">
          Rate: {payload[0]?.payload?.percentage || 0}%
        </p>
      </div>
    );
  }
  return null;
};

export default function WeeklyAttendanceChart({ data }: WeeklyAttendanceChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="absentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="present"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#presentGradient)"
            name="Present"
          />
          <Area
            type="monotone"
            dataKey="absent"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#absentGradient)"
            name="Absent"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}