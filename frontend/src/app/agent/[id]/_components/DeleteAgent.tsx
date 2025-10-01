"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteAgent } from "../../../../../actions/agent"

export default function AgentDeleteButton({ agentId }: { agentId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    await deleteAgent(agentId)
    setOpen(false)
    router.push("/dashboard") 
  }

  return (
    <>
      <button
        className="hover:bg-gray-600/10 px-3 cursor-pointer py-3 rounded-full"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="text-red-700" size={16} />
      </button>

      {open && (
        <div className="modal modal-open">
          <div className="modal-box rounded-xl">
            <h3 className="font-bold text-lg">Confirm Deletion</h3>
            <p className="py-4 text-sm opacity-80">
              Are you sure you want to delete this agent? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDelete}
              >
                Yes
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
