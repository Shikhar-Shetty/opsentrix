// AgentMetricsChart.tsx
"use client"

import {
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
} from "recharts"
import { Activity, HardDrive, Cpu, Database } from "lucide-react"

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
  summary: string
}

const COLORS = {
  cpu: "#10b981",
  memory: "#f59e0b",
  disk: "#3b82f6",
}

export default function AgentMetricsCharts({ agent }: { agent: Agent }) {
  const historicalData = parseSummary(agent?.summary)

  const currentMetrics = [
    { 
      name: "CPU", 
      value: agent.CPU || 0, 
      color: COLORS.cpu,
      icon: Cpu,
      unit: "%"
    },
    { 
      name: "Memory", 
      value: agent.memory || 0, 
      color: COLORS.memory,
      icon: Database,
      unit: "%"
    },
    { 
      name: "Disk", 
      value: agent.disk || 0, 
      color: COLORS.disk,
      icon: HardDrive,
      unit: "%"
    },
  ]

  const radialData = [
    { 
      name: "CPU", 
      value: agent.CPU || 0, 
      fill: COLORS.cpu,
      max: 100
    },
    { 
      name: "Memory", 
      value: agent.memory || 0, 
      fill: COLORS.memory,
      max: 100
    },
    { 
      name: "Disk", 
      value: agent.disk || 0, 
      fill: COLORS.disk,
      max: 100
    },
  ]

  function parseSummary(summary: string) {
    return summary
      .trim()
      .split('\n')
      .map(line => {
        const match = line.match(
          /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z): Memory: ([\d.]+)%, Disk: ([\d.]+)%, CPU: ([\d.]+)%, Processes: (\d+), Status: (\w+)/
        )
        if (!match) return null
        const date = new Date(match[1])
        return {
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          memory: parseFloat(match[2]),
          disk: parseFloat(match[3]),
          cpu: parseFloat(match[4]),
          processes: parseInt(match[5]),
          status: match[6],
        }
      })
      .filter(Boolean)
  }

  const getStatusColor = (value: number) => {
    if (value >= 90) return "text-error"
    if (value >= 75) return "text-warning"
    return "text-success"
  }

  const getStatusBadge = (value: number) => {
    if (value >= 90) return "Critical"
    if (value >= 75) return "Warning"
    return "Optimal"
  }

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentMetrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <div key={idx} className="card bg-base-200 border border-base-300">
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 opacity-50" />
                    <span className="text-sm font-medium opacity-70">{metric.name}</span>
                  </div>
                  <span className="badge badge-sm badge-ghost">{getStatusBadge(metric.value)}</span>
                </div>

                <div className="mb-3">
                  <span className={`text-3xl font-bold ${getStatusColor(metric.value)}`}>
                    {metric.value.toFixed(1)}
                  </span>
                  <span className="text-lg opacity-50 ml-1">{metric.unit}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 bg-base-300 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${metric.value}%`,
                        backgroundColor: metric.color
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs opacity-50">
                    <span>Used: {metric.value.toFixed(1)}%</span>
                    <span>Free: {(100 - metric.value).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 card bg-base-200 border border-base-300">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Performance Timeline</h3>
              <div className="flex gap-3 text-xs">
                {[
                  { label: "CPU", color: COLORS.cpu },
                  { label: "Memory", color: COLORS.memory },
                  { label: "Disk", color: COLORS.disk },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="opacity-60">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="h-64 ml-[-20px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.cpu} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.cpu} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.memory} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.memory} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.disk} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.disk} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    stroke="#4b5563"
                    interval={3}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    stroke="#4b5563"
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      padding: "8px"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke={COLORS.cpu}
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke={COLORS.memory}
                    fillOpacity={1}
                    fill="url(#colorMemory)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="disk"
                    stroke={COLORS.disk}
                    fillOpacity={1}
                    fill="url(#colorDisk)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Radial Chart */}
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-5">
            <h3 className="text-sm font-bold mb-4">Resource Distribution</h3>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="30%" 
                  outerRadius="90%" 
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background={{ fill: "#1f2937" }}
                    dataKey="value"
                    cornerRadius={8}
                  />
                  <Legend 
                    iconSize={10}
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{
                      fontSize: "11px"
                    }}
                    formatter={(value, entry: any) => {
                      const displayValue = typeof entry?.payload?.value === 'number' 
                        ? entry.payload.value.toFixed(1) 
                        : '0.0'
                      return `${value}: ${displayValue}%`
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      border: "1px solid #374151",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      padding: "8px"
                    }}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}