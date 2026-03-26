"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isManagerOrAdmin = exports.isAdmin = exports.hasRole = exports.isAuthenticated = void 0;
const authServices_1 = require("../services/authServices");
// Check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No auth token provided'
            });
        }
        const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix
        const user = await authServices_1.authService.verifyToken(idToken);
        if (!user || !user.id) {
            return res.status(401).json({
                success: false,
                error: 'Account not found or inactive'
            });
        }
        req.user = {
            uid: user.id,
            email: user.email,
            role: user.role
        };
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, error: 'Invalid authentication' });
    }
};
exports.isAuthenticated = isAuthenticated;
// Check if user has required role
const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }
        if (!req.user.role || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.hasRole = hasRole;
// Admin only middleware
exports.isAdmin = (0, exports.hasRole)('admin');
// Manager or Admin middleware
exports.isManagerOrAdmin = (0, exports.hasRole)('admin', 'manager');
//# sourceMappingURL=middleware.js.map