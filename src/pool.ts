export class ObjectPoolMap<K, V> {
  private storage: V[] = [];
  private keyToIndex: Map<K, number> = new Map();
  private indexToKey: K[] = [];
  private objectFactory: () => V;

  constructor(objectFactory: () => V) {
    this.objectFactory = objectFactory;
  }

  size() {
    return this.indexToKey.length;
  }

  add(key: K): V {
    const index = this.keyToIndex.get(key);
    if (index != undefined) return this.storage[index];
    if (this.storage.length <= this.indexToKey.length) {
      this.storage.push(this.objectFactory());
    }
    this.keyToIndex.set(key, this.indexToKey.length);
    this.indexToKey[this.indexToKey.length] = key;
    return this.storage[this.indexToKey.length - 1];
  }

  remove(key: K) {
    const index = this.keyToIndex.get(key);
    const backKey = this.indexToKey[this.indexToKey.length - 1];
    if (index == undefined || backKey == undefined) return;
    const temp = this.storage[this.indexToKey.length - 1];
    this.storage[this.indexToKey.length - 1] = this.storage[index];
    this.storage[index] = temp;
    this.indexToKey[index] = backKey;
    this.keyToIndex.set(backKey, index);
    this.indexToKey.pop();
    this.keyToIndex.delete(key);
  }

  get(key: K): V {
    const index = this.keyToIndex.get(key);
    if (index == undefined) throw new Error("Key not found");
    return this.storage[index];
  }

  has(key: K): boolean {
    return this.keyToIndex.has(key);
  }

  clean() {
    this.storage.splice(this.indexToKey.length);
  }
}
