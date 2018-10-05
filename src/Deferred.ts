export default class Deferred<A> {
  promise: Promise<A>;
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (value?: A | PromiseLike<A>): Promise<A> => {
        resolve(value);
        return this.promise;
      };
      this.reject = (reason?: string): Promise<A> => {
        reject(reason);
        return this.promise;
      };
    });
  }
}

export default interface Deferred<A> {
  resolve(value?: A | PromiseLike<A>): Promise<A>;
  reject(reason?: string): Promise<A>;
}
