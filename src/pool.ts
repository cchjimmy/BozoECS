export class ObjectPoolMap<K, V> {
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
    const temp = this.storage[index];
    this.storage[index] = this.storage[this.keyToIndex.size - 1];
    this.storage[this.keyToIndex.size - 1] = temp;
    const backKey = this.indexToKey[this.keyToIndex.size - 1];
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
