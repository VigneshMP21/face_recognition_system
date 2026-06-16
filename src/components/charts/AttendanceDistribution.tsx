"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DistributionData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface AttendanceDistributionProps {
  present: number;
  absent: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-white font-medium">{data.name}</p>
        <p className="text-sm" style={{ color: data.color }}>
          {data.value} students ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-col gap-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-400 text-sm">{entry.value}</span>
          <span className="text-white text-sm font-medium">{entry.payload.percentage}%</span>
        </div>
      ))}
    </div>
  );
};

export default function AttendanceDistribution({ present, absent }: AttendanceDistributionProps) {
  const total = present + absent;
  const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
  const absentPercentage = total > 0 ? Math.round((absent / total) * 100) : 0;

  const data: DistributionData[] = [
    { name: "Present", value: present, color: "#10b981", percentage: presentPercentage },
    { name: "Absent", value: absent, color: "#ef4444", percentage: absentPercentage },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="rgba(0,0,0,0)"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}