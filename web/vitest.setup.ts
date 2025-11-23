import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Clean up React Testing Library between tests
afterEach(() => {
  cleanup();
});
