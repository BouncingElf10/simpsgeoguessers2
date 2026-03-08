import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const redis = Redis.fromEnv();

export default async function handler(req, res) {
    if (req.method !== 'POST')
        return res.status(405).json({ error: 'Method not allowed' });

    const token = req.headers['x-admin-token'];
    if (token !== process.env.ADMIN_TOKEN)
        return res.status(401).json({ error: 'Unauthorized' });

    const { map } = req.body;
    if (!map) return res.status(400).json({ error: 'Missing map id' });

    try {
        const key = `leaderboard:${map}`;
        const entries = await redis.lrange(key, 0, -1);

        const parsed = entries.map(e => {
            try {
                return typeof e === 'string' ? JSON.parse(e) : e;
            } catch {
                return null;
            }
        }).filter(Boolean);

        const best = new Map();
        for (const entry of parsed) {
            const existing = best.get(entry.username);
            if (!existing || entry.score > existing.score) {
                best.set(entry.username, entry);
            }
        }

        const deduplicated = Array.from(best.values());
        const removedCount = parsed.length - deduplicated.length;

        const pipeline = redis.pipeline();
        pipeline.del(key);
        for (const entry of deduplicated) {
            pipeline.lpush(key, JSON.stringify(entry));
        }
        await pipeline.exec();

        return res.status(200).json({
            success: true,
            map,
            before: parsed.length,
            after: deduplicated.length,
            removed: removedCount,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to clean up leaderboard' });
    }
}