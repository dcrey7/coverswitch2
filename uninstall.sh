#!/usr/bin/env bash
# Cover Switch 2 — clean uninstaller for KDE Plasma 6
# Restores the default Alt+Tab layout, disables + removes both packages,
# and reloads KWin. Safe to re-run.
set -uo pipefail

info(){ printf '\033[1;34m==>\033[0m %s\n' "$1"; }
ok(){   printf '\033[1;32m==>\033[0m %s\n' "$1"; }

command -v kpackagetool6 >/dev/null 2>&1 || { echo "kpackagetool6 not found — nothing to do."; exit 0; }

# revert the Alt+Tab layout to the Plasma default only if ours is active
cur="$(kreadconfig6 --file kwinrc --group TabBox --key LayoutName 2>/dev/null || true)"
if [ "$cur" = "coverswitch2" ]; then
  info "Restoring default Alt+Tab layout (org.kde.breeze)"
  kwriteconfig6 --file kwinrc --group TabBox --key LayoutName org.kde.breeze
fi

info "Disabling zoom-in effect"
kwriteconfig6 --file kwinrc --group Plugins --key coverswitch2-zoom-inEnabled --type bool false
qdbus6 org.kde.KWin /Effects org.kde.kwin.Effects.unloadEffect coverswitch2-zoom-in >/dev/null 2>&1 || true

info "Removing packages"
kpackagetool6 --type KWin/WindowSwitcher --remove coverswitch2          >/dev/null 2>&1 || true
kpackagetool6 --type KWin/Effect          --remove coverswitch2-zoom-in >/dev/null 2>&1 || true

info "Reloading KWin"
qdbus6 org.kde.KWin /KWin reconfigure >/dev/null 2>&1 || true

ok "Cover Switch 2 removed."
