ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'password';
ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;

CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
