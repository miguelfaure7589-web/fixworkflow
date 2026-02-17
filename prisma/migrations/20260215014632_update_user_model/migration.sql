-- DropIndex
DROP INDEX "User_stripeSubscriptionId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ALTER COLUMN "email" DROP NOT NULL;
