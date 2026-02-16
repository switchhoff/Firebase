// Based on Node.js EventEmitter, but simplified for client-side use.
// This avoids pulling in a large dependency for a simple pub/sub system.

type Listener = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, Listener[]> = {};

  on(eventName: string, listener: Listener): this {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
    return this;
  }

  off(eventName: string, listener: Listener): this {
    if (!this.events[eventName]) {
      return this;
    }
    this.events[eventName] = this.events[eventName].filter(l => l !== listener);
    return this;
  }

  emit(eventName: string, ...args: any[]): boolean {
    const listeners = this.events[eventName];
    if (!listeners || listeners.length === 0) {
      return false;
    }

    listeners.forEach(listener => {
      listener(...args);
    });

    return true;
  }
}

export const errorEmitter = new EventEmitter();
