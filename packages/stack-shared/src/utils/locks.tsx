import { generateUuid } from "./uuids";

export class AsyncLock {
  private _isLocked = false;
  private readonly _waitingResolves = new Map<string, () => void>();

  async lock(): Promise<void> {
    if (this._isLocked) {
      const uuid = generateUuid();
      await new Promise<void>((resolve) => {
        this._waitingResolves.set(uuid, resolve);
      });
    }
    this._isLocked = true;
  }

  unlock(): void {
    if (!this._isLocked) {
      return;
    }
    this._isLocked = false;
    const nextResolve = this._waitingResolves.entries().next().value;
    if (nextResolve) {
      const [uuid, resolve] = nextResolve;
      this._waitingResolves.delete(uuid);
      resolve();
    }
  }

  async waitUntilUnlocked(): Promise<void> {
    if (!this._isLocked) {
      return;
    }
    const uuid = generateUuid();
    await new Promise<void>((resolve) => {
      this._waitingResolves.set(uuid, resolve);
    });
  }

}
