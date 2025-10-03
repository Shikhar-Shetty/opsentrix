import { getAgent } from "../../../../actions/agent"
import AgentDetailClient from "./_components/AgentDetailClient"

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const agent = await getAgent(id);
  return <AgentDetailClient Agent={agent} />
}
