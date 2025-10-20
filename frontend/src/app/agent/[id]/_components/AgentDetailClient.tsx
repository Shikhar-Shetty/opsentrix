"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import axios from "axios"
import { socket } from "@/components/socket"
import AgentMetricsCharts from "./AgentMetricsChart"
import AgentDeleteButton from "./DeleteAgent"
import { AlertCircle, AlertTriangle, CheckCircle, Sparkles, Settings, Trash2, Info, ArrowLeft, Copy, Check } from "lucide-react"
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
  let colorClass = "bg-success/20 text-success border border-success/30"
  let Icon = CheckCircle

  if (risk.level === "medium") {
    colorClass = "bg-warning/20 text-warning border border-warning/30"
    Icon = AlertTriangle
  } else if (risk.level === "high") {
    colorClass = "bg-error/20 text-error border border-error/30"
    Icon = AlertCircle
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium ${colorClass}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm">{risk.message}</span>
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
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedDocker, setCopiedDocker] = useState(false)
  const agentId = Agent?.id

  interface FolderCleanupData {
    before: number;
    after: number;
    freed: number;
  }
  
  interface CleanupResponse {
    success?: boolean;
    result?: {
      status: string;
      freed?: Record<string, FolderCleanupData> & { total: number };
      output?: string;
    };
    error?: string;
    details?: string;
  }
  
  const handleCacheCleanup = async () => {
    if (!agent) return;
    
    setIsCleaningCache(true);
    
    try {
      const { data } = await axios.post<CleanupResponse>(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://opsentrix.onrender.com'}/telemetry/clean-up`, 
        { agentId }
      );
      
      console.log("Cleanup response:", data);
      
      if (data.success && data.result) {
        const cleanupResult = data.result;
        
        if (cleanupResult.status === "success" && cleanupResult.freed) {
          const freedData = cleanupResult.freed;
          const totalFreed = freedData.total ?? 0;
          
          const folderDetails = Object.entries(freedData)
            .filter(([key]) => key !== "total")
            .map(([folder, val]) => {
              const freed = (val as FolderCleanupData).freed;
              return freed > 0 ? `${folder}: ${freed}MB` : null;
            })
            .filter(Boolean)
            .join(", ");
          
          if (totalFreed > 0) {
            toast.success(
              <div>
                <div className="font-semibold">Cleanup Complete!</div>
                <div className="text-sm opacity-90">Freed {totalFreed}MB total</div>
                {folderDetails && (
                  <div className="text-xs opacity-70 mt-1">{folderDetails}</div>
                )}
              </div>
            );
          } else {
            toast.info("Cleanup complete - system already optimized");
          }
        } else if (cleanupResult.status === "error") {
          toast.error(cleanupResult.output || "Cleanup failed");
        } else {
          toast.info("Cleanup completed with no changes");
        }
      } else if (data.error) {
        toast.error(data.error);
        console.error("Cleanup error:", data.details);
      } else {
        toast.warning("Cleanup returned unexpected response");
      }
      
    } catch (error: any) {
      console.error("Failed to initiate cache cleanup:", error);
      
      if (error.response?.status === 404) {
        toast.error("Agent is offline or not connected");
      } else if (error.response?.status === 504) {
        toast.error("Cleanup timed out - agent did not respond");
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to initiate cache cleanup");
      }
    } finally {
      setIsCleaningCache(false);
    }
  };

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
    <div className="min-h-screen bg-base-100 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="btn btn-ghost btn-sm mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold truncate mb-2">{agent.name}</h1>
              <p className="text-sm opacity-60 font-mono truncate">{agent.id}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70 hidden sm:inline">Status:</span>
                <div className={`badge ${agent.status === "online" ? "badge-success" : "badge-error"} gap-2`}>
                  <span className={`inline-block h-2 w-2 rounded-full ${agent.status === "online" ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                  {agent.status}
                </div>
              </div>
              
              <AgentStatusBadge agent={agent} />
              
              <div className="dropdown dropdown-end">
                <div className="flex items-center gap-2">
                  <label
                    tabIndex={0}
                    className="btn btn-sm btn-outline btn-primary gap-2 hover:btn-primary transition-all duration-200"
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
                      <Sparkles className="w-5 h-5 text-secondary" />
                      <div className="flex-1">
                        <span className="font-medium">AI Insights</span>
                        <p className="text-xs opacity-60">View AI-generated analysis</p>
                      </div>
                    </label>
                  </li>
                  
                  <li>
                    <button
                      onClick={handleCacheCleanup}
                      disabled={isCleaningCache || agent.status !== "online"}
                      className="flex items-center gap-3 p-3 hover:bg-base-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-5 h-5 text-warning" />
                      <div className="flex-1 text-left">
                        <span className="font-medium">
                          {isCleaningCache ? "Cleaning..." : "Clear Cache"}
                        </span>
                        <p className="text-xs opacity-60">
                          {agent.status !== "online" ? "Agent must be online" : "Free up system memory"}
                        </p>
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
            <div className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <h3 className="text-xs font-medium opacity-70 uppercase tracking-wide mb-1">CPU Usage</h3>
                <p className="text-2xl lg:text-3xl font-bold mb-2">{agent.CPU.toFixed(1)}%</p>
                <progress 
                  className={`progress w-full ${agent.CPU >= 80 ? 'progress-error' : agent.CPU >= 60 ? 'progress-warning' : 'progress-primary'}`} 
                  value={agent.CPU} 
                  max={100}
                ></progress>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <h3 className="text-xs font-medium opacity-70 uppercase tracking-wide mb-1">Memory</h3>
                <p className="text-2xl lg:text-3xl font-bold mb-2">{agent.memory.toFixed(1)}%</p>
                <progress 
                  className={`progress w-full ${agent.memory >= 85 ? 'progress-error' : agent.memory >= 70 ? 'progress-warning' : 'progress-secondary'}`}
                  value={agent.memory} 
                  max={100}
                ></progress>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <h3 className="text-xs font-medium opacity-70 uppercase tracking-wide mb-1">Disk Usage</h3>
                <p className="text-2xl lg:text-3xl font-bold mb-2">{agent.disk.toFixed(1)}%</p>
                <progress 
                  className={`progress w-full ${agent.disk >= 90 ? 'progress-error' : agent.disk >= 75 ? 'progress-warning' : 'progress-accent'}`}
                  value={agent.disk} 
                  max={100}
                ></progress>
              </div>
            </div>
            <div className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
              <div className="card-body p-4">
                <h3 className="text-xs font-medium opacity-70 uppercase tracking-wide mb-1">Processes</h3>
                <p className="text-2xl lg:text-3xl font-bold mb-2">{agent.processes}</p>
                <p className="text-xs opacity-60">Active processes</p>
              </div>
            </div>
          </div>

          <AgentMetricsCharts agent={agent} />

          <div className="card bg-base-200 border border-base-300 shadow-sm mt-6">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Agent Information</h2>
                <AgentDeleteButton agentId={agent.id} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-base-300/50 rounded-lg">
                  <p className="text-xs font-medium opacity-70 uppercase tracking-wide mb-1">Agent ID</p>
                  <p className="font-mono text-sm">{agent.id}</p>
                </div>
                <div className="p-3 bg-base-300/50 rounded-lg">
                  <p className="text-xs font-medium opacity-70 uppercase tracking-wide mb-1">Last Heartbeat</p>
                  <p className="text-sm">{new Date(agent.lastHeartbeat).toLocaleString()}</p>
                </div>
                {agent.token && (
                  <div className="md:col-span-2 p-3 bg-base-300/50 rounded-lg">
                    <p className="text-xs font-medium opacity-70 uppercase tracking-wide mb-2">Agent Token</p>
                    <div className="flex items-start gap-2">
                      <code className="text-xs font-mono bg-base-100 px-3 py-2 rounded-lg flex-1 break-all border border-base-300">
                        {agent.token}
                      </code>
                      <button
                        className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
                        onClick={() => copyToClipboard(agent.token!, 'token')}
                      >
                        {copiedToken ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {agent.token && (
                  <div className="md:col-span-2 p-3 bg-base-300/50 rounded-lg">
                    <p className="text-xs font-medium opacity-70 uppercase tracking-wide mb-2">Docker Run Command</p>
                    <div className="flex items-start gap-2">
                      <code className="text-xs font-mono bg-base-100 px-3 py-2 rounded-lg flex-1 break-all whitespace-pre-wrap border border-base-300">
                        {`docker run -d --name ${agent.name} -e AGENT_TOKEN="${agent.token}" -e AGENT_NAME="${agent.id}" etherealfrost019/opsentrix-agent:latest`}
                      </code>
                      <button
                        className="btn btn-ghost btn-sm btn-circle flex-shrink-0"
                        onClick={() => copyToClipboard(`docker run -d --name ${agent.name} -e AGENT_TOKEN="${agent.token}" -e AGENT_NAME="${agent.id}" etherealfrost019/opsentrix-agent:latest`, 'docker')}
                      >
                        {copiedDocker ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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