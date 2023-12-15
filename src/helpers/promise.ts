export function deferPromise<TReturn = void>(): {
  promise: Promise<TReturn>;
  resolve: (data?: TReturn) => void;
  reject: (error: Error) => void;
} {
  let resolvePromise = void 0 as unknown as (data?: TReturn) => void;
  let rejectPromise = void 0 as unknown as (error: Error) => void;
  const promise = new Promise<TReturn>((resolve, reject) => {
    resolvePromise = resolve as (...args: any[]) => any;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  };
}

async function waitMs(timeMs: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, timeMs));
}
