import AgentDetailClient from "./_components/AgentDetailClient"

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  return <AgentDetailClient agentId={id} />
}
