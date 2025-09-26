export class ObjectPool<T> {
  private storage: T[] = [];
  private objectFactory: () => T;
  private size = 0;

  constructor(objectFactory: () => T) {
    this.objectFactory = objectFactory;
  }

  len() {
    return this.size;
  }

  addObj(): T {
    let obj;
    if (this.size < this.storage.length) {
      obj = this.storage[this.size];
    } else {
      obj = this.objectFactory();
      this.storage.push(obj);
    }
    this.size++;
    return obj;
  }

  findIndex(object: T): number {
    return this.storage.findIndex((v) => v == object);
  }

  removeObj(index: number): T {
    if (index < 0 || index >= this.size) throw new Error("Index out of range.");
    const removed = this.storage[index];
    // swap with last to maintain packed
    this.storage[index] = this.storage[this.storage.length - 1];
    this.storage[this.storage.length - 1] = removed;
    this.size--;
    return removed;
  }

  getObj(index: number): T {
    if (index < 0 || index >= this.size) throw new Error("Index out of range.");
    return this.storage[index];
  }
}
