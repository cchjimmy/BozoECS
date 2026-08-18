// deno-lint-ignore no-explicit-any
export type EventHandler = (...args: any[]) => void;

export class EventManager {
	private _events: Map<EventHandler, undefined | { listeners: Set<EventHandler> }> = new Map()

	addEvent(eventSchema: EventHandler): void {
		this._events.set(eventSchema, { listeners: new Set() });
	}

	addListener<T extends EventHandler>(eventSchema: T, listener: T): void {
		this._events.get(eventSchema)?.listeners.add(listener);
	}

	removeListener<T extends EventHandler>(eventSchema: T, listener: T): void {
		const event = this._events.get(eventSchema);
		if (event == undefined) return;
		event.listeners.delete(listener);
	}

	removeEvent(eventSchema: EventHandler): void {
		this._events.delete(eventSchema);
	}

	emit<T extends EventHandler>(eventSchema: T, ...args: Parameters<T>): void {
		const event = this._events.get(eventSchema);
		if (event == undefined) return;
		for (const listener of event.listeners) {
			listener(...args);
		}
	}
}
