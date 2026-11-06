import { Client } from '../models/Client.js';
import { Enquiry } from '../models/Enquiry.js';
import { logActivity } from '../services/auditService.js';
import { generateNextClientID } from '../services/counterService.js';

export const createClient = async (req, res, next) => {
  try {
    const { companyName, mobile } = req.body;

    // Check duplicate by company name (case-insensitive)
    const existingByName = await Client.findOne({
      companyName: { $regex: new RegExp(`^${companyName.trim()}$`, 'i') }
    });
    if (existingByName) {
      return res.status(409).json({
        success: false,
        message: `Client with company name '${companyName}' already exists in the system.`
      });
    }

    // Check duplicate by primary mobile number
    const existingByMobile = await Client.findOne({ mobile: mobile.trim() });
    if (existingByMobile) {
      return res.status(409).json({
        success: false,
        message: `Client with mobile number '${mobile}' is already registered under '${existingByMobile.companyName}'.`
      });
    }

    const clientId = await generateNextClientID();
    const clientLocation = req.body.clientLocation || req.body.siteAddress || 'Salem, Tamil Nadu';
    const resolvedName = (req.body.name || req.body.clientName || req.body.companyName || '').trim();

    const client = await Client.create({
      ...req.body,
      name: resolvedName,
      clientName: resolvedName,
      clientId,
      clientLocation,
      createdBy: req.user._id
    });

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'CLIENT_CREATED',
      entityType: 'Client',
      entityId: client._id,
      details: { companyName: client.companyName, mobile: client.mobile },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Client registered successfully.',
      client
    });
  } catch (err) {
    next(err);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const { search, customerType, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { clientLocation: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (customerType) {
      query.customerType = customerType;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      clients
    });
  } catch (err) {
    next(err);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id).populate('createdBy', 'name email role');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    // Retrieve linked enquiries
    const linkedEnquiries = await Enquiry.find({ clientId: client._id })
      .select('ern offerDate enquiryType expectedProjectValue approvalStatus commercialStatus createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      client,
      enquiries: linkedEnquiries
    });
  } catch (err) {
    next(err);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    // Check duplicate name if changing
    if (req.body.companyName && req.body.companyName !== client.companyName) {
      const duplicate = await Client.findOne({
        _id: { $ne: id },
        companyName: { $regex: new RegExp(`^${req.body.companyName.trim()}$`, 'i') }
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another client with company name '${req.body.companyName}' already exists.`
        });
      }
    }

    Object.assign(client, req.body);
    await client.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'CLIENT_UPDATED',
      entityType: 'Client',
      entityId: client._id,
      details: { companyName: client.companyName },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully.',
      client
    });
  } catch (err) {
    next(err);
  }
};

