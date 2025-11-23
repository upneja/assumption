declare module '@playwright/test' {
  // Minimal stubs to satisfy TypeScript when Playwright is not installed in this workspace.
  export const devices: Record<string, Record<string, unknown>>;
  export function defineConfig<T = Record<string, unknown>>(config: T): T;
}
