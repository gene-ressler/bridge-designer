import { make32BitRandomGenerator } from './random-generator';
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
      expect(treeMap.insert('1')).toBeUndefined();
      expect(treeMap.find(1)).toBe('1');
    });

    it('should not insert a duplicate value', () => {
      treeMap.insert('1');
      expect(treeMap.insert('1')).toBe('1');
    });

    it('should insert multiple ascending values', () => {
      for (let i = 0; i < 100; ++i) {
        treeMap.insert(i.toString());
      }
      for (let i = 0; i < 100; ++i) {
        expect(treeMap.find(i)).withContext(`i=${i}`).toBe(i.toString());
      }
    });

    it('should insert multiple descending values', () => {
      for (let i = 99; i >= 0; --i) {
        treeMap.insert(i.toString());
      }
      for (let i = 0; i < 100; ++i) {
        expect(treeMap.find(i)).withContext(`i=${i}`).toBe(i.toString());
      }
    });

    it('should insert multiple random values', () => {
      const rand = make32BitRandomGenerator(10938443, 3098442, 109999942, 947362228);
      const data = [];
      for (let i = 0; i <= 100; ++i) {
        const n = rand();
        data.push(n);
        expect(treeMap.insert(n.toString())).withContext(`i=${i}, n=${n}`).toBeUndefined();
      }
      for (let i = 0; i <= 100; ++i) {
        expect(treeMap.find(data[i])).withContext(`i=${i}`).toBe(data[i].toString());
      }
    });
  });

  /* Deletion not used.
  describe('delete', () => {
    it('should return false if deleting from empty tree', () => {
      expect(treeMap.delete(42)).toBeUndefined();
    });

    it('should return false deleting nonexistent element', () => {
      expect(treeMap.insert('1')).toBeUndefined();
      expect(treeMap.delete(42)).toBeUndefined();
    });

    it('should delete the root', () => {
      expect(treeMap.insert('1')).toBeUndefined();
      expect(treeMap.delete(1)).toBe('1');
      expect(treeMap.find(1)).toBeUndefined();
    });

    it('should delete multiple ascending values', () => {
      for (let i = 0; i <= 100; ++i) {
        expect(treeMap.insert(i.toString())).withContext(`i=${i}`).toBeUndefined();
      }
      for (let i = 0; i <= 100; ++i) {
        expect(treeMap.delete(i)).withContext(`i=${i}`).toBe(i.toString());
      }
      for (let i = 99; i >= 0; --i) {
        expect(treeMap.find(i)).withContext(`i=${i}`).toBeUndefined();
      }
    });

    it('should delete multiple decending values', () => {
      for (let i = 99; i >= 0; --i) {
        expect(treeMap.insert(i.toString())).withContext(`i=${i}`).toBeUndefined();
      }
      for (let i = 99; i >= 0; --i) {
        expect(treeMap.delete(i)).withContext(`i=${i}`).toBe(i.toString());
      }
      for (let i = 99; i >= 0; --i) {
        expect(treeMap.find(i)).withContext(`i=${i}`).toBeUndefined();
      }
    });

    it('should delete multiple random values', () => {
      const rand = make32BitRandomGenerator(10938443, 3098442, 1099942, 947362228);
      const data = [];
      for (let i = 0; i <= 100; ++i) {
        const n = rand();
        data.push(n);
        expect(treeMap.insert(n.toString())).withContext(`i=${i}, n=${n}`).toBeUndefined();
      }
      for (let i = 0; i <= 100; ++i) {
        expect(treeMap.delete(data[i])).withContext(`i=${i}`).toBe(data[i].toString());
      }
      for (let i = 99; i >= 0; --i) {
        expect(treeMap.find(i)).withContext(`i=${i}`).toBeUndefined();
      }
    });
  });
  */
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

  describe('iterator', () => {
    it('should not iterate over empty tree', () => {
      let iterationCount: number = 0;
      for (const _value of treeMap) {
        ++iterationCount;
      }
      expect(iterationCount).toBe(0);
    });

    it('should iterate in order', () => {
      treeMap.insert('1');
      treeMap.insert('3');
      treeMap.insert('4');
      treeMap.insert('3');
      treeMap.insert('6');
      treeMap.insert('7');
      treeMap.insert('5');
      treeMap.insert('8');
      treeMap.insert('6');
      treeMap.insert('2');
      treeMap.insert('9');
      treeMap.insert('4');
      const result = [];
      for (const value of treeMap) {
        result.push(value);
      }
      expect(result).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });
  });
});
