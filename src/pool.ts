export class ObjectPool<T> {
	private reserve: T[];
	private active: T[];
	private objectConstructor: () => T;

	constructor(objectConstructor: () => T) {
		this.reserve = [];
		this.active = [];
		this.objectConstructor = objectConstructor;
	}

	addObj(): T {
		this.active.push(this.reserve.pop() ?? this.objectConstructor());
		return this.active[this.active.length - 1];
	}

	findIndex(object: T): number {
		return this.active.findIndex((v) => v == object);
	}

	removeObj(index: number): T {
		const removed = this.active[index];
		// swap with last to maintain packed
		this.active[index] = this.active[this.active.length - 1];
		this.active.length--;
		this.reserve.push(removed);
		return removed;
	}

	getObj(index: number): T {
		return this.active[index];
	}

	len(): number {
		return this.active.length;
	}
}
