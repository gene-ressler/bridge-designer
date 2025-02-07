import { makeRand } from '../../test/random-generator';
import { TreeMap } from './tree-map';

describe('TreeMap', () => {
  let treeMap: TreeMap<number, string>;

  beforeEach(() => {
    treeMap = new TreeMap<number, string>(
      (a, b) => a - b,
      value => parseInt(value),
    );
  });

  describe('constructor', () => {
    it('should initialize an empty tree', () => {
      expect(treeMap.find(1)).toBeUndefined();
    });
  });

  describe('insert', () => {
    it('should insert a value into an empty tree', () => {
      expect(treeMap.insert('1')).toBe(true);
      expect(treeMap.find(1)).toBe('1');
    });

    it('should not insert a duplicate value', () => {
      treeMap.insert('1');
      expect(treeMap.insert('1')).toBe(false);
    });

    it('should insert multiple ascending values', () => {
      for (let i = 0; i < 10000; ++i) {
        treeMap.insert(i.toString());
      }
      for (let i = 0; i < 10000; ++i) {
        expect(treeMap.find(i)).withContext(`i=${i}`).toBe(i.toString());
      }
    });

    it('should insert multiple descending values', () => {
      for (let i = 9999; i >= 0; --i) {
        treeMap.insert(i.toString());
      }
      for (let i = 0; i < 10000; ++i) {
        expect(treeMap.find(i)).withContext(`i=${i}`).toBe(i.toString());
      }
    });

    it('should insert multiple random values', () => {
      const rand = makeRand(10938443, 3098442, 109999942, 947362228);
      const data = [];
      for (let i = 0; i <= 10000; ++i) {
        const n = rand();
        data.push(n);
        expect(treeMap.insert(n.toString())).withContext(`n=${n}`).toBeTrue();
      }
      for (let i = 0; i <= 10000; ++i) {
        expect(treeMap.find(data[i])).withContext(`i=${i}`).toBe(data[i].toString());
      }
    });
  });

  describe('find', () => {
    it('should return undefined for an empty tree', () => {
      expect(treeMap.find(1)).toBeUndefined();
    });

    it('should find an inserted value', () => {
      treeMap.insert('1');
      expect(treeMap.find(1)).toBe('1');
    });

    it('should return undefined for a non-existent value', () => {
      treeMap.insert('1');
      expect(treeMap.find(2)).toBeUndefined();
    });
  });
});
