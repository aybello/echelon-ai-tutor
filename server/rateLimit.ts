import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Custom key generator that uses the ipKeyGenerator helper from express-rate-limit
 * to properly handle IPv6 subnet collapsing (prevents bypass via IPv6 rotation).
 */
const keyGen = (req: any): string => {
  const ip = req.ip ?? "127.0.0.1";
  return ipKeyGenerator(ip);
};

/**
 * General API rate limiter — applies to all /api/trpc routes.
 * 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  message: { error: "Too many requests — please try again in a moment." },
});

/**
 * AI Tutor rate limiter — more restrictive since each call costs LLM tokens.
 * 15 requests per minute per IP.
 */
export const aiTutorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  message: { error: "AI Tutor rate limit reached — please wait a moment before sending another message." },
});

/**
 * Contact form / email submission limiter — prevent spam.
 * 5 requests per 15 minutes per IP.
 */
export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  message: { error: "Too many submissions — please try again later." },
});

/**
 * Auth/login rate limiter — prevent brute force.
 * 10 requests per minute per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  message: { error: "Too many login attempts — please try again in a moment." },
});
