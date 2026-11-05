import { Followup } from '../models/Followup.js';
import { Enquiry } from '../models/Enquiry.js';
import { FOLLOWUP_STATUSES } from '../constants/statuses.js';
import { logActivity } from '../services/auditService.js';

export const createFollowup = async (req, res, next) => {
  try {
    const { enquiryId, type, followupDate, discussionNotes, clientResponse, nextFollowupDate, status } = req.body;

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    const followup = await Followup.create({
      enquiryId: enquiry._id,
      ern: enquiry.ern,
      clientId: enquiry.clientId,
      type,
      followupDate: followupDate || new Date(),
      ownerId: req.user._id,
      discussionNotes,
      clientResponse,
      nextFollowupDate,
      status: status || FOLLOWUP_STATUSES.PENDING
    });

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'FOLLOWUP_LOGGED',
      entityType: 'Followup',
      entityId: followup._id,
      ern: enquiry.ern,
      details: { type, status: followup.status },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Follow-up logged successfully.',
      followup
    });
  } catch (err) {
    next(err);
  }
};

export const getFollowups = async (req, res, next) => {
  try {
    const { filter, enquiryId, clientId, page = 1, limit = 50 } = req.query;
    const query = {};

    if (enquiryId) query.enquiryId = enquiryId;
    if (clientId) query.clientId = clientId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (filter === 'today') {
      query.followupDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (filter === 'upcoming') {
      query.followupDate = { $gt: endOfToday };
      query.status = FOLLOWUP_STATUSES.PENDING;
    } else if (filter === 'overdue') {
      query.followupDate = { $lt: startOfToday };
      query.status = FOLLOWUP_STATUSES.PENDING;
    } else if (filter === 'completed') {
      query.status = FOLLOWUP_STATUSES.COMPLETED;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Followup.countDocuments(query);
    const followups = await Followup.find(query)
      .populate('clientId', 'companyName clientLocation contactPerson mobile')
      .populate('ownerId', 'name email role')
      .sort({ followupDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      followups
    });
  } catch (err) {
    next(err);
  }
};

export const updateFollowup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const followup = await Followup.findById(id);

    if (!followup) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up record not found.'
      });
    }

    Object.assign(followup, req.body);
    await followup.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'FOLLOWUP_UPDATED',
      entityType: 'Followup',
      entityId: followup._id,
      ern: followup.ern,
      details: { status: followup.status },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully.',
      followup
    });
  } catch (err) {
    next(err);
  }
};

