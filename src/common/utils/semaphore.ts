// semaphore.ts
export class Semaphore {
  private counter: number;
  private waiting: Array<() => void> = [];

  constructor(private readonly maxConcurrency: number) {
    this.counter = maxConcurrency;
  }

  async acquire(): Promise<void> {
    if (this.counter > 0) {
      this.counter--;
      return;
    }

    return new Promise((resolve) => {
      this.waiting.push(() => {
        this.counter--;
        resolve();
      });
    });
  }

  release(): void {
    this.counter++;
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) next();
    }
  }
}
