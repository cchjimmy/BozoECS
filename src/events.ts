import type { entityT } from "./entity.ts";

export const events = {
	"addedComponent": (
		_entity: entityT,
		_component: object,
		_instance: object,
	): void => {},
	"removeComponent": (
		_entity: entityT,
		_component: object,
		_instance: object,
	): void => {},
};
