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
    y: -9.81
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
      this.randomizeVelocityAndPosition(K.velocity, p);
      K.angularSpeed = Math.random();
    }
  }
  randomizeVelocityAndPosition(v, p) {
    v.x = Math.random() * 100 - 50;
    v.y = Math.random() * 100 - 50;
    p.x = (Math.random() - 0.5) * canvas.width;
    p.y = (Math.random() - 0.5) * canvas.height;
    if (mouseDown) {
      p.x = mousePos.x;
      p.y = mousePos.y;
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
        this.randomizeVelocityAndPosition(K.velocity, p);
      };

      T.rotation += K.angularSpeed;
    }
  }
}

class RenderSystem extends BozoECS.System {
  init() {
    this.queryAny([Transform]);
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let T = this.queries.Transform[i];
      T.scale.x = Math.random() * 10;
      T.scale.y = Math.random() * 10;
    }

    this.randomizeColors();

    setInterval(() => this.randomizeColors(), 5000)
  }
  randomizeColors() {
    this.queryOnly([Appearance]);
    for (let i = 0; i < this.queries.Appearance.length; i++) {
      this.queries.Appearance[i].color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    }
  }
  run() {
    ctx.fillStyle = 'black';
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    this.queryOnly([Appearance]);
    let colors = [];
    for (let i = 0; i < this.queries.Appearance.length; i++) {
      colors.push(this.queries.Appearance[i].color);
    }

    this.queryOnly([Kinematics, Transform]);
    ctx.fillStyle = colors[0];
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let T = this.queries.Transform[i];
      let p = T.position;
      let s = T.scale;

      drawRect(-p.x, -p.y, s.x, s.y, T.rotation);
    }

    this.queryAny([Other]);
    ctx.fillStyle = colors[1];
    for (let i = 0; i < this.queries.Transform.length; i++) {
      let T = this.queries.Transform[i];
      let p = T.position;
      let s = T.scale;

      drawRect(p.x, p.y, s.x, s.y, T.rotation);
    }

    function drawRect(x, y, w, h, r) {
      ctx.save();
      ctx.translate(Math.floor(x), Math.floor(-y));
      ctx.rotate(r);
      ctx.fillRect(-w / 2, -h / 2, w, h);
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

  resizeCanvas();

  w
    .registerComponents([Transform, Kinematics, Other, Appearance])
    .registerSystems([MovementSystem, RenderSystem]);

  const numOfEntities = 1000;

  for (let i = 0; i < 2; i++) {
    w.EntityManager.addComponents(w.createEntity(), [Appearance]);
  }

  for (let i = 0; i < numOfEntities / 2; i++) {
    // adding Transform and Kinematics components individually to each entity so they can move freely
    w.EntityManager.addComponents(w.createEntity(), [Transform, Kinematics]);
  }

  for (let i = 0; i < numOfEntities / 2; i++) {
    // added Other component to distinguish between the other half of the entities
    w.EntityManager.addComponents(w.createEntity(), [Transform, Kinematics, Other]);
  }

  w.init();

  window.onresize = resizeCanvas;
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.translate(canvas.width / 2, canvas.height / 2);
  }

  // mouse support
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mousedown', handleMousePress);
  canvas.addEventListener('mouseup', handleMousePress);

  // touch support
  canvas.addEventListener('touchmove', handleMouseMove);
  canvas.addEventListener('touchstart', handleMousePress);
  canvas.addEventListener('touchend', handleMousePress);

  function handleMousePress(e) {
    mouseDown = !mouseDown;
    handleMouseMove(e);
  }

  function handleMouseMove(e) {
    let clientX = e?.clientX || e?.touches[0]?.clientX;
    let clientY = e?.clientY || e?.touches[0]?.clientY;
    mousePos.x = clientX - canvas.width / 2;
    mousePos.y = -(clientY - canvas.height / 2);
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