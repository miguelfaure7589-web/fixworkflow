-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" DATETIME
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "workEnvironment" TEXT NOT NULL,
    "productivityScore" INTEGER NOT NULL,
    "frictionAreas" TEXT NOT NULL,
    "currentTools" TEXT NOT NULL,
    "detailedAnswers" TEXT NOT NULL,
    "healthScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "Diagnosis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diagnosisId" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "problem" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "tools" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Recommendation_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "affiliateProgram" TEXT,
    "commissionType" TEXT,
    "commissionRate" TEXT,
    "cookieWindow" TEXT,
    "hasFreeTier" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "features" TEXT NOT NULL,
    "bestFor" TEXT NOT NULL,
    "pricing" TEXT,
    "rating" REAL
);

-- CreateTable
CREATE TABLE "AccessoryProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "price" TEXT,
    "bestFor" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rotationGroup" TEXT
);

-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "toolId" TEXT,
    "slug" TEXT NOT NULL,
    "diagnosisId" TEXT,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AffiliateClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AffiliateClick_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComparisonPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "tool1Slug" TEXT NOT NULL,
    "tool2Slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DiagnosticLandingPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "heroHeadline" TEXT NOT NULL,
    "heroSubheadline" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "prefilledCategory" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "StackPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "introText" TEXT NOT NULL,
    "recommendedTools" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AccessoryProduct_slug_key" ON "AccessoryProduct"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonPage_slug_key" ON "ComparisonPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticLandingPage_slug_key" ON "DiagnosticLandingPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StackPage_slug_key" ON "StackPage"("slug");
