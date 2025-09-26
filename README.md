# BozoECS

'An ECS is a software architectural pattern, mainly for video game development to represent game world objects' - [wiki](https://en.wikipedia.org/wiki/Entity_component_system). This ECS implementation is written in JavaScript.

## Examples

[Examples](./examples)

## Docs

### Entity

Entities are numbers which can be created by "World.createEntity",
or by using the "addEntity" method on a World instance.
Entities created using "createEntity" must be manually added to a World instance using the "addEntity" method.

```typescript
typedef entityT = number;
```

### Component

Components are plain objects and are stored in separate [ObjectPool](./src/pool.ts)s,
they must be registered by "World.registerComponent" or by "World.addComponent".
Components are instantiated via the spread operator.

### System

There is no definite way to define a system,
but World has a method called "update" which accepts an array of functions,
which will be called when the method is invoked.

### World

The [World](./src/world.ts) class is the core of this ECS.
It stores all entities and components in a "global" space,
which can be added to World instances.
World instances each have a local set of entities,
which can be accessed by the "query" method on the instance.

```typescript
static createEntity(): entityT;
```

Creates an entity in "global" space,
which can be added or removed from World instances.

```typescript
static registerComponent<T extends object>(component: T): typeof World;
```

This internally adds an object pool, index map for the input component.
Index map maps an entity to an index into an object pool.

```typescript
static addComponent<T extends object>(entity: entityT, component: T, values: Partial<T> = {}): T;
```

Adds a component to an entity and returns a shallow copy of the component.
The component is stored in "global" space, not within World instances.
If the component is not registered the function will register it.

```typescript
static removeComponent<T extends object>(entity: entityT, component: T): T;
```

Removes a component from an entity and returns it,
the removed component is stored in an object pool in "global" space.

```typescript
static getComponent<T extends object>(entity: entityT, component: T): T;
```

Returns the attached component, will throw an error if entity doesn't have the component.

```typescript
addEntity(entity?: entityT): entityT;
```

Adds an entity to a World instance's entity set.

```typescript
removeEntity(entity: entityT): void;
```

Removes an entity from a World instance's entity set.

```typescript
deleteEntity(entity: entityT): void;
```

Removes an entity from the "global" space along with all its components.

```typescript
update(...fns: ((world: World) => void)[]): void;
```

fns are called in sequence, it measures the elapsed time and records it into World.dtMilli,
then the time is added to World.timeMilli.

```typescript
query(q: Partial<Record<"and" | "or" | "not", object[]>>): entityT[];
```

Returns an array of entities matching the query.
- "and": chooses entities with all the components.
- "or": chooses entities with one or more of the listed components.
- "not": chooses entities without the listed components.
