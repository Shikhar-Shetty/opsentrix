import { AlertTriangle, X } from "lucide-react"

interface KillProcessModalProps {
    isOpen: boolean
    processName: string
    pid: number
    onConfirm: () => void
    onCancel: () => void
}

export default function KillProcessModal({
    isOpen,
    processName,
    pid,
    onConfirm,
    onCancel
}: KillProcessModalProps) {
    if (!isOpen) return null

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel()
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-base-200 rounded-2xl shadow-2xl border border-base-300 max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-error/10 border-b border-error/20 p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-error/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-error" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-error mb-1">Kill Process</h3>
                            <p className="text-xs sm:text-sm opacity-70">This action cannot be undone</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="btn btn-sm btn-ghost btn-circle flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-4">
                    <div className="bg-base-300/30 rounded-lg p-3 sm:p-4 space-y-3">
                        <div>
                            <div className="text-xs opacity-50 uppercase tracking-wide mb-1">Process Name</div>
                            <div className="font-semibold text-sm sm:text-base break-all">{processName}</div>
                        </div>
                        <div className="divider my-2"></div>
                        <div>
                            <div className="text-xs opacity-50 uppercase tracking-wide mb-1">Process ID</div>
                            <div className="font-mono text-sm">{pid}</div>
                        </div>
                    </div>

                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 sm:p-4">
                        <div className="flex gap-2 sm:gap-3">
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0 mt-0.5" />
                            <div className="text-xs sm:text-sm">
                                <p className="font-semibold text-warning mb-1">Warning</p>
                                <p className="opacity-80 leading-relaxed">
                                    Terminating this process will immediately stop it. Any unsaved data may be lost.
                                    Make sure this won&apos;t affect critical operations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-base-300/30 border-t border-base-300 p-3 sm:p-4 flex items-center justify-end gap-2 sm:gap-3">
                    <button
                        onClick={onCancel}
                        className="btn btn-ghost btn-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn btn-error btn-sm gap-2"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Kill Process
                    </button>
                </div>
            </div>
        </div>
    )
}