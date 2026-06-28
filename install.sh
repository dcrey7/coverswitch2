#!/usr/bin/env bash
# Cover Switch 2 — installer for KDE Plasma 6
# Installs both packages, sets the Alt+Tab layout, enables the zoom-in
# effect, and reloads KWin. Safe to re-run (idempotent).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SW="$DIR/packages/coverswitch2"
FX="$DIR/packages/coverswitch2-zoom-in"

info(){ printf '\033[1;34m==>\033[0m %s\n' "$1"; }
ok(){   printf '\033[1;32m==>\033[0m %s\n' "$1"; }
die(){  printf '\033[1;31m==> error:\033[0m %s\n' "$1" >&2
        printf '\033[1;31m==>\033[0m if this keeps happening, contact abhishek01789@gmail.com\n' >&2
        exit 1; }

for c in kpackagetool6 kwriteconfig6 qdbus6; do
  command -v "$c" >/dev/null 2>&1 || die "'$c' not found — Cover Switch 2 needs KDE Plasma 6."
done
[ -d "$SW" ] || die "packages/coverswitch2 not found — run this from the repo root."

# install, or upgrade if already present
install_pkg(){ # type dir label
  info "Installing $3"
  kpackagetool6 --type "$1" --install "$2" >/dev/null 2>&1 \
    || kpackagetool6 --type "$1" --upgrade "$2" >/dev/null 2>&1 \
    || die "failed to install $3"
}

install_pkg KWin/WindowSwitcher "$SW" coverswitch2
install_pkg KWin/Effect          "$FX" coverswitch2-zoom-in

info "Setting Cover Switch 2 as the Alt+Tab layout"
kwriteconfig6 --file kwinrc --group TabBox  --key LayoutName coverswitch2
kwriteconfig6 --file kwinrc --group Plugins --key coverswitch2-zoom-inEnabled --type bool true

info "Reloading KWin"
qdbus6 org.kde.KWin /KWin reconfigure >/dev/null 2>&1 || true
qdbus6 org.kde.KWin /Effects org.kde.kwin.Effects.loadEffect coverswitch2-zoom-in >/dev/null 2>&1 || true

ok "Cover Switch 2 installed — hold Alt and press Tab to try it."
