<!-- Copyright (c) 2025-2026 Gene Ressler
     SPDX-License-Identifier: GPL-3.0-or-later -->

# Edit commands

The undo/redo feature relies on a buffer of edit command objects. Each object represents a user edit of the bridge: add,
delete, or modify. It has `do` and `undo` methods. `Do` is called initially to execute the command, mutating the bridge.
`Undo` reverses the mutation in response to a user undo. This cycle may be repeated any number of times as the user
invokes undo and redo. The undo manager ensures that commands are executed in a logically consistent order. It does this
by organizing the command buffer as two stacks. It adds a command to the "done" stack immediately after its "do" method
completes and to the "undone" stack after "undo" completes. An undo or redo pops a command from the done or undone stack
respectively and - after execution is complete - pushes it on the opposite stack.

The undo stack is ultimately truncated at a large number of commands (e.g. 1000), since state persistence allows
unlimited growth across multiple sessions.

## Commands share structure with bridges

Sharing is important to session persistence as described below, so let's look at it.

Most commands share structure with the bridge during their lifetimes. The nature of sharing depends on whether the
command lies in the "done" or "undone" stack. In general...

- **_Adds._** Elements (joints and members) added by a command are shared when the command is "done" and unshared when
  it's "undone". I.e., adding the element makes it a part of the bridge. Undoing the add makes it no longer a part.
- **_Deletes._** Joints and members removed by a command are unshared when the command is "done" and shared when it's
  "undone".
- **_Modifies._** Joints, members, and label location changed by a command are always unshared. I.e. change is
  implemented by swapping contents, not references.

A further complication is that since the bridge itself mutates with every command, "shared with the bridge" actually
means "shared with the bridge at the time the command was constructed."

## Edit side effects

Details of the UI complicate commands. An innocuous-seeming command (e.g. move joint) can entail any number of "side
effect" edits to keep the bridge model sound. Here is a catalog:

| Command        | Side effect                   | Result                             |
| -------------- | ----------------------------- | ---------------------------------- |
| Add joint      | split transected members      | remove and add members; add joint  |
| Add member     | split if transected by joints | add one or more members            |
| Change members | none                          | mutate member attributes           |
| Delete joint   | delete connected members      | remove incident members and joint  |
| Delete members | delete orphaned joints        | remove multiple joints and members |
| Move joint     | split transected members      | remove and add members; move joint |
| Move labels    | none                          | mutate labels location             |

As implied above, "splitting" members when a joint is added or moved is implemented by removing the original member and
adding two two new ones. Moving a joint onto another joint is just flagged with a toast to the user.

## Commands share structure internally

Side effects imply that even when a joint is unshared with the bridge, it may be shared with members within a command
that holds it. For example this occurs when adding or deleting joints. In the first case, if the add is undone, the
joint is still referenced by split members. In the second, the deleted joint is still referenced by members removed with
it and stored in the command.

## Session persistence

The combined effects of shared structure and side effects must be accommodated when de- and re-hydrating the undo
manager edit command stacks. For correct behavior after re-hydration, the graph of commands, members and joints, with
references forming the edges, must be replicated exactly.

General graph serialization methods are well-known. (One example is the built-in of Lisp.) The one used here is a slight
customization. For dehydration,

- Maintain a "context" map from object references to serialized (dehydrated) references.
- Preload the map with bridge objects mapped to bridge references, which are just joint/member indices.
- Traverse the managers' "done" and "undone" stacks.
- When joints and members are encountered:
  - If a map entry already exists, use its value. Else...
  - For an external (non-bridge) object, first add to a "new objects" array. Then add a new external reference to the
    map, which is the new objects array index.
- Dehydrate the new objects array along with the all the manager data.

For rehydration, we can assume the bridge has already been rehydrated. Other joints and members will be called "extern."
Then...

- Rehydrate the extern objects array.
- Traverse the dehydrated done and undone stacks, rehydrating each command in turn.
- Upon encountering a joint or member reference, look up the contained index in either the bridge or new objects array
  accordingly.

## API

The logic of several command and the member splitter assumes that "do" is called immediately after command construction.
I.e. bridge, selection, and other state may be captured during construction that can't change before the command is
executed.

TODO: For future-proofing, make the initial "do" operation part of static factory `createAndDo()` methods in each
command.
