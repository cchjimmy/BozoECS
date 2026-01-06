# BozoECS

'An ECS is a software architectural pattern, mainly for video game development to represent game world objects' - [wiki](https://en.wikipedia.org/wiki/Entity_component_system). This ECS implementation is written in JavaScript.

## Examples

[Examples](./examples)

## Docs

### Entity

Entities are created using "addEntity" on a World instance,
they are unique to different instances,
meaning the same entity can be added to multiple worlds without collision.

```typescript
typedef entityT = number;
```

### Component

Components are plain objects and their instances are stored in separate [ObjectPoolMap](./src/pool.ts)s when added to an entity.
They can be registered using "World.registerComponent" or "World.addComponent".
Components are instantiated via the spread operator.

### System

```typescript
typedef systemT = (world: World) => void;
```

A system is defined as a function that accepts a World instance and returns void,
it can be passed into a World instance's "update" function,
to have it modify the World's entities.

### World

The [World](./src/world.ts) class is the core of this ECS,
it contains various methods to manage entities and components.
Below are the instance methods of the class.

### Instance Methods

```typescript
addEntity(entity: entityT = newEntity()): entityT;
```

This adds a new or existing entity to a World instance.
If the input entity already exists in the World,
it is returned without any modifications to its components.

```typescript
copyEntity(src: entityT, dest: entityT = newEntity()): entityT;
```

This copies the components of the "src" entity to the "dest" entity.
It can override existing entities or create new entity copies.

```typescript
registerComponent<T extends object>(component: T): World;
```

This internally adds an object pool for the input component and the component is added to an id map for identification.

```typescript
addComponent<T extends object>(entity: entityT, component: T, values: Partial<T> = {}): T;
```

Adds a component to an entity and returns a shallow copy of the component.
If the component is not registered the function will register it.

```typescript
removeComponent<T extends object>(entity: entityT, component: T): void;
```

Removes a component from an entity and returns void,
the removed component is returned to its object pool.

```typescript
getComponent<T extends object>(entity: entityT, component: T): T;
```

Returns the attached component of an entity,
this throws an error if the entity doesn't have the component.

```typescript
deleteEntity(entity: entityT): void;
```

Deletes an entity from a World instance along with all its components.

```typescript
update(...fns: systemT[]): void;
```

This calls "fns" in sequence,
where "fns" are user defined functions that accepts a World instance and returns void.

```typescript
query(q: Partial<Record<"and" | "not", object[]>>): entityT[];
```

Returns an array of entities matching the query.

- "and": chooses entities with all the components.
- "not": chooses entities without the listed components.

```typescript
cleanObjectPools(): void;
```

This functions clean object pools in a World when called.
This prevents accumulation of unused objects.
