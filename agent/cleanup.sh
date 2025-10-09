#!/bin/bash
echo "🧹 Cleaning up temporary and cache files..."

# --- Function to get folder size in MB ---
get_size_mb() {
  local size=$(du -sb "$1" 2>/dev/null | awk '{printf "%d\n", $1/1024/1024}')
  # Return 0 if empty or invalid
  echo "${size:-0}"
}

# --- Folders to clean ---
folders=(
  "/tmp"
  "/var/tmp"
  "$HOME/.cache"
  "$HOME/.cache/pip"
  "$HOME/.local/share/Trash/files"
  "/var/log"
)

declare -A before_sizes
declare -A after_sizes
freed_total=0

# --- Measure size before cleanup ---
for f in "${folders[@]}"; do
  before_sizes["$f"]=$(get_size_mb "$f")
done

# --- Cleanup ---
rm -rf /tmp/* /var/tmp/* 2>/dev/null || true
rm -rf "$HOME/.cache"/* "$HOME/.cache/pip"/* 2>/dev/null || true
rm -rf "$HOME/.local/share/Trash/files"/* 2>/dev/null || true
find /var/log -type f -mtime +7 -exec rm -f {} \; 2>/dev/null || true
npm cache clean --force &>/dev/null || true

# --- Measure size after cleanup ---
for f in "${folders[@]}"; do
  after_sizes["$f"]=$(get_size_mb "$f")
  freed=$(( before_sizes["$f"] - after_sizes["$f"] ))
  freed_total=$((freed_total + freed))
  echo "[${f}] Freed approx: ${freed} MB"
done

echo "✅ Cleanup complete! Total freed: ${freed_total} MB"

# --- Print JSON for agent API ---
json_output="{\"status\":\"success\",\"freed\":{"
first=true

for f in "${folders[@]}"; do
  folder_cleaned=$(echo "${f}" | sed 's/"/\\"/g')
  before=${before_sizes["$f"]:-0}
  after=${after_sizes["$f"]:-0}
  freed=$(( before - after ))
  
  if [ "$first" = true ]; then
    first=false
  else
    json_output+=","
  fi
  
  json_output+="\"${folder_cleaned}\":{\"before\":${before},\"after\":${after},\"freed\":${freed}}"
done

json_output+=",\"total\":${freed_total}}}"
echo "$json_output"