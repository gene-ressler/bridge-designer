# Session state service: preserving state through browser reloads

The BD has chunks of state scattered over many services and components. Per normal practice, we leverage a host listener
at the app level to handle `window:beforeunload` to save them. The handler writes to local storage. Individual
constructors reload state previously saved, when it exists.

## Feature Q/A

**_How does the handler collect all the data fragments?_** `SessionStateService` manages this task. It uses ngRx
broadcast subject `sessionStateSaveRequest`. Every component and service with state to be persisted subscribes. On
receipt of the request, each marshals the essential state and calls back to the service `recordState` method to position
it for writing to local storage. Arguments include a tag. The service accumulates a map of tag/state object pairs and
writes it when the broadcast is complete. Because it is synchronously scheduled, completion implies the state map is
ready to write, hence it is written.

**_How is saved state restored?_** Each respective constructor queries the service with its tag. The first arriving
query causes the service to look for saved state in local storage, read in the map formerly saved, and cache it.
Subsequent queries are answered with lookups in the cached map.

**_What about service/component dependencies?_** For better or worse, much BD logic depends on `===` equality of object
references. For example, members hold references directly to joints, which must be `===` to the corresponding objects in
the bridge's `joints` array. This means that in some cases, the order of state restoration matters. For example,
`BridgeService` holds the current bridge. Any other service holding references to joints or members must restore those
references with values `===` to respective objects in the bridge. This requires the bridge to be restored first.

**_How is correct restoration order ensured?_** Injector construction is our friend. The app-level injector must visit
the tree of injection dependencies in post order: a class's injections must be constructed before its own can complete.
We exploit this fact to restore state to services and components in a valid order. In the `BridgeService` example, any
service that injects it is guaranteed to see the restored bridge before its own restore commences because the
`BridgeService` injector - along with its state restoration - has already run.

**_Is injection order a valid proxy for restoration order?_** Yes. If a class holds a reference R to some object O that
has `===` dependencies, it must save a representation of O to local storage, not the reference itself. An example is
saving a joint index rather than the joint. When the representation is to be used for restoration, translating it back
to an object with the correct `===` reference value invariably means querying the service that owns it. In our example,
it must look up `joints[index]`. To query it, the service must be injected. And, Bob's your uncle!

## Start fresh option

A token is also written to session storage when state is sent to local storage. If at state restoration time, that token
is gone, we presume the the user has closed the tab in the interim and show a dialog that offers to continue or else
reload the app with empty state. A complete reload is necessary because we can't show an Angular dialog before state is
already restored...a chicken and egg problem. This is a bit janky, but alternatives all look worse.
