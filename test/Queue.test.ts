import Queue from '../src/Queue';

describe(`Queue`, () => {
  it('constructs', () => {
    const q = new Queue();
    expect(q).toBeInstanceOf(Queue);
  });

  it('circulates with a limit', () => {
    const q = new Queue(2);
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    expect(q.dequeue()).toBe(2);
    expect(q.dequeue()).toBe(3);
    expect(q.dequeue()).toBe(undefined);
    expect(q.length).toBe(0);
  });

  it('empty returns undefined', () => {
    const q = new Queue();
    expect(q.dequeue()).toBe(undefined);
  });

  it(`doesn't circulate without a limit`, () => {
    const q = new Queue();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    expect(q.dequeue()).toBe(1);
  });

  it(`clears`, () => {
    const q = new Queue();
    q.enqueue(1);
    q.enqueue(2);
    q.clear();
    expect(q.length).toBe(0);
    expect(q.dequeue()).toBe(undefined);
  });

  it(`foreaches`, () => {
    const q = new Queue();
    q.enqueue(1);
    q.enqueue(2);
    let n = 0;
    q.forEach(() => void (n += 1));
    expect(n).toBe(2);
  });
});
