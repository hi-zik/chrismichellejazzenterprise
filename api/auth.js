// api/auth.js - Vercel Serverless Function for Authentication
import { kv } from '@vercel/kv';

// Simple email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Simple password validation
function isValidPassword(password) {
    // At least 8 characters, contains letter and number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
}

// Hash password (simple implementation - use bcrypt in production)
function hashPassword(password) {
    // This is a simple hash - use bcrypt or similar in production
    return Buffer.from(password).toString('base64');
}

// Verify password
function verifyPassword(password, hashedPassword) {
    return hashPassword(password) === hashedPassword;
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        const { action, email, password, name, membership } = req.body;

        try {
            if (action === 'signup') {
                // Validation
                if (!name || !email || !password) {
                    return res.status(400).json({
                        success: false,
                        message: 'All fields are required'
                    });
                }

                if (!isValidEmail(email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please enter a valid email address'
                    });
                }

                if (!isValidPassword(password)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Password must be at least 8 characters with letters and numbers'
                    });
                }

                // Check if user already exists
                const existingUser = await kv.get(`user:${email}`);
                if (existingUser) {
                    return res.status(409).json({
                        success: false,
                        message: 'An account with this email already exists'
                    });
                }

                // Create user
                const userData = {
                    name,
                    email,
                    password: hashPassword(password),
                    membership: membership || 'none',
                    createdAt: new Date().toISOString(),
                    verified: false
                };

                await kv.set(`user:${email}`, userData);

                // Log signup attempt (for admin monitoring)
                await kv.lpush('signups', {
                    email,
                    name,
                    membership,
                    timestamp: new Date().toISOString(),
                    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
                });

                return res.status(201).json({
                    success: true,
                    message: 'Account created successfully',
                    user: {
                        name: userData.name,
                        email: userData.email,
                        membership: userData.membership
                    }
                });

            } else if (action === 'login') {
                // Validation
                if (!email || !password) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email and password are required'
                    });
                }

                // Get user
                const userData = await kv.get(`user:${email}`);
                if (!userData) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                    });
                }

                // Verify password
                if (!verifyPassword(password, userData.password)) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid email or password'
                    });
                }

                // Log login attempt
                await kv.lpush('logins', {
                    email,
                    timestamp: new Date().toISOString(),
                    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
                });

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    user: {
                        name: userData.name,
                        email: userData.email,
                        membership: userData.membership
                    }
                });

            } else if (action === 'log_payment') {
                // Log payment method selection
                if (!email || !req.body.paymentMethod) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email and payment method are required'
                    });
                }

                // Log payment selection
                await kv.lpush('payments', {
                    email,
                    paymentMethod: req.body.paymentMethod,
                    timestamp: req.body.timestamp || new Date().toISOString(),
                    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
                });

                return res.status(200).json({
                    success: true,
                    message: 'Payment method logged'
                });

            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action'
                });
            }

        } catch (error) {
            console.error('Auth error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error occurred'
            });
        }
    }

    // Method not allowed
    return res.status(405).json({
        success: false,
        message: 'Method not allowed'
    });
}