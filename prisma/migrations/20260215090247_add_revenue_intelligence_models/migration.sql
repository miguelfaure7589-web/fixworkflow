-- CreateTable
CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "revenueStage" TEXT NOT NULL,
    "primaryChannel" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "currentRevenue" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "revenueTrend7d" DOUBLE PRECISION NOT NULL,
    "revenueTrend30d" DOUBLE PRECISION NOT NULL,
    "leadCount" INTEGER NOT NULL,
    "closeRate" DOUBLE PRECISION NOT NULL,
    "averageDealValue" DOUBLE PRECISION NOT NULL,
    "taskCompletionRate" DOUBLE PRECISION NOT NULL,
    "followUpDelayHours" DOUBLE PRECISION NOT NULL,
    "contentFrequency" DOUBLE PRECISION NOT NULL,
    "burnoutRiskScore" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueHealthSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "componentScores" TEXT NOT NULL,
    "primaryBottleneck" TEXT NOT NULL,
    "revenueGap" DOUBLE PRECISION NOT NULL,
    "interpretationBand" TEXT NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueHealthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleneckAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryBottleneck" TEXT NOT NULL,
    "secondaryBottlenecks" TEXT NOT NULL,
    "severityScore" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BottleneckAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkProfile" (
    "id" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "revenueStage" TEXT NOT NULL,
    "avgRevenueGrowth" DOUBLE PRECISION NOT NULL,
    "avgCloseRate" DOUBLE PRECISION NOT NULL,
    "avgFollowUpTime" DOUBLE PRECISION NOT NULL,
    "avgLeadConsistency" DOUBLE PRECISION NOT NULL,
    "commonToolStack" TEXT NOT NULL,
    "commonGrowthPatterns" TEXT NOT NULL,

    CONSTRAINT "BenchmarkProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "weeklyExecutionPlan" TEXT NOT NULL,
    "recommendedTools" TEXT NOT NULL,
    "riskWarnings" TEXT NOT NULL,
    "opportunitySignals" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateTrigger" (
    "id" TEXT NOT NULL,
    "bottleneckType" TEXT NOT NULL,
    "recommendedTool" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metricGapThreshold" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AffiliateTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkProfile_businessType_revenueStage_key" ON "BenchmarkProfile"("businessType", "revenueStage");

-- AddForeignKey
ALTER TABLE "BusinessProfile" ADD CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricSnapshot" ADD CONSTRAINT "MetricSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueHealthSnapshot" ADD CONSTRAINT "RevenueHealthSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleneckAssessment" ADD CONSTRAINT "BottleneckAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
