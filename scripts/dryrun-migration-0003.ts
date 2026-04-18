import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const migrationPath = join(__dirname, '..', 'drizzle', '0003_mixed_mad_thinker.sql')
const migrationSql = readFileSync(migrationPath, 'utf-8')
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map(s => s.trim())
  .filter(Boolean)

console.log('=================================================')
console.log(' Static dryrun: drizzle/0003_mixed_mad_thinker.sql')
console.log('=================================================\n')

console.log('Statements that will execute (in order):')
for (const [i, s] of statements.entries()) {
  console.log(`  [${i + 1}] ${s.replace(/\s+/g, ' ')}`)
}

console.log('\nPer-statement analysis:')
console.log(`
[1] CREATE TYPE "public"."booking_source" AS ENUM('regular', 'classpass')
    - Creates a new enum type. Purely additive.
    - Fails only if the type already exists. Journal shows migrations up to
      0002 applied; this type is new here.

[2] ALTER TABLE "students" ALTER COLUMN "email" DROP NOT NULL
    - Relaxes email to nullable so admins can create minimal student records
      (e.g. walk-in / classpass participants) without an email address.
    - Non-destructive: existing rows unaffected, all currently have a non-null
      email (enforced by the prior NOT NULL).
    - Existing unique index students_email_idx is preserved. PostgreSQL allows
      multiple NULLs in a unique index by default, so NULL-email rows coexist
      freely; duplicate non-null emails remain rejected.

[3] ALTER TABLE "bookings" ADD COLUMN "source" "booking_source" NOT NULL DEFAULT 'regular'
    - Adds the source column. Every existing booking gets 'regular' via the
      column default (single-pass table rewrite in Postgres >= 11 is
      metadata-only when the default is a non-volatile constant, which this is).
    - NOT NULL is safe because of the DEFAULT.

Rollback strategy (if ever needed):
    ALTER TABLE "bookings" DROP COLUMN "source";
    ALTER TABLE "students" ALTER COLUMN "email" SET NOT NULL;  -- requires all rows have non-null email
    DROP TYPE "public"."booking_source";

Data safety summary:
  - Zero row deletions.
  - Zero existing-column value changes.
  - One new column with a constant default (all existing rows get 'regular').
  - One constraint relaxation (NOT NULL -> NULL on students.email).

Since this sandbox cannot reach the Neon host directly, this dryrun is
static. To apply from a trusted environment:
    NUXT_DATABASE_URL=... yarn drizzle-kit migrate
`)
