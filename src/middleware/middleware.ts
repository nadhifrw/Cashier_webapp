import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authServices';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string | null;
        role?: string;
      };
    }
  }
}

// Check if user is authenticated
export const isAuthenticated = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
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
    const user = await authService.verifyToken(idToken);
    
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
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid authentication' });
  }
};

// Check if user has required role
export const hasRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

// Admin only middleware
export const isAdmin = hasRole('admin');

// Manager or Admin middleware
export const isManagerOrAdmin = hasRole('admin', 'manager');
