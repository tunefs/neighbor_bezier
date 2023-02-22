const add = (a, b) => [a[0] + b[0], a[1] + b[1]];

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];

const mul = (a, v) => a.map(i => i * v);

const div = (a, v) => a.map(i => i / v);

const dot = (a, b) => a[0] * b[0] + a[1] * b[1];

const norm_squared = a => dot(a, a);

const completion = (t, bz) => {
  const t_ = 1 - t;
  return add(add(add(mul(bz[0], t_ * t_ * t_),
                     mul(bz[1], 3 * t_ * t_ * t)),
                     mul(bz[2], 3 * t_ * t * t)),
                     mul(bz[3], t * t * t));
};

const differential = (t, bz) => {
  const t_ = 1 - t;
  return add(add(mul(sub(bz[1], bz[0]), 3 * t_ * t_),
                 mul(sub(bz[2], bz[1]), 6 * t_ * t)),
                 mul(sub(bz[3], bz[2]), 3 * t * t));
};

const split_bezier = bz => {
  const center = completion(0.5, bz);
  return [
    [
      bz[0],
      div(add(bz[0], bz[1]), 2),
      div(add(add(bz[0], mul(bz[1], 2)), bz[2]), 4),
      center
    ],
    [
      center,
      div(add(add(bz[1], mul(bz[2], 2)), bz[3]), 4),
      div(add(bz[2], bz[3]), 2),
      bz[3]
    ]
  ];
};

const diff2_to_line = (line, p) => {
  const ps = sub(line[0], p);
  const [a, b] = sub(line[1], line[0]);
  const n2 = norm_squared([a, b]);
  const tt = -(a * ps[0] + b * ps[1]);
  if (tt < 0)
    return norm_squared(ps);
  else if (tt > n2)
    return norm_squared(sub(line[1], p));
  const f1 = a * ps[1] - b * ps[0];
  return f1 * f1 / n2;
};
const diff2_to_polygon = (bz, p) => {
  return Math.min(
    diff2_to_line([bz[0], bz[1]], p),
    diff2_to_line([bz[1], bz[2]], p),
    diff2_to_line([bz[2], bz[3]], p),
    diff2_to_line([bz[3], bz[0]], p)
  );
};

const done_or_recursive = (bz, p, t0, t1) => {
  const n2 = norm_squared(sub(bz[3], bz[0]));
  if (n2 < 1 * 1)
    return (t0 + t1) * 0.5;
  return neighbor_bezier(bz, p, t0, t1);
};

const neighbor_bezier = (bz, p, t0, t1) => {
  const splitbz = split_bezier(bz);
  const d0 = diff2_to_polygon(splitbz[0], p);
  const d1 = diff2_to_polygon(splitbz[1], p);
  const tcenter = (t0 + t1) * 0.5;
  return d0 < d1
    ? done_or_recursive(splitbz[0], p, t0, tcenter)
    : done_or_recursive(splitbz[1], p, tcenter, t1);
};

const bezier = [
  [ 50,  50],
  [ 50, 300],
  [550, 300],
  [550, 550]
];

const draw = ctx => {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(600, 0);
  ctx.lineTo(600, 600);
  ctx.lineTo(0, 600);
  ctx.lineTo(0, 0);
  ctx.moveTo(...bezier[0]);
  ctx.bezierCurveTo(...bezier[1], ...bezier[2], ...bezier[3]);
  ctx.stroke();
};

const redraw = (ctx, p) => {
  ctx.clearRect(0, 0, 600, 600);
  draw(ctx);
  const t = neighbor_bezier(bezier, p, 0, 1);
  const pp = completion(t, bezier);
  ctx.beginPath();
  ctx.moveTo(...p);
  ctx.lineTo(...pp);
  ctx.stroke();

  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(...pp, 3, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = 'black';
  ctx.font = '20px';
  ctx.fillText(`${Math.floor(pp[0])} / ${Math.floor(pp[1])}`, 500, 20);
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const getxy = e => {
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return [x, y];
};

let pressed = false;

const onMouseDown = e => {
  pressed = true;
  const p = getxy(e);
  redraw(ctx, p);
};

const onMouseUp = e => {
  pressed = false;
};

const onMouseOut = e => {
  pressed = false;
};

const onMouseMove = e => {
  if (pressed) {
    const p = getxy(e);
    redraw(ctx, p);
  }
};

canvas.addEventListener('mousedown', onMouseDown, false);
canvas.addEventListener('mouseup', onMouseUp, false);
canvas.addEventListener('mouseout', onMouseOut, false);
canvas.addEventListener('mousemove', onMouseMove, false);
draw(ctx);

// vim: set expandtab shiftwidth=2:
