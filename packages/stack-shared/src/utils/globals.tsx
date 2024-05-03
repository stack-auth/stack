const globalVar: any =
  typeof globalThis !== 'undefined' ? globalThis :
    typeof window !== 'undefined' ? window :
      typeof global !== 'undefined' ? global :
        typeof self !== 'undefined' ? self :
          {};
export {
  globalVar,
};

const stackGlobalsSymbol = Symbol.for('__stack-globals');
globalVar[stackGlobalsSymbol] ??= {};

export function createGlobal<T>(key: string, init: () => T) {
  if (!globalVar[stackGlobalsSymbol][key]) {
    globalVar[stackGlobalsSymbol][key] = init();
  }
  return globalVar[stackGlobalsSymbol][key] as T;
}
