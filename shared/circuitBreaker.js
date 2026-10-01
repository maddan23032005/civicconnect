import CircuitBreaker from "opossum";

const registry = new Map();

export function createBreaker(name, fn, log, options = {}) {
  const breaker = new CircuitBreaker(fn, {
    timeout: options.timeout ?? 8000,
    errorThresholdPercentage: options.errorThreshold ?? 50,
    resetTimeout: options.resetTimeout ?? 20000,
    rollingCountTimeout: 15000,
    volumeThreshold: options.volumeThreshold ?? 5,
    name,
  });

  breaker.on("open",     () => log.warn(`Circuit OPEN → ${name} (failing fast)`));
  breaker.on("halfOpen", () => log.info(`Circuit HALF-OPEN → ${name} (testing)`));
  breaker.on("close",    () => log.info(`Circuit CLOSED → ${name} (recovered)`));

  if (options.fallback) breaker.fallback(options.fallback);

  registry.set(name, breaker);
  return breaker;
}

export function breakerStates() {
  const out = {};
  for (const [name, b] of registry.entries()) {
    out[name] = {
      state: b.opened ? "open" : b.halfOpen ? "half-open" : "closed",
      stats: {
        successes: b.stats.successes,
        failures: b.stats.failures,
        timeouts: b.stats.timeouts,
        rejects: b.stats.rejects,
      },
    };
  }
  return out;
}
