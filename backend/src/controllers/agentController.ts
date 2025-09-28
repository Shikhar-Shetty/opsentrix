import prisma from "../prisma/client.js";


export const metricAgent = async (req:string, res:string) => {
    const data = await req;
    const agent = await prisma.agent.findUnique({ where: {id: req.id}})
    return agent;
}

