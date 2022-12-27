import BozoECS from "./BozoECS.js";

class Transform extends BozoECS.Component {
  position = {
    x: 0,
    y: 0
  }
  rotation = 0
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
  angularSpeed = 0;
}

class Appearance extends BozoECS.Component {
  color = 'white';
}

class Other extends BozoECS.Component { }

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
      K.angularSpeed = Math.random();
    }
  }
  run(args) {
    this.queryAll([Transform, Kinematics]);
    let dt = args[0];
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let T = this.queries.Transform[i];
      let p = T.position;
      let K = this.queries.Kinematics[i];

      p.x += (K.velocity.x += K.acceleration.x) * dt;
      p.y += (K.velocity.y += K.acceleration.y) * dt;

      if (p.x > canvas.width / 2 || p.x < -canvas.width / 2 || p.y > canvas.height / 2 || p.y < -canvas.height / 2) {

        p.x = (Math.random() - 0.5) * canvas.width;
        p.y = (Math.random() - 0.5) * canvas.height;

        if (mouseDown) {
          p.x = mousePos.x;
          p.y = -mousePos.y;
        }
      };

      T.rotation += K.angularSpeed;
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

    setInterval(() => {
      this.queryOnly([Appearance]);
      // due to instantiation of entity, only need to change the color of the one appearance component to change all other clones' colors
      this.queries.Appearance[0].color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
      this.queries.Appearance[1].color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    }, 5000)

  }
  run() {
    ctx.fillStyle = 'black';
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    this.queryOnly([Kinematics, Transform, Appearance]);
    let A = this.queries.Appearance[0];
    ctx.fillStyle = A.color;
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let T = this.queries.Transform[i];
      let p = T.position;
      let s = T.scale;

      ctx.save();
      ctx.translate(Math.floor(p.x), Math.floor(-p.y));
      ctx.rotate(T.rotation);
      ctx.fillRect(- s.x / 2, - s.y / 2, s.x, s.y);
      ctx.restore();
    }

    this.queryOnly([Kinematics, Transform, Appearance, Other]);
    A = this.queries.Appearance[0];
    ctx.fillStyle = A.color;
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let T = this.queries.Transform[i];
      let p = T.position;
      let s = T.scale;

      ctx.save();
      ctx.translate(Math.floor(p.x), Math.floor(-p.y));
      ctx.rotate(T.rotation);
      ctx.fillRect(- s.x / 2, - s.y / 2, s.x, s.y);
      ctx.restore();
    }
  }
}

const w = new BozoECS.World;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
var mousePos = {
  x: 0,
  y: 0
}
var mouseDown = false;

function init() {
  document.body.appendChild(canvas);

  canvas.width = innerWidth;
  canvas.height = innerHeight;
  ctx.translate(canvas.width / 2, canvas.height / 2);

  w
    .registerComponent(Transform)
    .registerComponent(Appearance)
    .registerComponent(Kinematics)
    .registerComponent(Other)
    .registerSystem(MovementSystem)
    .registerSystem(RenderSystem);

  let e = w.createEntity();
  w.EntityManager.addComponents(e, [Appearance]);

  let e1 = w.createEntity();
  w.EntityManager.addComponents(e1, [Appearance]);

  for (let i = 0; i < 2500; i++) {
    // instantiate entities with the same components as the first entity, meaning any changes to the appearance will apply to all of these entities
    let entity = w.EntityManager.instantiate(e);
    // adding Transform and Kinematics components individually to each of the other entity so they can move freely
    w.EntityManager.addComponents(entity, [Transform, Kinematics]);
  }

  for (let i = 0; i < 2500; i++) {
    let entity = w.EntityManager.instantiate(e1);
    w.EntityManager.addComponents(entity, [Transform, Kinematics, Other]);
  }

  w.init();

  document.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.translate(canvas.width / 2, canvas.height / 2);
  }

  document.addEventListener('mousemove', handleMouseMove);

  document.addEventListener('mousedown', handleMousePress);

  document.addEventListener('mouseup', handleMousePress);

  function handleMousePress() {
    mouseDown = !mouseDown;
  }

  function handleMouseMove(e) {
    mousePos.x = e.clientX - canvas.width / 2;
    mousePos.y = e.clientY - canvas.height / 2;
  }
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