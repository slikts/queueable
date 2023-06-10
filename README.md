<h1 align="center"><a href="https://github.com/slikts/queueable"><img src="https://raw.githubusercontent.com/slikts/queueable/master/logo.svg?sanitize=true" width="450" height="190" alt="Queueable"></a></h1>

<p align="center"><a href="https://github.com/slikts/queueable"><img src="https://img.shields.io/github/license/slikts/queueable.svg" alt="License"></a>
<a href="https://travis-ci.org/slikts/queueable"><img src="https://img.shields.io/travis/slikts/queueable/master.svg" alt="Build Status"></a>
<a href="https://coveralls.io/github/slikts/queueable?branch=master"><img src="https://coveralls.io/repos/github/slikts/queueable/badge.svg?branch=master" alt="Coverage Status"></a>
<a href="https://www.npmjs.com/package/queueable"><img src="https://img.shields.io/npm/v/queueable.svg" alt="Latest Stable Version"></a>
<a href="https://codeclimate.com/github/slikts/queueable"><img src="https://codeclimate.com/github/slikts/queueable.svg" alt="Code Climate"></a></p>

A library for converting push-based asynchronous streams like node streams or EventTarget to pull-based streams implementing the [ES2018 asynchronous iteration protocols][async].

Well-typed, well-tested and [lightweight].

## Overview

Asynchronous iteration is a new native feature of JavaScript for modeling streams of values in time. To give a rough analogy, asynchronous iteration is to event emitters as promises are to callbacks. The problem this library helps to solve is that iterables have a pull-based interface, while sources like event emitters are push-based, and converting between the two kinds of providers involves buffering the difference between pushes and pulls until it can be settled. This library provides push-pull adapters with buffering strategies suitable for different use cases.

Queueable is intended both for library authors and consumers. Library authors can implement a standard streaming interface for interoperability, and consumers can adapt not-yet interoperable sources to leverage tools like [IxJS] and a declarative approach to streams.

### Similarity to Streams API and node streams

Asynchronous iteration together with this library could be seen as a lightweight version of the WHATWG [Streams API][streams]. Specifically, the adapters work like [identity transform streams][id]. Asynchronous iteration [has been added][streams-reader] to Streams API `ReadableStream`.

Node streams have [already implemented][node-streams] asynchronous iteration for reading.

The use-case for this library, given that there are more standard alternatives, is based on its small size. Older browsers and node versions don't implement the newer APIs, and including a polyfill for a large API can be prohibitive.

### Similarity to CSP channels

[Communicating sequential processes][csp] (CSP) is a concurrency model used in Go goroutines and [Clojure's core.async][core.async] that is based on message passing via channels, and it's been possible to express this model in JavaScript with ES6 generators, as shown by [js-csp]. Asynchronous iteration brings JavaScript closer to having first-class syntactical support of channels, as can be seen in this [demonstration of ping-pong][ping-pong] adapted from Go and js-csp using Queuable.

[csp]: https://en.wikipedia.org/wiki/Communicating_sequential_processes
[core.async]: https://clojure.org/news/2013/06/28/clojure-clore-async-channels

### Use cases

Sources of asynchronous data that are pull-based (are backpressurable; allow the consumer to control the rate at which it receives data) are trivial to adapt to asynchronous iterators using asynchronous generator functions. Such sources include event emitters that can be paused and resumed, and callback functions that are fired a single time, and functions that return promises.

Converting pull-based sources to asynchronous iterables is still made easier by the `wrapRequest` helper method provided by this library. For a demonstration, see `requestAnimationFrame` example (also showing IxJS usage) and implementing an example interval.

Sources that are not backpressurable can only be sampled by subscribing to them or unsubscribing, and examples of such sources are user events like mouse clicks. Users can't be paused, so this library takes care of buffering the events they generate until requested by the consumer. See mouse events demonstration.

<!--### How it works

generate-->

### Asynchronous iteration

See slides about [Why Asynchronous Iterators Matter][slides] for a more general introduction to the topic.

## Installation

```sh
npm install --save queueable
```

```sh
yarn add queueable
```

### CDN

https://unpkg.com/queueable/dist/queueable.umd.js

## Adapters

### [`Channel`][channel]

Push-pull adapter backed by unbounded linked list queues (to avoid array reindexing) with optional circular buffering.

Circular buffering works like a safety valve by discarding the oldest item in the queue when the limit is reached.

#### Methods

- `static constructor(pushLimit = 0, pullLimit = 0)`
- `static fromDom(eventType, target[, options])`
- `static fromEmitter(eventType, emitter)`
- `push(value, [done])`
  Push a value to the queue; returns a promise that resolves when the value is pulled.
- `wrap([onReturn])`
  Return an iterable iterator with only the standard methods.

#### Examples

##### Implementing an asynchronous iterable iterator, pushing values to it and then consuming with `for-await-of`

```js
import { Channel } from 'queueable';

const channel = new Channel();
channel.push(1);
channel.push(2);
channel.push(3);
channel.push(4, true); // the second argument closes the iterator when its turn is reached

// for-await-of uses the async iterable protocol to consume the queue sequentially
for await (const n of channel) {
  console.log(n); // logs 1, 2, 3
  // doesn't log 4, because for-await-of ignores the value of a closing result
}
// the loop ends after it reaches a result where the iterator is closed
```

##### Pulling results and waiting for values to be pushed

```js
const channel = new Channel();
const result = channel.next(); // a promise of an iterator result
result.then(({ value }) => {
  console.log(value);
});
channel.push('hello'); // "hello" is logged in the next microtick
```

##### Hiding the adapter methods from consumers with `wrap()`

The iterables should be one-way for end-users, meaning that the consumer should only be able to request values, not push them, because the iterables could be shared. The `wrap([onReturn])` method returns an object with only the standard iterable methods.

This example adapts an EventTarget in the same way as the `fromDom()` method.

```js
const channel = new Channel();
const listener = (event) => void channel.push(event);
eventTarget.addEventListener('click', listener);
const clickIterable = channel.wrap(() => eventTarget.removeEventListener(type, listener));
clickIterable.next(); // -> a promise of the next click event
clickIterable.return(); // closes the iterable
```

##### Tracking when pushed values are pulled

The `push()` methods for the adapters return the same promise as the `next()` methods for the iterators, so it's possible for the provider to track when the pushed value is used to resolve a pull.

```js
const channel = new Channel();
const tracking = channel.push(123);
tracking.then(() => {
  console.log('value was pulled');
});
const result = channel.next(); // pulling the next result resolves `tracking` promise
result === tracking; // -> true
(await result) === (await tracking); // -> true
```

### [`LastResult`][lastresult]

An adapter that only buffers the last value pushed and caches and broadcasts it (pulling a value doesn't dequeue it). It's suitable for use cases where skipping results is allowed.

#### Methods

- `static constructor()`
- `static fromDom(eventType, target[, options])`
- `static fromEmitter(eventType, emitter)`
- `push(value)`
  Overwrite the previously pushed value.
- `wrap([onReturn])`
  Return an iterable iterator with only the standard methods.

#### Examples

##### Converting mouse move events into a stream

```js
import { LastResult } from 'queueable';
const moveIterable = LastResult.fromDom('click', eventTarget);
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
const { wrapRequest } = 'queueable';
const frames = wrapRequest(window.requestAnimationFrame, window.cancelAnimationFrame);
for await (const timestamp of frames) {
  console.log(timestamp); // logs frame timestamps sequentially
}
```

##### Creating an iterable interval with `setTimeout()`

```js
const makeInterval = (delay) =>
  wrapRequest((callback) => window.setTimeout(callback, delay), window.clearTimeout);
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

The same concept as `Subject` in observables; allows having zero or more subscribers that each receive the pushed values. The pushed values are discarded if there are no subscribers. Uses the `Channel` adapters internally.

```js
import { Multicast } from 'queueable';

const queue = new Multicast();
// subscribe two iterators to receive results
const subscriberA = queue[Symbol.asyncIterator]();
const subscriberB = queue[Symbol.asyncIterator]();
queue.push(123);
const results = Promise.all([subscriberA.next(), subscriberB.next()]);
console.log(await results); // logs [{ value: 123, done: false }, { value: 123, done: false }]
```

## Types

To make TypeScript know about the asnyc iterable types (`AsyncIterable<T>`, `AsyncIterator<T>`, `AsyncIterableiterator<T>`), the TypeScript `--lib` [compiler option][options] should include `"esnext.asynciterable"` or `"esnext"`.

## Alternatives

- [callback-to-async-iterator]
- [event-iterator]
- [Repeater.js]
- [rxjs-for-await](https://github.com/benlesh/rxjs-for-await)

## Tools for async iteration

- [IxJS] – supports various combinators for async iterables
- [Symbola] – protocol extension based combinators for async iterables
- [Axax] – async iteration helpers
- [iterall] – iteration utilities
- [iter-tools] – iteration helpers

[symbola]: https://github.com/slikts/symbola
[ixjs]: https://github.com/ReactiveX/IxJS#asynciterable
[callback-to-async-iterator]: https://github.com/withspectrum/callback-to-async-iterator
[async]: http://2ality.com/2016/10/asynchronous-iteration.html
[options]: https://www.typescriptlang.org/docs/handbook/compiler-options.html
[lightweight]: https://bundlephobia.com/result?p=queueable
[axax]: https://github.com/jamiemccrindle/axax
[iterall]: https://github.com/leebyron/iterall
[iter-tools]: https://github.com/sithmel/iter-tools
[streams]: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
[channel]: https://slikts.github.io/queueable/classes/Channel.html
[multicast]: https://slikts.github.io/queueable/classes/multicast.html
[lastresult]: https://slikts.github.io/queueable/classes/LastResult.html
[slides]: https://docs.google.com/presentation/d/1r2V1sLG8JSSk8txiLh4wfTkom-BoOsk52FgPBy8o3RM
[id]: https://streams.spec.whatwg.org/#ts
[streams-reader]: https://github.com/whatwg/streams/issues/778
[node-streams]: https://nodejs.org/api/stream.html#stream_readable_symbol_asynciterator
[js-csp]: https://github.com/ubolonton/js-csp
[ping-pong]: https://codepen.io/slikts/pen/yRPgQE?editors=0012
[animation]: https://codepen.io/slikts/pen/mzqKvo?editors=0010
[async-csp]: https://github.com/dvlsg/async-csp
[event-iterator]: https://github.com/rolftimmermans/event-iterator
[repeater.js]: https://repeater.js.org/
