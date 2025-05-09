(() => {
  // src/pool.ts
  var ObjectPool = class {
    reserve;
    active;
    objectConstructor;
    constructor(objectConstructor) {
      this.reserve = [];
      this.active = [];
      this.objectConstructor = objectConstructor;
    }
    addObj() {
      this.active.push(this.reserve.pop() ?? this.objectConstructor());
      return this.active[this.active.length - 1];
    }
    findIndex(object) {
      return this.active.findIndex((v) => v == object);
    }
    removeObj(index) {
      const removed = this.active[index];
      this.active[index] = this.active[--this.active.length];
      this.reserve.push(removed);
      return removed;
    }
  };

  // src/component.ts
  var Component = class {
    static id = -1;
    owner = -1;
  };
  var ComponentManager = class {
    pools = [];
    register(component) {
      component.id == -1 && (component.id = this.pools.length);
      this.pools[component.id] ??= new ObjectPool(() => new component());
    }
    isRegistered(component) {
      return !!this.pools[component.id];
    }
    add(component) {
      return this.pools[component.id].addObj();
    }
    delete(component, index) {
      return this.pools[component.id].removeObj(index);
    }
    get(component, index) {
      return this.pools[component.id].active[index];
    }
    len(component) {
      return this.pools[component.id].active.length;
    }
  };

  // src/query.ts
  function createQuery(...components) {
    return components.reduce((a, b) => a |= 1 << b.id, 0);
  }
  function query(world, query2, exclude = false) {
    const res = [];
    if (exclude) {
      const excludeMask = 2 ** world.components.pools.length - 1 & ~query2;
      for (const archetype in world.archetypes) {
        if ((parseInt(archetype) & ~query2 & excludeMask) > 0) {
          res.push(...world.archetypes[archetype]);
        }
      }
    } else {
      for (const archetype in world.archetypes) {
        if ((parseInt(archetype) & query2) == query2) {
          res.push(...world.archetypes[archetype]);
        }
      }
    }
    return res;
  }

  // src/entity.ts
  var EntityManager = class {
    nextId = 0;
    pool = new ObjectPool(() => this.nextId++);
    add() {
      return this.pool.addObj();
    }
    findIndex(entity) {
      return this.pool.findIndex(entity);
    }
    delete(index) {
      return this.pool.removeObj(index);
    }
  };

  // src/world.ts
  var World = class {
    indices;
    components;
    entities;
    entityMasks;
    archetypes;
    constructor() {
      this.indices = [];
      this.components = new ComponentManager();
      this.entities = new EntityManager();
      this.entityMasks = [];
      this.archetypes = { 0: /* @__PURE__ */ new Set() };
    }
    addEntity() {
      const entity = this.entities.add();
      this.indices[entity] = [];
      this.entityMasks[entity] = 0;
      this.archetypes[0].add(entity);
      return entity;
    }
    removeEntity(index) {
      const entity = this.entities.pool.active[index];
      for (let i = 0, l = this.components.pools.length; i < l; i++) {
        if (!(this.entityMasks[entity] & 1 << i)) continue;
        this.components.pools[i].removeObj(this.indices[entity][i]);
      }
      this.archetypes[0].delete(entity);
      return this.entities.delete(index);
    }
    entityExists(entity) {
      if (!this.indices[entity]) {
        throw new Error(`Entity ${entity} does not exist.`);
      }
    }
    componentExists(component) {
      if (!this.components.isRegistered(component)) {
        throw new Error(
          `Component ${component.name} is not registered.`
        );
      }
    }
    registerComponent(component) {
      this.components.register(component);
      return this;
    }
    hasComponent(entity, component) {
      return (this.entityMasks[entity] & 1 << component.id) > 0;
    }
    addComponent(entity, component) {
      this.entityExists(entity);
      this.componentExists(component);
      if (this.hasComponent(entity, component)) {
        throw new Error(`Entity ${entity} already had this component.`);
      }
      this.archetypes[this.entityMasks[entity]].delete(entity);
      this.entityMasks[entity] |= 1 << component.id;
      this.archetypes[this.entityMasks[entity]] ??= /* @__PURE__ */ new Set();
      this.archetypes[this.entityMasks[entity]].add(entity);
      this.indices[entity][component.id] = this.components.len(component);
      const comp = this.components.add(component);
      comp.owner = entity;
      return comp;
    }
    removeComponent(entity, component) {
      this.entityExists(entity);
      this.componentExists(component);
      if (!this.hasComponent(entity, component)) {
        throw new Error(
          `Entity ${entity} does not have component ${component.name}.`
        );
      }
      this.archetypes[this.entityMasks[entity]].delete(entity);
      this.entityMasks[entity] &= ~(1 << component.id);
      this.archetypes[this.entityMasks[entity]] ??= /* @__PURE__ */ new Set();
      this.archetypes[this.entityMasks[entity]].add(entity);
      const removed = this.components.delete(
        component,
        this.indices[entity][component.id]
      );
      const backEntity = this.components.pools[component.id].active[entity].owner;
      this.indices[backEntity][component.id] = this.indices[entity][component.id];
      return removed;
    }
    getComponent(entity, component) {
      this.entityExists(entity);
      this.componentExists(component);
      if (!this.hasComponent(entity, component)) {
        throw new Error(
          `Entity ${entity} does not have component ${component.name}.`
        );
      }
      return this.components.get(component, this.indices[entity][component.id]);
    }
  };

  // example/src/main.ts
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }
  function update(world, dt = 0) {
    const now = performance.now();
    dt /= 1e3;
    render(world, dt);
    move(world, dt);
    bounce(world, dt);
    logFPS(world, dt);
    requestAnimationFrame(() => update(world, performance.now() - now));
  }
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);
  var ENTITY_COUNT = 1e3;
  function fullsrn() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  fullsrn();
  window.onresize = fullsrn;
  document.body.style.margin = "0px";
  document.body.style.userSelect = "none";
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
  var w = new World();
  var Position = class extends Component {
    x = 0;
    y = 0;
  };
  var Velocity = class extends Component {
    x = 0;
    y = 0;
  };
  var Circle = class extends Component {
    radius = 10;
    color = "green";
  };
  w.registerComponent(Position).registerComponent(Velocity).registerComponent(Circle);
  var renderQ = createQuery(Position, Circle);
  var moveQ = createQuery(Position, Velocity);
  var bounceQ = createQuery(Position, Velocity, Circle);
  function logFPS(_world, dt) {
    if (!ctx) return;
    const txt = `FPS: ${(1 / dt).toFixed(0)}`;
    const fontSize = 30;
    const txtMetric = ctx.measureText(txt);
    const padding = 10;
    const margin = 5;
    const old = ctx.fillStyle;
    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = "white";
    ctx.fillRect(
      padding,
      padding,
      2 * margin + txtMetric.width,
      2 * margin + txtMetric.emHeightAscent
    );
    ctx.fillStyle = "black";
    ctx.fillText(
      txt,
      margin + padding,
      margin + padding + txtMetric.emHeightAscent
    );
    ctx.fillStyle = old;
  }
  function render(world, _dt) {
    if (!ctx) return;
    const twoPI = 2 * Math.PI;
    const entities = query(world, renderQ);
    ctx.lineWidth = 3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const oldStyle = ctx.strokeStyle;
    entities.forEach((e) => {
      const p = world.getComponent(e, Position);
      const c = world.getComponent(e, Circle);
      ctx.strokeStyle = c.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, c.radius, 0, twoPI);
      ctx.stroke();
    });
    ctx.strokeStyle = oldStyle;
  }
  function move(world, dt) {
    const entities = query(world, moveQ);
    entities.forEach((e) => {
      const p = world.getComponent(e, Position);
      const v = world.getComponent(e, Velocity);
      p.x += v.x * dt;
      p.y += v.y * dt;
    });
  }
  function bounce(world, _dt) {
    const entities = query(world, bounceQ);
    entities.forEach((e) => {
      const p = world.getComponent(e, Position);
      const v = world.getComponent(e, Velocity);
      const c = world.getComponent(e, Circle);
      if (p.x - c.radius < 0 || p.x + c.radius > canvas.width) {
        v.x *= -1;
        p.x = p.x < canvas.width * 0.5 ? c.radius : canvas.width - c.radius;
      }
      if (p.y - c.radius < 0 || p.y + c.radius > canvas.height) {
        v.y *= -1;
        p.y = p.y < canvas.height * 0.5 ? c.radius : canvas.height - c.radius;
      }
    });
  }
  function createEntity() {
    const e = w.addEntity();
    const p = w.addComponent(e, Position);
    const v = w.addComponent(e, Velocity);
    const c = w.addComponent(e, Circle);
    const maxSpeed = 100;
    p.x = random(0, canvas.width);
    p.y = random(0, canvas.height);
    v.x = random(-maxSpeed, maxSpeed);
    v.y = random(-maxSpeed, maxSpeed);
    c.radius = random(10, 30);
    c.color = `rgb(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)})`;
    return e;
  }
  for (let i = 0; i < ENTITY_COUNT; ++i) {
    createEntity();
  }
  update(w);
})();
