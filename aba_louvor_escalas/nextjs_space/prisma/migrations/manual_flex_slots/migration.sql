ALTER TABLE "EscalaVoluntario" DROP CONSTRAINT IF EXISTS "EscalaVoluntario_cultoId_funcao_key";
ALTER TABLE "EscalaVoluntario" ALTER COLUMN "funcao" TYPE TEXT USING "funcao"::TEXT;
DROP TYPE IF EXISTS "FuncaoEscala";
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EscalaVoluntario_cultoId_funcao_escalaId_key') THEN
    ALTER TABLE "EscalaVoluntario" ADD CONSTRAINT "EscalaVoluntario_cultoId_funcao_escalaId_key" UNIQUE ("cultoId", "funcao", "escalaId");
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ConfigCultoEscala' AND column_name = 'slots') THEN
    ALTER TABLE "ConfigCultoEscala" ADD COLUMN "slots" JSONB NOT NULL DEFAULT '[]';
  END IF;
END $$;
ALTER TABLE "ConfigCultoEscala" DROP COLUMN IF EXISTS "instrumentos";
ALTER TABLE "ConfigCultoEscala" DROP COLUMN IF EXISTS "numMinistros";
ALTER TABLE "ConfigCultoEscala" DROP COLUMN IF EXISTS "numBackVocals";
