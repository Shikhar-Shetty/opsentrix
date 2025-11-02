import { useState } from "react"
import { X, Trash2, ChevronRight, Loader2 } from "lucide-react"
import { socket } from "@/components/socket"
import { toast } from "sonner"

interface ProcessMetric {
  id: string
  pid: number
  processName: string
  cpuUsage: number
  memoryUsage: number
  status: string
  aiFlag: string
  aiReason: string | null
}

export default function ProcessListPopup({
  processes,
  agentId, // Add agentId prop
  onClose
}: {
  processes: ProcessMetric[]
  agentId: string // Add this
  onClose: () => void
}) {
  const [selectedProcess, setSelectedProcess] = useState<ProcessMetric | null>(null)
  const [killingPid, setKillingPid] = useState<number | null>(null)

  const handleDelete = async (pid: number, processName: string) => {
    if (!confirm(`Kill process "${processName}" (PID: ${pid})?\n\nThis will terminate the process immediately.`)) {
      return
    }

    setKillingPid(pid)

    socket.emit("kill_process", { agentId, pid })

    const killResponseHandler = (data: any) => {
      if (data.pid === pid) {
        setKillingPid(null)

        if (data.status === "success") {
          toast.success(data.message || `Process terminated successfully`, {
            description: `${processName} has been stopped`
          })

          if (selectedProcess?.pid === pid) {
            setSelectedProcess(null)
          }
        } else {
          // Handle different error types
          if (data.permissionDenied) {
            toast.warning("Protected System Process", {
              description: "This process cannot be killed as it's protected by the system or owned by another user."
            })
          } else if (data.message?.includes("no longer exists") || data.message?.includes("already terminated")) {
            toast.info("Process Already Stopped", {
              description: "This process has already been terminated or no longer exists."
            })
          } else {
            toast.error("Failed to Kill Process", {
              description: data.message || "An unexpected error occurred"
            })
          }
        }

        socket.off("process_kill_result", killResponseHandler)
      }
    }

    socket.on("process_kill_result", killResponseHandler)

    setTimeout(() => {
      if (killingPid === pid) {
        setKillingPid(null)
        toast.error("Request Timeout", {
          description: "The agent didn't respond in time. Please try again."
        })
        socket.off("process_kill_result", killResponseHandler)
      }
    }, 15000)
  }
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-black/20 flex justify-center items-center z-50 p-8"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-[1200px] h-[85vh] flex gap-6">
        {/* Left Side - Process List (Floating Card) */}
        <div className="w-[40%] flex flex-col bg-base-200/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-base-300/50 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-base-300/50">
            <div>
              <h2 className="text-lg font-semibold">Active Processes</h2>
              <p className="text-xs opacity-50">{processes.length} running</p>
            </div>
            <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {processes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm opacity-50">No processes found</p>
              </div>
            ) : (
              <div className="divide-y divide-base-300/50">
                {processes.map((p) => (
                  <div
                    key={`${p.id}-${p.pid}`}
                    onClick={() => setSelectedProcess(p)}
                    className={`p-4 cursor-pointer hover:bg-base-300/30 transition-all ${selectedProcess?.id === p.id ? "bg-primary/10 border-l-4 border-primary" : ""
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm truncate">
                            {p.processName}
                          </span>
                          <span className={`badge badge-xs ${p.aiFlag === 'safe' ? 'badge-success' :
                            p.aiFlag === 'unsafe' ? 'badge-error' :
                              'badge-ghost opacity-50'
                            }`}>
                            {p.aiFlag === 'unknown' ? '?' : p.aiFlag}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs opacity-70">
                          <span className="font-mono">PID: {p.pid}</span>
                          <span>CPU: {p.cpuUsage.toFixed(1)}%</span>
                          <span>MEM: {p.memoryUsage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Process Details */}
        <div className="flex-1 flex flex-col">
          {selectedProcess ? (
            <>
              {/* Header Card (Floating) */}
              <div className="bg-base-200/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-base-300/50 p-6 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl">{selectedProcess.processName}</h3>
                    <p className="text-xs opacity-50 font-mono mt-1">PID: {selectedProcess.pid}</p>
                  </div>
                  {selectedProcess.aiFlag !== "safe" && (
                    <p className="text-xs opacity-60 text-center">
                      🛡️ Protected <span className="hidden md:inline-block">- This process is critical for system stability</span>
                    </p>
                  )}
                  <button
                    disabled={selectedProcess.aiFlag !== "safe" || killingPid === selectedProcess.pid}
                    onClick={() => handleDelete(selectedProcess.pid, selectedProcess.processName)}
                    className={`btn btn-sm gap-2 ${selectedProcess.aiFlag === "safe" ? "btn-error" : "btn-disabled"
                      }`}
                    title={
                      selectedProcess.aiFlag !== "safe"
                        ? "This process is marked as unsafe to terminate"
                        : "Terminate this process"
                    }
                  >
                    {killingPid === selectedProcess.pid ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Terminating...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        Kill Process
                      </>
                    )}
                  </button>
                  
                </div>
              </div>

              {/* Rest of your existing code for details cards... */}
              <div className="flex-1 overflow-y-auto space-y-4">
                {/* Status & Safety Cards (Floating) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-base-200/90 backdrop-blur-xl rounded-2xl shadow-xl border border-base-300/50 p-5">
                    <div className="text-xs opacity-50 mb-2 uppercase tracking-wide">Status</div>
                    <span className={`badge badge-lg ${selectedProcess.status === 'running' ? 'badge-success' :
                      selectedProcess.status === 'sleeping' ? 'badge-ghost' :
                        'badge-warning'
                      }`}>
                      {selectedProcess.status}
                    </span>
                  </div>

                  <div className="bg-base-200/90 backdrop-blur-xl rounded-2xl shadow-xl border border-base-300/50 p-5">
                    <div className="text-xs opacity-50 mb-2 uppercase tracking-wide">Safety</div>
                    <span className={`badge badge-lg ${selectedProcess.aiFlag === 'safe' ? 'badge-success' :
                      selectedProcess.aiFlag === 'unsafe' ? 'badge-error' :
                        'badge-ghost'
                      }`}>
                      {selectedProcess.aiFlag}
                    </span>
                  </div>
                </div>

                {/* CPU Usage Card (Floating) */}
                <div className="bg-base-200/90 backdrop-blur-xl rounded-2xl shadow-xl border border-base-300/50 p-5">
                  <div className="text-xs opacity-50 mb-2 uppercase tracking-wide">CPU Usage</div>
                  <div className="flex items-end justify-between mb-3">
                    <div className="text-3xl font-bold">{selectedProcess.cpuUsage.toFixed(2)}%</div>
                    <div className="text-xs opacity-50">of total</div>
                  </div>
                  <progress
                    className="progress progress-primary w-full h-2"
                    value={selectedProcess.cpuUsage}
                    max="100"
                  ></progress>
                </div>

                {/* Memory Usage Card (Floating) */}
                <div className="bg-base-200/90 backdrop-blur-xl rounded-2xl shadow-xl border border-base-300/50 p-5">
                  <div className="text-xs opacity-50 mb-2 uppercase tracking-wide">Memory Usage</div>
                  <div className="flex items-end justify-between mb-3">
                    <div className="text-3xl font-bold">{selectedProcess.memoryUsage.toFixed(2)}%</div>
                    <div className="text-xs opacity-50">of total</div>
                  </div>
                  <progress
                    className="progress progress-secondary w-full h-2"
                    value={selectedProcess.memoryUsage}
                    max="100"
                  ></progress>
                </div>

                {/* AI Analysis Card (Floating) */}
                <div className="bg-base-200/90 backdrop-blur-xl rounded-2xl shadow-xl border border-base-300/50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-xs opacity-50 uppercase tracking-wide">AI Analysis</div>
                    {selectedProcess.aiFlag === 'unsafe' && (
                      <span className="badge badge-error badge-xs">⚠️ Warning</span>
                    )}
                    {selectedProcess.aiFlag === 'safe' && (
                      <span className="badge badge-success badge-xs">✓ Safe</span>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed">
                    {selectedProcess.aiReason || "No insights available for this process"}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center opacity-50">
                <svg
                  className="w-20 h-20 mx-auto mb-4 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-sm">Select a process to view details</p>
                <p className="text-xs opacity-70 mt-1">Click any process on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}