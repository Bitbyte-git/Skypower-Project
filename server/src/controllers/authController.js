import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
import { logActivity } from '../services/auditService.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email credentials or account is deactivated.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password combination.'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    await logActivity({
      userId: user._id,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email },
      req
    });

    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      department: user.department,
      lastLogin: user.lastLogin
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userProfile
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: req.user._id,
        req
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (err) {
    next(err);
  }
};

