const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createRateLimit({
  windowMs = DEFAULT_WINDOW_MS,
  max,
  message,
}) {
  const hits = new Map();

  return (req, res, next) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || entry.expiresAt <= now) {
      hits.set(ip, { count: 1, expiresAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= max) {
      const retryAfterSeconds = Math.ceil((entry.expiresAt - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfterSeconds, 1)));
      res.status(429).json({ message });
      return;
    }

    entry.count += 1;
    next();
  };
}

export const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
};

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.',
});

export const writeRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: 'Too many write requests. Please slow down and try again shortly.',
});
