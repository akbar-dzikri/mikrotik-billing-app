#!/bin/bash
cd /home/diki/projects/billing-app/.worktrees/infra
echo "=== TOP LEVEL ==="
git rev-parse --show-toplevel
echo "=== BRANCH ==="
git branch --show-current
