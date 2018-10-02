const Balancer = require(`../dist/lib/Balancer`).default

const iterations = 1e5
const now = () => process.hrtime.bigint()

const test = (q, f, n, label) => {
  const t0 = now()
  for (let i = 0; i < n; i += 1) {
    f(i, q)
  }
  const delta = now() - t0
  console.log(delta, label)
  return delta
}

const t1 = test(new Balancer(), (n, q) => {
  q.push(n)
  if (n % 10 === 0) q.next()
}, iterations, `Balancer`)

const t2 = test([], (n, q) => {
  q.push(n)
  if (n % 10 === 0) q.shift()
}, iterations, `Array.shift()`)

console.log(`${t2 / t1}x`)
