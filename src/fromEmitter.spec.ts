import LastResult from './adapters/LastResult';
import Channel from './adapters/Channel';

describe('Channel.fromEmitter', () => {
  it('handles emitters', async () => {
    const it = Channel.fromEmitter('click', {
      addListener(type: any, listener: any) {
        Promise.resolve().then(() => {
          listener(1);
          listener(2);
        });
      },
    } as any as NodeJS.EventEmitter);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 2 },
    ]);
  });
})

describe('LastResult.fromEmitter', () => {
  it('handles emitters', async () => {
    const it = LastResult.fromEmitter('click', {
      addListener(type: any, listener: any) {
        Promise.resolve().then(() => {
          listener(1);
          listener(2);
        });
      },
    } as any as NodeJS.EventEmitter);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 1 },
    ]);
  });

  it('unregisters listeners', async () => {
    let a = 0;
    const it = LastResult.fromEmitter('click', {
      addListener() {},
      removeListener() {
        a = 1;
      },
    } as any as NodeJS.EventEmitter);
    it.return && (await it.return());
    expect(a).toBe(1);
  });
});
