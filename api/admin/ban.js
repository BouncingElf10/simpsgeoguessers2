import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const redis = Redis.fromEnv();

export default async function handler(req, res) {
    const token = req.headers['x-admin-token'];
    if (!token || token !== process.env.ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { ipHash, username, reason } = req.body;
    if (!ipHash && !username) return res.status(400).json({ error: 'Provide ipHash or username' });

    try {
        let bannedHashes = [];

        if (ipHash) {
            await redis.sadd('banned_ips', ipHash);
            bannedHashes.push(ipHash);
        }

        if (username) {
            const raw = await redis.lrange('recent_submissions', 0, 499);
            const items = raw.map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
            const hashes = new Set(items.filter(it => it.username === username).map(it => it.ipHash));
            for (const h of hashes) {
                await redis.sadd('banned_ips', h);
                bannedHashes.push(h);
            }
        }

        return res.status(200).json({ success: true, banned: bannedHashes, reason: reason || null });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to ban' });
    }
}
