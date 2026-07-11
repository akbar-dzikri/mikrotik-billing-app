import { vi } from 'vitest';

/**
 * Creates a single Drizzle query mock that is both thenable and chainable.
 *
 * Every chainable method (`from`, `leftJoin`, `where`, `orderBy`, `limit`,
 * `offset`, `values`, `set`) returns `this`, so arbitrarily long chains work.
 *
 * The query itself has a `then` method, making it awaitable.  It resolves
 * to the `defaultResult` passed in.
 */
export function createMockQuery<T>(defaultResult: T[] = []) {
  const query = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    then(resolve: (value: T[]) => void) {
      resolve(defaultResult);
    },
    catch() {
      // no-op
    },
    finally() {
      // no-op
    },
  };
  return query;
}

/**
 * Creates a mock `db` object with `select`, `insert`, `update`, `delete`.
 *
 * Each method returns a mock query by default, so chaining works out of the box.
 * Use `.mockReturnValueOnce(createMockQuery(specificResult))` to configure
 * per-call results for specific assertions.
 */
export function createMockDb() {
  const defaultQuery = createMockQuery();
  return {
    select: vi.fn(() => defaultQuery),
    insert: vi.fn(() => defaultQuery),
    update: vi.fn(() => defaultQuery),
    delete: vi.fn(() => defaultQuery),
  };
}
