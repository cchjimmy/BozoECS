export class ObjectPoolMap<K, V> {
  private storage: Map<K, V> = new Map();
  private freeKeys: Set<K> = new Set();
  private count = 0;
  private objectFactory: () => V;

  constructor(objectFactory: () => V) {
    this.objectFactory = objectFactory;
  }

  size(): number {
    return this.count;
  }

  add(key: K): V {
    if (this.has(key)) {
      return this.storage.get(key) as V;
    }
    let value: V | undefined;
    let freeKey: K | undefined;
    if (this.freeKeys.has(key)) {
      freeKey = key;
    } else {
      for (const k of this.freeKeys) {
        freeKey = k;
        break;
      }
    }
    if (freeKey != undefined) {
      this.freeKeys.delete(freeKey);
      value = this.storage.get(freeKey);
      this.storage.delete(freeKey);
    }
    value = value == undefined ? this.objectFactory() : value;
    this.storage.set(key, value);
    this.count++;
    return value;
  }

  remove(key: K): void {
    if (!this.has(key)) return;
    this.freeKeys.add(key);
    this.count--;
  }

  get(key: K): V {
    const value = this.storage.get(key);
    if (value == undefined) throw new Error("Key not found.");
    return value;
  }

  has(key: K): boolean {
    return this.storage.has(key) && !this.freeKeys.has(key);
  }

  clean(): void {
    for (const value of this.freeKeys) {
      this.storage.delete(value);
    }
    this.freeKeys.clear();
  }
}
export class ObjectPoolMapOld<K, V> {
  private storage: V[] = [];
  private keyToIndex: Map<K, number> = new Map();
  private indexToKey: K[] = [];
  private objectFactory: () => V;

  constructor(objectFactory: () => V) {
    this.objectFactory = objectFactory;
  }

  size() {
    return this.keyToIndex.size;
  }

  add(key: K): V {
    if (this.keyToIndex.has(key))
      return this.storage[this.keyToIndex.get(key) as number];
    if (this.storage.length <= this.keyToIndex.size)
      this.storage.push(this.objectFactory());
    this.keyToIndex.set(key, this.keyToIndex.size);
    this.indexToKey[this.keyToIndex.size - 1] = key;
    return this.storage[this.keyToIndex.get(key) as number];
  }

  remove(key: K): void {
    const index = this.keyToIndex.get(key);
    if (index == undefined) return;
    const backKey = this.indexToKey[this.keyToIndex.size - 1];
    const temp = this.storage[index];
    this.storage[index] = this.storage[this.keyToIndex.size - 1];
    this.storage[this.keyToIndex.size - 1] = temp;
    this.indexToKey[index] = backKey;
    this.indexToKey.pop();
    this.keyToIndex.set(backKey, index);
    this.keyToIndex.delete(key);
  }

  get(key: K): V {
    const index = this.keyToIndex.get(key);
    if (index == undefined) throw new Error("Key not found.");
    return this.storage[index];
  }

  has(key: K): boolean {
    return this.keyToIndex.has(key);
  }

  clean(): void {
    this.storage.splice(this.keyToIndex.size);
  }
}
