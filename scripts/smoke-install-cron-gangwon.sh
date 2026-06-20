#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_SCRIPT="$SCRIPT_DIR/install-cron.sh"
TMP_DIR="$(mktemp -d)"
FAKE_BIN="$TMP_DIR/bin"
FAKE_CRONTAB="$TMP_DIR/crontab"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$FAKE_BIN"

cat > "$FAKE_BIN/crontab" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "-l" ]; then
  [ -f "$SILVER_FAKE_CRONTAB" ] && cat "$SILVER_FAKE_CRONTAB"
  exit 0
fi

cp "$1" "$SILVER_FAKE_CRONTAB"
EOF
chmod +x "$FAKE_BIN/crontab"

run_install() {
  local gangwon_enabled="$1"

  : > "$FAKE_CRONTAB"
  PATH="$FAKE_BIN:$PATH" \
    SILVER_FAKE_CRONTAB="$FAKE_CRONTAB" \
    SILVER_APP_DIR="$TMP_DIR/app" \
    SILVER_LOG_DIR="$TMP_DIR/logs" \
    SILVER_REFRESH_REGIONS="강릉" \
    SILVER_GANGWON_CORE_REFRESH_ENABLED="$gangwon_enabled" \
    SILVER_GANGWON_REFRESH_REGIONS="강원" \
    SILVER_GANGWON_CORE_REFRESH_LIMIT=50 \
    bash "$INSTALL_SCRIPT" >/dev/null
}

run_install 1
grep -Fq 'SILVER_REFRESH_REGIONS="강릉"' "$FAKE_CRONTAB" || {
  echo "Daily Gangneung refresh cron was not installed." >&2
  exit 1
}
grep -Fq '0 5 * * 0' "$FAKE_CRONTAB" || {
  echo "Weekly Gangwon refresh schedule was not installed." >&2
  exit 1
}
grep -Fq 'SILVER_REFRESH_REGIONS="강원"' "$FAKE_CRONTAB" || {
  echo "Weekly Gangwon refresh region was not installed." >&2
  exit 1
}
grep -Fq 'SILVER_REFRESH_LIMIT=50' "$FAKE_CRONTAB" || {
  echo "Weekly Gangwon refresh limit was not installed." >&2
  exit 1
}
grep -Fq 'refresh-gangwon.log' "$FAKE_CRONTAB" || {
  echo "Weekly Gangwon refresh log was not installed." >&2
  exit 1
}

run_install 0
if grep -Fq 'refresh-gangwon.log' "$FAKE_CRONTAB"; then
  echo "Gangwon cron must not be installed when disabled." >&2
  cat "$FAKE_CRONTAB" >&2
  exit 1
fi

if PATH="$FAKE_BIN:$PATH" \
  SILVER_FAKE_CRONTAB="$FAKE_CRONTAB" \
  SILVER_GANGWON_CORE_REFRESH_ENABLED=invalid \
  bash "$INSTALL_SCRIPT" >/dev/null 2>&1; then
  echo "Invalid Gangwon cron setting must fail." >&2
  exit 1
fi

echo "install-cron Gangwon refresh smoke passed."
