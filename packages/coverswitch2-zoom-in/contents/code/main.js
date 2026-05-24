/*
    SPDX-FileCopyrightText: 2026 dcrey7 <abhishek01789@gmail.com>
    SPDX-License-Identifier: GPL-2.0-or-later
*/

"use strict";

var coverSwitchZoomInEffect = {
    debug: false,
    duration: animationTime(180),
    sessionActive: false,
    animationActive: false,
    sessionStartWindow: null,
    expectingActivation: false,
    expirationDeadline: 0,

    log: function (message) {
        if (coverSwitchZoomInEffect.debug) {
            console.log(message);
        }
    },

    loadConfig: function () {
        coverSwitchZoomInEffect.duration = animationTime(180);
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in loadConfig duration=" + coverSwitchZoomInEffect.duration);
    },

    windowGeometry: function (window) {
        if (!window) {
            return null;
        }
        if (window.geometry) {
            return window.geometry;
        }
        if (window.frameGeometry) {
            return window.frameGeometry;
        }
        return null;
    },

    describeWindow: function (window) {
        if (!window) {
            return "null";
        }
        try {
            return [
                "caption=" + window.caption,
                "class=" + window.windowClass,
                "managed=" + window.managed,
                "visible=" + window.visible,
                "minimized=" + window.minimized,
                "deleted=" + window.deleted
            ].join(" ");
        } catch (e) {
            return "" + window;
        }
    },

    describeRect: function (rect) {
        if (!rect) {
            return "null";
        }
        try {
            return JSON.stringify(rect);
        } catch (e) {
            return [
                "x=" + rect.x,
                "y=" + rect.y,
                "width=" + rect.width,
                "height=" + rect.height
            ].join(" ");
        }
    },

    describeKeys: function (object) {
        var keys = [];
        try {
            keys = Object.keys(object);
        } catch (e) {
            keys = [];
        }
        try {
            for (var key in object) {
                if (keys.indexOf(key) === -1) {
                    keys.push(key);
                }
            }
        } catch (e) {
        }
        return keys.join(",");
    },

    screenGeometryForWindow: function (window, windowRect) {
        try {
            if (window && window.output && window.output.geometry) {
                return window.output.geometry;
            }
        } catch (e) {
        }

        try {
            if (effects.virtualScreenGeometry) {
                return effects.virtualScreenGeometry;
            }
        } catch (e) {
        }

        return windowRect;
    },

    onTabBoxAdded: function (mode) {
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in tabBoxAdded mode=" + mode);
        coverSwitchZoomInEffect.sessionActive = true;
        coverSwitchZoomInEffect.sessionStartWindow = effects.activeWindow;
        coverSwitchZoomInEffect.expectingActivation = false;
        coverSwitchZoomInEffect.expirationDeadline = 0;
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in sessionStartWindow="
            + (effects.activeWindow ? effects.activeWindow.caption : "null"));
    },

    onTabBoxUpdated: function () {
        // No-op: window activation is caught after tabBoxClosed.
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in tabBoxUpdated (no-op)");
    },

    onTabBoxClosed: function () {
        if (!coverSwitchZoomInEffect.sessionActive) {
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in tabBoxClosed: no active session, skipping");
            return;
        }
        if (coverSwitchZoomInEffect.animationActive) {
            coverSwitchZoomInEffect.resetSession();
            return;
        }
        coverSwitchZoomInEffect.sessionActive = false;
        coverSwitchZoomInEffect.expectingActivation = true;
        coverSwitchZoomInEffect.expirationDeadline = Date.now() + 400;

        coverSwitchZoomInEffect.log("coverswitch2-zoom-in tabBoxClosed (arming windowActivated catch)");
    },

    onWindowActivated: function (window) {
        if (!coverSwitchZoomInEffect.expectingActivation) {
            return;
        }
        if (Date.now() > coverSwitchZoomInEffect.expirationDeadline) {
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in expiration: no windowActivated within 400ms");
            coverSwitchZoomInEffect.expectingActivation = false;
            coverSwitchZoomInEffect.expirationDeadline = 0;
            coverSwitchZoomInEffect.sessionStartWindow = null;
            return;
        }
        coverSwitchZoomInEffect.expectingActivation = false;
        coverSwitchZoomInEffect.expirationDeadline = 0;

        coverSwitchZoomInEffect.log("coverswitch2-zoom-in windowActivated post-tabbox window="
            + (window ? window.caption : "null")
            + " start="
            + (coverSwitchZoomInEffect.sessionStartWindow
                ? coverSwitchZoomInEffect.sessionStartWindow.caption
                : "null"));

        if (!window) {
            coverSwitchZoomInEffect.sessionStartWindow = null;
            return;
        }
        if (window === coverSwitchZoomInEffect.sessionStartWindow) {
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in skip: activated same as start (user dismissed)");
            coverSwitchZoomInEffect.sessionStartWindow = null;
            return;
        }

        coverSwitchZoomInEffect.sessionStartWindow = null;
        coverSwitchZoomInEffect.runZoomIn(window);
    },

    runZoomIn: function (window) {
        if (!window) return;

        var rect = coverSwitchZoomInEffect.windowGeometry(window);
        if (!rect || rect.width <= 0 || rect.height <= 0) {
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in runZoomIn skip: invalid rect "
                + (rect ? rect.width + "x" + rect.height : "null"));
            return;
        }

        var screenRect = coverSwitchZoomInEffect.screenGeometryForWindow(window, rect);
        var cardW = Math.round(screenRect.width * 0.45);
        var cardH = Math.round(screenRect.height * 0.45);
        var cardX = Math.round(screenRect.x + (screenRect.width - cardW) / 2);
        var cardY = Math.round(screenRect.y + (screenRect.height - cardH) / 2);

        // Translation is relative to the window's CURRENT position. We want the
        // animation to LOOK like the window starts at the card rect (cardX, cardY)
        // at size cardW x cardH, then grows to its real rect.
        var fromTransX = cardX - rect.x;
        var fromTransY = cardY - rect.y;

        coverSwitchZoomInEffect.log("coverswitch2-zoom-in runZoomIn window=" + window.caption
            + " rect=" + JSON.stringify(rect)
            + " card=" + cardX + "," + cardY + " " + cardW + "x" + cardH
            + " fromTrans=" + fromTransX + "," + fromTransY);

        try {
            var animId = animate({
                window: window,
                curve: QEasingCurve.OutCubic,
                duration: coverSwitchZoomInEffect.duration,
                keepAlive: false,
                animations: [
                    {
                        type: Effect.Size,
                        from: {
                            value1: cardW,
                            value2: cardH
                        },
                        to: {
                            value1: rect.width,
                            value2: rect.height
                        }
                    },
                    {
                        type: Effect.Translation,
                        from: {
                            value1: fromTransX,
                            value2: fromTransY
                        },
                        to: {
                            value1: 0,
                            value2: 0
                        }
                    },
                    {
                        type: Effect.Opacity,
                        from: 0.85,
                        to: 1.0
                    }
                ]
            });
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in animate returned id=" + animId);
            window.coverswitch2ZoomInAnimation = animId;
            coverSwitchZoomInEffect.animationActive = true;
        } catch (e) {
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in animate FAILED: " + e);
        }
    },

    resetSession: function () {
        coverSwitchZoomInEffect.sessionActive = false;
        coverSwitchZoomInEffect.expectingActivation = false;
        coverSwitchZoomInEffect.expirationDeadline = 0;
        coverSwitchZoomInEffect.sessionStartWindow = null;
    },

    onAnimationEnded: function (window) {
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in animationEnded window=" +
            coverSwitchZoomInEffect.describeWindow(window));
        if (!window || !window.coverswitch2ZoomInAnimation) {
            return;
        }

        delete window.coverswitch2ZoomInAnimation;
        coverSwitchZoomInEffect.animationActive = false;
        window.setData(Effect.WindowForceBlurRole, null);
    },

    init: function () {
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in EFFECT init called");
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in effects.tabBoxAdded type=" + typeof effects.tabBoxAdded);
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in effects.tabBoxClosed type=" + typeof effects.tabBoxClosed);
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in effects.tabBoxUpdated type=" + typeof effects.tabBoxUpdated);
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in effects.windowActivated type=" + typeof effects.windowActivated);
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in effects.windowActivatedChanged type=" + typeof effects.windowActivatedChanged);
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in effects.activeWindowChanged type=" + typeof effects.activeWindowChanged);
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in effects.activated type=" + typeof effects.activated);
        coverSwitchZoomInEffect.log("coverswitch2-zoom-in effects keys: " + coverSwitchZoomInEffect.describeKeys(effects));
        try {
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in Effect keys: " + coverSwitchZoomInEffect.describeKeys(Effect));
        } catch (e) {
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in Effect keys FAILED: " + e);
        }
        try {
            effect.configChanged.connect(coverSwitchZoomInEffect.loadConfig);
            effect.animationEnded.connect(coverSwitchZoomInEffect.onAnimationEnded);
            effects.tabBoxAdded.connect(coverSwitchZoomInEffect.onTabBoxAdded);
            effects.tabBoxClosed.connect(coverSwitchZoomInEffect.onTabBoxClosed);
            effects.tabBoxUpdated.connect(coverSwitchZoomInEffect.onTabBoxUpdated);
            if (typeof effects.windowActivated !== "undefined") {
                effects.windowActivated.connect(coverSwitchZoomInEffect.onWindowActivated);
            } else if (typeof effects.windowActivatedChanged !== "undefined") {
                effects.windowActivatedChanged.connect(coverSwitchZoomInEffect.onWindowActivated);
            } else if (typeof effects.activeWindowChanged !== "undefined") {
                effects.activeWindowChanged.connect(coverSwitchZoomInEffect.onWindowActivated);
            } else if (typeof effects.activated !== "undefined") {
                effects.activated.connect(coverSwitchZoomInEffect.onWindowActivated);
            }
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in EFFECT signals connected OK");
        } catch (e) {
            coverSwitchZoomInEffect.log("coverswitch2-zoom-in EFFECT signal connect FAILED: " + e);
        }
        coverSwitchZoomInEffect.loadConfig();
    }
};

coverSwitchZoomInEffect.init();
