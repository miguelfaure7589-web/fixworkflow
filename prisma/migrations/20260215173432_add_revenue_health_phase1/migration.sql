-- CreateTable
CREATE TABLE "RevenueProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revenueMonthly" DOUBLE PRECISION,
    "grossMarginPct" DOUBLE PRECISION,
    "netProfitMonthly" DOUBLE PRECISION,
    "runwayMonths" DOUBLE PRECISION,
    "churnMonthlyPct" DOUBLE PRECISION,
    "conversionRatePct" DOUBLE PRECISION,
    "trafficMonthly" DOUBLE PRECISION,
    "avgOrderValue" DOUBLE PRECISION,
    "cac" DOUBLE PRECISION,
    "ltv" DOUBLE PRECISION,
    "opsHoursPerWeek" DOUBLE PRECISION,
    "fulfillmentDays" DOUBLE PRECISION,
    "supportTicketsPerWeek" DOUBLE PRECISION,
    "connectedApps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueScoreSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "pillarRevenue" INTEGER NOT NULL,
    "pillarProfitability" INTEGER NOT NULL,
    "pillarRetention" INTEGER NOT NULL,
    "pillarAcquisition" INTEGER NOT NULL,
    "pillarOps" INTEGER NOT NULL,
    "pillarsJson" TEXT NOT NULL,
    "primaryRisk" TEXT NOT NULL,
    "fastestLever" TEXT NOT NULL,
    "nextStepsJson" TEXT NOT NULL,
    "missingDataJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RevenueProfile_userId_key" ON "RevenueProfile"("userId");

-- AddForeignKey
ALTER TABLE "RevenueProfile" ADD CONSTRAINT "RevenueProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueScoreSnapshot" ADD CONSTRAINT "RevenueScoreSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
