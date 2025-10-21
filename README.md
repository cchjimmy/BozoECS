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

Components are plain objects and are stored in separate [ObjectPoolMaps](./src/pool.ts)s,
they must be registered using "World.registerComponent" or "World.addComponent".
Components are instantiated via the spread operator.

### System

There is no definite way to define a system,
but a World instance has a method called "update" which accepts an array of functions,
which will be called in sequence when the method is invoked.

### World

The [World](./src/world.ts) class is the core of this ECS,
it stores entities and components in its instances,
which can be accessed by the "query" method on the instance.
Below are methods defined in the World class.

```typescript
constructor(cleanUpMinutes = 5): World;
```

The World constructor accepts "cleanUpMinutes" input,
which specifies the time interval to clean the object pools.

```typescript
addEntity(entity: entityT = newEntity()): entityT;
```

This creates a new entity or add an existing entity to World instances.

```typescript
copyEntity(src: entityT, dest: entityT = newEntity()): entityT;
```

Copies an entity in a World instance and returns a new entity containing copied components,
which is added into the World instance.
This can be used for instantiating prefab entities.

```typescript
registerComponent<T extends object>(component: T): World;
```

This internally adds an object pool for the input component and is added into an id map for identification.

```typescript
addComponent<T extends object>(entity: entityT, component: T, values: Partial<T> = {}): T;
```

Adds a component to an entity and returns a shallow copy of the component,
and it is stored in World instances.
If the component is not registered the function will register it.

```typescript
removeComponent<T extends object>(entity: entityT, component: T): boolean;
```

Removes a component from an entity and returns true if it is removed and false otherwise,
the removed component is returned to its object pool.

```typescript
getComponent<T extends object>(entity: entityT, component: T): T;
```

Returns the attached component to entity,
will throw an error if entity doesn't have the component.

```typescript
deleteEntity(entity: entityT): void;
```

Deletes an entity from a World instance along with all its components.
The entity is first stored in an array,
and removal is commited at the end of the "update" function.

```typescript
update(...fns: ((world: World) => void)[]): void;
```

"fns" are called in sequence then entity removal then cleaning the object pools.

```typescript
query(q: Partial<Record<"and" | "not", object[]>>): entityT[];
```

Returns an array of entities matching the query.

- "and": chooses entities with all the components.
- "not": chooses entities without the listed components.
