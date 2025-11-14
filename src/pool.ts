export class ObjectPoolMap<K, V> {
  private storage: V[] = [];
  private map: Map<K, V> = new Map();
  private objectFactory: () => V;

  constructor(objectFactory: () => V) {
    this.objectFactory = objectFactory;
  }

  size() {
    return this.map.size;
  }

  add(key: K): V {
    const value = this.map.get(key);
    if (value) return value;
    this.storage.push(this.objectFactory());
    this.map.set(key, this.storage[this.storage.length - 1]);
    return this.storage[this.storage.length - 1];
  }

  remove(key: K) {
    this.map.delete(key);
  }

  get(key: K): V {
    const value = this.map.get(key);
    if (!value) throw new Error("Key not found");
    return value;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  clean() {
    this.storage.splice(this.map.size);
  }
}
