# Browser awareness

This directory contains logic for assessing and reacting to the browser environment at startup.

## Goal

Support recent Chromium- and Firefox-based browser versions with the following installation-specific capabilities:

- Complete HTML canvas 2d graphics.
- Local storage for persistence across refreshes.
- Mouse-equivalent pointer device. Touch interfaces aren't supported.
- WebGL2 for test animations.
- WASM for 3d-printing support.
- Modern CSS (no required Mozilla tags, etc.)
- Minimum screen size of 1280x800, though a device this small will not be very convenient.

For reference, a few known Chromium-based browsers are:

- Google Chrome
- Microsoft Edge
- Opera
- Brave

Firefox-based browsers include:

- LibreWolf (WebGL2 is disabled by default, but this may change soon)
- Waterfox

Development is in Chrome. Edge, Opera, and Firefox are routinely checked. Chromebook, Windows, and Ubuntu substrates are
commonly checked. We have no resources for testing Safari or on OSx, unfortunately.

## Intent

At startup, BD surveys browser features and chooses a course of action when any are lacking. There are two paths:

- Warn user of likely failure and either redirect to help on browser requirements or allow override.
- Continuing with selected features disabled, notifying the user of such.

In any case, notification dialogs are once-and-done. We aren't going to nag users. The risk is that an unsupported
setups will work well enough, yet we'd be carping about it.

# Implementation

We'll handle this in two levels. Main checks will run before `bootstrapApplication()` is executed in `main.ts`. Anything
so fundamental that it would cause problems with the bootstrap will be handled with a native alert box, after which the
bootstrap is skipped and a redirect occurs to a static page with information on minimum requirements.

After Angular boot, we'll disable features that can't possibly work in the current browser and notify the user.

The general tack is to let the user know if anything seems fishy, tell them how to fix the fishiness, then get out of
their way.

## feature.js

Some of the checks follow the techniques used in [`feature.js`](https://featurejs.com/). We thank `Ariel Salminen` for
the inspiration.
