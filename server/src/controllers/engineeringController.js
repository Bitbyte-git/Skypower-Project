import mongoose from 'mongoose';
import { EngineeringProject, PROJECT_STATUSES } from '../models/EngineeringProject.js';
import { EngineeringDrawing, DRAWING_STATUSES, DRAWING_TYPES } from '../models/EngineeringDrawing.js';
import { DrawingSubmission, SUBMISSION_STATUSES } from '../models/DrawingSubmission.js';
import { TechnicalClarification, CLARIFICATION_STATUSES } from '../models/TechnicalClarification.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { User } from '../models/User.js';
import {
  generateNextEngineeringProjectNumber,
  generateNextDrawingNumber,
  generateNextSubmissionNumber,
  generateNextClarificationNumber
} from '../services/counterService.js';

/**
 * Recalculate and persist aggregate stats for an engineering project
 */
const recalculateProjectStats = async (projectId) => {
  try {
    const drawings = await EngineeringDrawing.find({ projectId });
    const submissions = await DrawingSubmission.find({ projectId });
    const clarifications = await TechnicalClarification.find({ projectId });

    const totalDrawings = drawings.length;
    const completedDrawings = drawings.filter(
      (d) => d.status === DRAWING_STATUSES.READY_FOR_SUBMISSION || d.status === DRAWING_STATUSES.SUBMITTED || d.status === DRAWING_STATUSES.APPROVED
    ).length;
    const submittedDrawings = drawings.filter(
      (d) => d.status === DRAWING_STATUSES.SUBMITTED || d.status === DRAWING_STATUSES.UNDER_CUSTOMER_REVIEW || d.status === DRAWING_STATUSES.APPROVED
    ).length;
    const approvedDrawings = drawings.filter((d) => d.status === DRAWING_STATUSES.APPROVED).length;
    const revisionPendingDrawings = drawings.filter((d) => d.status === DRAWING_STATUSES.REVISION_REQUIRED).length;
    const openClarifications = clarifications.filter(
      (c) => c.status !== CLARIFICATION_STATUSES.RESOLVED && c.status !== CLARIFICATION_STATUSES.CLOSED
    ).length;

    // Determine derived project status
    let derivedStatus = PROJECT_STATUSES.DRAWING_PREPARATION;
    if (totalDrawings === 0) {
      derivedStatus = PROJECT_STATUSES.NOT_STARTED;
    } else if (approvedDrawings === totalDrawings && totalDrawings > 0) {
      derivedStatus = PROJECT_STATUSES.FULLY_APPROVED;
    } else if (approvedDrawings > 0) {
      derivedStatus = PROJECT_STATUSES.PARTIALLY_APPROVED;
    } else if (revisionPendingDrawings > 0) {
      derivedStatus = PROJECT_STATUSES.REVISION_IN_PROGRESS;
    } else if (submittedDrawings > 0) {
      derivedStatus = PROJECT_STATUSES.CUSTOMER_REVIEW;
    } else if (drawings.some((d) => d.status === DRAWING_STATUSES.INTERNAL_REVIEW)) {
      derivedStatus = PROJECT_STATUSES.INTERNAL_REVIEW;
    }

    await EngineeringProject.findByIdAndUpdate(projectId, {
      status: derivedStatus,
      'stats.totalDrawings': totalDrawings,
      'stats.completedDrawings': completedDrawings,
      'stats.submittedDrawings': submittedDrawings,
      'stats.approvedDrawings': approvedDrawings,
      'stats.revisionPendingDrawings': revisionPendingDrawings,
      'stats.totalSubmissions': submissions.length,
      'stats.openClarifications': openClarifications
    });
  } catch (err) {
    console.error('Error recalculating project stats:', err);
  }
};

/**
 * Auto-sync or create an Engineering Project from a Sales Order
 */
export const syncEngineeringProjectForOrder = async (orderOrId, user = null) => {
  try {
    const order = (typeof orderOrId === 'string' || orderOrId instanceof mongoose.Types.ObjectId)
      ? await SalesOrder.findById(orderOrId).populate('clientId enquiryId')
      : orderOrId;
    if (!order) return null;

    // Check if project already exists
    let existing = await EngineeringProject.findOne({ salesOrderId: order._id });
    if (existing) return existing;

    // Resolve assigned engineer
    let engineerUser = user?.role === 'DESIGN_ENGINEER' ? user : await User.findOne({ role: 'DESIGN_ENGINEER' });
    if (!engineerUser) engineerUser = user || await User.findOne();
    const engineerName = engineerUser?.name || 'Praveen Kumar (Lead Design Engineer)';
    const engineerId = engineerUser?._id;

    const projectNumber = await generateNextEngineeringProjectNumber();
    const primaryProduct = order.products?.[0] || {};
    const enquiry = order.enquiryId || {};

    const technicalSpecs = {
      equipmentType: primaryProduct.productName || '11kV Indoor HT Switchboard',
      switchgearType: `${primaryProduct.voltageRating || '11 kV'} Metal-Clad Vacuum Circuit Breaker Switchgear`,
      voltageRating: primaryProduct.voltageRating || '11 kV',
      currentRating: primaryProduct.currentRating || '630 A',
      shortCircuitRating: primaryProduct.breakingCapacity || '26.3 kA',
      shortCircuitDuration: '3 Seconds',
      indoorOutdoor: 'Indoor',
      panelType: 'Floor-Mounted Drawout Switchboard',
      panelCount: order.products?.length || 1,

      busbarMaterial: 'High Conductivity Electrolytic Copper (EC Grade)',
      busbarRating: parseInt(primaryProduct.currentRating, 10) > 630 ? '1250 A' : '800 A',
      busbarConfiguration: '3-Phase 3-Wire Sleeved Busbar Assembly',
      insulationRequirements: 'Heat-Shrinkable High-Dielectric Sleeving with Flame Retardant Shrouds',
      cableEntry: 'Bottom Cable Entry with Detachable Gland Plates',

      ctType: 'Resin Cast Dual Ratio Block Type CT',
      ctRatio: enquiry.drawingOADetails?.ctRatioConfirmed || `${primaryProduct.currentRating?.replace(/[^0-9]/g, '') || '200'}-100/5-5A`,
      primaryCurrent: primaryProduct.currentRating || '200 A',
      secondaryCurrent: '5 A',
      coreCount: 2,
      coreClass: 'Core 1: 0.5s (Metering), Core 2: 5P10 (Protection)',
      burden: '15 VA per core',
      accuracy: 'Class 0.5s',
      meteringCoreDetails: 'Class 0.5s, 15VA, ISF <= 5',
      protectionCoreDetails: '5P10, 15VA, ALF >= 10',
      ctMake: 'Kappa / Pragati / Kalpa',
      ctModel: 'Indoor Block Type',
      ctApprovalStatus: 'Draft',

      ptType: '3-Phase 3-Limb Cast Resin Voltage Transformer',
      ptRatio: '11000/sqrt(3) V : 110/sqrt(3) V',
      primaryVoltage: '11000 V',
      secondaryVoltage: '110 V',
      ptAccuracy: 'Class 0.5',
      ptBurden: '50 VA per phase',
      ptMake: 'Kappa / Pragati',
      ptModel: 'Drawout Carriage with Primary HRC Fuses',
      ptApprovalStatus: 'Draft',

      relayType: 'Numerical Multi-Function Feeder Protection Relay',
      relayMake: 'Schneider Electric / ABB / Siemens',
      relayModel: 'MiCOM P122 / REF615',
      protectionFunctions: 'ANSI 50/51 Non-Directional Overcurrent, 50N/51N Earth Fault, 50BF Breaker Failure',
      communicationProtocol: 'IEC 61850 / Modbus RS-485 RTU',
      relayApprovalStatus: 'Draft',

      meterMake: 'Schneider / Secure / Rishabh',
      meterModel: 'Digital Multi-Function Energy Meter Class 0.5s',
      meteringRequirements: 'V, I, PF, Freq, kW, kVA, kWh, kVARh with RS485 Modbus Port',

      vcbSpecification: `11kV, ${primaryProduct.currentRating || '630A'}, 26.3kA, 3-Pole Vacuum Circuit Breaker with 230V AC Motorized Spring Mechanism, Shunt Trip, and Anti-Pumping Relay`,
      controlVoltage: '110V DC / 230V AC Auxiliary Supply',
      spaceHeaterAndThermostat: '230V AC 80W Space Heater with Rotary Control Switch and Dial Thermostat',

      installationLocation: order.siteAddress || 'Works / Delivery Site, Tamil Nadu',
      customerStandard: 'TANGEDCO / CPWD / OEM Standard Specifications',
      applicableStandards: 'IEC 62271-200 / IEC 62271-100 / IS 13118 / IS 3427',
      environmentalRequirements: 'Max Ambient: 45°C, Design Ambient: 40°C, Relative Humidity: 95%, Altitude: <1000m',
      specialCustomerRequirements: order.customerPO?.customerRemarks || 'Standard Switchgear Manufacturing Spec',
      engineeringRemarks: 'Project auto-initiated from verified Sales Order / Workflow Stage 4 (Drawing).'
    };

    const calculatedTargetDate = order.deliveryCommitment?.expectedDeliveryDate
      ? new Date(new Date(order.deliveryCommitment.expectedDeliveryDate).getTime() - 21 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const project = new EngineeringProject({
      projectNumber,
      salesOrderId: order._id,
      orderNumber: order.orderNumber,
      customerPO: order.customerPO?.poNumber || '',
      quotationNumber: order.quotationNumber || '',
      clientId: order.clientId?._id || order.clientId,
      customerName: order.customerName || order.clientId?.clientName || 'Valued Customer',
      customerCode: order.customerCode,
      projectName: order.projectTitle,
      endUser: order.endUser || 'Direct Industrial Supply',
      assignedEngineer: engineerId,
      assignedEngineerName: engineerName,
      priority: 'HIGH',
      status: PROJECT_STATUSES.DRAWING_PREPARATION,
      startDate: new Date(),
      targetDate: calculatedTargetDate,
      technicalRemarks: 'Auto-synchronized for Engineering & Drawing Approval Console.',
      technicalSpecs,
      timeline: [
        {
          event: 'Engineering Project Created',
          user: engineerId,
          userName: engineerName,
          role: 'Design Engineer',
          timestamp: new Date(),
          notes: `Engineering Project ${projectNumber} created from Sales Order ${order.orderNumber}. Technical specifications imported.`
        }
      ],
      createdBy: engineerId
    });

    await project.save();

    // 5 standard switchgear drawings
    const defaultDrawings = [
      {
        type: 'GA',
        title: `General Arrangement (GA) Drawing - ${primaryProduct.voltageRating || '11kV'} VCB Panel Lineup`,
        panelNumber: 'Panel 01 - Main Lineup'
      },
      {
        type: 'SLD',
        title: `Single Line Diagram (SLD) & Power Circuit - ${order.projectTitle}`,
        panelNumber: 'All Panels'
      },
      {
        type: 'SCHEMATIC',
        title: 'AC / DC Control & Auxiliary Schematic Diagram',
        panelNumber: 'Panel 01 - Control Compartment'
      },
      {
        type: 'PROTECTION',
        title: 'Protection, Metering & CT/PT Secondary Connection Diagram',
        panelNumber: 'Panel 01 - Relay & Metering Door'
      },
      {
        type: 'FOUNDATION',
        title: 'Civil Foundation, Cable Trench & Cutout Drawing',
        panelNumber: 'Civil Scope'
      }
    ];

    for (const d of defaultDrawings) {
      const drawingNumber = await generateNextDrawingNumber(d.type);
      const dwg = new EngineeringDrawing({
        drawingNumber,
        drawingTitle: d.title,
        drawingType: d.type,
        projectId: project._id,
        projectNumber: project.projectNumber,
        salesOrderId: order._id,
        panelNumber: d.panelNumber,
        currentRevision: 'Rev 0',
        status: DRAWING_STATUSES.IN_PREPARATION,
        assignedEngineer: project.assignedEngineer,
        assignedEngineerName: project.assignedEngineerName,
        plannedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        technicalNotes: 'Standard engineering draft for internal review and customer approval.',
        revisions: [
          {
            revisionNumber: 'Rev 0',
            revisionDate: new Date(),
            description: 'Initial engineering draft generated from project scope',
            changeReason: 'Initial Release',
            preparedBy: project.assignedEngineer,
            preparedByName: project.assignedEngineerName,
            customerApproval: { status: 'Awaiting Submission' }
          }
        ],
        createdBy: engineerId
      });
      await dwg.save();
    }

    await recalculateProjectStats(project._id);

    order.engineeringProjectId = project._id;
    order.engineeringStatus = 'Engineering In Progress';
    order.timeline = order.timeline || [];
    order.timeline.push({
      event: 'Engineering Project Initiated',
      status: order.status,
      notes: `Engineering project ${projectNumber} initiated. Drawings under preparation by ${engineerName}.`,
      performedBy: engineerId,
      timestamp: new Date()
    });
    await order.save();

    return project;
  } catch (err) {
    console.error('Error in syncEngineeringProjectForOrder:', err);
    return null;
  }
};

/**
 * Sync all active Sales Orders into Engineering Projects
 */
export const syncEngineeringOrdersController = async (req, res) => {
  try {
    const orders = await SalesOrder.find().populate('clientId enquiryId');
    const synced = [];
    for (const order of orders) {
      const existing = await EngineeringProject.findOne({ salesOrderId: order._id });
      if (!existing) {
        const p = await syncEngineeringProjectForOrder(order, req.user);
        if (p) synced.push(p);
      }
    }
    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${synced.length} order(s) into Engineering Projects.`,
      syncedCount: synced.length,
      synced
    });
  } catch (error) {
    console.error('Error in syncEngineeringOrdersController:', error);
    return res.status(500).json({ success: false, message: 'Failed to sync engineering projects.', error: error.message });
  }
};

/**
 * 1. GET /api/engineering/dashboard/stats
 * Dynamic dashboard KPIs, drawing status breakdown, and pending activities
 */
export const getEngineeringDashboardStats = async (req, res) => {
  try {
    let projects = await EngineeringProject.find().sort({ updatedAt: -1 });

    // Auto-sync if no engineering projects exist but sales orders exist
    if (projects.length === 0) {
      const orders = await SalesOrder.find().populate('clientId enquiryId');
      for (const order of orders) {
        await syncEngineeringProjectForOrder(order, req.user);
      }
      projects = await EngineeringProject.find().sort({ updatedAt: -1 });
    }

    const [drawings, submissions, clarifications] = await Promise.all([
      EngineeringDrawing.find(),
      DrawingSubmission.find().sort({ submissionDate: -1 }),
      TechnicalClarification.find({ status: { $nin: ['Resolved', 'Closed'] } }).sort({ dueDate: 1 })
    ]);

    const totalProjects = projects.length;
    const drawingsUnderPreparation = drawings.filter(
      (d) => d.status === DRAWING_STATUSES.IN_PREPARATION || d.status === DRAWING_STATUSES.NOT_STARTED
    ).length;
    const internalReviewPending = drawings.filter((d) => d.status === DRAWING_STATUSES.INTERNAL_REVIEW).length;
    const customerSubmissionPending = drawings.filter((d) => d.status === DRAWING_STATUSES.READY_FOR_SUBMISSION).length;
    const customerApprovalPending = drawings.filter(
      (d) => d.status === DRAWING_STATUSES.SUBMITTED || d.status === DRAWING_STATUSES.UNDER_CUSTOMER_REVIEW
    ).length;
    const revisionRequired = drawings.filter((d) => d.status === DRAWING_STATUSES.REVISION_REQUIRED).length;
    const approvedDrawings = drawings.filter((d) => d.status === DRAWING_STATUSES.APPROVED).length;

    // Check delayed projects (targetDate < now and not fully approved)
    const now = new Date();
    const delayedProjects = projects.filter(
      (p) => p.targetDate && new Date(p.targetDate) < now && p.status !== PROJECT_STATUSES.FULLY_APPROVED && p.status !== PROJECT_STATUSES.COMPLETED
    ).length;

    // Drawing Status Summary
    const drawingStatusSummary = {
      notStarted: drawings.filter((d) => d.status === DRAWING_STATUSES.NOT_STARTED).length,
      draft: drawings.filter((d) => d.status === DRAWING_STATUSES.IN_PREPARATION).length,
      inPreparation: drawings.filter((d) => d.status === DRAWING_STATUSES.IN_PREPARATION).length,
      internalReview: internalReviewPending,
      readyForSubmission: customerSubmissionPending,
      submitted: drawings.filter((d) => d.status === DRAWING_STATUSES.SUBMITTED).length,
      revisionRequired: revisionRequired,
      approved: approvedDrawings
    };

    // Project Progress Overview List (Top 10)
    const projectOverview = projects.slice(0, 10).map((p) => {
      const total = p.stats?.totalDrawings || 0;
      const approved = p.stats?.approvedDrawings || 0;
      const submitted = p.stats?.submittedDrawings || 0;
      const drawingProgress = total > 0 ? Math.round(((p.stats?.completedDrawings || 0) / total) * 100) : 0;
      const approvalProgress = total > 0 ? Math.round((approved / total) * 100) : 0;

      return {
        _id: p._id,
        projectNumber: p.projectNumber,
        salesOrderId: p.salesOrderId,
        orderNumber: p.orderNumber,
        customerName: p.customerName,
        customerCode: p.customerCode,
        projectName: p.projectName,
        assignedEngineerName: p.assignedEngineerName || 'Unassigned',
        status: p.status,
        priority: p.priority,
        targetDate: p.targetDate,
        totalDrawings: total,
        approvedDrawings: approved,
        submittedDrawings: submitted,
        drawingProgress,
        approvalProgress
      };
    });

    // Pending Activities
    const pendingActivities = {
      internalReviews: drawings
        .filter((d) => d.status === DRAWING_STATUSES.INTERNAL_REVIEW)
        .slice(0, 5)
        .map((d) => ({
          _id: d._id,
          drawingNumber: d.drawingNumber,
          drawingTitle: d.drawingTitle,
          projectNumber: d.projectNumber,
          assignedEngineerName: d.assignedEngineerName,
          plannedDate: d.plannedDate
        })),
      customerApprovals: drawings
        .filter((d) => d.status === DRAWING_STATUSES.SUBMITTED || d.status === DRAWING_STATUSES.UNDER_CUSTOMER_REVIEW)
        .slice(0, 5)
        .map((d) => ({
          _id: d._id,
          drawingNumber: d.drawingNumber,
          drawingTitle: d.drawingTitle,
          projectNumber: d.projectNumber,
          customerSubmissionDate: d.customerSubmissionDate,
          currentRevision: d.currentRevision
        })),
      revisionRequests: drawings
        .filter((d) => d.status === DRAWING_STATUSES.REVISION_REQUIRED)
        .slice(0, 5)
        .map((d) => ({
          _id: d._id,
          drawingNumber: d.drawingNumber,
          drawingTitle: d.drawingTitle,
          projectNumber: d.projectNumber,
          comments: d.customerApproval?.comments || d.internalReview?.reworkNotes || 'Revision required'
        })),
      pendingClarifications: clarifications.slice(0, 5).map((c) => ({
        _id: c._id,
        clarificationNumber: c.clarificationNumber,
        subject: c.subject,
        projectNumber: c.projectNumber,
        priority: c.priority,
        dueDate: c.dueDate,
        status: c.status
      })),
      upcomingDeadlines: projects
        .filter((p) => p.targetDate && p.status !== PROJECT_STATUSES.FULLY_APPROVED)
        .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
        .slice(0, 5)
        .map((p) => ({
          _id: p._id,
          projectNumber: p.projectNumber,
          projectName: p.projectName,
          customerName: p.customerName,
          targetDate: p.targetDate,
          status: p.status
        }))
    };

    return res.status(200).json({
      success: true,
      kpis: {
        totalProjects,
        drawingsUnderPreparation,
        internalReviewPending,
        customerSubmissionPending,
        customerApprovalPending,
        revisionRequired,
        approvedDrawings,
        delayedProjects
      },
      drawingStatusSummary,
      projectOverview,
      pendingActivities
    });
  } catch (error) {
    console.error('Error in getEngineeringDashboardStats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch engineering dashboard stats.', error: error.message });
  }
};

/**
 * 2. GET /api/engineering/projects
 * List all engineering projects with filtering, search & pagination
 */
export const getAllEngineeringProjects = async (req, res) => {
  try {
    const totalCount = await EngineeringProject.countDocuments();
    if (totalCount === 0) {
      const orders = await SalesOrder.find().populate('clientId enquiryId');
      for (const order of orders) {
        await syncEngineeringProjectForOrder(order, req.user);
      }
    }

    const { status, priority, search, limit = 50, page = 1 } = req.query;

    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }
    if (search) {
      const q = search.trim();
      query.$or = [
        { projectNumber: { $regex: q, $options: 'i' } },
        { orderNumber: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { customerCode: { $regex: q, $options: 'i' } },
        { projectName: { $regex: q, $options: 'i' } },
        { assignedEngineerName: { $regex: q, $options: 'i' } }
      ];
    }

    const projects = await EngineeringProject.find(query)
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await EngineeringProject.countDocuments(query);

    return res.status(200).json({
      success: true,
      projects,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error in getAllEngineeringProjects:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch engineering projects.', error: error.message });
  }
};

/**
 * 3. POST /api/engineering/projects/from-order
 * Create Engineering Project from confirmed Sales Order
 */
export const createEngineeringProjectFromOrder = async (req, res) => {
  try {
    const { salesOrderId, assignedEngineerId, targetDate, priority = 'HIGH', technicalRemarks = '' } = req.body;

    if (!salesOrderId) {
      return res.status(400).json({ success: false, message: 'Sales Order ID is required.' });
    }

    const order = await SalesOrder.findById(salesOrderId).populate('clientId enquiryId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    // Check if project already exists for this order
    const existing = await EngineeringProject.findOne({ salesOrderId: order._id });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: `Engineering Project ${existing.projectNumber} already exists for this Sales Order.`,
        project: existing
      });
    }

    let engineerName = 'Senior Design Engineer';
    if (assignedEngineerId) {
      const engineer = await User.findById(assignedEngineerId);
      if (engineer) engineerName = engineer.name;
    } else if (req.user?.name) {
      engineerName = req.user.name;
    }

    const projectNumber = await generateNextEngineeringProjectNumber();
    const primaryProduct = order.products?.[0] || {};
    const enquiry = order.enquiryId || {};

    // Auto-populate switchgear technical specs
    const technicalSpecs = {
      equipmentType: primaryProduct.productName || '11kV Indoor HT Switchboard',
      switchgearType: `${primaryProduct.voltageRating || '11 kV'} Metal-Clad Vacuum Circuit Breaker Switchgear`,
      voltageRating: primaryProduct.voltageRating || '11 kV',
      currentRating: primaryProduct.currentRating || '630 A',
      shortCircuitRating: primaryProduct.breakingCapacity || '26.3 kA',
      shortCircuitDuration: '3 Seconds',
      indoorOutdoor: 'Indoor',
      panelType: 'Floor-Mounted Drawout Switchboard',
      panelCount: order.products?.length || 1,

      busbarMaterial: 'High Conductivity Electrolytic Copper (EC Grade)',
      busbarRating: parseInt(primaryProduct.currentRating, 10) > 630 ? '1250 A' : '800 A',
      busbarConfiguration: '3-Phase 3-Wire Sleeved Busbar Assembly',
      insulationRequirements: 'Heat-Shrinkable High-Dielectric Sleeving with Flame Retardant Shrouds',
      cableEntry: 'Bottom Cable Entry with Detachable Gland Plates',

      ctType: 'Resin Cast Dual Ratio Block Type CT',
      ctRatio: enquiry.drawingOADetails?.ctRatioConfirmed || `${primaryProduct.currentRating?.replace(/[^0-9]/g, '') || '200'}-100/5-5A`,
      primaryCurrent: primaryProduct.currentRating || '200 A',
      secondaryCurrent: '5 A',
      coreCount: 2,
      coreClass: 'Core 1: 0.5s (Metering), Core 2: 5P10 (Protection)',
      burden: '15 VA per core',
      accuracy: 'Class 0.5s',
      meteringCoreDetails: 'Class 0.5s, 15VA, ISF <= 5',
      protectionCoreDetails: '5P10, 15VA, ALF >= 10',
      ctMake: 'Kappa / Pragati / Kalpa',
      ctModel: 'Indoor Block Type',
      ctApprovalStatus: 'Draft',

      ptType: '3-Phase 3-Limb Cast Resin Voltage Transformer',
      ptRatio: '11000/sqrt(3) V : 110/sqrt(3) V',
      primaryVoltage: '11000 V',
      secondaryVoltage: '110 V',
      ptAccuracy: 'Class 0.5',
      ptBurden: '50 VA per phase',
      ptMake: 'Kappa / Pragati',
      ptModel: 'Drawout Carriage with Primary HRC Fuses',
      ptApprovalStatus: 'Draft',

      relayType: 'Numerical Multi-Function Feeder Protection Relay',
      relayMake: 'Schneider Electric / ABB / Siemens',
      relayModel: 'MiCOM P122 / REF615',
      protectionFunctions: 'ANSI 50/51 Non-Directional Overcurrent, 50N/51N Earth Fault, 50BF Breaker Failure',
      communicationProtocol: 'IEC 61850 / Modbus RS-485 RTU',
      relayApprovalStatus: 'Draft',

      meterMake: 'Schneider / Secure / Rishabh',
      meterModel: 'Digital Multi-Function Energy Meter Class 0.5s',
      meteringRequirements: 'V, I, PF, Freq, kW, kVA, kWh, kVARh with RS485 Modbus Port',

      vcbSpecification: `11kV, ${primaryProduct.currentRating || '630A'}, 26.3kA, 3-Pole Vacuum Circuit Breaker with 230V AC Motorized Spring Mechanism, Shunt Trip, and Anti-Pumping Relay`,
      controlVoltage: '110V DC / 230V AC Auxiliary Supply',
      spaceHeaterAndThermostat: '230V AC 80W Space Heater with Rotary Control Switch and Dial Thermostat',

      installationLocation: order.siteAddress || 'Works / Delivery Site, Tamil Nadu',
      customerStandard: 'TANGEDCO / CPWD / OEM Standard Specifications',
      applicableStandards: 'IEC 62271-200 / IEC 62271-100 / IS 13118 / IS 3427',
      environmentalRequirements: 'Max Ambient: 45°C, Design Ambient: 40°C, Relative Humidity: 95%, Altitude: <1000m',
      specialCustomerRequirements: order.customerPO?.customerRemarks || 'Standard Switchgear Manufacturing Spec',
      engineeringRemarks: technicalRemarks || 'Project initiated from Sales Order.'
    };

    const calculatedTargetDate = targetDate
      ? new Date(targetDate)
      : order.deliveryCommitment?.expectedDeliveryDate
      ? new Date(new Date(order.deliveryCommitment.expectedDeliveryDate).getTime() - 21 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const project = new EngineeringProject({
      projectNumber,
      salesOrderId: order._id,
      orderNumber: order.orderNumber,
      customerPO: order.customerPO?.poNumber || '',
      quotationNumber: order.quotationNumber || '',
      clientId: order.clientId?._id || order.clientId,
      customerName: order.customerName,
      customerCode: order.customerCode,
      projectName: order.projectTitle,
      endUser: order.endUser || 'Direct Industrial Supply',
      assignedEngineer: assignedEngineerId || req.user?._id,
      assignedEngineerName: engineerName,
      priority,
      status: PROJECT_STATUSES.DRAWING_PREPARATION,
      startDate: new Date(),
      targetDate: calculatedTargetDate,
      technicalRemarks,
      technicalSpecs,
      timeline: [
        {
          event: 'Engineering Project Created',
          user: req.user?._id,
          userName: req.user?.name || 'Operations Lead',
          role: req.user?.role || 'Admin',
          timestamp: new Date(),
          notes: `Engineering Project ${projectNumber} created from Sales Order ${order.orderNumber}. Technical specifications imported.`
        }
      ],
      createdBy: req.user?._id
    });

    await project.save();

    // Automatically generate the 5 standard switchgear drawings required for customer approval
    const defaultDrawings = [
      {
        type: 'GA',
        title: `General Arrangement (GA) Drawing - ${primaryProduct.voltageRating || '11kV'} VCB Panel Lineup`,
        panelNumber: 'Panel 01 - Main Lineup'
      },
      {
        type: 'SLD',
        title: `Single Line Diagram (SLD) & Power Circuit - ${order.projectTitle}`,
        panelNumber: 'All Panels'
      },
      {
        type: 'SCHEMATIC',
        title: 'AC / DC Control & Auxiliary Schematic Diagram',
        panelNumber: 'Panel 01 - Control Compartment'
      },
      {
        type: 'PROTECTION',
        title: 'Protection, Metering & CT/PT Secondary Connection Diagram',
        panelNumber: 'Panel 01 - Relay & Metering Door'
      },
      {
        type: 'FOUNDATION',
        title: 'Civil Foundation, Cable Trench & Cutout Drawing',
        panelNumber: 'Civil Scope'
      }
    ];

    for (const d of defaultDrawings) {
      const drawingNumber = await generateNextDrawingNumber(d.type);
      const dwg = new EngineeringDrawing({
        drawingNumber,
        drawingTitle: d.title,
        drawingType: d.type,
        projectId: project._id,
        projectNumber: project.projectNumber,
        salesOrderId: order._id,
        panelNumber: d.panelNumber,
        currentRevision: 'Rev 0',
        status: DRAWING_STATUSES.IN_PREPARATION,
        assignedEngineer: project.assignedEngineer,
        assignedEngineerName: project.assignedEngineerName,
        plannedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        technicalNotes: 'Standard engineering draft for internal review and customer approval.',
        revisions: [
          {
            revisionNumber: 'Rev 0',
            revisionDate: new Date(),
            description: 'Initial engineering draft generated from project scope',
            changeReason: 'Initial Release',
            preparedBy: project.assignedEngineer,
            preparedByName: project.assignedEngineerName,
            customerApproval: { status: 'Awaiting Submission' }
          }
        ],
        createdBy: req.user?._id
      });
      await dwg.save();
    }

    // Recalculate stats
    await recalculateProjectStats(project._id);

    // Update order with reference
    order.engineeringProjectId = project._id;
    order.engineeringStatus = 'Engineering In Progress';
    order.timeline.push({
      event: 'Engineering Project Initiated',
      status: order.status,
      notes: `Engineering project ${projectNumber} initiated. Drawings under preparation by ${engineerName}.`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Engineering Lead',
      timestamp: new Date()
    });
    await order.save();

    const populatedProject = await EngineeringProject.findById(project._id);

    return res.status(201).json({
      success: true,
      message: `Engineering Project ${projectNumber} created successfully with standard drawing register.`,
      project: populatedProject
    });
  } catch (error) {
    console.error('Error in createEngineeringProjectFromOrder:', error);
    return res.status(500).json({ success: false, message: 'Failed to create engineering project.', error: error.message });
  }
};

/**
 * 4. GET /api/engineering/projects/:id
 * Get full project details with drawings, submissions, clarifications
 */
export const getEngineeringProjectById = async (req, res) => {
  try {
    const project = await EngineeringProject.findById(req.params.id)
      .populate('salesOrderId')
      .populate('clientId')
      .populate('assignedEngineer', 'name email role phone');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Engineering Project not found.' });
    }

    const [drawings, submissions, clarifications] = await Promise.all([
      EngineeringDrawing.find({ projectId: project._id }).sort({ createdAt: 1 }),
      DrawingSubmission.find({ projectId: project._id }).sort({ submissionDate: -1 }),
      TechnicalClarification.find({ projectId: project._id }).sort({ createdAt: -1 })
    ]);

    return res.status(200).json({
      success: true,
      project,
      drawings,
      submissions,
      clarifications
    });
  } catch (error) {
    console.error('Error in getEngineeringProjectById:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch engineering project details.', error: error.message });
  }
};

/**
 * 5. PUT /api/engineering/projects/:id
 * Update project metadata, priority, engineer assignment, target date
 */
export const updateEngineeringProject = async (req, res) => {
  try {
    const project = await EngineeringProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Engineering Project not found.' });
    }

    const { assignedEngineerId, priority, status, targetDate, technicalRemarks } = req.body;

    let changesNote = [];
    if (assignedEngineerId && assignedEngineerId !== String(project.assignedEngineer)) {
      const user = await User.findById(assignedEngineerId);
      if (user) {
        project.assignedEngineer = user._id;
        project.assignedEngineerName = user.name;
        changesNote.push(`Assigned to ${user.name}`);
      }
    }

    if (priority && priority !== project.priority) {
      changesNote.push(`Priority changed from ${project.priority} to ${priority}`);
      project.priority = priority;
    }

    if (status && status !== project.status) {
      changesNote.push(`Status updated to ${status}`);
      project.status = status;
    }

    if (targetDate) {
      project.targetDate = new Date(targetDate);
      changesNote.push(`Target completion date updated to ${new Date(targetDate).toLocaleDateString('en-IN')}`);
    }

    if (technicalRemarks !== undefined) {
      project.technicalRemarks = technicalRemarks;
    }

    project.updatedBy = req.user?._id;

    if (changesNote.length > 0) {
      project.timeline.push({
        event: 'Engineering Project Updated',
        user: req.user?._id,
        userName: req.user?.name || 'Engineer',
        role: req.user?.role || 'Lead',
        timestamp: new Date(),
        notes: changesNote.join('; ')
      });
    }

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Engineering project updated successfully.',
      project
    });
  } catch (error) {
    console.error('Error in updateEngineeringProject:', error);
    return res.status(500).json({ success: false, message: 'Failed to update engineering project.', error: error.message });
  }
};

/**
 * 6. PUT /api/engineering/projects/:id/specs
 * Update structured technical specifications (CT, PT, relay, busbar, ratings)
 */
export const updateTechnicalSpecifications = async (req, res) => {
  try {
    const project = await EngineeringProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Engineering Project not found.' });
    }

    const { technicalSpecs, changeReason = 'Engineering specification refinement' } = req.body;
    if (!technicalSpecs) {
      return res.status(400).json({ success: false, message: 'Technical specifications payload is required.' });
    }

    const currentSpecs = project.technicalSpecs ? project.technicalSpecs.toObject() : {};
    const updatedSpecs = { ...currentSpecs, ...technicalSpecs };

    // Push revision record
    if (!updatedSpecs.specRevisions) updatedSpecs.specRevisions = [];
    updatedSpecs.specRevisions.push({
      revisionDate: new Date(),
      revisedBy: req.user?._id,
      revisedByName: req.user?.name || 'Design Engineer',
      changeDescription: `Updated specs: CT ${technicalSpecs.ctRatio || currentSpecs.ctRatio}, PT ${technicalSpecs.ptRatio || currentSpecs.ptRatio}, Relay ${technicalSpecs.relayModel || currentSpecs.relayModel}`,
      reason: changeReason
    });

    project.technicalSpecs = updatedSpecs;
    project.timeline.push({
      event: 'Technical Specifications Updated',
      user: req.user?._id,
      userName: req.user?.name || 'Design Engineer',
      role: req.user?.role || 'Engineer',
      timestamp: new Date(),
      notes: `Switchgear specs modified. Reason: ${changeReason}.`
    });

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Technical specifications saved successfully.',
      technicalSpecs: project.technicalSpecs
    });
  } catch (error) {
    console.error('Error in updateTechnicalSpecifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to update technical specifications.', error: error.message });
  }
};

/**
 * 7. GET /api/engineering/drawings
 * Centralized drawing register with filters
 */
export const getAllDrawings = async (req, res) => {
  try {
    const { projectId, drawingType, status, assignedEngineer, search, limit = 100, page = 1 } = req.query;

    const query = {};
    if (projectId) query.projectId = projectId;
    if (drawingType && drawingType !== 'ALL') query.drawingType = drawingType;
    if (status && status !== 'ALL') query.status = status;
    if (assignedEngineer) query.assignedEngineer = assignedEngineer;
    if (search) {
      const q = search.trim();
      query.$or = [
        { drawingNumber: { $regex: q, $options: 'i' } },
        { drawingTitle: { $regex: q, $options: 'i' } },
        { projectNumber: { $regex: q, $options: 'i' } },
        { panelNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const drawings = await EngineeringDrawing.find(query)
      .sort({ updatedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await EngineeringDrawing.countDocuments(query);

    return res.status(200).json({
      success: true,
      drawings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error in getAllDrawings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch drawings.', error: error.message });
  }
};

/**
 * 8. POST /api/engineering/drawings
 * Create new drawing in project register
 */
export const createDrawing = async (req, res) => {
  try {
    const { projectId, drawingTitle, drawingType = 'GA', panelNumber, plannedDate, technicalNotes } = req.body;

    if (!projectId || !drawingTitle) {
      return res.status(400).json({ success: false, message: 'Project ID and Drawing Title are required.' });
    }

    const project = await EngineeringProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Engineering Project not found.' });
    }

    const drawingNumber = await generateNextDrawingNumber(drawingType);

    const drawing = new EngineeringDrawing({
      drawingNumber,
      drawingTitle,
      drawingType,
      projectId: project._id,
      projectNumber: project.projectNumber,
      salesOrderId: project.salesOrderId,
      panelNumber: panelNumber || 'Panel 01',
      currentRevision: 'Rev 0',
      status: DRAWING_STATUSES.IN_PREPARATION,
      assignedEngineer: project.assignedEngineer,
      assignedEngineerName: project.assignedEngineerName,
      plannedDate: plannedDate ? new Date(plannedDate) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      technicalNotes: technicalNotes || '',
      revisions: [
        {
          revisionNumber: 'Rev 0',
          revisionDate: new Date(),
          description: 'Initial drawing registration',
          changeReason: 'New Drawing',
          preparedBy: project.assignedEngineer,
          preparedByName: project.assignedEngineerName
        }
      ],
      createdBy: req.user?._id
    });

    await drawing.save();

    project.timeline.push({
      event: 'New Drawing Created',
      user: req.user?._id,
      userName: req.user?.name || 'Engineer',
      role: req.user?.role || 'Design Engineer',
      timestamp: new Date(),
      notes: `Drawing ${drawingNumber} (${drawingTitle}) added to project register.`,
      drawingNumber
    });
    await project.save();

    await recalculateProjectStats(project._id);

    return res.status(201).json({
      success: true,
      message: `Drawing ${drawingNumber} created successfully.`,
      drawing
    });
  } catch (error) {
    console.error('Error in createDrawing:', error);
    return res.status(500).json({ success: false, message: 'Failed to create drawing.', error: error.message });
  }
};

/**
 * 9. POST /api/engineering/drawings/:id/upload
 * Upload drawing CAD / PDF file
 */
export const uploadDrawingFile = async (req, res) => {
  try {
    const drawing = await EngineeringDrawing.findById(req.params.id);
    if (!drawing) {
      return res.status(404).json({ success: false, message: 'Drawing not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype || 'application/pdf';

    drawing.fileUrl = fileUrl;
    drawing.fileName = fileName;
    drawing.fileSize = fileSize;
    drawing.fileType = fileType;
    drawing.status = DRAWING_STATUSES.INTERNAL_REVIEW;
    drawing.actualCompletionDate = new Date();

    // Update active revision
    if (drawing.revisions && drawing.revisions.length > 0) {
      const currentRev = drawing.revisions[drawing.revisions.length - 1];
      currentRev.fileUrl = fileUrl;
      currentRev.fileName = fileName;
      currentRev.fileSize = fileSize;
      currentRev.fileType = fileType;
    }

    await drawing.save();

    // Log to project
    await EngineeringProject.findByIdAndUpdate(drawing.projectId, {
      $push: {
        timeline: {
          event: 'Drawing File Uploaded',
          user: req.user?._id,
          userName: req.user?.name || 'Engineer',
          role: req.user?.role || 'Design Engineer',
          timestamp: new Date(),
          notes: `Drawing ${drawing.drawingNumber} (${drawing.currentRevision}) uploaded file "${fileName}". Ready for internal review.`,
          drawingNumber: drawing.drawingNumber
        }
      }
    });

    await recalculateProjectStats(drawing.projectId);

    return res.status(200).json({
      success: true,
      message: `Drawing file uploaded successfully. Drawing is now ready for Internal Engineering Review.`,
      drawing
    });
  } catch (error) {
    console.error('Error in uploadDrawingFile:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload drawing file.', error: error.message });
  }
};

/**
 * 10. POST /api/engineering/drawings/:id/review
 * Record internal engineering review checklist & decision
 */
export const recordInternalReview = async (req, res) => {
  try {
    const drawing = await EngineeringDrawing.findById(req.params.id);
    if (!drawing) {
      return res.status(404).json({ success: false, message: 'Drawing not found.' });
    }

    const { result = 'Approved', comments = '', reworkNotes = '', checklist = [] } = req.body;

    const reviewerName = req.user?.name || 'Quality & Engineering Reviewer';
    const reviewDate = new Date();

    drawing.internalReview = {
      reviewerName,
      reviewDate,
      result,
      comments,
      reworkNotes
    };

    if (result === 'Approved') {
      drawing.status = DRAWING_STATUSES.READY_FOR_SUBMISSION;
      drawing.checkedBy = req.user?._id;
      drawing.checkedByName = reviewerName;
      drawing.internalReviewDate = reviewDate;
    } else {
      drawing.status = DRAWING_STATUSES.REVISION_REQUIRED;
    }

    // Update revision entry
    if (drawing.revisions && drawing.revisions.length > 0) {
      const currentRev = drawing.revisions[drawing.revisions.length - 1];
      currentRev.internalReview = {
        reviewer: req.user?._id,
        reviewerName,
        reviewDate,
        result,
        comments,
        reworkNotes,
        checklist
      };
    }

    await drawing.save();

    await EngineeringProject.findByIdAndUpdate(drawing.projectId, {
      $push: {
        timeline: {
          event: result === 'Approved' ? 'Drawing Approved Internally' : 'Drawing Rework Requested',
          user: req.user?._id,
          userName: reviewerName,
          role: req.user?.role || 'Engineering Reviewer',
          timestamp: reviewDate,
          notes: `Internal review for ${drawing.drawingNumber}: ${result}. ${comments || reworkNotes}`,
          drawingNumber: drawing.drawingNumber
        }
      }
    });

    await recalculateProjectStats(drawing.projectId);

    return res.status(200).json({
      success: true,
      message: result === 'Approved' ? `Drawing approved internally and cleared for customer submission.` : `Rework requested. Returned to design engineer.`,
      drawing
    });
  } catch (error) {
    console.error('Error in recordInternalReview:', error);
    return res.status(500).json({ success: false, message: 'Failed to record internal review.', error: error.message });
  }
};

/**
 * 11. POST /api/engineering/drawings/:id/revision
 * Create new revision for drawing (Rev 0 -> Rev A -> Rev B)
 */
export const createDrawingRevision = async (req, res) => {
  try {
    const drawing = await EngineeringDrawing.findById(req.params.id);
    if (!drawing) {
      return res.status(404).json({ success: false, message: 'Drawing not found.' });
    }

    const { revisionNumber, description, changeReason } = req.body;

    const nextRev = revisionNumber || (drawing.currentRevision === 'Rev 0' ? 'Rev A' : `Rev ${String.fromCharCode(drawing.currentRevision.charCodeAt(4) + 1)}`);

    let fileUrl = drawing.fileUrl;
    let fileName = drawing.fileName;
    let fileSize = drawing.fileSize;
    let fileType = drawing.fileType;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      fileType = req.file.mimetype || 'application/pdf';
    }

    const newRev = {
      revisionNumber: nextRev,
      revisionDate: new Date(),
      description: description || 'Revised per review / customer comments',
      changeReason: changeReason || 'Customer Feedback / Engineering Modification',
      preparedBy: req.user?._id || drawing.assignedEngineer,
      preparedByName: req.user?.name || drawing.assignedEngineerName,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      customerApproval: { status: 'Awaiting Submission' }
    };

    drawing.revisions.push(newRev);
    drawing.currentRevision = nextRev;
    drawing.fileUrl = fileUrl;
    drawing.fileName = fileName;
    drawing.fileSize = fileSize;
    drawing.fileType = fileType;
    drawing.status = DRAWING_STATUSES.IN_PREPARATION;
    drawing.customerApproval.status = 'Awaiting Submission';

    await drawing.save();

    await EngineeringProject.findByIdAndUpdate(drawing.projectId, {
      $push: {
        timeline: {
          event: `Drawing Revision ${nextRev} Created`,
          user: req.user?._id,
          userName: req.user?.name || 'Design Engineer',
          role: req.user?.role || 'Engineer',
          timestamp: new Date(),
          notes: `New revision ${nextRev} created for ${drawing.drawingNumber}. Reason: ${changeReason || 'Revision requested'}`,
          drawingNumber: drawing.drawingNumber
        }
      }
    });

    await recalculateProjectStats(drawing.projectId);

    return res.status(200).json({
      success: true,
      message: `Revision ${nextRev} created successfully.`,
      drawing
    });
  } catch (error) {
    console.error('Error in createDrawingRevision:', error);
    return res.status(500).json({ success: false, message: 'Failed to create drawing revision.', error: error.message });
  }
};

/**
 * 12. POST /api/engineering/drawings/:id/customer-approval
 * Record customer approval, approval stamp/comments, or revision required
 */
export const recordCustomerApproval = async (req, res) => {
  try {
    const drawing = await EngineeringDrawing.findById(req.params.id);
    if (!drawing) {
      return res.status(404).json({ success: false, message: 'Drawing not found.' });
    }

    const { status = 'Approved', approvedBy = 'Customer Authority', comments = '', approvalDocumentUrl } = req.body;

    const responseDate = new Date();
    let approvalDocUrl = approvalDocumentUrl || '';
    if (req.file) {
      approvalDocUrl = `/uploads/${req.file.filename}`;
    }

    drawing.customerApproval = {
      status,
      responseDate,
      approvedBy,
      comments,
      approvalDocumentUrl: approvalDocUrl
    };

    if (status === 'Approved' || status === 'Approved with Comments') {
      drawing.status = DRAWING_STATUSES.APPROVED;
      drawing.customerApprovalDate = responseDate;
      drawing.approvedByName = approvedBy;
    } else if (status === 'Revision Required' || status === 'Rejected') {
      drawing.status = DRAWING_STATUSES.REVISION_REQUIRED;
    } else {
      drawing.status = DRAWING_STATUSES.UNDER_CUSTOMER_REVIEW;
    }

    if (drawing.revisions && drawing.revisions.length > 0) {
      const currentRev = drawing.revisions[drawing.revisions.length - 1];
      currentRev.customerApproval = {
        status,
        responseDate,
        approvedBy,
        comments,
        approvalDocumentUrl: approvalDocUrl
      };
    }

    await drawing.save();

    await EngineeringProject.findByIdAndUpdate(drawing.projectId, {
      $push: {
        timeline: {
          event: status === 'Approved' ? 'Customer Approval Received' : 'Customer Feedback / Revision Required',
          user: req.user?._id,
          userName: req.user?.name || 'Project Coordinator',
          role: req.user?.role || 'Lead',
          timestamp: responseDate,
          notes: `Customer approval status for ${drawing.drawingNumber}: ${status}. Notes: ${comments || 'Approved by customer'}`,
          drawingNumber: drawing.drawingNumber
        }
      }
    });

    await recalculateProjectStats(drawing.projectId);

    return res.status(200).json({
      success: true,
      message: `Customer approval recorded as "${status}".`,
      drawing
    });
  } catch (error) {
    console.error('Error in recordCustomerApproval:', error);
    return res.status(500).json({ success: false, message: 'Failed to record customer approval.', error: error.message });
  }
};

/**
 * 13. GET /api/engineering/submissions
 * List customer drawing submission packages
 */
export const getAllSubmissions = async (req, res) => {
  try {
    const { projectId, status, search, limit = 50, page = 1 } = req.query;

    const query = {};
    if (projectId) query.projectId = projectId;
    if (status && status !== 'ALL') query.status = status;
    if (search) {
      const q = search.trim();
      query.$or = [
        { submissionNumber: { $regex: q, $options: 'i' } },
        { projectNumber: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { emailReference: { $regex: q, $options: 'i' } }
      ];
    }

    const submissions = await DrawingSubmission.find(query)
      .sort({ submissionDate: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await DrawingSubmission.countDocuments(query);

    return res.status(200).json({
      success: true,
      submissions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error in getAllSubmissions:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch drawing submissions.', error: error.message });
  }
};

/**
 * 14. POST /api/engineering/submissions
 * Create and issue drawing submission package to customer
 */
export const createDrawingSubmission = async (req, res) => {
  try {
    const {
      projectId,
      drawingIds = [],
      submissionType = 'INITIAL_SUBMISSION',
      revision = 'Rev 0',
      submissionRemarks = 'Customer Drawing Approval Set',
      emailReference = '',
      expectedCustomerResponseDate
    } = req.body;

    if (!projectId || drawingIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Project ID and at least one Drawing are required.' });
    }

    const project = await EngineeringProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Engineering Project not found.' });
    }

    const submissionNumber = await generateNextSubmissionNumber();

    const selectedDrawings = await EngineeringDrawing.find({ _id: { $in: drawingIds } });

    const submissionItems = selectedDrawings.map((d) => ({
      drawingId: d._id,
      drawingNumber: d.drawingNumber,
      drawingTitle: d.drawingTitle,
      revision: d.currentRevision,
      fileUrl: d.fileUrl,
      fileName: d.fileName,
      customerStatus: 'Under Review'
    }));

    const submission = new DrawingSubmission({
      submissionNumber,
      projectId: project._id,
      projectNumber: project.projectNumber,
      salesOrderId: project.salesOrderId,
      orderNumber: project.orderNumber,
      customerName: project.customerName,
      submissionDate: new Date(),
      submissionType,
      revision,
      submittedBy: req.user?._id,
      submittedByName: req.user?.name || 'Lead Design Engineer',
      submissionRemarks,
      emailReference,
      expectedCustomerResponseDate: expectedCustomerResponseDate ? new Date(expectedCustomerResponseDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: SUBMISSION_STATUSES.SUBMITTED,
      drawings: submissionItems,
      createdBy: req.user?._id
    });

    await submission.save();

    // Update status of all included drawings to SUBMITTED
    await EngineeringDrawing.updateMany(
      { _id: { $in: drawingIds } },
      {
        $set: {
          status: DRAWING_STATUSES.SUBMITTED,
          customerSubmissionDate: new Date(),
          'customerApproval.status': 'Under Review'
        }
      }
    );

    project.timeline.push({
      event: 'Drawing Submission Package Sent',
      user: req.user?._id,
      userName: req.user?.name || 'Design Lead',
      role: req.user?.role || 'Lead',
      timestamp: new Date(),
      notes: `Submission ${submissionNumber} sent to ${project.customerName} with ${selectedDrawings.length} drawing(s). Ref: ${emailReference || 'Direct dispatch'}.`,
      submissionNumber
    });
    await project.save();

    await recalculateProjectStats(project._id);

    return res.status(201).json({
      success: true,
      message: `Drawing Submission ${submissionNumber} generated and sent to customer.`,
      submission
    });
  } catch (error) {
    console.error('Error in createDrawingSubmission:', error);
    return res.status(500).json({ success: false, message: 'Failed to create drawing submission.', error: error.message });
  }
};

/**
 * 15. POST /api/engineering/submissions/:id/response
 * Record customer response for whole submission package
 */
export const recordSubmissionResponse = async (req, res) => {
  try {
    const submission = await DrawingSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission package not found.' });
    }

    const { overallStatus = 'Approved', comments = '', receivedBy = 'Customer Review Authority' } = req.body;

    let responseDocumentUrl = '';
    if (req.file) {
      responseDocumentUrl = `/uploads/${req.file.filename}`;
    }

    submission.customerResponse = {
      responseDate: new Date(),
      receivedBy,
      overallStatus,
      comments,
      responseDocumentUrl
    };

    submission.status = SUBMISSION_STATUSES.RESPONSE_RECEIVED;

    // Update drawing statuses accordingly
    const drawingIds = submission.drawings.map((d) => d.drawingId);
    if (overallStatus === 'Approved' || overallStatus === 'Approved with Comments') {
      await EngineeringDrawing.updateMany(
        { _id: { $in: drawingIds } },
        {
          $set: {
            status: DRAWING_STATUSES.APPROVED,
            customerApprovalDate: new Date(),
            'customerApproval.status': overallStatus,
            'customerApproval.comments': comments,
            'customerApproval.approvedBy': receivedBy,
            'customerApproval.approvalDocumentUrl': responseDocumentUrl
          }
        }
      );
    } else if (overallStatus === 'Revision Required' || overallStatus === 'Rejected') {
      await EngineeringDrawing.updateMany(
        { _id: { $in: drawingIds } },
        {
          $set: {
            status: DRAWING_STATUSES.REVISION_REQUIRED,
            'customerApproval.status': overallStatus,
            'customerApproval.comments': comments
          }
        }
      );
    }

    await submission.save();

    await recalculateProjectStats(submission.projectId);

    return res.status(200).json({
      success: true,
      message: `Customer response recorded for submission ${submission.submissionNumber}.`,
      submission
    });
  } catch (error) {
    console.error('Error in recordSubmissionResponse:', error);
    return res.status(500).json({ success: false, message: 'Failed to record submission response.', error: error.message });
  }
};

/**
 * 16. GET /api/engineering/clarifications
 * List technical clarifications
 */
export const getAllClarifications = async (req, res) => {
  try {
    const { projectId, status, clarificationType, priority, search, limit = 50, page = 1 } = req.query;

    const query = {};
    if (projectId) query.projectId = projectId;
    if (status && status !== 'ALL') query.status = status;
    if (clarificationType && clarificationType !== 'ALL') query.clarificationType = clarificationType;
    if (priority && priority !== 'ALL') query.priority = priority;
    if (search) {
      const q = search.trim();
      query.$or = [
        { clarificationNumber: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { question: { $regex: q, $options: 'i' } },
        { projectNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const clarifications = await TechnicalClarification.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await TechnicalClarification.countDocuments(query);

    return res.status(200).json({
      success: true,
      clarifications,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error in getAllClarifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch clarifications.', error: error.message });
  }
};

/**
 * 17. POST /api/engineering/clarifications
 * Create technical clarification ticket
 */
export const createTechnicalClarification = async (req, res) => {
  try {
    const {
      projectId,
      drawingId,
      clarificationType = 'ELECTRICAL',
      subject,
      question,
      assignedEngineerId,
      priority = 'MEDIUM',
      dueDate
    } = req.body;

    if (!projectId || !subject || !question) {
      return res.status(400).json({ success: false, message: 'Project, Subject, and Question are required.' });
    }

    const project = await EngineeringProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Engineering Project not found.' });
    }

    let drawingNumber = '';
    if (drawingId) {
      const dwg = await EngineeringDrawing.findById(drawingId);
      if (dwg) drawingNumber = dwg.drawingNumber;
    }

    let engineerName = 'Lead Electrical Engineer';
    if (assignedEngineerId) {
      const eng = await User.findById(assignedEngineerId);
      if (eng) engineerName = eng.name;
    }

    const clarificationNumber = await generateNextClarificationNumber();

    const clarification = new TechnicalClarification({
      clarificationNumber,
      projectId: project._id,
      projectNumber: project.projectNumber,
      salesOrderId: project.salesOrderId,
      orderNumber: project.orderNumber,
      drawingId: drawingId || null,
      drawingNumber,
      clarificationType,
      subject,
      raisedBy: req.user?.name || 'Design Team',
      question,
      assignedEngineer: assignedEngineerId || req.user?._id,
      assignedEngineerName: engineerName,
      priority,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: CLARIFICATION_STATUSES.OPEN,
      createdBy: req.user?._id
    });

    await clarification.save();

    project.timeline.push({
      event: 'Technical Clarification Raised',
      user: req.user?._id,
      userName: req.user?.name || 'Engineer',
      role: req.user?.role || 'Design Engineer',
      timestamp: new Date(),
      notes: `Clarification ${clarificationNumber}: "${subject}" raised for ${clarificationType}.`
    });
    await project.save();

    await recalculateProjectStats(project._id);

    return res.status(201).json({
      success: true,
      message: `Technical Clarification ${clarificationNumber} raised successfully.`,
      clarification
    });
  } catch (error) {
    console.error('Error in createTechnicalClarification:', error);
    return res.status(500).json({ success: false, message: 'Failed to create clarification.', error: error.message });
  }
};

/**
 * 18. PUT /api/engineering/clarifications/:id
 * Answer, resolve, or close technical clarification
 */
export const updateTechnicalClarification = async (req, res) => {
  try {
    const clarification = await TechnicalClarification.findById(req.params.id);
    if (!clarification) {
      return res.status(404).json({ success: false, message: 'Clarification not found.' });
    }

    const { internalResponse, customerResponse, status, priority } = req.body;

    if (internalResponse !== undefined) clarification.internalResponse = internalResponse;
    if (customerResponse !== undefined) clarification.customerResponse = customerResponse;
    if (priority) clarification.priority = priority;

    if (status) {
      clarification.status = status;
      if (status === CLARIFICATION_STATUSES.RESOLVED || status === CLARIFICATION_STATUSES.CLOSED) {
        clarification.resolvedDate = new Date();
      }
    }

    clarification.updatedBy = req.user?._id;
    await clarification.save();

    await recalculateProjectStats(clarification.projectId);

    return res.status(200).json({
      success: true,
      message: 'Technical clarification updated.',
      clarification
    });
  } catch (error) {
    console.error('Error in updateTechnicalClarification:', error);
    return res.status(500).json({ success: false, message: 'Failed to update clarification.', error: error.message });
  }
};

/**
 * 19. POST /api/engineering/seed-samples
 * Seeds authentic switchgear engineering projects from existing confirmed orders
 */
export const seedSampleEngineeringProjects = async (req, res) => {
  try {
    const orders = await SalesOrder.find().limit(5);
    const existingProjects = await EngineeringProject.find();

    if (existingProjects.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Engineering projects already present.',
        count: existingProjects.length
      });
    }

    let createdCount = 0;
    for (const order of orders) {
      const projectNumber = await generateNextEngineeringProjectNumber();
      const primaryProduct = order.products?.[0] || {};

      const project = new EngineeringProject({
        projectNumber,
        salesOrderId: order._id,
        orderNumber: order.orderNumber,
        customerPO: order.customerPO?.poNumber || '',
        quotationNumber: order.quotationNumber || '',
        clientId: order.clientId,
        customerName: order.customerName,
        customerCode: order.customerCode,
        projectName: order.projectTitle,
        endUser: order.endUser || 'Direct Industrial Supply',
        assignedEngineerName: 'Senior Design Engineer (Electrical)',
        priority: 'HIGH',
        status: PROJECT_STATUSES.CUSTOMER_REVIEW,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        targetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        technicalRemarks: 'Auto-seeded switchgear engineering project.',
        technicalSpecs: {
          equipmentType: primaryProduct.productName || '11kV HT Switchboard',
          voltageRating: primaryProduct.voltageRating || '11 kV',
          currentRating: primaryProduct.currentRating || '630 A',
          shortCircuitRating: primaryProduct.breakingCapacity || '26.3 kA',
          ctRatio: '200-100/5-5A',
          ptRatio: '11000/sqrt(3) V : 110/sqrt(3) V',
          relayModel: 'MiCOM P122',
          meterModel: 'Schneider MFM Class 0.5s'
        },
        timeline: [
          {
            event: 'Engineering Project Seeded',
            userName: 'System Admin',
            role: 'Admin',
            timestamp: new Date(),
            notes: `Project ${projectNumber} linked with Sales Order ${order.orderNumber}.`
          }
        ]
      });

      await project.save();

      // Create standard drawings
      const defaultDrawings = [
        { type: 'GA', title: `General Arrangement (GA) Drawing - ${primaryProduct.voltageRating || '11kV'} Panel` },
        { type: 'SLD', title: `Single Line Diagram (SLD) & Power Circuit` },
        { type: 'SCHEMATIC', title: 'AC / DC Control & Auxiliary Schematic Diagram' },
        { type: 'PROTECTION', title: 'Protection & Metering CT/PT Connection Diagram' }
      ];

      for (const d of defaultDrawings) {
        const drawingNumber = await generateNextDrawingNumber(d.type);
        const dwg = new EngineeringDrawing({
          drawingNumber,
          drawingTitle: d.title,
          drawingType: d.type,
          projectId: project._id,
          projectNumber: project.projectNumber,
          salesOrderId: order._id,
          panelNumber: 'Panel 01 - Main Lineup',
          currentRevision: 'Rev 0',
          status: DRAWING_STATUSES.SUBMITTED,
          assignedEngineerName: 'Senior Design Engineer',
          plannedDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          customerSubmissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          revisions: [
            {
              revisionNumber: 'Rev 0',
              revisionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              description: 'Initial engineering draft',
              changeReason: 'Initial Release',
              preparedByName: 'Senior Design Engineer'
            }
          ]
        });
        await dwg.save();
      }

      await recalculateProjectStats(project._id);
      createdCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Seeded ${createdCount} sample engineering projects successfully.`,
      count: createdCount
    });
  } catch (error) {
    console.error('Error in seedSampleEngineeringProjects:', error);
    return res.status(500).json({ success: false, message: 'Failed to seed sample engineering projects.', error: error.message });
  }
};
