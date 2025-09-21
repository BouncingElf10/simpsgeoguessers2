import { Redis } from "@upstash/redis";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const redis = Redis.fromEnv();

export default async function handler(req, res) {
    const token = req.headers['x-admin-token'];
    if (!token || token !== process.env.ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const bannedList = await redis.smembers("banned_ips");

        res.status(200).json({ bannedList });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch banned list" });
    }
}
