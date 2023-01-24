import LinkedQueue from './LinkedQueue';

describe('LinkedQueue', () => {
  it('constructs', () => {
    const q = new LinkedQueue();
    expect(q).toBeInstanceOf(LinkedQueue);
  });

  it('circulates with a limit of one', () => {
    const q = new LinkedQueue(1);
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    expect(q.length).toBe(1);
    expect(q.dequeue()).toBe(3);
    expect(q.length).toBe(0);
  });

  it('circulates with a limit of two', () => {
    const q = new LinkedQueue(2);
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    q.enqueue(4);
    expect(q.length).toBe(2);
    expect(q.dequeue()).toBe(3);
    expect(q.length).toBe(1);
    expect(q.dequeue()).toBe(4);
    expect(q.length).toBe(0);
  });

  it('empty throws', () => {
    const q = new LinkedQueue();
    expect(() => q.dequeue()).toThrow();
  });

  it(`doesn't circulate without a limit`, () => {
    const q = new LinkedQueue();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    expect(q.dequeue()).toBe(1);
  });

  it(`clears`, () => {
    const q = new LinkedQueue();
    q.enqueue(1);
    q.enqueue(2);
    q.clear();
    expect(q.length).toBe(0);
    expect(() => q.dequeue()).toThrow();
  });

  it(`foreaches`, () => {
    const q = new LinkedQueue();
    q.enqueue(1);
    q.enqueue(2);
    let n = 0;
    q.forEach(() => void (n += 1));
    expect(n).toBe(2);
  });
});
