# User-facing interface management

This directory holds logic that determines the overall user experience: allowed operations, sequences of mutually
dependent operations, state changes affecting multiple UI elements. Mostly this a place for event handling and UI state
tracking that doesn't have another obvious owner.

You might expect the startup flow to be handled here: browser capability check, welcome dialog, tip dialog, initial
drafting panel state-setting. It's not. Rather, that's considered to be owned by the app component.

## UI State service

Implements the feature where multiple jqxWidget controls have the same function, hence all should

- invoke the same handler
- have identical disable/enable behavior
- TODO: have common tool tip text

Java Swing provided all this for the previous version. `UiStateService` working with `EventBrokerService` duplicate it,
but with a very different pattern. They also support "UI mode" disablement. The modes are e.g. initial (no visible
bridge), design, and animation. For each widget, we need to override normal enablement with disable. E.g. we want most
but not all widgets disabled while in "initial" mode. This was provided by a separate class in Java.

The implementation uses `EventBroker` `Subject`s as keys to group respective widgets.

### Type safety

RxJs `Subject`s have type `Subject<EventInfo<T>>` where `T` is the event payload type. Consequently, event senders and
handlers are type safe for payloads. Internally, `UiStateService` throws away type information because it needs to
maintain lists and maps containing subject types. This collides head-on with the well-known aggregate of invariant
generics problem.

An attempt to maintain stronger typing turned up a need for existential generic types. Typescript doesn't support these
natively, but can "simulate" them by representing objects with generic parameters as wrappers that accept a callback and
return the object. The callback signature then transmits the parameter type. Example for future reference:

```
// 1. Define the internal generic interface
interface Box<T> {
  value: T;
  format: (val: T) => string;
}

// 2. Define the "Existential" wrapper as a higher-order function
// This says: "I hold a Box<T> for SOME T, and I'll give it to your callback."
type SomeBox = <R>(callback: <T>(box: Box<T>) => R) => R;

// 3. Create a helper to "hide" the type (the producer)
const makeBox = <T>(box: Box<T>): SomeBox => (callback) => callback(box);

// 4. Create your heterogeneous array
const boxes: SomeBox[] = [
  makeBox({ value: 123, format: (n) => n.toFixed(2) }),
  makeBox({ value: "Hello", format: (s) => s.toUpperCase() })
];

// 5. Consume the array safely
boxes.forEach(someBox => {
  const result = someBox(box => box.format(box.value)); // Correctly inferred per item
  console.log(result);
});
```
