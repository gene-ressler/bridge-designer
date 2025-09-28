type Color = 'r' | 'b';
type NullableNode<K, V> = Node<K, V> | null;
type Node<K, V> = {
  value: V;
  color: Color;
  kids: [NullableNode<K, V>, NullableNode<K, V>];
};

function isBlack<K, V>(node: NullableNode<K, V>): boolean {
  return node === null || node.color === 'b';
}
/*
function isRed<K, V>(node: NullableNode<K, V>): boolean {
  return node !== null && node.color === 'r';
}
  */

export class TreeMap<K, V> {
  private root: NullableNode<K, V> = null;
  private _size: number = 0;

  constructor(
    private readonly cmpFn: (a: K, b: K) => number,
    private readonly keyFn: (value: V) => K,
  ) {}

  /** Returns the current number of values in the map. */
  public get size(): number {
    return this._size;
  }

  /** Finds the value with given key and returns it or undefined if not found. */
  public find(key: K): V | undefined {
    let p: Node<K, V> | null = this.root;
    while (p) {
      const cmp = this.cmpFn(key, this.keyFn(p.value));
      if (cmp === 0) {
        return p.value;
      }
      p = p.kids[+(cmp > 0)];
    }
    return undefined;
  }

  /**
   * Tries to insert the given value. Succeeds and returns undefined if the
   * key wasn't already in the map. Otherwise, returns the existing value.
   */
  public insert(value: V): V | undefined {
    if (this.root === null) {
      this.root = { value, color: 'b', kids: [null, null] };
      this._size = 1;
      return undefined;
    }

    // Search for insert position. Build a stack of nodes and directions taken.
    const key = this.keyFn(value);
    const stack: [Node<K, V>, number][] = [];
    let lastSearchPtr = null;
    let searchPtr: NullableNode<K, V> = this.root;
    let searchDir: number = NaN;
    do {
      const cmp = this.cmpFn(key, this.keyFn(searchPtr.value));
      if (cmp === 0) {
        return searchPtr.value;
      }
      searchDir = +(cmp > 0);
      stack.push([searchPtr, searchDir]);
      lastSearchPtr = searchPtr;
      searchPtr = searchPtr.kids[searchDir];
    } while (searchPtr);

    // Insert new node.
    let child: Node<K, V> = { value, color: 'r', kids: [null, null] };
    lastSearchPtr.kids[searchDir] = child;
    this._size++;

    // Rebalance.
    while (stack.length >= 2) {
      const [parent, parentDir] = stack.pop()!;
      if (parent.color === 'b') {
        break;
      }
      const [grandparent, grandparentDir] = stack.pop()!;
      const oppositeGrandparentDir = 1 - grandparentDir;
      const parentSibling = grandparent.kids[oppositeGrandparentDir];
      if (isBlack(parentSibling)) {
        // Do canonical rotations and return. Swap value references to avoid
        // mutating the great-grandparent's kids, where the root is a special case.
        if (parentDir === grandparentDir) {
          [grandparent.value, parent.value] = [parent.value, grandparent.value];
          grandparent.kids[grandparentDir] = child;
          grandparent.kids[oppositeGrandparentDir] = parent;
          parent.kids[grandparentDir] = parent.kids[oppositeGrandparentDir];
          parent.kids[oppositeGrandparentDir] = parentSibling;
        } else {
          [grandparent.value, child.value] = [child.value, grandparent.value];
          grandparent.kids[oppositeGrandparentDir] = child;
          parent.kids[oppositeGrandparentDir] = child.kids[grandparentDir];
          child.kids[grandparentDir] = child.kids[oppositeGrandparentDir];
          child.kids[oppositeGrandparentDir] = parentSibling;
        }
        break;
      }
      // Do re-coloring and recur for the grandparent.
      parent.color = parentSibling!.color = 'b';
      if (grandparent !== this.root) {
        grandparent.color = 'r';
      }
      child = grandparent;
    }
    return undefined;
  }

  /**
   * Doesn't rebalance. Not used. 
   * Deletes and returns the value with given key or undefined if it didn't exist.
  public delete(key: K): V | undefined {
    // Search for node to delete. Build a stack of nodes and directions taken.
    const stack: [Node<K, V>, number][] = [];
    let lastSearchPtr: NullableNode<K, V> = null;
    let searchPtr: NullableNode<K, V> = this.root;
    let searchDir: number = NaN;
    while (true) {
      if (searchPtr === null) {
        return undefined;
      }
      const cmp = this.cmpFn(key, this.keyFn(searchPtr.value));
      if (cmp === 0) {
        break;
      }
      searchDir = +(cmp > 0);
      stack.push([searchPtr, searchDir]);
      lastSearchPtr = searchPtr;
      searchPtr = searchPtr.kids[searchDir];
    }
    const toDelete = searchPtr;
    const deletedValue = toDelete.value;
    const toDeleteParent = lastSearchPtr;
    if (toDelete.kids[0] === null) {
      if (toDelete.kids[1] === null) {
        // No children. Remove node.
        if (toDeleteParent) {
          toDeleteParent.kids[searchDir] = null;
        } else {
          this.root = null;
          return deletedValue;
        }
      } else {
        // Right child only.
        if (toDeleteParent) {
          toDeleteParent.kids[searchDir] = toDelete.kids[1];
        } else {
          this.root = toDelete.kids[1];
          this.root.color = 'b';
        }
      }
    } else {
      if (toDelete.kids[1] === null) {
        // Left child only.
        if (toDeleteParent) {
          toDeleteParent.kids[searchDir] = toDelete.kids[0];
        } else {
          this.root = toDelete.kids[0];
          this.root.color = 'b';
        }
      } else {
        // Two children. Find successor node, copy its value up, and delete.
        // Successor is one step right, then left as far as possible.
        lastSearchPtr = toDelete;
        searchDir = 1;
        searchPtr = toDelete.kids[1]!;
        while (searchPtr.kids[0]) {
          stack.push([searchPtr, searchDir]);
          searchDir = 0;
          lastSearchPtr = searchPtr;
          searchPtr = searchPtr.kids[0];
        }
        toDelete.value = searchPtr.value;
        lastSearchPtr.kids[searchDir] = searchPtr.kids[1];
      }
    }
    this._size--;
    /*
    // Stack has all but deleted (former successor) node.
    if (searchPtr!.color === 'r') {
      // Case 1: No rebalance needed.
      return deletedValue;
    }
    //let db: Node<K, V> = null;
    let [dbParent, dbParentDir] = stack.pop()!;
    let oppositeDbParentDir = 1 - dbParentDir;
    while (stack.length > 0) {
      const dbSibling = dbParent.kids[oppositeDbParentDir]!;
      if (isRed(dbSibling)) {
        // Case 4
        [dbParent.color, dbSibling.color] = [dbSibling.color, dbParent.color]; // parent -> red
        this.rotate(dbParent, oppositeDbParentDir);
        stack.push([dbParent, dbParentDir]); // Push node rotated into path to root.
        dbParent = dbSibling; // Account for value swap.
      } else if (isRed(dbSibling!.kids[oppositeDbParentDir] /* far is red * /)) {
        // Case 6
        [dbParent.color, dbSibling.color] = [dbSibling.color, dbParent.color];
        this.rotate(dbParent, oppositeDbParentDir);
        stack.push([dbParent, dbParentDir]); // Push node rotated into path to root.
        dbParent = dbSibling; // Account for value swap.
      } else if (isBlack(dbSibling!.kids[dbParentDir]) /* near is black * /) {
        // Case 3
        dbSibling.color = 'r';
        if (isRed(dbParent) || stack.length === 0) {
          dbParent.color = 'b';
          break;
        }
        //db = dbParent;
        [dbParent, dbParentDir] = stack.pop()!;
        oppositeDbParentDir = 1 - dbParentDir;
      } else {
        // Case 5
        // Sibling is black. far is black. near is red
        dbSibling.color = 'r';
        dbSibling!.kids[dbParentDir]!.color = 'b';
        this.rotate(dbSibling, dbParentDir);
      }
    }
    return deletedValue;
  }
  private rotate(a: Node<K, V>, d: number) {
    const b = a.kids[d]!;
    const e = 1 - d;
    [a.value, b.value] = [b.value, a.value]
    a.kids[d] = b.kids[d];
    b.kids[d] = b.kids[e];
    b.kids[e] = a.kids[e];
  }
*/

  public forEach(f: (item: V) => any) {
    for (const item of this) {
      f(item);
    }
  }

  [Symbol.iterator](): any {
    const stk: Node<K, V>[] = [];
    let node: NullableNode<K, V> = this.root;
    return {
      next: () => {
        while (node) {
          stk.push(node);
          node = node.kids[0];
        }
        if (stk.length === 0) {
          return { value: undefined, done: true };
        }
        const visitNode: Node<K, V> = stk.pop()!;
        node = visitNode.kids[1];
        return { value: visitNode.value, done: false };
      },
    };
  }
}
