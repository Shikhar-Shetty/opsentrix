-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "ProcessMetrics" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "processName" TEXT NOT NULL,
    "pid" INTEGER NOT NULL,
    "cpuUsage" DOUBLE PRECISION NOT NULL,
    "memoryUsage" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "aiFlag" TEXT NOT NULL DEFAULT 'unsafe',
    "aiReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessMetrics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProcessMetrics" ADD CONSTRAINT "ProcessMetrics_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
