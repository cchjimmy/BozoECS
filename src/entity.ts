export type entityT = number;

export class EntityManager {
  private _entities: Set<entityT> = new Set();

  create(): entityT {
    return Math.random();
  }

  add(entity: entityT = this.create()) {
    this._entities.add(entity);
  }

  remove(entity: entityT) {
    this._entities.delete(entity);
  }

  has(entity: entityT): boolean {
    return this._entities.has(entity);
  }

  getEntities(): entityT[] {
    return Array.from(this._entities);
  }

  getEntitySet(): Set<entityT> {
    return this._entities;
  }

  clear(): void {
    this._entities.clear();
  }

  size(): number {
    return this._entities.size;
  }
}
