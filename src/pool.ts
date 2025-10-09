export class ObjectPoolMap<T> {
  private storage: T[] = [];
  private indices: Map<unknown, number> = new Map();
  private objectFactory: () => T;
  private size = 0;

  constructor(objectFactory: () => T) {
    this.objectFactory = objectFactory;
  }

  len() {
    return this.size;
  }

  addObj(key: unknown): T {
    let obj;
    if (this.size < this.storage.length) {
      obj = this.storage[this.size];
    } else {
      obj = this.objectFactory();
      this.storage.push(obj);
    }
    this.indices.set(key, this.size);
    this.size++;
    return obj;
  }

  removeObj(key: unknown): boolean {
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

  getObj(key: unknown): T {
    const index = this.indices.get(key) ?? -1;
    if (index < 0 || index >= this.size) throw new Error("Index out of range.");
    return this.storage[index];
  }
}
