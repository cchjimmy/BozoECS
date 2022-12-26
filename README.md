# BozoECS
This is an ECS implementation based on archetypes. Archetypes are the different types of entity within a simulation space, they are defined by the components attached to an entity.

In this implementation, each archetype is a JavaScript object, which acts as a table storing entity IDs and their associated components. For example, a column in the archetype table could be the IDs, and they would be stored in an array in the archetype object. Archetypes can be created and destroyed automatically by adding/ removing components or entities.
