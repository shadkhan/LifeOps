-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('openai', 'anthropic', 'groq');

-- CreateTable
CREATE TABLE "AiSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "provider" "AIProvider" NOT NULL DEFAULT 'groq',
    "model" TEXT NOT NULL DEFAULT 'llama-3.1-8b-instant',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSettings_pkey" PRIMARY KEY ("id")
);
