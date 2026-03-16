-- Fix vector dimensions: change from vector(768) to vector(384) for bge-small model
-- Existing 768-dim embeddings are incompatible; they will be dropped and re-generated on next analysis.

-- Clear embedding tables (incompatible data will be re-generated on next repo analysis)
TRUNCATE TABLE "code_embeddings";
TRUNCATE TABLE "repository_embeddings";

-- code_embeddings: drop and recreate embedding column
ALTER TABLE "code_embeddings" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "code_embeddings" ADD COLUMN "embedding" vector(384);

-- repository_embeddings: drop and recreate embedding column
ALTER TABLE "repository_embeddings" DROP COLUMN IF EXISTS "embedding";
ALTER TABLE "repository_embeddings" ADD COLUMN "embedding" vector(384) NOT NULL;
