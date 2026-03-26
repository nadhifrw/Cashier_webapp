"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authServices_1 = require("../services/authServices");
const middleware_1 = require("../middleware/middleware");
const router = (0, express_1.Router)();
// router.use(isAuthenticated);
// // Admin-only routes
// router.use(isAdmin);
// POST /api/auth/register - Register new user (admin only)
router.post('/register', middleware_1.isAuthenticated, middleware_1.isAdmin, async (req, res) => {
    try {
        const { email, username, password, name, role } = req.body;
        if (!email || !username || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                error: 'Email, username, password, name, and role are required'
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            });
        }
        const user = await authServices_1.authService.register({ email, username, password, name, role });
        res.status(201).json({ success: true, data: user });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
// POST /api/auth/login - Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }
        const user = await authServices_1.authService.login({ username, password });
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});
// POST /api/auth/refresh - Refresh ID token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
        }
        const tokens = await authServices_1.authService.refreshIdToken(refreshToken);
        res.json({ success: true, data: tokens });
    }
    catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});
// POST /api/auth/logout - Logout
router.post('/logout', middleware_1.isAuthenticated, async (req, res) => {
    try {
        await authServices_1.authService.logout();
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// GET /api/auth/me - Get current user
router.get('/me', middleware_1.isAuthenticated, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        const user = await authServices_1.authService.getUserById(req.user.uid);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User profile not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// GET /api/users - Get all users (admin only)
router.get('/users', middleware_1.isAuthenticated, middleware_1.isAdmin, async (req, res) => {
    try {
        const { role } = req.query;
        let users;
        if (role) {
            users = await authServices_1.authService.getUsersByRole(role);
        }
        else {
            users = await authServices_1.authService.getAllUsers();
        }
        res.json({ success: true, data: users });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// GET /api/users/:id - Get user by ID
router.get('/users/:id', middleware_1.isAuthenticated, middleware_1.isAdmin, async (req, res) => {
    try {
        const user = await authServices_1.authService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// PUT /api/users/:id - Update user
router.put('/users/:id', async (req, res) => {
    try {
        const user = await authServices_1.authService.updateUser(req.params.id, req.body);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// DELETE /api/users/:id - Deactivate user
router.delete('/users/:id', async (req, res) => {
    try {
        const success = await authServices_1.authService.deactivateUser(req.params.id);
        if (!success) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, message: 'User deactivated successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map