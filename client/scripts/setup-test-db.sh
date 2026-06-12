#!/bin/sh
set -eu

DB_NAME="takeaseat_test"
DB_USER="${DB_USER:-n230418003}"

createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || echo "DB already exists"

export DATABASE_URL="postgresql://$DB_USER@localhost:5432/$DB_NAME"
export TEST_DB=1

cd "$(dirname "$0")/.."
pnpm exec prisma migrate deploy
node ../server/prisma/seed.mjs
