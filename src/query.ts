import { Component } from "./component.ts";
import { entityT } from "./entity.ts";
import { World } from "./world.ts";

export type queryT = number;

export function createQuery<T extends typeof Component[]>(
  ...components: T
): queryT {
  return components.reduce((a, b) => a |= 1 << b.id, 0);
}

export function query(
  world: World,
  query: queryT,
  exclude: boolean = false,
): entityT[] {
  const res = [];
  if (exclude) {
    const excludeMask = (2 ** world.components.pools.length - 1) &
      ~query;
    for (const archetype in world.archetypes) {
      if (((parseInt(archetype) & ~query) & excludeMask) > 0) {
        res.push(...world.archetypes[archetype]);
      }
    }
  } else {
    for (const archetype in world.archetypes) {
      if ((parseInt(archetype) & query) == query) {
        res.push(...world.archetypes[archetype]);
      }
    }
  }
  return res;
}
