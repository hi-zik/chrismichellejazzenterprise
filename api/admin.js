// api/admin.js - Complete admin endpoint using Vercel KV
import { kv } from '@vercel/kv';

// Simple admin authentication
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Simple admin authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - Missing token'
        });
    }

    const token = authHeader.substring(7);
    if (token !== ADMIN_PASSWORD) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - Invalid token'
        });
    }

    if (req.method === 'GET') {
        try {
            // Get recent signups
            const signups = await kv.lrange('signups', 0, 99) || [];
            
            // Get recent logins
            const logins = await kv.lrange('logins', 0, 99) || [];

            // Get all users
            const userKeys = await kv.keys('user:*') || [];
            const users = [];
            
            for (const key of userKeys) {
                const userData = await kv.get(key);
                if (userData) {
                    // Remove password from response
                    const { password, ...safeUserData } = userData;
                    users.push(safeUserData);
                }
            }

            // Stats
            const stats = {
                totalUsers: users.length,
                totalSignups: signups.length,
                totalLogins: logins.length,
                membershipBreakdown: users.reduce((acc, user) => {
                    const membership = user.membership || 'none';
                    acc[membership] = (acc[membership] || 0) + 1;
                    return acc;
                }, {})
            };

            return res.status(200).json({
                success: true,
                data: {
                    stats,
                    users: users.slice(0, 50), // Limit to 50 users
                    recentSignups: signups.slice(0, 20),
                    recentLogins: logins.slice(0, 20)
                }
            });

        } catch (error) {
            console.error('Admin error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error occurred',
                details: error.message
            });
        }
    }

    return res.status(405).json({
        success: false,
        message: 'Method not allowed'
    });
}