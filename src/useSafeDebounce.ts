import { useCallback, useEffect, useMemo, useRef } from 'react';

type Timeout = ReturnType<typeof setTimeout>;

const debounce: (...args: any[]) => any = (
  method: (...args: any[]) => any,
  timeout = 500,
) => {
  let timeoutId: Timeout;

  return (...args: any[]) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      method(...args);
    }, timeout);
  };
};

/**
 * Safe because the hook is lifecycle aware and debounced callback will **not** be called on unmounted component.
 *
 * @param callback callback to debounce
 * @param timeout [ms]
 * @returns
 */
const useSafeDebounce = (
  callback: (...args: any[]) => void,
  timeout: number,
) => {
  const mountedRef = useRef<boolean>();

  const lifecycleSafeCallback = useCallback(
    (...args: any[]) => {
      if (mountedRef.current === true) {
        callback(...args);
      }
    },
    [callback],
  );

  // ugh, useMemo :/
  const debounced = useMemo(
    () => debounce(lifecycleSafeCallback, timeout),
    [lifecycleSafeCallback, timeout],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return debounced;
};

export default useSafeDebounce;

