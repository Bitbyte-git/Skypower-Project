import { SystemSetting } from '../models/SystemSetting.js';
import { logActivity } from '../services/auditService.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'master_config' });
    if (!settings) {
      settings = await SystemSetting.create({ key: 'master_config' });
    }
    return res.status(200).json({
      success: true,
      settings
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ key: 'master_config' });
    if (!settings) {
      settings = new SystemSetting({ key: 'master_config' });
    }

    Object.assign(settings, req.body);
    await settings.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'SystemSetting',
      entityId: settings._id,
      details: { updatedKeys: Object.keys(req.body) },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      settings
    });
  } catch (err) {
    next(err);
  }
};

