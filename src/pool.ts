export class ObjectPoolMap<K, V> {
  private storage: V[] = [];
  private keyToIndex: Map<K, number> = new Map();
  private indexToKey: Array<K> = [];
  private objectFactory: () => V;
  private size = 0;

  constructor(objectFactory: () => V) {
    this.objectFactory = objectFactory;
  }

  len() {
    return this.size;
  }

  add(key: K): V {
    const index = this.keyToIndex.get(key);
    if (index != undefined) return this.storage[index];
    if (this.size >= this.storage.length)
      this.storage.push(this.objectFactory());
    this.keyToIndex.set(key, this.size);
    this.indexToKey[this.size] = key;
    this.size++;
    return this.storage[this.size - 1];
  }

  remove(key: K): boolean {
    const index = this.keyToIndex.get(key) ?? -1;
    const backKey = this.indexToKey[this.size - 1];
    if (index < 0 || index >= this.size || !backKey) return false;
    const removed = this.storage[index];
    // swap with last to maintain packed
    this.storage[index] = this.storage[this.size - 1];
    this.storage[this.size - 1] = removed;
    // set before deleting because backKey == key sometimes
    this.keyToIndex.set(backKey, index);
    this.keyToIndex.delete(key);
    this.indexToKey[index] = backKey;
    this.size--;
    return true;
  }

  get(key: K): V {
    const index = this.keyToIndex.get(key) ?? -1;
    if (index < 0 || index >= this.size) throw new Error("Index out of range.");
    return this.storage[index];
  }

  has(key: K): boolean {
    return this.keyToIndex.has(key);
  }

  clean() {
    this.storage.splice(this.size);
    this.indexToKey.splice(this.size);
    for (const key of this.keyToIndex.keys()) {
      const index = this.keyToIndex.get(key) ?? -1;
      (index < 0 || index >= this.size) && this.keyToIndex.delete(key);
    }
  }
}
