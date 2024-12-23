/*
  Warnings:

  - You are about to drop the column `readTime` on the `BlogPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BlogPost" DROP COLUMN "readTime",
ADD COLUMN     "readCount" INTEGER NOT NULL DEFAULT 0;
