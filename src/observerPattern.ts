// credit: https://en.wikipedia.org/wiki/Observer_pattern#JavaScript

export class Subject<T> {
	private _observers: Observer<T>[] = [];
	private _data: T[];

	constructor(...data: T[]) {
		this._data = data;
	}

	add(observer: Observer<T>): void {
		this._observers.push(observer);
	}

	remove(observer: Observer<T>): void {
		const last = this._observers.pop();
		if (last == undefined) return;
		for (let i = 0, l = this._observers.length; i < l; i++) {
			if (this._observers[i] != observer) continue;
			this._observers[i] = last;
		}
	}

	notify(): void {
		for (let i = 0, l = this._observers.length; i < l; i++) {
			this._observers[i](...this._data);
		}
	}

	get data(): T[] {
		return this._data;
	}

	set data(value: T[]) {
		this._data = value;
		this.notify();
	}
}

export interface Observer<T> {
	(...subjectData: T[]): void;
}
