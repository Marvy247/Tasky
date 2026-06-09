#!/bin/bash
REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_FILE="$REPO_DIR/activity.log"
echo "Auto-activity started. Logging to $LOG_FILE. Press Ctrl+C to stop."
while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running generate-activity..." | tee -a "$LOG_FILE"
  cd "$REPO_DIR" && node scripts/activity/generate-activity.cjs 2>&1 | tee -a "$LOG_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done. Sleeping 3 minutes..." | tee -a "$LOG_FILE"
  sleep 180
done
