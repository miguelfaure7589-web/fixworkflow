-- CreateTable
CREATE TABLE "UserPlaybookProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playbookSlug" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "UserPlaybookProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPlaybookProgress_userId_playbookSlug_stepIndex_key" ON "UserPlaybookProgress"("userId", "playbookSlug", "stepIndex");

-- AddForeignKey
ALTER TABLE "UserPlaybookProgress" ADD CONSTRAINT "UserPlaybookProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
