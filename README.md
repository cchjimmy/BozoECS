# BozoECS
'An ECS is a software architectural pattern, mainly for video game development to represent game world objects' - [wiki](https://en.wikipedia.org/wiki/Entity_component_system). This ECS implementation is written in JavaScript and is based on archetypes. An archetype represents a type of entity and it is defined by the components attached to the entity.

In this implementation, each archetype is a JavaScript object, which acts as a table storing entity IDs and their associated components. Each column in the table is a separate array, and they are stored as values within the archetype object. Archetypes can be created or destroyed automatically by adding or removing components or entities.

Go to https://cchjimmy.github.io/BozoECS/ to see this ECS in action. See example.js as to how it is used in code.