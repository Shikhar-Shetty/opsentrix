import { X } from "lucide-react"

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

export default function ProcessDetailsPopup({ 
  process, 
  onClose 
}: { 
  process: ProcessMetric
  onClose: () => void 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
      <div className="bg-base-200 rounded-xl shadow-xl p-6 w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Process Details</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            <X />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="p-3 bg-base-300/30 rounded-lg">
            <div className="text-xs opacity-50 mb-1">Process Name</div>
            <div className="font-semibold">{process.processName}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-base-300/30 rounded-lg">
              <div className="text-xs opacity-50 mb-1">PID</div>
              <div className="font-mono">{process.pid}</div>
            </div>
            <div className="p-3 bg-base-300/30 rounded-lg">
              <div className="text-xs opacity-50 mb-1">Status</div>
              <span className={`badge ${
                process.status === 'running' ? 'badge-success' : 
                process.status === 'sleeping' ? 'badge-ghost' : 
                'badge-warning'
              }`}>
                {process.status}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-base-300/30 rounded-lg">
              <div className="text-xs opacity-50 mb-1">CPU Usage</div>
              <div className="font-semibold">{process.cpuUsage.toFixed(2)}%</div>
            </div>
            <div className="p-3 bg-base-300/30 rounded-lg">
              <div className="text-xs opacity-50 mb-1">Memory Usage</div>
              <div className="font-semibold">{process.memoryUsage.toFixed(2)}%</div>
            </div>
          </div>
          
          <div className="p-3 bg-base-300/30 rounded-lg">
            <div className="text-xs opacity-50 mb-1">AI Safety Flag</div>
            <span className={`badge ${
              process.aiFlag === 'safe' ? 'badge-success' : 
              process.aiFlag === 'unsafe' ? 'badge-error' : 
              'badge-ghost'
            }`}>
              {process.aiFlag}
            </span>
          </div>
          
          <div className="p-3 bg-base-300/30 rounded-lg">
            <div className="text-xs opacity-50 mb-1">AI Insight</div>
            <div className="text-sm">{process.aiReason || "No insights available"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}