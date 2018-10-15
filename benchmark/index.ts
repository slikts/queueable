import Channel from "../src/adapters/Channel";

const iterations = 1e5;
const now = () => (process.hrtime as any).bigint();

const test = (q: any, f: any, n: any, label: any) => {
  const t0 = now();
  for (let i = 0; i < n; i += 1) {
    f(i, q);
  }
  const delta = now() - t0;
  console.log(delta, label);
  return delta;
};

const t1 = test(new Channel(), (n: any, q: any) => {
  q.push(n);
  if (n % 10 === 0) q.next();
}, iterations, `Balancer`);

const t2 = test([], (n: any, q: any) => {
  q.push(n);
  if (n % 10 === 0) q.shift();
}, iterations, `Array.shift()`);

console.log(`${Number(t2) / Number(t1)}x`);
