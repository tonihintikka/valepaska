import type { GameEvent, GameEventType } from '../types/events.js';

/**
 * Event listener function type
 */
export type EventListener<T extends GameEvent = GameEvent> = (event: T) => void;

/**
 * Event emitter for game events
 */
export class GameEventEmitter {
  private listeners: Map<GameEventType | '*', Set<EventListener>>;
  private eventLog: GameEvent[];
  private sequenceNumber: number;

  constructor() {
    this.listeners = new Map();
    this.eventLog = [];
    this.sequenceNumber = 0;
  }

  /**
   * Subscribe to a specific event type
   */
  on<T extends GameEvent>(
    type: T['type'],
    listener: EventListener<T>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as EventListener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(listener as EventListener);
    };
  }

  /**
   * Subscribe to all events
   */
  onAll(listener: EventListener): () => void {
    if (!this.listeners.has('*')) {
      this.listeners.set('*', new Set());
    }
    this.listeners.get('*')!.add(listener);
    
    return () => {
      this.listeners.get('*')?.delete(listener);
    };
  }

  /**
   * Emit an event
   */
  emit<T extends GameEvent>(
    type: T['type'],
    data: Omit<T, 'type' | 'timestamp' | 'sequenceNumber'>
  ): T {
    const event = {
      type,
      timestamp: Date.now(),
      sequenceNumber: this.sequenceNumber++,
      ...data,
    } as T;

    // Add to log
    this.eventLog.push(event);

    // Notify specific listeners
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        listener(event);
      }
    }

    // Notify wildcard listeners
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      for (const listener of allListeners) {
        listener(event);
      }
    }

    return event;
  }

  /**
   * Get the full event log
   */
  getEventLog(): readonly GameEvent[] {
    return this.eventLog;
  }

  /**
   * Get events of a specific type
   */
  getEventsOfType<T extends GameEvent>(type: T['type']): T[] {
    return this.eventLog.filter((e) => e.type === type) as T[];
  }

  /**
   * Clear all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Reset the event log (for testing)
   */
  resetLog(): void {
    this.eventLog = [];
    this.sequenceNumber = 0;
  }
}



