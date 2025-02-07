type Color = 'r' | 'b';
type NullableNode<K, V> = Node<K, V> | null;
type Node<K, V> = {
  value: V;
  color: Color;
  kids: [NullableNode<K, V>, NullableNode<K, V>];
};

export class TreeMap<K, V> {
  private root: NullableNode<K, V> = null;
  private size: number = 0;

  constructor(
    private readonly cmpFn: (a: K, b: K) => number,
    private readonly keyFn: (value: V) => K,
  ) {}

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

  /** Inserts given value and returns true unless a value with the same key already exists. */
  public insert(value: V): boolean {
    if (this.root === null) {
      this.root = { value, color: 'b', kids: [null, null] };
      this.size = 1;
      return true;
    }
    const key = this.keyFn(value);
    const pa: Node<K, V>[] = [];
    const cd: number[] = [];
    let s: NullableNode<K, V> = this.root;
    let sd: number = NaN;
    do {
      const cmp = this.cmpFn(key, this.keyFn(s.value));
      if (cmp === 0) {
        return false;
      }
      pa.push(s);
      sd = +(cmp > 0);
      cd.push(sd);
      s = s.kids[sd];
    } while (s);
    let k: Node<K, V> = (pa[pa.length - 1].kids[sd] = { value, color: 'r', kids: [null, null] });
    this.size++;
    while (pa.length >= 2) {
      const p = pa.pop()!;
      const pd = cd.pop()!;
      if (p.color === 'b') {
        break;
      }
      const g = pa.pop()!;
      const gd = cd.pop()!;
      const go = 1 - gd;
      const s = g.kids[1 - gd];
      if (s === null || s.color === 'b') {
        // prettier-ignore
        if (pd === gd) {
          [g.value, g.kids[gd], g.kids[go], p.value, p.kids[gd], p.kids[go]] = [p.value, k, p, g.value, p.kids[go], s];
        } else {
          [g.value, g.kids[go], k.value, k.kids[gd], k.kids[go], p.kids[go]] = [k.value, k, g.value, k.kids[go], s, k.kids[gd]];
        }
        break;
      }
      p.color = s.color = 'b';
      if (g !== this.root) {
        g.color = 'r';
      }
      k = g;
    }
    return true;
  }

  public insertVerified(value: V): boolean {
    const result = this.insert(value);
    const message = this.verify();
    if (message !== 'good') {
      throw `Verify failed on ${value}: ${message}`;
    }
    return result;
  }

  public verify(): string {
    if (this.root === null) {
      return 'empty';
    }
    if (this.root.color !== 'b') {
      return 'root not black';
    }
    try {
      this.helpVerify(this.root);
    } catch (error) {
      return 'exception: ' + error;
    }
    return 'good';
  }

  private helpVerify(node: NullableNode<K, V>): number {
    if (node === null) {
      return 1;
    }
    if (node.color === 'r') {
      node.kids.forEach(kid => {
        if (kid && kid.color !== 'b') {
          throw `non-black child of read node: ${node.value}`;
        }
      });
    }
    const black = node.kids.map(kid => this.helpVerify(kid))
    if (black[0] !== black[1]) {
      throw `unequal black counts at ${node.value}: ${black}`;
    }
    return node.color === 'b' ? 1 + black[0] : black[0]; 
  }
}
