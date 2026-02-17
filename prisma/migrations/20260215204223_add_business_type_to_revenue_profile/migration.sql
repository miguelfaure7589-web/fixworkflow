-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('ecommerce', 'saas', 'service_agency', 'creator', 'local_business');

-- AlterTable
ALTER TABLE "RevenueProfile" ADD COLUMN     "businessType" "BusinessType";
