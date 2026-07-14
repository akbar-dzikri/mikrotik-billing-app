#!/usr/bin/env bash
cd /home/diki/projects/billing-app/.worktrees/infra
echo "=== git rev-parse ==="
git rev-parse --show-toplevel
echo "=== git branch ==="
git branch --show-current
echo "=== Running drizzle-kit generate ==="
pnpm exec drizzle-kit generate 2>&1
echo "=== Exit code: $? ==="
