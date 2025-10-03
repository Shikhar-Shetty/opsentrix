"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { socket } from "@/components/socket"
import AgentMetricsCharts from "./AgentMetricsChart"
import AgentDeleteButton from "./DeleteAgent"

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
}

export default function AgentDetailClient({ Agent }:{Agent: Agent | null}) {
  const [agent, setAgent] = useState<Agent | null>(Agent)
  const [notFound, setNotFound] = useState(false)
  const agentId = Agent?.id;
  useEffect(() => {
    socket.connect()
    socket.emit("get_agent", agentId)

    socket.on("agent_data", (data: Agent) => {
      if (data.id === agentId) {
        setAgent(data)
        setNotFound(false)
      }
    })

    socket.on("agent_update", (data: Agent) => {
      if (data.id === agentId) {
        setAgent(data)
      }
    })

    socket.on("agent_not_found", (id: string) => {
      if (id === agentId) {
        setNotFound(true)
      }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{agent.name}</h1>
              <p className="text-sm opacity-70 mt-1">{agent.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">Status:</span>
              <div className={`badge ${agent.status === "online" ? "badge-success" : "badge-error"} gap-2`}>
                <span className="inline-block h-2 w-2 rounded-full bg-white" />
                {agent.status}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="text-sm opacity-70">CPU Usage</h3>
              <p className="text-3xl font-bold">{agent.CPU}%</p>
              <progress className="progress progress-primary" value={agent.CPU} max={100}></progress>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="text-sm opacity-70">Memory</h3>
              <p className="text-3xl font-bold">{agent.memory}%</p>
              <progress className="progress progress-secondary" value={agent.memory} max={100}></progress>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="text-sm opacity-70">Disk Usage</h3>
              <p className="text-3xl font-bold">{agent.disk}%</p>
              <progress className="progress progress-accent" value={agent.disk} max={100}></progress>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="text-sm opacity-70">Processes</h3>
              <p className="text-3xl font-bold">{agent.processes}</p>
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
  )
}
