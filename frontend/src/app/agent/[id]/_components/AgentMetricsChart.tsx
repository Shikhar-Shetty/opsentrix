"use client"

import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  Area,
  AreaChart,
} from "recharts"

type Agent = {
  id: string
  name: string
  status: string
  lastHeartbeat: Date
  token?: string
  CPU: number
  memory: number
  disk: number
  processes: number
}

const COLORS = {
  cpu: "#1eb854",
  memory: "#f59e0b",
  disk: "#3b82f6",
  cpuUsed: "#10b981",
  cpuAvailable: "#d1fae5",
  memoryUsed: "#f59e0b",
  memoryAvailable: "#fef3c7",
  diskUsed: "#3b82f6",
  diskAvailable: "#dbeafe",
}

export default function AgentMetricsCharts({ agent }: { agent: Agent }) {
  const historicalData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    cpu: Math.max(0, (agent.CPU || 0) + (Math.random() - 0.5) * 20),
    memory: Math.max(0, (agent.memory || 0) + (Math.random() - 0.5) * 15),
    disk: Math.max(0, (agent.disk || 0) + (Math.random() - 0.5) * 10),
  }))

  const currentMetrics = [
    { name: "CPU", value: agent.CPU || 0, color: COLORS.cpu },
    { name: "Memory", value: agent.memory || 0, color: COLORS.memory },
    { name: "Disk", value: agent.disk || 0, color: COLORS.disk },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            24-Hour Resource History
          </h2>
          <p className="text-xs opacity-60 mb-2">Historical performance metrics</p>
          <div className="h-[320px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cpu} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.cpu} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.memory} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.memory} stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.disk} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.disk} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  stroke="#6b7280"
                  interval={3}
                  tickLine={{ stroke: "#6b7280" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  stroke="#6b7280"
                  tickLine={{ stroke: "#6b7280" }}
                  label={{ value: "Usage %", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                    color: "#f3f4f6",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  labelStyle={{ color: "#f3f4f6", fontWeight: "bold" }}
                />
                <Legend wrapperStyle={{ color: "#9ca3af", paddingTop: "10px" }} iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke={COLORS.cpu}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  name="CPU %"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stroke={COLORS.memory}
                  fillOpacity={1}
                  fill="url(#colorMemory)"
                  name="Memory %"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="disk"
                  stroke={COLORS.disk}
                  fillOpacity={1}
                  fill="url(#colorDisk)"
                  name="Disk %"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            Current Resource Distribution
          </h2>
          <p className="text-xs opacity-60 mb-2">Real-time usage breakdown</p>
          <div className="h-[320px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentMetrics}
                  cx="50%"
                  cy="50%"
                  labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#1f2937"
                  strokeWidth={2}
                >
                  {currentMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  labelStyle={{ color: "#a0a0a0ff" }}
                  itemStyle={{ color: "#a0a0a0ff" }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />

                <Legend wrapperStyle={{ color: "#ffffffff", paddingTop: "10px" }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
