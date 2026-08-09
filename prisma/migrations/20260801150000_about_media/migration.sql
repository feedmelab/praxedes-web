-- CreateTable
CREATE TABLE "AboutMedia" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AboutMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AboutMedia_order_idx" ON "AboutMedia"("order");

-- Trasladar las 5 columnas fijas de SiteSettings a filas ordenadas
-- (centro/principal primero, luego arriba, derecha, abajo, izquierda).
INSERT INTO "AboutMedia" ("id", "url", "order")
SELECT gen_random_uuid()::text, url, ord
FROM (
  SELECT "aboutImage"       AS url, 0 AS ord FROM "SiteSettings" WHERE id = 'singleton' AND "aboutImage"       IS NOT NULL
  UNION ALL
  SELECT "aboutImageTop"    AS url, 1 AS ord FROM "SiteSettings" WHERE id = 'singleton' AND "aboutImageTop"    IS NOT NULL
  UNION ALL
  SELECT "aboutImageRight"  AS url, 2 AS ord FROM "SiteSettings" WHERE id = 'singleton' AND "aboutImageRight"  IS NOT NULL
  UNION ALL
  SELECT "aboutImageBottom" AS url, 3 AS ord FROM "SiteSettings" WHERE id = 'singleton' AND "aboutImageBottom" IS NOT NULL
  UNION ALL
  SELECT "aboutImageLeft"   AS url, 4 AS ord FROM "SiteSettings" WHERE id = 'singleton' AND "aboutImageLeft"   IS NOT NULL
) t;
