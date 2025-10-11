"use client"

import Link from "next/link"
import { useState, useCallback, useEffect } from "react"
import { createAgent } from "../../../../actions/agent"
import { RelativeTime } from "./RelativeTime"
import { socket } from "@/components/socket"

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

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-block h-3 w-3 ml-2 rounded-full ${status === "online" ? "bg-success" : "bg-error"}`} />
)

const ProgressBar = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs opacity-70 w-14">{label}</span>
    <progress className="progress progress-primary w-32" value={value} max={100}></progress>
    <span className="text-xs tabular-nums w-10 text-right">{value}%</span>
  </div>
)

const TokenCell = ({ token }: { token?: string }) => {
  const [revealed, setRevealed] = useState(false)
  if (!token) return <span className="opacity-60">-</span>
  const masked = revealed ? token : `${token.slice(0, 6)}••••••••••${token.slice(-4)}`
  const copy = async () => {
    if (token)
      try {
        await navigator.clipboard.writeText(token)
      } catch {}
  }
  return (
    <div className="flex items-center gap-2">
      <code className="kbd kbd-sm">{masked}</code>
      <button className="btn btn-ghost btn-xs" onClick={() => setRevealed((r) => !r)}>
        {revealed ? "Hide" : "View"}
      </button>
      <button className="btn btn-ghost btn-xs" onClick={copy}>
        Copy
      </button>
    </div>
  )
}

const DockerCommandCell = ({ token, id }: { token: string; id: string }) => {
  const dockerCmd = `docker run -d --name agent-1 -e AGENT_TOKEN="${token}" -e AGENT_NAME="${id}" etherealfrost019/opsentrix-agent:latest`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(dockerCmd)
    } catch {}
  }
  return (
    <div className="mt-4">
      <label className="label">
        <span className="label-text font-medium">Docker Command:</span>
      </label>
      <div className="flex my-1 gap-2">
        <textarea
          className="textarea textarea-bordered w-full font-mono text-xs focus:outline-none focus:ring-0 resize-none overflow-hidden pl-5"
          readOnly
          value={dockerCmd}
          rows={4}
        />
        <button className="btn btn-sm" onClick={copy}>
          Copy
        </button>
      </div>
      <div className="label">
        <span className="label-text-alt opacity-70">Run this command to start your agent</span>
      </div>
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

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agents Dashboard</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => setAgents([...agents])}>
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
            + New Agent
          </button>
        </div>
      </header>

      <div className="card bg-base-200">
        <div className="card-body overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Status</th>
                <th>Last heartbeat</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Disk</th>
                <th>Proc</th>
                <th>Token</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="flex flex-col">
                      <Link href={`/agent/${a.id}`} className="link link-hover font-medium">
                        {a.name}
                      </Link>
                      <span className="text-xs opacity-70">{a.id}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="text-sm">
                    <RelativeTime date={a.lastHeartbeat} />
                  </td>
                  <td>
                    <ProgressBar value={a.CPU} label="CPU" />
                  </td>
                  <td>
                    <ProgressBar value={a.memory} label="Mem" />
                  </td>
                  <td>
                    <ProgressBar value={a.disk} label="Disk" />
                  </td>
                  <td className="text-sm tabular-nums">{a.processes}</td>
                  <td>
                    <TokenCell token={a.token} />
                  </td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="flex justify-center py-8 opacity-70">No agents yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`modal ${creating ? "modal-open" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-box focus:outline-none">
          <h3 className="text-lg font-medium">Create New Agent</h3>
          <p className="opacity-70 mb-4">Name your agent to generate a registration token.</p>

          <label className="form-control flex">
            <div className="label mr-2">
              <span className="label-text">Agent name:</span>
            </div>
            <input
              type="text"
              className="input input-bordered focus:outline-none focus:ring-0 w-full"
              placeholder="e.g., web-node-01"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              disabled={!!creatingToken}
            />
          </label>
          <div className="label pt-3">
            <span className="label-text-alt opacity-70">You can't change this later.</span>
          </div>

          {creatingToken && (
            <>
              <div className="alert alert-info mt-4">
                <div>
                  <h4 className="font-medium">Agent token generated</h4>
                  <p className="text-sm opacity-90">
                    Copy this token and use it to register your agent. It will also appear in the dashboard.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  className="input input-bordered input-sm w-full focus:outline-none focus:ring-0"
                  readOnly
                  value={creatingToken}
                  aria-label="New agent token"
                />
                <button
                  className="btn btn-sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(creatingToken)
                    } catch {}
                  }}
                >
                  Copy
                </button>
              </div>
              <DockerCommandCell token={creatingToken} id={creatingAgentId} />
            </>
          )}

          <div className="modal-action">
            {!creatingToken ? (
              <>
                <button className="btn btn-ghost" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={onCreateAgent} disabled={!newName.trim()}>
                  Create & Generate Token
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={closeCreateModal}>
                Done
              </button>
            )}
          </div>
        </div>
        <div className="modal-backdrop" onClick={closeCreateModal} />
      </div>
    </div>
  )
}
