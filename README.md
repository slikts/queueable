<h1 align="center"><img src="https://i.imgur.com/Ks7oik8.png" width="437" height="180" alt="Queueable"></h1>

[![License](https://img.shields.io/github/license/slikts/queueable.svg)](https://github.com/slikts/queueable)
[![Build Status](https://img.shields.io/travis/slikts/queueable/master.svg)](https://travis-ci.org/slikts/queueable)
[![Coverage Status](https://coveralls.io/repos/github/slikts/queueable/badge.svg?branch=master)](https://coveralls.io/github/slikts/queueable?branch=master)
[![Latest Stable Version](https://img.shields.io/npm/v/queueable.svg)](https://www.npmjs.com/package/queueable) [![Greenkeeper badge](https://badges.greenkeeper.io/slikts/queueable.svg)](https://greenkeeper.io/)
[![Code Climate](https://codeclimate.com/github/slikts/queueable.svg)](https://codeclimate.com/github/slikts/queueable)
[![Dependency Status](https://david-dm.org/slikts/queueable.svg)](https://david-dm.org/slikts/queueable)

A library for converting push-based asynchronous streams like node streams or EventTarget to pull-based streams implementing the [ES2018 asynchronous iteration protocols][async].

Well-typed, well-tested and [lightweight].

## Overview

Asynchronous iteration is a new native feature of JavaScript for modeling streams of values in time. To give a rough analogy, asynchronous iteration is to event emitters as promises are to callbacks. The problem this library helps to solve is that iterables have a pull-based interface, while sources like event emitters are push-based, and converting between the two kinds of providers involves buffering the difference between pushes and pulls until it can be settled. This library provides push-pull adapters with buffering strategies suitable for different use cases.

Queueable is intended both for library authors and consumers. Library authors can implement a standard streaming interface for interoperability, and consumers can adapt not-yet interoperable sources to leverage tools like [IxJS] and a declarative approach to streams. 

Asynchronous iteration together with this library could be seen as a very simplified and more general version of the [Streams API][streams].

See slides about [Why Async Iterators Matter][slides] for a more general introduction to the topic.

## Installation

### npm

```
npm install --save queueable
```

### CDN

https://unpkg.com/queueable/dist/queueable.umd.js




## Adapters

### [`Balancer`][balancer]

Push-pull adapter backed by unbounded linked list queues (to avoid array reindexing) with optional circular buffering. 

Circular buffering works like a safety valve by discarding the oldest item in the queue when the limit is reached.

#### Methods

* `static constructor(pushLimit = 0, pullLimit = 0)`
* `static fromDom(eventType, target[, options])`
* `static fromEmitter(eventType, emitter)`
* `push(value)`
  Push a value to the queue; returns a promise that resolves when the value is pulled.
* `wrap([onReturn])`
  Return an iterable iterator with only the standard methods.

#### Examples

##### Implementing an asynchronous iterable iterator, pushing values to it and then consuming with `for-await-of`
```js
import { Balancer } from "queueable";

const queue = new Balancer();
queue.push(1);
queue.push(2);
queue.push(3);
queue.push(4, true); // the second argument closes the iterator when its turn is reached

// for-await-of uses the async iterable protocol to consume the queue sequentially
for await (const n of queue) {
  console.log(n); // logs 1, 2, 3
  // doesn't log 4, because for-await-of ignores the value of a closing result
}
// the loop ends after it reaches a result where the iterator is closed
```
##### Pulling results and waiting for values to be pushed
```js
const queue = new Balancer();
const result = queue.next(); // a promise of an iterator result
result.then(({ value }) => { console.log(value); });
queue.push("hello"); // "hello" is logged in the next microtick
```
##### Hiding the adapter methods from consumers with `wrap()`

The iterables should be one-way for end-users, meaning that the consumer should only be able to request values, not push them, because the iterables could be shared. The `wrap([onReturn])` method returns an object with only the standard iterable methods.

This example adapts an EventTarget in the same way as the `fromDom()` method.

```js
const adapter = new Balancer();
const listener = event => void producer.push(event);
eventTarget.addEventListener('click', listener);
const clickIterable = adapter.wrap(() => eventTarget.removeEventListener(type, listener));
clickIterable.next(); // -> a promise of the next click event
clickIterable.return(); // closes the iterable
```

##### Tracking when pushed values are pulled

The `push()` methods for the adapters return the same promise as the `next()` methods for the iterators, so it's possible for the provider to track when the pushed value is used to resolve a pull.
```js
const queue = new Balancer();
const tracking = queue.push(123);
tracking.then(() => { console.log('value was pulled'); });
const result = queue.next(); // pulling the next result resolves `tracking` promise
result === tracking; // -> true
await result === await tracking; // -> true
```

### [`LastValue`][lastvalue]

An adapter that only buffers the last value pushed and returns the same promise of the last pushed value for each request. It's suitable for use cases where the stream should be processed close to real-time and it's not important to process every event, like with animation frames or mouse move events. Always returning the last value also makes it efficient for multicasting.

#### Methods

* `static constructor()`
* `static fromDom(eventType, target[, options])`
* `static fromEmitter(eventType, emitter)`
* `push(value)`
  Overwrite the previously pushed value.
* `wrap([onReturn])`
  Return an iterable iterator with only the standard methods.

#### Examples

##### Converting mouse move events into a stream
```js
import { LastValue } from "queueable";
const moveIterable = LastValue.fromDom('click', eventTarget);
for await (const moveEvent of moveIterable) {
  console.log(moveEvent); // logs MouseEvent objects each time the mouse is clicked
}
// the event listener can be removed and stream closed with .return()
moveIterable.return();
```
### `wrapRequest(request[, onReturn])`

The `wrapRequest()` method converts singular callbacks to an asynchronous iterable and provides an optional hook for cleanup when the `return()` is called.

#### Examples

##### Adapting `requestAnimationFrame()`
```js
const { wrapRequest } = "queueable";
const frames = wrapRequest(window.requestAnimationFrame, window.cancelAnimationFrame);
for await (const timestamp of frames) {
  console.log(timestamp); // logs frame timestamps sequentially
}
```
##### Creating an iterable interval with `setTimeout()`
```js
const makeInterval = delay => wrapRequest(callback => window.setTimeout(callback, delay), window.clearTimeout);
const interval = makeInterval(100); // creates the interval but does nothing until .next() is invoked
let i = 0;
for await (const _ of interval) {
  i += 1;
  if (i === 10) {
    interval.return(); // stops the interval
  }
}
```

### [`Multicast`][multicast]
The same concept as `Subject` in observables; allows having zero or more subscribers that each receive the pushed values. The pushed values are discarded if there are no subscribers. Uses the `Balancer` adapters internally.

```js
import { Multicast } from "queueable";

const queue = new Multicast();
// subscribe two iterators to receive results
const subscriberA = queue[Symbol.asyncIterator]();
const subscriberB = queue[Symbol.asyncIterator](); 
queue.push(123);
const results = Promise.all([subscriberA.next(), subscriberB.next()]);
console.log(await results); // logs [{ value: 123, done: false }, { value: 123, done: false }]
```
### Basic stream transformations
The library also includes the basic `map()`, `filter()` and `reduce()` combinators.
```js
// implement an async iterable with a generator
const sequence = async function*() {
  yield* [1, 2, 3];
}
const mapped = map(n => n * 2, sequence());
for await (const n of mapped) {
  console.log(n); // logs 2, 4, 6
}
```

## Types

To make TypeScript know about the asnyc iterable types (`AsyncIterable<T>`, `AsyncIterator<T>`, `AsyncIterableiterator<T>`), the TypeScript `--lib` [compiler option][options] should include `"esnext.asynciterable"` or `"esnext"`.

## Alternatives

* [callback-to-async-iterator]

## Tools for async iteration

* [IxJS] – supports various combinators for async iterables
* [Symbola] – protocol extension based combinators for async iterables
* [Axax] – async iteration helpers
* [iterall] – iteration utilities
* [iter-tools] – iteration helpers

[Symbola]: https://github.com/slikts/symbola
[IxJS]: https://github.com/ReactiveX/IxJS#asynciterable
[callback-to-async-iterator]: https://github.com/withspectrum/callback-to-async-iterator
[async]: http://2ality.com/2016/10/asynchronous-iteration.html
[options]: https://www.typescriptlang.org/docs/handbook/compiler-options.html
[lightweight]: https://bundlephobia.com/result?p=queueable
[axax]: https://github.com/jamiemccrindle/axax
[iterall]: https://github.com/leebyron/iterall
[iter-tools]: https://github.com/sithmel/iter-tools
[streams]: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
[balancer]: https://slikts.github.io/queueable/classes/balancer.html
[multicast]: https://slikts.github.io/queueable/classes/multicast.html
[lastvalue]: https://slikts.github.io/queueable/classes/lastvalue.html
[slides]: https://docs.google.com/presentation/d/1r2V1sLG8JSSk8txiLh4wfTkom-BoOsk52FgPBy8o3RM
