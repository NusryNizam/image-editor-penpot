type DebounceOptions = {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
};
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => ReturnType<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;

  const { leading = false, trailing = true, maxWait } = options;

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const invoke = () => {
    if (lastArgs && lastThis) {
      const returnValue = func.apply(lastThis, lastArgs);
      result = returnValue;
      lastArgs = lastThis = null;
      return returnValue;
    }
  };

  const startTimer = (pendingFunc: () => void, wait: number) => {
    clearTimeout(timer!);
    timer = setTimeout(pendingFunc, wait);
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait === undefined
      ? timeWaiting
      : Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
  };

  const timerExpired = () => {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge();
    }

    // Restart the timer
    startTimer(timerExpired, remainingWait(time));
  };

  const leadingEdge = () => {
    lastInvokeTime = Date.now();
    // Start the timer for the trailing edge
    startTimer(timerExpired, wait);
    // Invoke the leading edge
    return leading ? invoke() : result;
  };

  const trailingEdge = () => {
    timer = null;

    if (trailing && lastArgs) {
      return invoke();
    }
    lastArgs = lastThis = null;
    return result;
  };

  const debounced = function (this: any, ...args: Parameters<T>) {
    const time = Date.now();
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    const isInvoking = shouldInvoke(time);

    if (isInvoking) {
      if (timer === null) {
        return leadingEdge();
      }
      if (maxWait !== undefined) {
        startTimer(timerExpired, wait);
        return invoke();
      }
    }
    if (timer === null) {
      startTimer(timerExpired, wait);
    }
    return result;
  };

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timer = null;
  };

  debounced.flush = () => {
    return timer === null ? result : trailingEdge();
  };

  debounced.pending = () => {
    return timer !== null;
  };

  return debounced;
}

export default debounce;
