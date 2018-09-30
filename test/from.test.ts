import { fromDom, fromEmitter } from '../src/from'

const domMock = ({
  addEventListener(type: any, listener: any) {
    Promise.resolve().then(() => {
      listener(1)
      listener(2)
    })
  },
} as any) as EventTarget

it('handles listeners', async () => {
  const it = fromDom('click', domMock)
  const done = false
  expect(await Promise.all([it.next(), it.next()])).toEqual([
    { done, value: 1 },
    { done, value: 2 },
  ])
})

const emitterMock = ({
  on(type: any, listener: any) {
    Promise.resolve().then(() => {
      listener(1)
      listener(2)
    })
  },
} as any) as NodeJS.EventEmitter

it('handles emitters', async () => {
  const it = fromEmitter('click', emitterMock)
  const done = false
  expect(await Promise.all([it.next(), it.next()])).toEqual([
    { done, value: 1 },
    { done, value: 2 },
  ])
})
