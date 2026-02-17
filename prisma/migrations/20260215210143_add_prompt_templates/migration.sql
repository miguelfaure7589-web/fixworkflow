-- CreateEnum
CREATE TYPE "PromptVisibility" AS ENUM ('FREE', 'PREMIUM');

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "businessType" "BusinessType",
    "visibility" "PromptVisibility" NOT NULL DEFAULT 'FREE',
    "template" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_slug_key" ON "PromptTemplate"("slug");
