# Drawing panel cursor overlay

The cursor overlay implemented in this directory is a transparent canvas "above" the drafting panel in z-order. Its
reason for being is to implement various crosshair and rubber band cursors on top of the drawing with the browser
handling the problem of compositing the two layers. This has many advantages, but some fiddly details.

- Some cursors need to duplicate chunks of the drawing to render correctly. An example is the rubber members displayed
  when moving joints. Another is hot elements, discussed below.
- The drawing panel "sees" events only as relayed by the overlay via Angular `@Output` events.
- Others.

## Organization

The top level manager is `CursorOverlayComponent`. It includes the transparent canvas. It owns the edit mode of the
drafting panel and handles dispatching to one service per mode that implements cursor rendering and event handling. It
uses the Angular component `Output` mechanism to send events to the drafting panel. It also sends broadcast messages to
synchronize its state with the app. For example, it does this to clear the selection as needed. It also broadcasts a
notification when each mode change is complete.

An `InputHandlerSet` is a set of mouse/pointer handlers plus a keystroke handler, all optional. Each of the four cursor
mode services - erase, joints, members, and select - is a handler set.

## Hot elements

Hot elements are a key concept. There is at any moment zero or one hot element. It is a joint or member within a
specific radius of the pointer closest to it. It's rendered on the overlay with a highlighted appearance. When it's no
longer hot, the element is erased in the overlay, which exposes its normal appearance in the drafting panel. Member and
joint rendering are parameterized by graphic context so they can be used in either layer.

Many cursor operations are on the hot element: erase, move joint via click and drag, move joint via keyboard, context
widget display, start and end of member rubber banding, and others.

Hot element and cursor operations - both mouse and keyboard driven - are intricately connected. Manually test changes
thoroughly.
