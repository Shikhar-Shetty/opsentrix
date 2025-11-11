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
        `🚨 [Opsentrix Monitoring Alert] Critical Resource Threshold Breached`,
        ``,
        `Dear ${agent.name} Administrator,`,
        ``,
        `Our monitoring system has detected one or more critical performance anomalies on the following agent:`,
        ``,
        `────────────────────────────`,
        `🔹 **Agent Information**`,
        `   • Name: ${agent.name}`,
        `   • ID: ${agent.id}`,
        `   • Status: ${agent.status.toUpperCase()}`,
        agent.location ? `   • Location: ${agent.location}` : null,
        `   • Last Heartbeat: ${new Date(agent.lastHeartbeat).toLocaleString()}`,
        `────────────────────────────`,
        ``,
        `⚠️ **Triggered Metrics**`,
        ...messageLines.map(line => `   • ${line}`),
        ``,
        `💡 **Recommended Actions**`,
        `   • Review system workloads and identify high-consumption processes.`,
        `   • Consider scaling resources or optimizing running applications.`,
        `   • Verify disk, memory, and CPU health through the Opsentrix dashboard.`,
        ``,
        `📈 **Next Steps**`,
        `   This alert will remain active until the resource usage returns below defined thresholds.`,
        `   Continued breach of limits may impact agent performance and service reliability.`,
        ``,
        `────────────────────────────`,
        `Opsentrix Monitoring Platform`,
        `Automated Notification — Do not reply`,
        `────────────────────────────`
      ].filter(Boolean).join("\n");

      const updatedAgent = await prisma.agent.update({
        where: { id: agent.id },
        data: { message: alertMessage },
      });

      console.log("Updated Agent Alert:", updatedAgent.id);
      await sendAlertEmail(agent.email, messageBody, agent.name);
    }
  }
}
