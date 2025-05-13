import { Component, ComponentManager } from "./component.ts";
import { EntityManager, entityT } from "./entity.ts";

export type queryT = Partial<
	Record<"and" | "or" | "not", (typeof Component)[]>
>;

export class World {
	private static indices: number[][] = [];
	private static components: ComponentManager = new ComponentManager();
	private static entities: EntityManager = new EntityManager();
	private static entityMasks: number[] = [];
	private static archetypes: Record<number, Set<entityT>> = { 0: new Set() };
	private static worlds: World[] = [];

	time = 0;
	dt = 0;
	localEntities: Set<entityT> = new Set();

	constructor() {
		World.worlds.push(this);
	}

	static createEntity(): entityT {
		const entity = World.entities.add();
		World.indices[entity] = [];
		World.entityMasks[entity] = 0;
		World.archetypes[World.entityMasks[entity]].add(entity);
		return entity;
	}

	static deleteEntity(entity: entityT) {
		for (const world of World.worlds) {
			world.removeEntity(entity);
		}
		for (let i = 0, l = World.components.pools.length; i < l; i++) {
			if (!(World.entityMasks[entity] & 1 << i)) continue;
			const comp = World.components.pools[i].removeObj(
				World.indices[entity][i],
			).constructor.prototype as typeof Component;
			World.indices[World.components.get(comp, entity).owner][i] =
				World.indices[entity][i];
		}
		World.archetypes[World.entityMasks[entity]].delete(entity);
		World.entityMasks[entity] = 0;
		World.entities.delete(World.entities.findIndex(entity));
	}

	addEntity(entity?: entityT): entityT {
		entity ??= World.createEntity();
		this.localEntities.add(entity);
		return entity;
	}

	removeEntity(entity: entityT) {
		this.localEntities.delete(entity);
	}

	entityExists(entity: entityT) {
		if (!this.localEntities.has(entity)) {
			throw new Error(`Entity ${entity} does not exist.`);
		}
	}

	static componentExists<T extends typeof Component>(component: T) {
		if (!World.components.isRegistered(component)) {
			throw new Error(
				`Component ${component.name} is not registered.`,
			);
		}
	}

	static registerComponent<T extends typeof Component>(
		component: T,
	): typeof World {
		World.components.register(component);
		return World;
	}

	static hasComponent<T extends typeof Component>(
		entity: entityT,
		component: T,
	): boolean {
		return (World.entityMasks[entity] & 1 << component.id) > 0;
	}

	static addComponent<T extends typeof Component>(
		entity: entityT,
		component: T,
	): InstanceType<T> {
		World.componentExists(component);
		if (World.hasComponent(entity, component)) {
			throw new Error(`Entity ${entity} already had this component.`);
		}
		World.archetypes[World.entityMasks[entity]].delete(entity);
		World.entityMasks[entity] |= 1 << component.id;
		World.archetypes[World.entityMasks[entity]] ??= new Set();
		World.archetypes[World.entityMasks[entity]].add(entity);
		World.indices[entity][component.id] = World.components.len(component);
		const comp = World.components.add(component);
		comp.owner = entity;
		return comp;
	}

	static removeComponent<T extends typeof Component>(
		entity: entityT,
		component: T,
	): InstanceType<T> {
		World.componentExists(component);
		if (!World.hasComponent(entity, component)) {
			throw new Error(
				`Entity ${entity} does not have component ${component.name}.`,
			);
		}
		World.archetypes[World.entityMasks[entity]].delete(entity);
		World.entityMasks[entity] &= ~(1 << component.id);
		World.archetypes[World.entityMasks[entity]] ??= new Set();
		World.archetypes[World.entityMasks[entity]].add(entity);
		const removed = World.components.delete(
			component,
			World.indices[entity][component.id],
		);
		const backEntity = World.components.get(
			component,
			World.indices[entity][component.id],
		).owner;
		World.indices[backEntity][component.id] =
			World.indices[entity][component.id];
		return removed;
	}

	getComponent<T extends typeof Component>(
		entity: entityT,
		component: T,
	): InstanceType<T> {
		this.entityExists(entity);
		World.componentExists(component);
		if (!World.hasComponent(entity, component)) {
			throw new Error(
				`Entity ${entity} does not have component ${component.name}.`,
			);
		}
		return World.components.get(
			component,
			World.indices[entity][component.id],
		);
	}

	update(...funcs: ((world: World, dtSecond: number) => void)[]) {
		for (const func of funcs) {
			func(this, this.dt / 1000);
		}
		this.dt = performance.now() - this.time;
		this.time += this.dt;
	}

	query(query: queryT): entityT[] {
		let andMask = 0, orMask = 0, notMask = 0;
		if (query.and) {
			for (let i = 0, l = query.and.length; i < l; i++) {
				andMask |= 1 << query.and[i].id;
			}
		}
		if (query.or) {
			for (let i = 0, l = query.or.length; i < l; i++) {
				orMask |= 1 << query.or[i].id;
			}
		}
		if (query.not) {
			for (let i = 0, l = query.not.length; i < l; i++) {
				notMask |= 1 << query.not[i].id;
			}
		}
		const res = [];
		for (const archtype in World.archetypes) {
			const a = parseInt(archtype);
			if (
				(a & andMask) == andMask && (a | orMask) > 0 &&
				(a & notMask) == 0
			) {
				res.push(
					...this.localEntities.intersection(
						World.archetypes[archtype],
					),
				);
			}
		}
		return res;
	}
}
