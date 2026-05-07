import { ComponentManager } from "./component.ts";
import { EntityManager, entityT } from "./entity.ts";
import { Grouper } from "./grouper.ts";

type queryT = Record<"and" | "not", object[]>;
export type systemT = (world: World) => void;

export class World {
  private static _compManager = new ComponentManager();
  private _entityManager = new EntityManager();
  private _entityCompMap: Map<object, Map<entityT, object>> = new Map();
  private _archtypeGroups: Grouper<bigint, entityT> = new Grouper();

  onAddedComponent(
    entity: entityT,
    component: object,
    instance: object,
  ): void {}

  onRemoveComponent(
    entity: entityT,
    component: object,
    instance: object,
  ): void {}

  addEntity(entity: entityT = this._entityManager.newEntity()): entityT {
    this._entityManager.addEntity(entity);
    return entity;
  }

  copyEntity(
    src: entityT,
    dest: entityT = this._entityManager.newEntity(),
  ): entityT {
    this._entityManager.addEntity(dest);
    for (const entry of this._entityCompMap) {
      const srcComp = entry[1].get(src);
      if (srcComp == undefined) continue;
      this._addComponent(dest, entry[0], srcComp);
    }
    const destMask = this._archtypeGroups.getGroup(dest) ?? 0n;
    this._archtypeGroups.switchGroup(
      dest,
      destMask,
      destMask | (this._archtypeGroups.getGroup(src) ?? 0n),
    );
    return dest;
  }

  deleteEntity(entity: entityT): void {
    for (const entry of this._entityCompMap) {
      this._removeComponent(entity, entry[0]);
    }
    this._archtypeGroups.delete(entity);
    this._entityManager.removeEntity(entity);
  }

  hasComponent<T extends object>(entity: entityT, component: T): boolean {
    return !!this._entityCompMap.get(component)?.has(entity);
  }

  addComponent<T extends object>(
    entity: entityT,
    component: T,
    values: Partial<T> = component,
  ): T {
    this._registerComponent(component);
    const entityMask = this._archtypeGroups.getGroup(entity) ?? 0n;
    this._archtypeGroups.switchGroup(
      entity,
      entityMask,
      entityMask | (1n << BigInt(World._compManager.getId(component))),
    );
    return this._addComponent(entity, component, values);
  }

  removeComponent<T extends object>(entity: entityT, component: T): void {
    this._registerComponent(component);
    const entityMask = this._archtypeGroups.getGroup(entity) ?? 0n;
    this._archtypeGroups.switchGroup(
      entity,
      entityMask,
      entityMask & ~(1n << BigInt(World._compManager.getId(component))),
    );
    this._removeComponent(entity, component);
  }

  getComponent<T extends object>(entity: entityT, component: T): T {
    const instance = this._entityCompMap.get(component)?.get(entity);
    if (instance == undefined)
      throw new Error(
        `Entity ${entity} does not have component ${JSON.stringify(component)}.`,
      );
    return instance as T;
  }

  copyEntityTo(anotherWorld: World, entity: entityT): void {
    if (anotherWorld == this) return;
    anotherWorld.addEntity(entity);
    for (const entry of this._entityCompMap) {
      const instance = entry[1].get(entity);
      if (instance == undefined) continue;
      anotherWorld.addComponent(entity, entry[0], instance);
    }
  }

  copyComponentTo<T extends object>(
    anotherWorld: World,
    entity: entityT,
    component: T,
  ): void {
    const instance = this._entityCompMap.get(component)?.get(entity);
    if (instance == undefined) return;
    anotherWorld.addEntity(entity);
    anotherWorld.addComponent(entity, component, instance);
  }

  update(fns: systemT[]): void {
    for (let i = 0, l = fns.length; i < l; i++) fns[i](this);
  }

  cleanObjectPools(): void {
    World._compManager.clean();
  }

  query(query: Partial<queryT>, res: entityT[] = []): entityT[] {
    const andMask = query.and ? this._getMask(query.and) : 0n;
    const notMask = query.not ? this._getMask(query.not) : 0n;
    for (const entry of this._archtypeGroups) {
      if (
        entry[1].size == 0 ||
        (entry[0] & andMask) != andMask ||
        (entry[0] & notMask) != 0n
      )
        continue;
      res.push(...entry[1]);
    }
    return res;
  }

  entityCount(): number {
    return this._entityManager.size();
  }

  clearWorld(): void {
    for (const entry of this._entityCompMap) {
      for (const entry1 of entry[1]) {
        World._compManager.remove(entry[0], entry1[1]);
      }
      entry[1].clear();
    }
    for (const entity of this._entityManager.getEntitySet()) {
      this._archtypeGroups.delete(entity);
      this._entityManager.removeEntity(entity);
    }
  }

  private _addComponent<T extends object>(
    entity: entityT,
    component: T,
    values: Partial<T>,
  ): T {
    let instance = this._entityCompMap.get(component)?.get(entity);
    if (instance) return Object.assign(instance, values) as T;
    instance = Object.assign(World._compManager.add(component), values);
    this._entityCompMap.get(component)?.set(entity, instance);
    this.onAddedComponent(entity, component, instance);
    return instance as T;
  }

  private _removeComponent<T extends object>(
    entity: entityT,
    component: T,
  ): void {
    const instance = this._entityCompMap.get(component)?.get(entity);
    if (instance == undefined) return;
    this.onRemoveComponent(entity, component, instance);
    this._entityCompMap.get(component)?.delete(entity);
    World._compManager.remove(component, instance);
  }

  private _getMask<T extends Iterable<object>>(components: T): bigint {
    let mask = 0n;
    for (const comp of components) {
      let id = World._compManager.getId(comp);
      if (id == -1) {
        this._registerComponent(comp);
        id = World._compManager.getId(comp);
      }
      mask |= 1n << BigInt(id);
    }
    return mask;
  }

  private _registerComponent<T extends object>(component: T): void {
    if (this._entityCompMap.has(component)) return;
    World._compManager.register(component);
    this._entityCompMap.set(component, new Map());
  }
}
