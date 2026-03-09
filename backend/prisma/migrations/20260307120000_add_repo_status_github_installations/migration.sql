-- CreateEnum
CREATE TYPE "RepoStatus" AS ENUM ('PENDING', 'CLONING', 'ANALYZING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "github_installations" (
    "id" TEXT NOT NULL,
    "githubInstallationId" INTEGER NOT NULL,
    "githubAccountLogin" TEXT NOT NULL,
    "githubAccountId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_installations_workspaceId_userId_key" ON "github_installations"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add workspaceId to repositories if missing (legacy init had userId only)
DO $$
DECLARE
  r RECORD;
  new_ws_id TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'repositories' AND column_name = 'workspaceId'
  ) THEN
    ALTER TABLE "repositories" ADD COLUMN "workspaceId" TEXT;
    FOR r IN SELECT DISTINCT "userId" FROM "repositories"
    LOOP
      new_ws_id := gen_random_uuid()::text;
      INSERT INTO "workspaces" ("id", "name", "createdAt", "updatedAt")
      VALUES (new_ws_id, 'Default', NOW(), NOW());
      INSERT INTO "workspace_members" ("id", "role", "joinedAt", "workspaceId", "userId")
      VALUES (gen_random_uuid()::text, 'OWNER', NOW(), new_ws_id, r."userId");
      UPDATE "repositories" SET "workspaceId" = new_ws_id WHERE "userId" = r."userId";
    END LOOP;
    ALTER TABLE "repositories" ALTER COLUMN "workspaceId" SET NOT NULL;
    ALTER TABLE "repositories" DROP CONSTRAINT IF EXISTS "repositories_userId_fkey";
    DROP INDEX IF EXISTS "repositories_userId_owner_name_key";
    ALTER TABLE "repositories" DROP COLUMN "userId";
    CREATE UNIQUE INDEX "repositories_workspaceId_owner_name_key" ON "repositories"("workspaceId", "owner", "name");
    ALTER TABLE "repositories" ADD CONSTRAINT "repositories_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add repoUrl and status to repositories
ALTER TABLE "repositories" ADD COLUMN IF NOT EXISTS "repoUrl" TEXT;
ALTER TABLE "repositories" ADD COLUMN IF NOT EXISTS "status" "RepoStatus" NOT NULL DEFAULT 'PENDING';

