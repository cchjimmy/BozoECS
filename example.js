import BozoECS from "./BozoECS.js";

class Transform extends BozoECS.Component {
  position = {
    x: 0,
    y: 0
  }
  rotation = {
    radians: 0
  }
  scale = {
    x: 1,
    y: 1
  }
}

class Kinematics extends BozoECS.Component {
  velocity = {
    x: 0,
    y: 0
  }
  acceleration = {
    x: 0,
    y: 0
  }
}

class Appearance extends BozoECS.Component {
  color = 'black';
}

class MovementSystem extends BozoECS.System {
  init() {
    this.queryAll([Transform, Kinematics]);
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let p = this.queries.Transform[i].position;
      let K = this.queries.Kinematics[i];
      p.x = (Math.random() - 0.5) * canvas.width;
      p.y = (Math.random() - 0.5) * canvas.height;
      K.velocity.x = Math.random() * 100 - 50;
      K.velocity.y = Math.random() * 100 - 50;
    }
  }
  run(args) {
    this.queryAll([Transform, Kinematics]);
    let dt = args[0];
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let p = this.queries.Transform[i].position;
      let K = this.queries.Kinematics[i];
      p.x += (K.velocity.x += K.acceleration.x) * dt;
      p.y += (K.velocity.y += K.acceleration.y) * dt;
    }
  }
}

class RenderSystem extends BozoECS.System {
  init() {
    this.queryAll([Transform, Appearance]);
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let T = this.queries.Transform[i];
      T.scale.x = Math.random() * 10;
      T.scale.y = Math.random() * 10;
    }
    // due to instantiation of entity, only need to change the color of the first appearance component to change all other clone's colors
    this.queries.Appearance[0].color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
  }
  run() {
    this.queryAll([Transform, Appearance]);
    ctx.fillStyle = 'black';
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let T = this.queries.Transform[i];
      let A = this.queries.Appearance[i];
      let p = T.position;
      let s = T.scale;

      ctx.fillStyle = A.color;
      ctx.fillRect(Math.floor(p.x - s.x / 2), -Math.floor(p.y - s.y / 2), s.x, s.y);
    }
  }
}

const w = new BozoECS.World;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function init() {
  document.body.appendChild(canvas);

  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.translate(canvas.width / 2, canvas.height / 2);

  w
  .registerComponent(Transform)
  .registerComponent(Appearance)
  .registerComponent(Kinematics)
  .registerSystem(MovementSystem)
  .registerSystem(RenderSystem);

  let e = w.createEntity();
  w.EntityManager.addComponents(e, [Appearance]);

  for (let i = 0; i < 10000; i++) {
    // instantiate 10000 entities with the same components as the first entity, meaning any changes to the appearance will apply to all of these entities
    let e1 = w.EntityManager.instantiate(e);
    // adding Transform and Kinematics components individually to each of the other entity so they can move freely
    w.EntityManager.addComponents(e1, [Transform, Kinematics]);
  }

  w.init();
}

var past = 0;
function run() {
  let now = performance.now();
  let dt = (now - past) / 1000;
  w.run(dt);
  past = now;
  requestAnimationFrame(run);
}

init();
run();