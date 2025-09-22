import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import dotenv from 'dotenv';
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

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { username, score } = req.body;
        if (score <= 10) return res.status(400).json({ error: 'At least get some score before submitting...' });
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

        const entry = { username, score, createdAt: Date.now() };
        await redis.lpush('leaderboard', JSON.stringify(entry));

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