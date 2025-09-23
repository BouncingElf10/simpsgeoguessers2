import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Filter from 'leo-profanity';
dotenv.config({ path: '.env.local' });

const redis = Redis.fromEnv();

function hashIp(ip) {
    return crypto
        .createHmac('sha256', process.env.IP_SECRET_SALT || 'default_salt')
        .update(ip)
        .digest('hex');
}

function getIp(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown'
    );
}

Filter.loadDictionary('en');
function isCleanUsername(username) {
    return !Filter.check(username);
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { map } = req.query;
        if (!map) return res.status(400).json({ error: 'Missing map id' });

        try {
            const entries = await redis.lrange(`leaderboard:${map}`, 0, 99);

            const parsed = entries.map(e => {
                try {
                    return typeof e === "string" ? JSON.parse(e) : e;
                } catch {
                    return e;
                }
            });

            parsed.sort((a, b) => b.score - a.score);

            return res.status(200).json({ leaderboard: parsed });
        } catch (e) {
            console.error(e);
            return res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { username, score, totalTime, points, map } = req.body;
            if (score <= 10) return res.status(400).json({ error: 'At least get some score before submitting...' });
            if (!isCleanUsername(username)) {
                return res.status(400).json({ error: 'really dude?' });
            }
            const ip = getIp(req);
            const ipHash = hashIp(ip);

            const banned = await redis.sismember('banned_ips', ipHash);
            if (banned) return res.status(403).json({ error: 'IP banned' });

            if (!username || typeof username !== 'string' || username.length > 20 || typeof score !== 'number' || score < 0) {
                return res.status(400).json({ error: 'Invalid input' });
            }

            const rateKey = `rate:${ipHash}`;
            const submissions = await redis.incr(rateKey);
            if (submissions === 1) await redis.expire(rateKey, 60);
            if (submissions > 5) return res.status(429).json({ error: 'Too many submissions' });

            const entry = { username, score, totalTime, points, map, createdAt: Date.now() };

            const key = `leaderboard:${map}`;
            await redis.lpush(key, JSON.stringify(entry));
            await redis.ltrim(key, 0, 999);

            const recentItem = JSON.stringify({ username, score, createdAt: Date.now(), ipHash });
            await redis.lpush('recent_submissions', recentItem);
            await redis.ltrim('recent_submissions', 0, 499); // keep last 500
            await redis.expire('recent_submissions', 60 * 60 * 24 * 3); // 3 days

            return res.status(200).json({ success: true, entry });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to save score' });
        }
    }
}