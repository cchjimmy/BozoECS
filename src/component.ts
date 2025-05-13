import { entityT } from "./entity.ts";
import { ObjectPool } from "./pool.ts";

export class Component {
	static id: number = -1;
	owner: entityT = -1;
}

export class ComponentManager {
	pools: ObjectPool<InstanceType<typeof Component>>[] = [];

	register<T extends typeof Component>(
		component: T,
	) {
		component.id == -1 && (component.id = this.pools.length);
		this.pools[component.id] ??= new ObjectPool(() => new component());
	}

	isRegistered<T extends typeof Component>(
		component: T,
	): boolean {
		return !!(this.pools[component.id]);
	}

	add<T extends typeof Component>(component: T): InstanceType<T> {
		return this.pools[component.id].addObj() as InstanceType<T>;
	}

	delete<T extends typeof Component>(
		component: T,
		index: number,
	): InstanceType<T> {
		return this.pools[component.id].removeObj(index) as InstanceType<T>;
	}

	get<T extends typeof Component>(
		component: T,
		index: number,
	): InstanceType<T> {
		return this.pools[component.id].getObj(index) as InstanceType<T>;
	}

	len<T extends typeof Component>(component: T): number {
		return this.pools[component.id].len();
	}
}
