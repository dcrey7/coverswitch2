# Cover Switch 2

Cover Switch 2 is a Plasma 6 Alt+Tab task switcher with a GNOME-style cover-flow layout, panel-aware geometry, open morph animation, cyclic wrap navigation, and an optional zoom-in activation effect.

It is split into two KDE packages:

- `coverswitch2`: KWin task switcher layout (`KWin/WindowSwitcher`)
- `coverswitch2-zoom-in`: optional KWin effect for the selected-window zoom-in (`KWin/Effect`)

Install both packages for the full animation.

## Status

Tested locally on:

- KDE Plasma 6.6.5
- KWin Wayland
- CachyOS
- 2560x1440 external display at 144 Hz

## Install From Source

```bash
kpackagetool6 --type KWin/WindowSwitcher --install packages/coverswitch2
kpackagetool6 --type KWin/Effect --install packages/coverswitch2-zoom-in

kwriteconfig6 --file kwinrc --group TabBox --key LayoutName coverswitch2
kwriteconfig6 --file kwinrc --group Plugins --key coverswitch2-zoom-inEnabled --type bool true

qdbus6 org.kde.KWin /KWin reconfigure
qdbus6 org.kde.KWin /Effects org.kde.kwin.Effects.loadEffect coverswitch2-zoom-in
```

Then log out and back in if the task switcher does not appear immediately in System Settings.

## Package Release Archives

Create KDE Store upload archives:

```bash
scripts/package-release.sh 1.0.0
```

This creates:

- `dist/coverswitch2-1.0.0.tar.gz`
- `dist/coverswitch2-zoom-in-1.0.0.tar.gz`

Upload `coverswitch2` to the KDE Store category `KWin (Plasma 6) -> Kwin Switching Layouts`.

Upload `coverswitch2-zoom-in` to the KDE Store category `KWin (Plasma 6) -> KWin Effects`.

## Debugging

Useful logs:

```bash
journalctl --user -b 0 -g 'kwin.*qml|coverswitch2|tabbox' | tail -80
```

Both packages keep verbose debug logging disabled by default.

## Attribution

The task switcher is based on the Cover Switch QML rewrite by Ismael Asensio and has been modified for Plasma 6 with panel-aware geometry and additional animations by dcrey7.

## License

GPL-2.0-or-later.
