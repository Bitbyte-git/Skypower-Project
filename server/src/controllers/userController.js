import { User } from '../models/User.js';
import { logActivity } from '../services/auditService.js';

export const getUsers = async (req, res, next) => {
  try {
    const { search, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (status !== undefined) query.isActive = status === 'active';

    const users = await User.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      phone,
      department
    });

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser._id,
      details: { email: newUser.email, role: newUser.role },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        department: newUser.department,
        isActive: newUser.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: user._id,
      details: { email: user.email, isActive: user.isActive },
      req
    });

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user
    });
  } catch (err) {
    next(err);
  }
};

