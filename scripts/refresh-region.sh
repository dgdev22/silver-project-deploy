#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: scripts/refresh-region.sh <region> [limit]" >&2
  echo "Example: scripts/refresh-region.sh 강릉 20" >&2
  exit 1
fi

REGION="$1"
LIMIT="${2:-20}"

SILVER_REFRESH_MODE=core \
SILVER_REFRESH_REGIONS="$REGION" \
SILVER_REFRESH_LIMIT="$LIMIT" \
"$(dirname "$0")/refresh-data.sh"
