export class ObjectPoolMap<K, V> {
  private storage: V[] = [];
  private indices: Map<K, number> = new Map();
  private objectFactory: () => V;
  private size = 0;

  constructor(objectFactory: () => V) {
    this.objectFactory = objectFactory;
  }

  len() {
    return this.size;
  }

  add(key: K): V {
    const index = this.indices.get(key);
    if (index != undefined) return this.storage[index];
    if (this.size >= this.storage.length)
      this.storage.push(this.objectFactory());
    this.indices.set(key, this.size);
    this.size++;
    return this.storage[this.size - 1];
  }

  remove(key: K): boolean {
    const index = this.indices.get(key) ?? -1;
    if (index < 0 || index >= this.size) return false;
    const removed = this.storage[index];
    // swap with last to maintain packed
    this.storage[index] = this.storage[this.size - 1];
    this.storage[this.size - 1] = removed;
    for (const [k, v] of this.indices) {
      if (v != this.size - 1) continue;
      this.indices.set(k, index);
      break;
    }
    this.indices.delete(key);
    this.size--;
    return true;
  }

  get(key: K): V {
    const index = this.indices.get(key) ?? -1;
    if (index < 0 || index >= this.size) throw new Error("Index out of range.");
    return this.storage[index];
  }

  has(key: K): boolean {
    return this.indices.has(key);
  }
}
