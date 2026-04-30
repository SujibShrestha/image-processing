import rateLimit from "express-rate-limit";

const parseEnvNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const globalWindowMs = parseEnvNumber(
  process.env.RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000
);
const globalMaxRequests = parseEnvNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 200);

const authWindowMs = parseEnvNumber(
  process.env.AUTH_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000
);
const authMaxRequests = parseEnvNumber(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10);

export const apiRateLimiter = rateLimit({
  windowMs: globalWindowMs,
  max: globalMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts. Please try again later.",
  },
});
