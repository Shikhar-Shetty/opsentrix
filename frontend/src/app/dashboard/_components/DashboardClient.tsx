"use client"

import Link from "next/link"
import { useState, useCallback, useEffect } from "react"
import { createAgent } from "../../../../actions/agent"
import { RelativeTime } from "./RelativeTime"
import { socket } from "@/components/socket"
import {
  Cpu,
  HardDrive,
  Database,
  Settings,
  Eye,
  EyeOff,
  Clipboard,
  Check,
  Bot,
} from "lucide-react"
import React from "react"

export type Agent = {
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
  dailyinsights: string | null
  insightDate: Date | null
  message: string | null
  email: string
}

const StatusIndicator = ({ status }: { status: string }) => {
  const isOnline = status === "online"
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-success animate-pulse" : "bg-error"}`} />
      <span className={`text-sm font-medium ${isOnline ? "text-success" : "text-error"}`}>
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  )
}

const MetricCard = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => {
  const getColorClass = (val: number) => {
    if (val >= 80) return "text-error"
    if (val >= 60) return "text-warning"
    return "text-success"
  }

  return (
    <div className="bg-base-100 rounded-lg p-3 border border-base-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">{label}</span>
        <div className="text-lg w-5 h-5 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${getColorClass(value)}`}>{value}%</span>
        <div className="flex-1 mb-1">
          <progress 
            className={`progress w-full h-1 ${
              value >= 80 ? "progress-error" : value >= 60 ? "progress-warning" : "progress-success"
            }`} 
            value={value} 
            max={100}
          />
        </div>
      </div>
    </div>
  )
}

const TokenManager = ({ token }: { token?: string }) => {
  const [isRevealed, setIsRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!token) {
    return (
      <div className="flex items-center gap-2 text-base-content/50">
        <span className="text-sm">No token</span>
      </div>
    )
  }

  const displayToken = isRevealed ? token : `${token.slice(0, 8)}${"•".repeat(20)}${token.slice(-4)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy token:", error)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <code className="bg-base-200 px-2 py-1 rounded text-xs font-mono border">
        {displayToken}
      </code>
      <div className="flex gap-1">
        <button
          className="btn btn-ghost btn-xs w-6 h-6 p-0 min-h-0 flex items-center justify-center"
          onClick={() => setIsRevealed(!isRevealed)}
          title={isRevealed ? "Hide token" : "Show token"}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </div>
        </button>
        <button
          className="btn btn-ghost btn-xs w-6 h-6 p-0 min-h-0 flex items-center justify-center"
          onClick={handleCopy}
          title="Copy token"
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {copied ? <Check size={14} /> : <Clipboard size={14} />}
          </div>
        </button>
      </div>
    </div>
  )
}

const AgentCard = ({ agent }: { agent: Agent }) => {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow">
      <div className="card-body p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link href={`/agent/${agent.id}`} className="link link-hover">
              <h3 className="text-lg font-semibold text-base-content">{agent.name}</h3>
            </Link>
            <p className="text-sm text-base-content/60 font-mono mt-1">{agent.id}</p>
          </div>
          <StatusIndicator status={agent.status} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <MetricCard label="CPU" value={agent.CPU} icon={<Cpu size={18} />} />
          <MetricCard label="Memory" value={agent.memory} icon={<HardDrive size={18} />} />
          <MetricCard label="Disk" value={agent.disk} icon={<Database size={18} />} />
          <div className="bg-base-100 rounded-lg p-3 border border-base-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Processes</span>
              <div className="text-lg w-5 h-5 flex items-center justify-center">
                <Settings size={18} />
              </div>
            </div>
            <span className="text-2xl font-bold">{agent.processes}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-base-content/70 uppercase tracking-wide block mb-1">
              Last Heartbeat
            </label>
            <div className="text-sm text-base-content">
              <RelativeTime date={agent.lastHeartbeat} />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-base-content/70 uppercase tracking-wide block mb-1">
              Access Token
            </label>
            <TokenManager token={agent.token} />
          </div>
        </div>
      </div>
    </div>
  )
}

const CreateAgentModal = ({
  isOpen,
  onClose,
  newName,
  setNewName,
  onCreateAgent,
  creatingToken,
  creatingAgentName,
  creatingAgentId,
}: {
  isOpen: boolean
  onClose: () => void
  newName: string
  setNewName: (name: string) => void
  onCreateAgent: () => void
  creatingToken: string | null
  creatingAgentName: string
  creatingAgentId: string
}) => {
  const dockerCmd = creatingToken 
    ? `docker run -d --name ${creatingAgentName} -e AGENT_TOKEN="${creatingToken}" -e AGENT_NAME="${creatingAgentId}" etherealfrost019/opsentrix-agent:latest`
    : ""

  const copyDockerCommand = async () => {
    try {
      await navigator.clipboard.writeText(dockerCmd)
    } catch (error) {
      console.error("Failed to copy docker command:", error)
    }
  }

  const copyToken = async () => {
    if (creatingToken) {
      try {
        await navigator.clipboard.writeText(creatingToken)
      } catch (error) {
        console.error("Failed to copy token:", error)
      }
    }
  }

  return (
    <div className={`modal ${isOpen ? "modal-open" : ""}`}>
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Create New Agent</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
        </div>

        {!creatingToken ? (
          <div className="space-y-6">
            <div className="alert alert-info">
              <div>
                <h4 className="font-medium">Agent Setup</h4>
                <p className="text-sm opacity-90">
                  Create a new agent by providing a unique name. A secure token will be generated for authentication.
                </p>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium pb-1 pl-1">Agent Name</span>
              </label>
              <input
                type="text"
                className="input focus:outline-none input-bordered w-full"
                placeholder="e.g., production-server-01"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <label className="label">
                <span className="label-text-alt pt-1 pl-1 text-base-content/60">
                  Choose a descriptive name. This cannot be changed later.
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={onCreateAgent} 
                disabled={!newName.trim()}
              >
                Create Agent
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="alert alert-success">
              <div>
                <h4 className="font-medium">Agent Created Successfully!</h4>
                <p className="text-sm opacity-90">
                  Your agent <strong>{creatingAgentName}</strong> has been created. Save the token and Docker command below.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium pb-1">Authentication Token</span>
                </label>
                <div className="flex items-start gap-2">
                  <code className="text-xs font-mono bg-base-200 px-2 pl-3 py-2 rounded-lg flex-1 break-all whitespace-pre-wrap border border-base-300">
                    {creatingToken}
                  </code>
                  <button className="btn btn-circle p-1 btn-sm btn-ghost flex-shrink-0" onClick={copyToken}>
                    Copy
                  </button>
                </div>
                <label className="label">
                  <span className="label-text-alt mt-1 text-sm text-warning">
                    ⚠️ Store this token securely. It won't be shown again.
                  </span>
                </label>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium pb-1">Docker Run Command</span>
                </label>
                <div className="flex items-start gap-2">
                  <code className="text-xs font-mono bg-base-200 px-2 pl-3 py-2 rounded-lg flex-1 break-all whitespace-pre-wrap border border-base-300">
                    {dockerCmd}
                  </code>
                  <button className="btn btn-circle p-1 btn-sm btn-ghost flex-shrink-0" onClick={copyDockerCommand}>
                    Copy
                  </button>
                </div>
                <label className="label">
                  <span className="label-text-alt pt-1 text-sm text-base-content/60">
                    Run this command on your target server to deploy the agent.
                  </span>
                </label>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  )
}

type Props = { initialAgents: Agent[] }

export default function DashboardClient({ initialAgents }: Props) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [creatingToken, setCreatingToken] = useState<string | null>(null)
  const [creatingAgentName, setCreatingAgentName] = useState<string>("")
  const [creatingAgentId, setCreatingAgentId] = useState<string>("")

  useEffect(() => {
    socket.connect()

    socket.on("connect", () => {
      console.log("Connected to backend via socket.io")
    })

    socket.on("agent_update", (data: Agent) => {
      console.log("Received agent update:", data)
      setAgents((prev) => {
        const exists = prev.find((a) => a.id === data.id)
        if (exists) {
          return prev.map((a) => (a.id === data.id ? { ...a, ...data } : a))
        }
        return [...prev, data]
      })
    })

    return () => {
      socket.off("agent_update")
      socket.off("connect")
      socket.disconnect()
    }
  }, [])

  const generateToken = () =>
    "tok_" + crypto.getRandomValues(new Uint8Array(12)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")
  const generateAgentId = () =>
    "agt_" + crypto.getRandomValues(new Uint8Array(6)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")

  const onCreateAgent = useCallback(async () => {
    const name = newName.trim()
    if (!name) return
    const token = generateToken()
    const id = generateAgentId()
    try {
      const res = await createAgent({ name, token, id })
      setAgents((prev) => [...prev, res])
      setCreatingToken(token)
      setCreatingAgentName(name)
      setCreatingAgentId(id)
    } catch (err) {
      console.error(err)
    }
  }, [newName])

  const closeCreateModal = useCallback(() => {
    setCreating(false)
    setCreatingToken(null)
    setNewName("")
    setCreatingAgentName("")
    setCreatingAgentId("")
  }, [])

  const onlineAgents = agents.filter(a => a.status === "online").length
  const totalAgents = agents.length

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto px-1 py-1">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content mb-2">Agent Management</h1>
              <p className="text-base-content/70">Monitor and manage your distributed agents</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="stats shadow-sm bg-base-100 border border-base-300">
                <div className="stat py-1 px-4">
                  <div className="stat-title text-xs">Active</div>
                  <div className="stat-value text-sm text-success">{onlineAgents}</div>
                </div>
                <div className="stat py-1 px-4">
                  <div className="stat-title text-xs">Total</div>
                  <div className="stat-value text-sm">{totalAgents}</div>
                </div>
              </div>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setAgents([...agents])}
              >
                Refresh
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setCreating(true)}
              >
                New Agent
              </button>
            </div>
          </div>
        </div>

        {agents.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body text-center py-16">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <Bot size={64} />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No Agents Yet</h3>
              <p className="text-base-content/70 mb-6">
                Get started by creating your first agent to monitor and manage your infrastructure.
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => setCreating(true)}
              >
                Create Your First Agent
              </button>
            </div>
          </div>
        )}

        <CreateAgentModal
          isOpen={creating}
          onClose={closeCreateModal}
          newName={newName}
          setNewName={setNewName}
          onCreateAgent={onCreateAgent}
          creatingToken={creatingToken}
          creatingAgentName={creatingAgentName}
          creatingAgentId={creatingAgentId}
        />
      </div>
    </div>
  )
}