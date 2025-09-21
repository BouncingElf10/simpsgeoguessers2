import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const redis = Redis.fromEnv();

export default async function handler(req, res) {
    if (req.method !== "GET")
        return res.status(405).json({ error: "Method not allowed" });

    const token = req.headers["x-admin-token"];
    if (token !== process.env.ADMIN_TOKEN)
        return res.status(401).json({ error: "Unauthorized" });

    try {
        const submissions = await redis.lrange("recent_submissions", 0, 199);

        res.status(200).json({ submissions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch recent submissions" });
    }
}
