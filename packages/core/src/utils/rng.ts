/**
 * Seeded Random Number Generator using xoshiro128++
 * Provides deterministic randomness for reproducible games
 */

/**
 * RNG state
 */
export interface RngState {
  readonly s0: number;
  readonly s1: number;
  readonly s2: number;
  readonly s3: number;
}

/**
 * Seeded RNG class
 */
export class SeededRng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    // Initialize state using splitmix64 to expand the seed
    let state = seed >>> 0;
    
    const splitmix = (): number => {
      state = (state + 0x9e3779b9) >>> 0;
      let z = state;
      z = (z ^ (z >>> 16)) >>> 0;
      z = Math.imul(z, 0x85ebca6b) >>> 0;
      z = (z ^ (z >>> 13)) >>> 0;
      z = Math.imul(z, 0xc2b2ae35) >>> 0;
      z = (z ^ (z >>> 16)) >>> 0;
      return z;
    };

    this.s0 = splitmix();
    this.s1 = splitmix();
    this.s2 = splitmix();
    this.s3 = splitmix();
  }

  /**
   * Get the current state for serialization
   */
  getState(): RngState {
    return {
      s0: this.s0,
      s1: this.s1,
      s2: this.s2,
      s3: this.s3,
    };
  }

  /**
   * Restore state from serialized form
   */
  setState(state: RngState): void {
    this.s0 = state.s0;
    this.s1 = state.s1;
    this.s2 = state.s2;
    this.s3 = state.s3;
  }

  /**
   * Generate next random number (0 to 2^32 - 1)
   */
  private nextUint32(): number {
    const result = (((this.s0 + this.s3) >>> 0) + ((this.s0 + this.s3) << 9 | (this.s0 + this.s3) >>> 23)) >>> 0;
    
    const t = (this.s1 << 9) >>> 0;
    
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    
    this.s2 ^= t;
    this.s3 = ((this.s3 << 11) | (this.s3 >>> 21)) >>> 0;
    
    return result;
  }

  /**
   * Generate a random float between 0 (inclusive) and 1 (exclusive)
   */
  random(): number {
    return this.nextUint32() / 0x100000000;
  }

  /**
   * Generate a random integer between min (inclusive) and max (exclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      const temp = array[i]!;
      array[i] = array[j]!;
      array[j] = temp;
    }
    return array;
  }

  /**
   * Pick a random element from an array
   */
  pick<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return array[this.randomInt(0, array.length)]!;
  }

  /**
   * Returns true with the given probability (0 to 1)
   */
  chance(probability: number): boolean {
    return this.random() < probability;
  }
}

/**
 * Create a new seeded RNG
 */
export function createRng(seed: number): SeededRng {
  return new SeededRng(seed);
}




