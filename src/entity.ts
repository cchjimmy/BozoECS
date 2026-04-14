export type entityT = number;

export class EntityManager {
  private _entities: Set<entityT> = new Set();

  newEntity(): entityT {
    return Math.random();
  }

  addEntity(entity: entityT = this.newEntity()) {
    this._entities.add(entity);
  }

  removeEntity(entity: entityT) {
    this._entities.delete(entity);
  }

  getEntities(): entityT[] {
    return Array.from(this._entities);
  }

  getEntitySet(): Set<entityT> {
    return this._entities;
  }

  size(): number {
    return this._entities.size;
  }
}
