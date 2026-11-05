import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce any fast-changing value (e.g. CGPA inputs, preference weight sliders).
 * Emits the latest value only after the specified delay buffer has elapsed without further updates.
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

