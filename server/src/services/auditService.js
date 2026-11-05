import { AuditLog } from '../models/AuditLog.js';

export const logActivity = async ({
  userId,
  userRole,
  action,
  entityType,
  entityId,
  ern,
  details = {},
  req
}) => {
  try {
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    const userAgent = req?.headers['user-agent'] || '';

    await AuditLog.create({
      userId,
      userRole,
      action,
      entityType,
      entityId,
      ern,
      details,
      ipAddress,
      userAgent
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log entry:', err.message);
  }
};

