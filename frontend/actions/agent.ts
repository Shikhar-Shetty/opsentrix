"use server"

import { auth } from "@clerk/nextjs/server";
import prisma from "../lib/prisma";

type AgentData = {
  id: string;
  name: string;
  token: string;
};

export async function createAgent(data: AgentData) {
  const { userId } = await auth();
  if (!userId) throw new Error("User is not authenticated");
  const newAgent = await prisma.agent.create({
    data: {
      ...data,
      userId,
      summary: ""
    },
  });
  console.log(newAgent);
  return newAgent;
}

export async function getAllAgents() {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  const agents = await prisma.agent.findMany({ where: { userId } })
  return agents;
}

export async function getAgent(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");
  const agent = await prisma.agent.findUnique({ where: { id } })
  console.log(agent);
  return agent;
}

export async function deleteAgent(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");
  const agent = await prisma.agent.delete({
    where: { id, userId }
  });
  return agent;
}