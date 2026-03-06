/**
 * Rate limiter por usuario y acción.
 * - Sin REDIS_URL: usa almacenamiento en memoria (no escala en multi-instancia).
 * - Con REDIS_URL: usa Redis para límites distribuidos en producción.
 */

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  upload: { max: 20, windowMs: 60 * 1000 },
  registerActivity: { max: 30, windowMs: 60 * 1000 },
  like: { max: 60, windowMs: 60 * 1000 },
};

function getKey(userId: string, action: string): string {
  return `ratelimit:${action}:${userId}`;
}

// --- In-memory (fallback cuando no hay Redis) ---
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitMemory(userId: string, action: string): boolean {
  const config = LIMITS[action];
  if (!config) return true;

  const key = getKey(userId, action);
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.max) return false;
  entry.count++;
  return true;
}

// --- Redis (producción multi-instancia) ---
let redisClient: import("ioredis").Redis | null = null;

async function getRedisClient(): Promise<import("ioredis").Redis | null> {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;

  if (redisClient) return redisClient;

  try {
    const Redis = (await import("ioredis")).default;
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 3000)),
      lazyConnect: true,
    });
    await redisClient.connect();
    return redisClient;
  } catch {
    return null;
  }
}

async function checkRateLimitRedis(
  userId: string,
  action: string
): Promise<boolean> {
  const config = LIMITS[action];
  if (!config) return true;

  const redis = await getRedisClient();
  if (!redis) return checkRateLimitMemory(userId, action);

  const key = getKey(userId, action);

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, config.windowMs);
    }
    return count <= config.max;
  } catch {
    return checkRateLimitMemory(userId, action);
  }
}

/**
 * Comprueba si el usuario puede realizar la acción (rate limit).
 * @returns true si está permitido, false si se excedió el límite
 */
export async function checkRateLimit(userId: string, action: string): Promise<boolean> {
  const url = process.env.REDIS_URL?.trim();
  if (url) {
    return checkRateLimitRedis(userId, action);
  }
  return checkRateLimitMemory(userId, action);
}
