import { useState, useEffect } from 'react';

/**
 * Returns a debounced version of `value` that only updates after
 * `delay` milliseconds of inactivity. Cleans up the timer on unmount
 * or when dependencies change — no stale closures, no memory leaks.
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
