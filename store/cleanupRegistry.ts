type CleanupFn = () => Promise<void> | void;

const _cleanups: CleanupFn[] = [];

export function registerStoreCleanup(fn: CleanupFn): void {
  _cleanups.push(fn);
}

export async function runStoreCleanups(): Promise<void> {
  await Promise.all(_cleanups.map((fn) => fn()));
}
