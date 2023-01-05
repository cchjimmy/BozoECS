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

class MovementSystem extends BozoECS.System {
  init() {
    this.forEach([Transform, Kinematics], (T, K) => {
      this.randomizeVelocityAndPosition(K.velocity, T.position);
      K.angularSpeed = randomMinMax(-0.1, 0.1);
    })
  }
  randomizeVelocityAndPosition(v, p) {
    let maxSpeed = 100;
    v.x = (Math.random() - 0.5) * maxSpeed;
    v.y = (Math.random() - 0.5) * maxSpeed;
    p.x = (Math.random() - 0.5) * canvas.width;
    p.y = (Math.random() - 0.5) * canvas.height;
    if (mouseDown) {
      p.x = mousePos.x;
      p.y = mousePos.y;
    }
  }
  run(args) {
    let dt = args[0];
    this.forEach([Transform, Kinematics], (T, K) => {
      T.position.x += (K.velocity.x += K.acceleration.x) * dt;
      T.position.y += (K.velocity.y += K.acceleration.y) * dt;

      if (T.position.x > canvas.width / 2 || T.position.x < -canvas.width / 2 || T.position.y > canvas.height / 2 || T.position.y < -canvas.height / 2) {
        this.randomizeVelocityAndPosition(K.velocity, T.position);
      };

      T.rotation += K.angularSpeed;
    });
  }
}

class RenderSystem extends BozoECS.System {
  init() {
    this.forEach([Transform, Appearance], (T, A) => {
      T.scale.x = randomMinMax(20, 50);
      T.scale.y = randomMinMax(20, 50);
      A.color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
    })
  }
  run() {
    ctx.fillStyle = '#133337';
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

    this.forEach([Transform, Appearance], (T, A) => {
      drawRect(T.position.x, T.position.y, T.scale.x, T.scale.y, T.rotation, A.color);
    })

    function drawRect(x, y, w, h, r, color) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.translate(Math.floor(x), Math.floor(-y));
      ctx.rotate(r);
      ctx.scale(w, h);
      ctx.fillRect(-0.5, -0.5, 1, 1);
      ctx.restore();
    }
  }
}

function randomMinMax(min, max) {
  return Math.random() * (max - min) + min;
}

const w = new BozoECS.World;
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const fps = document.querySelector('span');
const numOfEntities = 600;
var mousePos = {
  x: 0,
  y: 0
}
var mouseDown = false;

function init() {
  document.body.appendChild(canvas);

  resizeCanvas();

  w
    .registerComponents([Transform, Kinematics, Appearance])
    .registerSystems([MovementSystem, RenderSystem]);

  for (let i = 0; i < numOfEntities; i++) {
    w.EntityManager.addComponents(w.createEntity(), [Transform, Kinematics, Appearance]);
  }

  console.log(w);
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
    let clientX = e.clientX || e.touches[0]?.clientX;
    let clientY = e.clientY || e.touches[0]?.clientY;
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
  fps.innerText = (1 / dt).toFixed(0);
  requestAnimationFrame(run);
}

init();
run();