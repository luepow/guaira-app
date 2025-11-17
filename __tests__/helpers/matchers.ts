/**
 * Custom Jest Matchers para el proyecto
 */

export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUuid(): R;
      toBeValidEmail(): R;
      toBeValidPhone(): R;
      toBeWithinRange(min: number, max: number): R;
      toHaveBalance(expected: number): R;
    }
  }
}

expect.extend({
  /**
   * Valida que un string sea un UUID válido
   */
  toBeValidUuid(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
    };
  },

  /**
   * Valida que un string sea un email válido
   */
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
    };
  },

  /**
   * Valida que un string sea un teléfono válido
   */
  toBeValidPhone(received: string) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const pass = typeof received === 'string' && phoneRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid phone`
          : `Expected ${received} to be a valid phone`,
    };
  },

  /**
   * Valida que un número esté dentro de un rango
   */
  toBeWithinRange(received: number, min: number, max: number) {
    const pass =
      typeof received === 'number' && received >= min && received <= max;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be within range ${min} to ${max}`
          : `Expected ${received} to be within range ${min} to ${max}`,
    };
  },

  /**
   * Valida el balance de una wallet
   */
  toHaveBalance(received: any, expected: number) {
    const actualBalance = received?.balance ?? received;
    const pass = Math.abs(actualBalance - expected) < 0.01; // Tolerancia de 1 centavo

    return {
      pass,
      message: () =>
        pass
          ? `Expected balance not to be ${expected}, but got ${actualBalance}`
          : `Expected balance to be ${expected}, but got ${actualBalance}`,
    };
  },
});
