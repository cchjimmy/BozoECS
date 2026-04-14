export class ObjectPool<T extends object> {
  private _pool: T[] = [];
  private _obj: T;
  private _count = 0;

  constructor(obj: T) {
    this._obj = obj;
  }

  release(obj: T): void {
    this._count--;
    this._pool.push(obj);
  }

  get(): T {
    this._count++;
    return Object.assign(this._pool.pop() ?? {}, this._obj);
  }

  copy(obj: Partial<T>): T {
    return Object.assign(this.get(), obj);
  }

  size(): number {
    return this._count;
  }

  clean() {
    this._pool.length = 0;
  }
}
