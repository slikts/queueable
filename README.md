# Async Queue

[![License](https://img.shields.io/github/license/slikts/asyncqueue.svg)](https://github.com/slikts/asyncqueue)
[![Build Status](https://img.shields.io/travis/slikts/asyncqueue/master.svg)](https://travis-ci.org/slikts/asyncqueue)
[![Test Coverage](https://img.shields.io/codecov/c/github/slikts/asyncqueue/master.svg)](https://codecov.io/github/slikts/asyncqueue?branch=master)
[![Latest Stable Version](https://img.shields.io/npm/v/slikts/asyncqueue.svg)](https://www.npmjs.com/package/slikts/asyncqueue)

A library for turning push-based collections into pull-based ones that implement the [ES2018 asynchronous iteration protocols][async].

## Features

* Buffers pushed and pulled values
* TypeScript types

## Install

```
npm install --save @slikts/asyncqueue
```

## Usage

```typescript
const queue = new AsyncQueue<number>();
queue.push(1);
queue.push(2);

for await (const n of queue) {
  console.log(n); // logs 1, 2
}
```

## Alternatives

* [callback-to-async-iterator]

[callback-to-async-iterator]: https://github.com/withspectrum/callback-to-async-iterator
[async]: http://2ality.com/2016/10/asynchronous-iteration.html
