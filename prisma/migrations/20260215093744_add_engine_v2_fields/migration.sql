-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN     "bottleneckScores" TEXT;

-- AlterTable
ALTER TABLE "Recommendation" ADD COLUMN     "aiInsight" TEXT,
ADD COLUMN     "difficulty" INTEGER,
ADD COLUMN     "impactScore" INTEGER,
ADD COLUMN     "resourceLinks" TEXT,
ADD COLUMN     "timeToImplement" TEXT,
ADD COLUMN     "toolTags" TEXT;
