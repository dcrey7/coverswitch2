#!/usr/bin/env bash
set -euo pipefail

version="${1:-1.0.0}"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dist_dir="$repo_root/dist"

mkdir -p "$dist_dir"

for package in coverswitch2 coverswitch2-zoom-in; do
  src="$repo_root/packages/$package"
  if [[ ! -f "$src/metadata.json" ]]; then
    echo "Missing metadata.json in $src" >&2
    exit 1
  fi

  tarball="$dist_dir/${package}-${version}.tar.gz"
  rm -f "$tarball"
  tar -C "$src" -czf "$tarball" .
  echo "Wrote $tarball"
done
