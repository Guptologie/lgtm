export class RateLimiter {
  private queue: Array<{ fn: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }> = [];
  private active = 0;
  private lastRequestTime = 0;
  private readonly maxConcurrent: number;
  private readonly minSpacing: number;

  constructor(maxConcurrent = 3, minSpacing = 200) {
    this.maxConcurrent = maxConcurrent;
    this.minSpacing = minSpacing;
  }

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) return;

    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.minSpacing) {
      setTimeout(() => this.processQueue(), this.minSpacing - timeSinceLast);
      return;
    }

    const item = this.queue.shift()!;
    this.active++;
    this.lastRequestTime = Date.now();

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.active--;
      this.processQueue();
    }
  }
}
