import { sendAlertEmail } from "../config/nodemailer.ts";
import prisma from "../prisma/client.ts";

const Threshold = {
    CPU: 90, 
    MEMORY: 90, 
    DISK: 85
}

export async function checkAndSendAlert(agentId: string) {
    const agent = await prisma.agent.findFirst({ where: { id: agentId } });
    if (!agent) return;
  
    const issues: string[] = [];
    const messageLines: string[] = [];
  
    if (agent.CPU >= Threshold.CPU) {
      issues.push("CPU: HIGH");
      messageLines.push(`CPU Usage: ${agent.CPU}%`);
    }
    if (agent.memory >= Threshold.MEMORY) {
      issues.push("MEMORY: HIGH");
      messageLines.push(`Memory Usage: ${agent.memory}%`);
    }
    if (agent.disk >= Threshold.DISK) {
      issues.push("DISK: HIGH");
      messageLines.push(`Disk Usage: ${agent.disk}%`);
    }
  
    if (issues.length > 0 && agent.status === "online") {
      const alertMessage = issues.join(" | ");
  
      if (agent.message !== alertMessage) {
        const messageBody = [
          `⚠️ Opsentrix Alert: High Resource Usage Detected`,
          ``,
          `Agent Name: ${agent.name}`,
          `Agent ID: ${agent.id}`,
          ``,
          ...messageLines,
          ``,
          `Please take immediate action to resolve the high usage.`,
        ].join("\n");
  
        const updatedAgent = await prisma.agent.update({
          where: { id: agent.id },
          data: { message: alertMessage },
        });
  
        console.log("Updated Agent Alert:", updatedAgent.id);
        await sendAlertEmail(agent.email, messageBody, agent.name);
      }
    }
  }
  