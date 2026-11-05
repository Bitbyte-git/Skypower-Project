import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { USER_ROLES } from '../constants/roles.js';

export const requireAuth = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid.'
      });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User session is invalid or user account has been deactivated.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: err.message
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required for this operation.'
    });
  }
  next();
};

export const requireSalesOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== USER_ROLES.SALES && req.user.role !== USER_ROLES.ADMIN)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Insufficient privileges.'
    });
  }
  next();
};

