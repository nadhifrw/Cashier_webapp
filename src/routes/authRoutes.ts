import { Router, Request, Response } from 'express';
import { authService } from '../services/authServices';
import { isAuthenticated, isAdmin } from '../middleware/middleware';

const router = Router();
// router.use(isAuthenticated);

// // Admin-only routes
// router.use(isAdmin);

// POST /api/auth/register - Register new user (admin only)
router.post('/register', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { email, username ,password, name, role } = req.body;
    
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
    
    const user = await authService.register({ email, username, password, name, role });
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/auth/login - Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }
    
    const user = await authService.login({ username, password });
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(401).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/auth/refresh - Refresh ID token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const tokens = await authService.refreshIdToken(refreshToken);

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, error: (error as Error).message });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', isAuthenticated, async (req: Request, res: Response) => {
  try {
    await authService.logout();
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    const user = await authService.getUserById(req.user.uid);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/users - Get all users (admin only)
router.get('/users', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    
    let users;
    if (role) {
      users = await authService.getUsersByRole(role as string);
    } else {
      users = await authService.getAllUsers();
    }
    
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/users/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.params.id as string);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// PUT /api/users/:id - Update user
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await authService.updateUser(req.params.id as string, req.body);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// DELETE /api/users/:id - Deactivate user
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const success = await authService.deactivateUser(req.params.id as string);
    
    if (!success) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
