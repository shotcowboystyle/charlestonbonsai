import { expect } from 'vitest'

/**
 * Narrow away `undefined` from an indexed access with a real assertion.
 *
 * `noUncheckedIndexedAccess` is on, so `list[0].name` will not compile. Prefer
 * this over `!` in assertions: a bare `!` on a missing element yields
 * "Cannot read properties of undefined", which says nothing about what failed.
 */
export function expectDefined<T>(value: T | undefined | null, label = 'value'): T {
  expect(value, `${label} should be defined`).toBeDefined()
  expect(value, `${label} should not be null`).not.toBeNull()
  return value as T
}
