import type { entityT } from "./entity.ts";
import type { World } from "./world.ts";

export type queryT = Record<"and" | "not", object[]>;

export class QueryManager {
	private _storage: Map<entityT[], {
		world: World, query: queryT
	}> = new Map();

	addQuery(world: World, query: queryT, res: entityT[] = []): entityT[] {
		this._storage.set(res, { world, query });
		return res;
	}

	updateQuery(queryResult: entityT[]): entityT[] {
		const obj = this._storage.get(queryResult); 
		if (!obj) return queryResult;
		queryResult.length = 0;
		obj.world.query(obj.query, queryResult);
		return queryResult;
	}

	removeQuery(queryResult: entityT[]): void {
		this._storage.delete(queryResult);
	}
}
