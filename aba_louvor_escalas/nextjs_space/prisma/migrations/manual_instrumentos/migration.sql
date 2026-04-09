-- CreateTable
CREATE TABLE IF NOT EXISTS "InstrumentoConfig" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstrumentoConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "InstrumentoConfig_codigo_key" ON "InstrumentoConfig"("codigo");
CREATE INDEX IF NOT EXISTS "InstrumentoConfig_codigo_idx" ON "InstrumentoConfig"("codigo");

-- Convert instrumentos column from enum array to text array
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Instrumento') THEN
        ALTER TABLE "Voluntario" ALTER COLUMN "instrumentos" TYPE TEXT[] USING "instrumentos"::TEXT[];
    END IF;
END $$;

-- Drop the old Instrumento enum if it exists
DROP TYPE IF EXISTS "Instrumento";

-- Seed default instruments
INSERT INTO "InstrumentoConfig" ("id", "codigo", "nome", "ativo", "ordem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::TEXT, 'BATERIA', 'Bateria', true, 1, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'BAIXO', 'Baixo', true, 2, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'GUITARRA', 'Guitarra', true, 3, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'VIOLAO', 'Violão', true, 4, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'TECLADO', 'Teclado', true, 5, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'BACK_VOCAL', 'Back Vocal', true, 6, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'TECNICO_SOM', 'Técnico de Som', true, 7, NOW(), NOW()),
  (gen_random_uuid()::TEXT, 'TECNICO_TRANSMISSAO', 'Técnico de Transmissão', true, 8, NOW(), NOW())
ON CONFLICT ("codigo") DO NOTHING;
