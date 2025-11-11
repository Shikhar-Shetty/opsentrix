// AgentDetailClient.tsx (page component)
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { socket } from "@/components/socket"
import AgentMetricsCharts from "./AgentMetricsChart"
import AgentDeleteButton from "./DeleteAgent"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Settings,
  Trash2,
  ArrowLeft,
  Copy,
  Check,
  List
} from "lucide-react"
import { toast } from "sonner"
import ProcessListPopup from "./_processComponents/ProcessListPopup"

export interface AgentI {
  id: string
  name: string
  token?: string
  status: string
  lastHeartbeat: Date
  location: string | null
  CPU: number
  memory: number
  disk: number
  processes: number
  summary: string
  dailyinsights: string | null
  insightDate: Date | null
}

interface ProcessMetric {
  id: string
  pid: number
  processName: string
  cpuUsage: number
  memoryUsage: number
  status: string
  aiFlag: string
  aiReason: string | null
  createdAt: Date
}

type RiskLevel = "none" | "medium" | "high"

const getRisk = (agent: AgentI): { level: RiskLevel; message: string } => {
  if (agent.CPU >= 90 || agent.disk >= 90 || agent.memory >= 95 || agent.processes >= 800) {
    if (agent.CPU >= 90) return { level: "high", message: "Critical CPU load" }
    if (agent.disk >= 90) return { level: "high", message: "Critical disk usage" }
    if (agent.memory >= 95) return { level: "high", message: "Critical memory usage" }
    return { level: "high", message: "System critical" }
  }

  if (agent.CPU >= 75 || agent.disk >= 80 || agent.memory >= 85 || agent.processes >= 500) {
    if (agent.CPU >= 75) return { level: "medium", message: "High CPU usage" }
    if (agent.disk >= 80) return { level: "medium", message: "High disk usage" }
    if (agent.memory >= 85) return { level: "medium", message: "High memory usage" }
    return { level: "medium", message: "System elevated" }
  }

  return { level: "none", message: "System healthy" }
}

const AgentStatusBadge = ({ agent }: { agent: AgentI }) => {
  const risk = getRisk(agent)
  let colorClass = "bg-success/10 text-success"
  let Icon = CheckCircle

  if (risk.level === "medium") {
    colorClass = "bg-warning/10 text-warning"
    Icon = AlertTriangle
  } else if (risk.level === "high") {
    colorClass = "bg-error/10 text-error"
    Icon = AlertCircle
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{risk.message}</span>
    </div>
  )
}

const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return <p className="text-sm opacity-70">No insights available yet.</p>

  const lines = content.split("\n")

  return (
    <div className="prose prose-sm max-w-none">
      {lines.map((line, idx) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-xl font-bold mt-5 mb-3">
              {line.replace("## ", "")}
            </h2>
          )
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={idx} className="text-2xl font-bold mt-6 mb-4">
              {line.replace("# ", "")}
            </h1>
          )
        }

        if (line.includes("**")) {
          const parts = line.split("**")
          return (
            <p key={idx} className="mb-2">
              {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
            </p>
          )
        }

        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
          return (
            <li key={idx} className="ml-4 mb-1">
              {line.replace(/^[\s-*]+/, "")}
            </li>
          )
        }

        if (line.trim() === "") {
          return <div key={idx} className="h-2" />
        }

        return (
          <p key={idx} className="mb-2 leading-relaxed">
            {line}
          </p>
        )
      })}
    </div>
  )
}

export default function AgentDetailClient({ Agent, initialProcesses }: {
  Agent: AgentI | null
  initialProcesses: ProcessMetric[]
}) {
  const [agent, setAgent] = useState<AgentI | null>(Agent)
  const [notFound, setNotFound] = useState(false)
  const [isCleaningCache, setIsCleaningCache] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedDocker, setCopiedDocker] = useState(false)
  const [showProcesses, setShowProcesses] = useState(false)
  const [processes, setProcesses] = useState<ProcessMetric[]>(initialProcesses) // Changed from ps  const [showProcesses, setShowProcesses] = useState(false);
  const agentId = Agent?.id

  interface FolderCleanupData {
    before: number
    after: number
    freed: number
  }

  interface CleanupResponse {
    success?: boolean
    result?: {
      status: string
      freed?: Record<string, FolderCleanupData> & { total: number }
      output?: string
    }
    error?: string
    details?: string
  }

  const handleCacheCleanup = async () => {
    if (!agent) return

    setIsCleaningCache(true)

    try {
      const { data } = await axios.post<CleanupResponse>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://opsentrix.onrender.com'}/telemetry/clean-up`,
        { agentId }
      )

      if (data.success && data.result) {
        const cleanupResult = data.result

        if (cleanupResult.status === "success" && cleanupResult.freed) {
          const freedData = cleanupResult.freed
          const totalFreed = freedData.total ?? 0

          const folderDetails = Object.entries(freedData)
            .filter(([key]) => key !== "total")
            .map(([folder, val]) => {
              const freed = (val as FolderCleanupData).freed
              return freed > 0 ? `${folder}: ${freed}MB` : null
            })
            .filter(Boolean)
            .join(", ")

          if (totalFreed > 0) {
            toast.success(
              <div>
                <div className="font-semibold">Cleanup Complete!</div>
                <div className="text-sm opacity-90">Freed {totalFreed}MB total</div>
                {folderDetails && (
                  <div className="text-xs opacity-70 mt-1">{folderDetails}</div>
                )}
              </div>
            )
          } else {
            toast.info("Cleanup complete - system already optimized")
          }
        } else if (cleanupResult.status === "error") {
          toast.error(cleanupResult.output || "Cleanup failed")
        } else {
          toast.info("Cleanup completed with no changes")
        }
      } else if (data.error) {
        toast.error(data.error)
        console.error("Cleanup error:", data.details)
      } else {
        toast.warning("Cleanup returned unexpected response")
      }

    } catch (error: any) {
      console.error("Failed to initiate cache cleanup:", error)

      if (error.response?.status === 404) {
        toast.error("Agent is offline or not connected")
      } else if (error.response?.status === 504) {
        toast.error("Cleanup timed out - agent did not respond")
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else {
        toast.error("Failed to initiate cache cleanup")
      }
    } finally {
      setIsCleaningCache(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'token' | 'docker') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'token') {
        setCopiedToken(true)
        setTimeout(() => setCopiedToken(false), 2000)
      } else {
        setCopiedDocker(true)
        setTimeout(() => setCopiedDocker(false), 2000)
      }
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  useEffect(() => {
    socket.connect()
    socket.emit("get_agent", agentId)

    socket.on("agent_data", (data: AgentI) => {
      if (data.id === agentId) {
        setAgent((prev) => ({
          ...prev,
          ...data,
          dailyinsights: data.dailyinsights ?? prev?.dailyinsights ?? null,
          insightDate: data.insightDate ?? prev?.insightDate ?? null,
        }))
        setNotFound(false)
      }
    })

    socket.on("process_update", (data) => {
      console.log("Process update received:", data)
      if (data.agentId === agentId && Array.isArray(data.processes)) {
        setProcesses(data.processes)
      }
    })

    socket.on("agent_update", (data: AgentI) => {
      if (data.id === agentId) {
        setAgent((prev) => {
          if (!prev) return data
          return {
            ...prev,
            ...data,
            dailyinsights: data.dailyinsights ?? prev.dailyinsights,
            insightDate: data.insightDate ?? prev.insightDate,
          }
        })
      }
    })

    socket.on("agent_not_found", (id: string) => {
      if (id === agentId) setNotFound(true)
    })

    return () => {
      socket.off("agent_data")
      socket.off("process_update")
      socket.off("agent_update")
      socket.off("agent_not_found")
      socket.disconnect()
    }
  }, [agentId])

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Agent Not Found</h1>
          <p className="text-sm opacity-60 mb-6">The requested agent does not exist</p>
          <Link href="/dashboard" className="btn btn-primary btn-sm gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-sm opacity-60">Loading agent data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-[1600px] mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:underline mb-2 inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <p className="text-xs opacity-50 font-mono mt-1">{agent.id}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`badge gap-2 ${agent.status === "online" ? "badge-success" : "badge-error"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {agent.status}
            </div>
            <AgentStatusBadge agent={agent} />
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="opacity-50">Processes:</span>
                  <span className="font-semibold ml-2">{agent.processes}</span>
                </div>
                <div className="opacity-20">|</div>
                <div>
                  <span className="opacity-50">Last Heartbeat:</span>
                  <span className="font-semibold ml-2">{new Date(agent.lastHeartbeat).toLocaleTimeString()}</span>
                </div>
                <div className="opacity-20">|</div>
                <div>
                  <span className="opacity-50">Location:</span>
                  <span className="font-semibold ml-2">{agent.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="ai-insights-modal" className="btn btn-sm btn-ghost gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Insights
                </label>

                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn btn-sm btn-ghost gap-2">
                    <Settings className="w-4 h-4" />
                    Actions
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-50 menu p-2 shadow-lg bg-base-200 rounded-box w-64 mt-2 border border-base-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <li>
                      <button
                        onClick={handleCacheCleanup}
                        disabled={isCleaningCache || agent.status !== "online"}
                        className={`text-sm flex items-center gap-2 ${agent.status !== "online"
                            ? "opacity-60 cursor-not-allowed tooltip tooltip-bottom"
                            : ""
                          }`}
                        data-tip={agent.status !== "online" ? "Agent is offline" : ""}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>{isCleaningCache ? "Cleaning..." : "Clear Cache"}</span>
                        {isCleaningCache && <span className="loading loading-spinner loading-xs"></span>}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowProcesses(true)
                          const dropdown = document.activeElement as HTMLElement
                          dropdown?.blur()
                        }}
                        className="text-sm"
                      >
                        <List className="w-4 h-4" />
                        <span>View Processes</span>
                      </button>
                    </li>
                  </ul>
                </div>
                {showProcesses && (
                  <ProcessListPopup
                    processes={processes}
                    agentId={agentId!}
                    onClose={() => setShowProcesses(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Modal */}
        <input type="checkbox" id="ai-insights-modal" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box w-11/12 max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-secondary" />
                <div>
                  <h3 className="font-bold text-lg">AI Daily Insights</h3>
                  {agent.insightDate && (
                    <p className="text-xs opacity-60">
                      {new Date(agent.insightDate).toLocaleDateString()} at{" "}
                      {new Date(agent.insightDate).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              <label htmlFor="ai-insights-modal" className="btn btn-sm btn-circle btn-ghost">✕</label>
            </div>
            <div className="divider my-2"></div>
            <MarkdownRenderer content={agent.dailyinsights ?? "Error fetching AI Insights"} />
          </div>
          <label className="modal-backdrop" htmlFor="ai-insights-modal">Close</label>
        </div>

        {/* Metrics */}
        <AgentMetricsCharts agent={agent} />

        {/* Configuration */}
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Configuration</h2>
              <AgentDeleteButton agentId={agent.id} />
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-base-300/30 rounded-lg">
                <div className="text-xs opacity-50 mb-1 uppercase tracking-wide">Agent ID</div>
                <code className="text-sm font-mono">{agent.id}</code>
              </div>

              {agent.token && (
                <>
                  <div className="p-3 bg-base-300/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs opacity-50 uppercase tracking-wide">Token</div>
                      <button
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => copyToClipboard(agent.token!, 'token')}
                      >
                        {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <code className="text-xs font-mono break-all">{agent.token}</code>
                  </div>

                  <div className="p-3 bg-base-300/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs opacity-50 uppercase tracking-wide">Docker Command</div>
                      <button
                        className="btn btn-ghost btn-xs gap-1"
                        onClick={() => copyToClipboard(
                          `docker run -d --name ${agent.name} --privileged --pid=host -e AGENT_TOKEN="${agent.token}" -e AGENT_NAME="${agent.id}" etherealfrost019/opsentrix-agent:latest`,
                          'docker'
                        )}
                      >
                        {copiedDocker ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <code className="text-xs font-mono break-all whitespace-pre-wrap">
                      {`docker run -d --name ${agent.name} --privileged --pid=host -e AGENT_TOKEN="${agent.token}" -e AGENT_NAME="${agent.id}" etherealfrost019/opsentrix-agent:latest`}
                    </code>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}