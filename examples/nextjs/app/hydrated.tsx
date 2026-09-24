'use client';

import { useEffect } from 'react';

/** Marks the document once React has hydrated it, for the bench to wait on. */
export function Hydrated() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true';
  }, []);
  return null;
}
