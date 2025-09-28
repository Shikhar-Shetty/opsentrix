import { getAllAgents } from "../../../actions/agent"
import DashboardClient, { Agent } from "./_components/DashboardClient"

export default async function DashboardPage() {
  const agents: Agent[] = await getAllAgents()
  return (
    <main className="min-h-screen p-8 bg-base-100">
      <DashboardClient initialAgents={agents} />
    </main>
  )
}
