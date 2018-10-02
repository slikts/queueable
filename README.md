
<h1 align="center"><img src="https://i.imgur.com/gjLSYAr.png" width="437" height="180" alt="Queueable"></h1>

[![License](https://img.shields.io/github/license/slikts/queueable.svg)](https://github.com/slikts/queueable)
[![Build Status](https://img.shields.io/travis/slikts/queueable/master.svg)](https://travis-ci.org/slikts/queueable)
[![Coverage Status](https://coveralls.io/repos/github/slikts/queueable/badge.svg?branch=master)](https://coveralls.io/github/slikts/queueable?branch=master)
[![Latest Stable Version](https://img.shields.io/npm/v/queueable.svg)](https://www.npmjs.com/package/queueable) [![Greenkeeper badge](https://badges.greenkeeper.io/slikts/queueable.svg)](https://greenkeeper.io/)
[![Code Climate](https://codeclimate.com/github/slikts/queueable.svg)](https://codeclimate.com/github/slikts/queueable)
[![Dependency Status](https://david-dm.org/slikts/queueable.svg)](https://david-dm.org/slikts/queueable)

A library for turning push-based collections like streams into pull-based ones that implement the [ES2018 asynchronous iteration protocols][async].

## Features

* Buffers pushed and pulled values
* Well-typed with TypeScript
* Lightweight, no dependencies
* Full test coverage

## Explanation

Examples of push-based collections are streams and event emitters, and the 'push' aspect refers to control flow being handed to the collection to return the next value at a time determined by the collection. The control flow is normally passed in as an either explicit or implicit continuation (callbacks being explicit, and generator or async function continuations being implicit), and the values can be returned asynchronously, meaning with a time delay.

Pull collections return values immediately upon request; an example of a pull collection is a JavaScript array, where methods like `Array#pop()` return values directly.

Async iterators are pull collections that return promises, and, in turn, promises are push-based (albeit for singular values, not multiple, like with streams), so async iterators combine the pull- and push-based aspects.

This library is for populating async iterators with values; the intended use case is to implement async iterability for data structures, and to convert collections like event emitters to async iterators.

## Installation

```
npm install --save queueable
```

## Usage

### Implementing an async iterable iterator
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
}
// the loop ends after it reaches a result where the iterator is closed
```
### Pulling results and waiting for values to be pushed
```js
const queue = new Balancer();
const result = queue.next(); // a promise of an iterator result
result.then(({ value }) => {
  console.log(value);
});
queue.push("hello"); // "hello" is logged in the next microtick
```
### Multicasting
```js
import { Multicast } from "queueable";

const queue = new Multicast();
// subscribe two iterators to receive results
const a = queue[Symbol.asyncIterator]();
const b = queue[Symbol.asyncIterator](); 
queue.push(123);
Promise.all([a.next(), b.next()]).then(results => {
  console.log(results); // logs [{ value: 123, done: false }, { value: 123, done: false }]
});
```
### Converting streams to async iterable iterators
```js
import { fromDom } from "queueable";
const queue = fromDom('click', eventTarget);
for await (const event of queue) {
  console.log(event); // logs MouseEvent objects each time the mouse is clicked
}
// the event listener can be removed and stream closed with .return()
queue.return();
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

* [IxJS] - supports various combinators for async iterables
* [Symbola] - protocol extension based combinators for async iterables

[Symbola]: https://github.com/slikts/symbola
[IxJS]: https://github.com/ReactiveX/IxJS#asynciterable
[callback-to-async-iterator]: https://github.com/withspectrum/callback-to-async-iterator
[async]: http://2ality.com/2016/10/asynchronous-iteration.html
[options]: https://www.typescriptlang.org/docs/handbook/compiler-options.html
