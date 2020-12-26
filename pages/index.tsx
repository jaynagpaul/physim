import 'water.css/out/water.min.css';
import { useState, useEffect } from 'react';
const totW = 800;
const totH = 600;
const circleRadius = 8;

// hack to give runSimulation access
let globalIsPaused = false;
let restartSim = false;

// pixels per meter
// TODO: dynamically calculatepixels per meter based on total travel
const PPM = 4;

function Input(props) {
  return (
    <>
      <label htmlFor={props.id}>
        {props.title} ({props.suffix})
      </label>
      <input
        id={props.id}
        type="number"
        value={props.value}
        onChange={(e) => props.setValue(parseFloat(e.target.value))}
      />
    </>
  );
}

export default function Simulation() {
  const [height, setHeight] = useState(30);
  const [vi, setVi] = useState(40);
  const [theta, setTheta] = useState(60);

  const [time, setTime] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: height });
  const [vel, setVel] = useState({
    x: vi * Math.cos((theta * Math.PI) / 180),
    y: vi * Math.sin((theta * Math.PI) / 180),
  });
  let netVel = Math.sqrt(Math.pow(vel.x, 2) + Math.pow(vel.y, 2));

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const PRECISION = 3;
  globalIsPaused = isPaused;
  restartSim = false;
  useKeypress('Enter', async () => {
    if (!isRunning) {
      setIsRunning(true);
      document.getElementById('run').setAttribute('disabled', 'disabled');
      await runSimulation(height, vi, theta, setTime, setPos, setVel);
      document.getElementById('run').removeAttribute('disabled');
      setIsRunning(false);
    }
  });

  return (
    <>
      <h1>Jay Nagpaul Projectile Motion Simulation</h1>
      <Input
        id="height"
        title="Height"
        value={height}
        setValue={setHeight}
        suffix="m"
      />
      <Input
        id="vi"
        title="Initial Velocity"
        value={vi}
        setValue={setVi}
        suffix="m/s"
      />
      <Input
        id="theta"
        title="Angle"
        value={theta}
        setValue={setTheta}
        suffix="°"
      />
      <button
        id="run"
        onClick={async (e) => {
          if (isPaused) {
            setIsPaused(false);
            return;
          } else if (isRunning) {
            setIsPaused(true);
          } else {
            setIsRunning(true);
            await runSimulation(height, vi, theta, setTime, setPos, setVel);
            document.getElementById('run').removeAttribute('disabled');
            setIsRunning(false);
          }
        }}
      >
        {isPaused && 'Start'}
        {isRunning && !isPaused && 'Pause'}
        {!isRunning && !isPaused && 'Start'}
      </button>

      <button
        id="restart"
        onClick={(e) => {
          restartSim = true;
        }}
      >
        Restart
      </button>
      <div style={{ textAlign: 'center' }}>
        <canvas
          id="SimCanvas"
          width="800"
          height="600"
          style={{ border: '1px solid gray' }}
        ></canvas>
      </div>
      <table>
        <thead>
          <tr>
            <th>Variable</th> <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Time</td> <td>{time.toPrecision(PRECISION)} s</td>
          </tr>
          <tr>
            <td>X</td> <td>{(pos.x || 0).toPrecision(PRECISION)} m</td>
          </tr>
          <tr>
            <td>Y</td> <td>{pos.y.toPrecision(PRECISION)} m</td>
          </tr>
          <tr>
            <td>X Velocity</td> <td>{vel.x.toPrecision(PRECISION)} m/s</td>
          </tr>
          <tr>
            <td>Y Velocity</td> <td>{vel.y.toPrecision(PRECISION)} m/s</td>
          </tr>
          <tr>
            <td>Net Velocity</td> <td>{netVel.toPrecision(PRECISION)} m/s</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

async function runSimulation(
  height,
  initialVelocity,
  theta,
  setTime,
  setPos,
  setVel
) {
  // default vars
  let posi = { x: 0, y: height };
  let vi = {
    x: initialVelocity * Math.cos((theta * Math.PI) / 180),
    y: initialVelocity * Math.sin((theta * Math.PI) / 180),
  };

  let canvas = document.getElementById('SimCanvas') as HTMLCanvasElement;
  let ctx = canvas.getContext('2d');
  fixBlurryness(canvas, ctx);

  let t = 0;
  while (getY(posi.y, vi.y, t) > 0) {
    if (restartSim) {
      repaint(ctx, mToPx(posi.x), mToPx(posi.y, true));
      return;
    }
    if (globalIsPaused) {
      await sleep(100);
      continue;
    }

    var xf = getX(posi.x, vi.x, t);
    var yf = getY(posi.y, vi.y, t);

    repaint(ctx, mToPx(xf), mToPx(yf, true));
    setPos({ x: xf, y: yf });
    setTime(t);
    setVel({ x: vi.x, y: vi.y + -9.8 * t });
    t += 0.01;
    await sleep(1);
  }
  setPos({ x: xf, y: 0 });
}

export function useKeypress(key, action) {
  useEffect(() => {
    function onKeyup(e) {
      if (e.key === key) action();
    }
    window.addEventListener('keyup', onKeyup);
    return () => window.removeEventListener('keyup', onKeyup);
  }, []);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

function mToPx(m: number, y = false): number {
  let px = m * PPM;
  if (y) return 600 - px;
  return px;
}

// physics magic
function getX(xi, vix, t) {
  return vix * t + xi;
}

function getY(yi, viy, t) {
  const a = -9.8;
  return (1 / 2) * a * Math.pow(t, 2) + viy * t + yi;
}

function repaint(ctx: CanvasRenderingContext2D, x, y) {
  // clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, totW, totH);

  circle(ctx, x, y);
}

function circle(ctx: CanvasRenderingContext2D, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, circleRadius, 0, 2 * Math.PI, false);
  ctx.fillStyle = 'green';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#003300';
  ctx.stroke();
}

// https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
function fixBlurryness(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  // Set display size (css pixels).
  canvas.style.width = 800 + 'px';
  canvas.style.height = 600 + 'px';

  // Set actual size in memory (scaled to account for extra pixel density).
  var scale = window.devicePixelRatio; // Change to 1 on retina screens to see blurry canvas.
  canvas.width = Math.floor(800 * scale);
  canvas.height = Math.floor(600 * scale);

  // Normalize coordinate system to use css pixels.
  ctx.scale(scale, scale);
}
