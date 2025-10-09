"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { socket } from "@/components/socket"
import AgentMetricsCharts from "./AgentMetricsChart"
import AgentDeleteButton from "./DeleteAgent"
import { AlertCircle, AlertTriangle, CheckCircle, Sparkles, Settings, Trash2, Info } from "lucide-react"
import { toast } from "sonner";

export interface Agent {
  id: string
  name: string
  token?: string
  status: string
  lastHeartbeat: Date
  CPU: number
  memory: number
  disk: number
  processes: number
  dailyinsights: string | null
  insightDate: Date | null
}

type RiskLevel = "none" | "medium" | "high"

const getRisk = (agent: Agent): { level: RiskLevel; message: string } => {
  if (agent.CPU >= 90 || agent.disk >= 90 || agent.memory >= 95 || agent.processes >= 800) {
    if (agent.CPU >= 90) return { level: "high", message: "High CPU usage" }
    if (agent.disk >= 90) return { level: "high", message: "High disk usage" }
    if (agent.memory >= 95) return { level: "high", message: "High memory usage" }
    return { level: "high", message: "System under heavy load" }
  }

  if (agent.CPU >= 75 || agent.disk >= 80 || agent.memory >= 85 || agent.processes >= 500) {
    if (agent.CPU >= 75) return { level: "medium", message: "Elevated CPU usage" }
    if (agent.disk >= 80) return { level: "medium", message: "Elevated disk usage" }
    if (agent.memory >= 85) return { level: "medium", message: "Elevated memory usage" }
    return { level: "medium", message: "System load is elevated" }
  }

  return { level: "none", message: "No risk detected" }
}

const AgentStatusBadge = ({ agent }: { agent: Agent }) => {
  const risk = getRisk(agent)
  let colorClass = "bg-green-600/60 text-green-200 text-sm"
  let Icon = CheckCircle

  if (risk.level === "medium") {
    colorClass = "bg-yellow-600/60 text-yellow-200 text-sm"
    Icon = AlertTriangle
  } else if (risk.level === "high") {
    colorClass = "bg-red-700/60 text-red-200 text-sm"
    Icon = AlertCircle
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium ${colorClass}`}>
      <Icon className="w-4 h-4" />
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
        if (line.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-lg font-bold mt-4 mb-2">
              {line.replace("### ", "")}
            </h3>
          )
        }
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

export default function AgentDetailClient({ Agent }: { Agent: Agent | null }) {
  const [agent, setAgent] = useState<Agent | null>(Agent)
  const [notFound, setNotFound] = useState(false)
  const [isCleaningCache, setIsCleaningCache] = useState(false)
  const agentId = Agent?.id

  interface FolderCleanupData {
    before: number;
    after: number;
    freed: number;
  }
  
  interface CleanupResponse {
    status: string;
    freed: Record<string, FolderCleanupData> & { total: number };
  }
  
  const handleCacheCleanup = async () => {
    if (!agent) return;
    
    setIsCleaningCache(true);
    
    try {
      const { data } = await axios.post<CleanupResponse>(
        `http://localhost:4000/telemetry/clean-up`, 
        { agentId }
      );
      
      if (data.status === "success" && data.freed) {
        const freedData = data.freed;
        const totalFreed = freedData.total ?? 0;
        
        const folderDescription = Object.entries(freedData)
          .filter(([key]) => key !== "total")
          .map(([folder, val]) => {
            const freed = (val as FolderCleanupData).freed;
            return `${folder}: ${freed} MB`;
          })
          .join(", ");
        
        toast.success(`Cleanup complete! Freed ${totalFreed} MB`);
      } else {
        toast.error("Cleanup returned no data");
      }
      
    } catch (error) {
      console.error("Failed to initiate cache cleanup:", error);
      toast.error("Failed to initiate cache cleanup");
    } finally {
      setIsCleaningCache(false);
    }
  };

  useEffect(() => {
    socket.connect()
    socket.emit("get_agent", agentId)

    socket.on("agent_data", (data: Agent) => {
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

    socket.on("agent_update", (data: Agent) => {
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
      socket.off("agent_update")
      socket.off("agent_not_found")
      socket.disconnect()
    }
  }, [agentId])

  if (notFound) {
    return (
      <div className="min-h-screen bg-base-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-lg opacity-70 mb-6">Agent not found</p>
          <Link href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-base-100 p-6 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="btn btn-ghost btn-sm mb-4">
            ← Back to Dashboard
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold truncate">{agent.name}</h1>
              <p className="text-sm opacity-70 mt-1 font-mono truncate">{agent.id}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70 hidden sm:inline">Status:</span>
                <div className={`badge ${agent.status === "online" ? "badge-success" : "badge-error"} gap-2`}>
                  <span className="inline-block h-2 w-2 rounded-full bg-white" />
                  {agent.status}
                </div>
              </div>
              
              {/* Risk Status Badge */}
              <div className="w-full sm:w-auto">
                <AgentStatusBadge agent={agent} />
              </div>
              
              <div className="dropdown dropdown-end w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <label
                    tabIndex={0}
                    className="btn btn-sm btn-outline btn-primary gap-2 hover:btn-primary transition-all duration-200 w-full sm:w-auto"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Actions</span>
                  </label>
                  
                  <div className="tooltip tooltip-left" data-tip="Agent management actions">
                    <Info className="w-4 h-4 opacity-60 hover:opacity-100 transition-opacity cursor-help" />
                  </div>
                </div>
                
                <ul
                  tabIndex={0}
                  className="dropdown-content z-50 menu p-2 shadow-xl bg-base-200 rounded-box w-64 mt-2 border border-base-300"
                >
                  <li>
                    <label
                      htmlFor="ai-insights-modal"
                      className="flex items-center gap-3 p-3 hover:bg-base-300 rounded-lg transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-secondary" />
                      <div className="flex-1">
                        <span className="font-medium">AI Insights</span>
                        <p className="text-xs opacity-60">View AI-generated analysis</p>
                      </div>
                    </label>
                  </li>
                  
                  <li>
                    <button
                      onClick={handleCacheCleanup}
                      disabled={isCleaningCache}
                      className="flex items-center gap-3 p-3 hover:bg-base-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-warning" />
                      <div className="flex-1 text-left">
                        <span className="font-medium">
                          {isCleaningCache ? "Cleaning..." : "Clear Cache"}
                        </span>
                        <p className="text-xs opacity-60">Free up system memory</p>
                      </div>
                      {isCleaningCache && <span className="loading loading-spinner loading-xs"></span>}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <input type="checkbox" id="ai-insights-modal" className="modal-toggle" />
          <div className="modal">
            <div className="modal-box w-11/12 max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  AI Daily Insights
                </h3>
                <label htmlFor="ai-insights-modal" className="btn btn-sm btn-circle btn-ghost">
                  ✕
                </label>
              </div>
              
              {agent.insightDate && (
                <p className="text-xs opacity-60 mb-4">
                  Generated on {new Date(agent.insightDate).toLocaleDateString()} at{" "}
                  {new Date(agent.insightDate).toLocaleTimeString()}
                </p>
              )}
              
              <div className="divider my-2"></div>
              <div className="pr-2">
                <MarkdownRenderer content={agent.dailyinsights ?? "Error fetching AI Insights"} />
              </div>
            </div>
            <label className="modal-backdrop" htmlFor="ai-insights-modal">Close</label>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="text-sm opacity-70">CPU Usage</h3>
                <p className="text-2xl lg:text-3xl font-bold">{agent.CPU}%</p>
                <progress className="progress progress-primary" value={agent.CPU} max={100}></progress>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="text-sm opacity-70">Memory</h3>
                <p className="text-2xl lg:text-3xl font-bold">{agent.memory}%</p>
                <progress className="progress progress-secondary" value={agent.memory} max={100}></progress>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="text-sm opacity-70">Disk Usage</h3>
                <p className="text-2xl lg:text-3xl font-bold">{agent.disk}%</p>
                <progress className="progress progress-accent" value={agent.disk} max={100}></progress>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="text-sm opacity-70">Processes</h3>
                <p className="text-2xl lg:text-3xl font-bold">{agent.processes}</p>
                <p className="text-xs opacity-60 mt-1">Active processes</p>
              </div>
            </div>
          </div>

          <AgentMetricsCharts agent={agent} />

          <div className="card bg-base-200 mt-6">
            <div className="card-body">
              <div className="flex justify-between">
                <h2 className="card-title">Agent Information</h2>
                <AgentDeleteButton agentId={agent.id} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm opacity-70">Agent ID</p>
                  <p className="font-mono text-sm">{agent.id}</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Last Heartbeat</p>
                  <p className="text-sm">{new Date(agent.lastHeartbeat).toLocaleString()}</p>
                </div>
                {agent.token && (
                  <div className="md:col-span-2">
                    <p className="text-sm opacity-70 mb-2">Agent Token</p>
                    <code className="kbd kbd-sm">{agent.token}</code>
                  </div>
                )}
                {agent.token && (
                  <div className="md:col-span-2 space-y-2">
                    <p className="text-xs uppercase tracking-wider opacity-60 font-semibold flex items-center gap-2">
                      Docker Run Command
                    </p>
                    <div className="flex items-start gap-2">
                      <code
                        id={`docker-cmd-${agent.id}`}
                        className="text-xs font-mono bg-base-300 px-3 py-2 rounded-lg flex-1 break-all whitespace-pre-wrap"
                      >
                        {`docker run -d --name ${agent.name} -e AGENT_TOKEN="${agent.token}" -e AGENT_NAME="${agent.id}" etherealfrost019/opsentrix-agent:latest`}
                      </code>
                      <button
                        className="btn btn-square btn-sm btn-ghost"
                        onClick={() => {
                          const text = document.getElementById(`docker-cmd-${agent.id}`)?.innerText
                          if (text) navigator.clipboard.writeText(text)
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}