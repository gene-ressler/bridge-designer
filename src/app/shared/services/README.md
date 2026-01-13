<!-- Copyright (c) 2025-2026 Gene Ressler
     SPDX-License-Identifier: GPL-3.0-or-later -->

# Shared services

Here are services used by more than one component or other service.

## Bridge sketch service:

This holds algorithms for generating descriptions of the grayed sketches that the UI calls "templates." We avoid that
word for naming BD objects because Angular uses it differently.

### Bridge sketch data service

This is a subordinate to `BridgeSketchService` for holding data descriptions of more sketches. It covers cases where
algorithms would be too complex to be worthwhile. The data were originally constructed using the BD itself in a special
"sketch writing" mode.

TODO: Duplicate this capability in the current edition.

## Event broker

This is just an injectable container for read-only RxJs `Subject`s that serve as internal pubsub channels. You might
argue they all ought not to be in a single place in the source, but I can't come up with a down side.

## UI State service

Implements the feature where multiple jqxWidget controls have the same function, hence all should

- invoke the same handler
- have identical disable/enable behavior
- TODO: have common tool tip text

Java Swing provided all this for the previous version. `UiStateService` workign with `EventBrokerService duplicate it,
but with a very different pattern. They also support "UI mode" disablement. The modes are e.g. initial (no visible
bridge), design, and animation. For each widget, we need to override normal enablement with disable. E.g. we want most
but not all widgets disabled while in "initial" mode. This was provided by a seperate class in Java.

The implementation uses `EventBroker` `Subject`s as keys to group respective widgets.
