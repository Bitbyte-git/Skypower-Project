import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Client } from '../models/Client.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { ProjectWorkflow } from '../models/ProjectWorkflow.js';
import { CustomerPayment } from '../models/CustomerPayment.js';
import { EngineeringDrawing } from '../models/EngineeringDrawing.js';
import { USER_ROLES } from '../constants/roles.js';
import { ENV } from '../config/env.js';

// Customer Workflow 10 Milestone Stages (Customer Friendly)
const CUSTOMER_WORKFLOW_STAGES = [
  { seq: 1, code: 'SALES', title: 'Order Received', desc: 'Commercial quotation confirmed and technical enquiry registered.' },
  { seq: 2, code: 'PO_TEAM', title: 'PO Verification', desc: 'Customer Purchase Order verified against technical specifications.' },
  { seq: 3, code: 'ACCOUNTANT', title: 'Advance Payment', desc: 'Commercial invoice created and advance payment cleared.' },
  { seq: 4, code: 'DRAWING', title: 'Engineering & Drawings', desc: 'GA, SLD, and Schematic switchgear drawings prepared by design engineers.' },
  { seq: 5, code: 'CT_PT', title: 'CT / PT & Protection Specs', desc: 'Instrument transformer ratios and protection relay parameters validated.' },
  { seq: 6, code: 'FABRICATION', title: 'Panel Fabrication', desc: 'Sheet metal CNC punching, bending, 7-tank pretreatment, and powder coating.' },
  { seq: 7, code: 'BUSBAR', title: 'Busbar & Primary Assembly', desc: 'Electrolytic copper busbar fabrication, sleeving, and VCB drawout carriage integration.' },
  { seq: 8, code: 'WIRING', title: 'Metering & Secondary Wiring', desc: 'Relay, digital energy meter, and control circuit wiring completion.' },
  { seq: 9, code: 'TESTING', title: 'Routine Testing & Inspection', desc: 'High voltage insulation, breaker timing, contact resistance, and primary injection tests.' },
  { seq: 10, code: 'DISPATCH', title: 'Ready for Dispatch & Delivery', desc: 'Quality clearance certificate issued, transit packing, and site delivery dispatch.' }
];

// Helper: map ProjectWorkflow stage to customer milestone status
const mapWorkflowToCustomerStages = (workflow, order) => {
  const currentSeq = workflow?.currentDepartmentSequence || (order?.status === 'Verified' ? 3 : 1);
  const isCompleted = workflow?.overallStatus === 'COMPLETED' || order?.status === 'Completed';

  return CUSTOMER_WORKFLOW_STAGES.map((stage) => {
    let status = 'UPCOMING';
    let completedAt = null;

    if (isCompleted || stage.seq < currentSeq) {
      status = 'COMPLETED';
      completedAt = workflow?.updatedAt || order?.updatedAt;
    } else if (stage.seq === currentSeq) {
      status = 'IN_PROGRESS';
    }

    return {
      sequence: stage.seq,
      code: stage.code,
      title: stage.title,
      description: stage.desc,
      status,
      completedAt: status === 'COMPLETED' ? completedAt : null
    };
  });
};

const calculateOrderTotal = (order) => {
  if (order.totalAmount && Number(order.totalAmount) > 0) return Number(order.totalAmount);
  if (order.commercialPricing?.netPayableAmount && Number(order.commercialPricing.netPayableAmount) > 0) {
    return Number(order.commercialPricing.netPayableAmount);
  }
  if (order.commercialPricing?.totalBasicPrice && Number(order.commercialPricing.totalBasicPrice) > 0) {
    return Number(order.commercialPricing.totalBasicPrice);
  }
  if (order.products && order.products.length > 0) {
    return order.products.reduce((acc, p) => {
      const basic = Number(p.totalPrice || (p.unitPrice * (p.quantity || 1)) || 0);
      const taxRate = p.taxRatePercent !== undefined ? p.taxRatePercent : 18;
      const tax = (basic * taxRate) / 100;
      return acc + basic + tax;
    }, 0);
  }
  return 0;
};

const assembleCustomerPayments = (rawPayments, orders) => {
  const list = [...rawPayments];
  for (const order of orders) {
    const enq = order.enquiryId;
    if (enq?.advancePaymentDetails?.amount) {
      const adv = enq.advancePaymentDetails;
      const exists = list.some(
        (p) => p.transactionReference === adv.referenceNumber || p.orderId?.toString() === order._id.toString()
      );
      if (!exists) {
        list.push({
          _id: `adv-${order._id}`,
          receiptNumber: `REC-ADV-${order.orderNumber.replace(/[^0-9]/g, '') || '0001'}`,
          receiptDate: adv.clearedAt || adv.paymentDate || order.createdAt,
          orderId: order._id,
          orderNumber: order.orderNumber,
          amount: Number(adv.amount),
          paymentMode: adv.paymentMode || 'UPI',
          bankName: adv.bankName || 'HDFC Bank',
          transactionReference: adv.referenceNumber || 'UTR-CLEARED',
          status: 'Cleared',
          paymentType: 'ADVANCE',
          remarks: 'Advance payment received & verified by Accounts'
        });
      }
    }
  }
  return list;
};

/* =========================================================================
   1. CUSTOMER PUBLIC AUTHENTICATION CONTROLLER
   ========================================================================= */

/**
 * POST /api/portal/auth/login
 * Dedicated Customer Portal Login
 */
export const customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || user.role !== USER_ROLES.CUSTOMER) {
      return res.status(401).json({
        success: false,
        message: 'Invalid customer email credentials or account does not exist.'
      });
    }

    if (!user.isActive || user.portalStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your Customer Portal account is currently inactive or suspended. Please contact Sky Power support.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check and try again.'
      });
    }

    // Verify linked client record
    const client = await Client.findById(user.clientId);
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'Customer profile mapping not found. Please contact support.'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, clientId: client._id },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Welcome to Sky Power Customer Portal',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: client._id,
        clientCode: client.clientId,
        companyName: client.companyName || user.companyName,
        contactPerson: client.contactPerson,
        phone: client.mobile || user.phone,
        clientLocation: client.clientLocation,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    console.error('Error in customerLogin:', err);
    return res.status(500).json({ success: false, message: 'Server error during customer login.', error: err.message });
  }
};

/**
 * POST /api/portal/auth/forgot-password
 * Request password reset token
 */
export const customerForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim(), role: USER_ROLES.CUSTOMER });
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetToken // Returned for development/demo ease without mandatory SMTP service
    });
  } catch (err) {
    console.error('Error in customerForgotPassword:', err);
    return res.status(500).json({ success: false, message: 'Failed to process password reset.', error: err.message });
  }
};

/**
 * POST /api/portal/auth/reset-password
 * Set new password with valid token
 */
export const customerResetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid token and minimum 6 character password required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
      role: USER_ROLES.CUSTOMER
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.portalStatus = 'ACTIVE';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You may now login to your customer portal.'
    });
  } catch (err) {
    console.error('Error in customerResetPassword:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password.', error: err.message });
  }
};

/**
 * POST /api/portal/auth/activate
 * Customer activates account from invitation token and sets their password
 */
export const customerActivateAccount = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Valid activation token and password (min 6 chars) required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      activationToken: hashedToken,
      activationTokenExpires: { $gt: Date.now() },
      role: USER_ROLES.CUSTOMER
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Activation token is invalid or has expired.' });
    }

    user.password = password;
    user.portalStatus = 'ACTIVE';
    user.isActive = true;
    user.activationToken = undefined;
    user.activationTokenExpires = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Update Client record
    if (user.clientId) {
      await Client.findByIdAndUpdate(user.clientId, {
        'portalAccess.status': 'ACTIVE',
        'portalAccess.activatedAt': new Date()
      });
    }

    const client = await Client.findById(user.clientId);
    const authToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email, clientId: user.clientId },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Account activated successfully! Welcome to Sky Power Customer Portal.',
      token: authToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        companyName: client?.companyName || user.companyName,
        contactPerson: client?.contactPerson
      }
    });
  } catch (err) {
    console.error('Error in customerActivateAccount:', err);
    return res.status(500).json({ success: false, message: 'Account activation failed.', error: err.message });
  }
};

/* =========================================================================
   2. CUSTOMER PORTAL DATA CONTROLLER (WITH STRICT CLIENT ISOLATION)
   ========================================================================= */

/**
 * GET /api/portal/dashboard
 * Dynamic Customer Dashboard Overview
 */
export const getCustomerDashboard = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    if (!clientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: No linked customer record.' });
    }

    const [client, orders, rawPayments] = await Promise.all([
      Client.findById(clientId),
      SalesOrder.find({ clientId }).populate('enquiryId').sort({ createdAt: -1 }),
      CustomerPayment.find({ clientId }).sort({ receiptDate: -1 })
    ]);

    const payments = assembleCustomerPayments(rawPayments, orders);

    const orderIds = orders.map((o) => o._id);
    const drawings = await EngineeringDrawing.find({
      salesOrderId: { $in: orderIds },
      status: { $in: ['Approved', 'Submitted', 'Under Customer Review'] }
    }).sort({ updatedAt: -1 });

    // Calculate Financial Summary
    let totalOrderValue = 0;
    orders.forEach((o) => {
      totalOrderValue += calculateOrderTotal(o);
    });

    let totalPaid = 0;
    payments.forEach((p) => {
      totalPaid += Number(p.amount || 0);
    });

    const pendingBalance = Math.max(0, totalOrderValue - totalPaid);

    // Order Counts
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'Completed').length;
    const inProductionOrders = orders.filter((o) => ['Verified', 'Order Confirmed', 'PO Received'].includes(o.status)).length;
    const pendingOrders = orders.filter((o) => ['Awaiting PO', 'Under Verification'].includes(o.status)).length;

    // Recent 5 Orders with workflow status
    const recentOrders = await Promise.all(
      orders.slice(0, 5).map(async (order) => {
        const workflow = await ProjectWorkflow.findOne({
          $or: [{ salesOrderId: order._id }, { enquiryId: order.enquiryId?._id || order.enquiryId }]
        });

        const orderPayments = payments.filter((p) => p.orderId?.toString() === order._id.toString());
        const orderPaid = orderPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const orderVal = calculateOrderTotal(order);

        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          projectTitle: order.projectTitle,
          orderDate: order.orderDate || order.createdAt,
          expectedDeliveryDate: order.deliveryCommitment?.expectedDeliveryDate,
          status: order.status,
          totalAmount: orderVal,
          paidAmount: orderPaid,
          balanceAmount: Math.max(0, orderVal - orderPaid),
          workflowStage: workflow?.currentDepartmentCode || 'SALES',
          completionPercentage: workflow?.completionPercentage || 20,
          productName: order.products?.[0]?.productName || 'Switchboard Lineup',
          quantity: order.products?.[0]?.quantity || 1
        };
      })
    );

    // Customer-Visible Recent Approved Drawings (Top 5)
    const recentDocuments = drawings.slice(0, 5).map((d) => ({
      _id: d._id,
      drawingNumber: d.drawingNumber,
      drawingTitle: d.drawingTitle,
      drawingType: d.drawingType,
      currentRevision: d.currentRevision,
      status: d.status,
      fileUrl: d.fileUrl,
      updatedAt: d.updatedAt
    }));

    return res.status(200).json({
      success: true,
      client: {
        companyName: client?.companyName || req.user.companyName,
        contactPerson: client?.contactPerson || req.user.name,
        clientCode: client?.clientId,
        location: client?.clientLocation
      },
      kpis: {
        totalOrders,
        pendingOrders,
        inProductionOrders,
        completedOrders,
        approvedDrawings: drawings.filter((d) => d.status === 'Approved').length,
        totalOrderValue,
        totalPaid,
        pendingBalance
      },
      recentOrders,
      recentDocuments,
      recentPayments: payments.slice(0, 5)
    });
  } catch (err) {
    console.error('Error in getCustomerDashboard:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.', error: err.message });
  }
};

/**
 * GET /api/portal/orders
 * List Orders for the Authenticated Customer ONLY
 */
export const getCustomerOrders = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { status, search } = req.query;

    const query = { clientId };

    if (status && status !== 'ALL') {
      if (status === 'IN_PROGRESS') {
        query.status = { $in: ['Verified', 'Order Confirmed', 'PO Received'] };
      } else if (status === 'COMPLETED') {
        query.status = 'Completed';
      } else if (status === 'PENDING') {
        query.status = { $in: ['Awaiting PO', 'Under Verification'] };
      } else if (status === 'CANCELLED') {
        query.status = 'Cancelled';
      }
    }

    if (search) {
      const q = search.trim();
      query.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { projectTitle: { $regex: q, $options: 'i' } },
        { customerCode: { $regex: q, $options: 'i' } }
      ];
    }

    const orders = await SalesOrder.find(query).populate('enquiryId').sort({ createdAt: -1 });
    const rawPayments = await CustomerPayment.find({ clientId });
    const payments = assembleCustomerPayments(rawPayments, orders);

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const workflow = await ProjectWorkflow.findOne({
          $or: [{ salesOrderId: order._id }, { enquiryId: order.enquiryId?._id || order.enquiryId }]
        });

        const orderPayments = payments.filter((p) => p.orderId?.toString() === order._id.toString());
        const paidAmount = orderPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const totalAmount = calculateOrderTotal(order);

        return {
          _id: order._id,
          orderNumber: order.orderNumber,
          projectTitle: order.projectTitle,
          orderDate: order.orderDate || order.createdAt,
          expectedDeliveryDate: order.deliveryCommitment?.expectedDeliveryDate,
          siteAddress: order.siteAddress,
          status: order.status,
          totalAmount,
          paidAmount,
          balanceAmount: Math.max(0, totalAmount - paidAmount),
          products: order.products?.map((p) => ({
            productName: p.productName,
            productDescription: p.productDescription,
            voltageRating: p.voltageRating,
            currentRating: p.currentRating,
            quantity: p.quantity,
            unit: p.unit
          })),
          workflowStage: workflow?.currentDepartmentCode || 'SALES',
          completionPercentage: workflow?.completionPercentage || 20
        };
      })
    );

    return res.status(200).json({
      success: true,
      orders: ordersWithDetails
    });
  } catch (err) {
    console.error('Error in getCustomerOrders:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch customer orders.', error: err.message });
  }
};

/**
 * GET /api/portal/orders/:id
 * Detailed Customer Order View (STRICT CUSTOMER ISOLATION)
 */
export const getCustomerOrderById = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const { id } = req.params;

    // STRICT ISOLATION: Must match BOTH order _id AND authenticated customer's clientId
    const order = await SalesOrder.findOne({ _id: id, clientId }).populate('enquiryId');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you are not authorized to view this record.'
      });
    }

    const [workflow, drawings, rawPayments] = await Promise.all([
      ProjectWorkflow.findOne({
        $or: [{ salesOrderId: order._id }, { enquiryId: order.enquiryId?._id || order.enquiryId }]
      }),
      EngineeringDrawing.find({
        salesOrderId: order._id,
        status: { $in: ['Approved', 'Submitted', 'Under Customer Review', 'In Preparation'] }
      }),
      CustomerPayment.find({ orderId: order._id, clientId })
    ]);

    const payments = assembleCustomerPayments(rawPayments, [order]);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalAmount = calculateOrderTotal(order);

    const stages = mapWorkflowToCustomerStages(workflow, order);

    // Customer-Sanitized Specs (NO INTERNAL BOM, VENDOR COSTS, OR PRIVATE MARGINS)
    const sanitizedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      projectTitle: order.projectTitle,
      orderDate: order.orderDate || order.createdAt,
      customerPO: order.customerPO?.poNumber,
      poDate: order.customerPO?.poDate,
      expectedDeliveryDate: order.deliveryCommitment?.expectedDeliveryDate,
      deliveryTerms: order.deliveryCommitment?.deliveryTerms || 'FOR Site Delivery',
      siteAddress: order.siteAddress,
      status: order.status,
      financials: {
        totalAmount,
        advancePaid: payments.find((p) => p.paymentType === 'ADVANCE')?.amount || 0,
        totalPaid,
        pendingBalance: Math.max(0, totalAmount - totalPaid),
        paymentStatus: totalPaid >= totalAmount ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING'
      },
      products: order.products?.map((p) => ({
        productName: p.productName,
        productDescription: p.productDescription,
        voltageRating: p.voltageRating,
        currentRating: p.currentRating,
        breakingCapacity: p.breakingCapacity,
        durationSec: p.durationSec,
        usage: p.usage,
        panelType: p.panelType,
        quantity: p.quantity,
        unit: p.unit,
        ctSpecification: p.ctSpecification,
        ptSpecification: p.ptSpecification,
        relaySpecification: p.relaySpecification,
        meteringSpecification: p.meteringSpecification
      })),
      drawings: drawings.map((d) => ({
        _id: d._id,
        drawingNumber: d.drawingNumber,
        drawingTitle: d.drawingTitle,
        drawingType: d.drawingType,
        currentRevision: d.currentRevision,
        status: d.status,
        fileUrl: d.fileUrl,
        updatedAt: d.updatedAt
      })),
      payments: payments.map((p) => ({
        receiptNumber: p.receiptNumber,
        receiptDate: p.receiptDate,
        amount: p.amount,
        paymentMode: p.paymentMode,
        bankName: p.bankName,
        transactionReference: p.transactionReference,
        status: p.status
      })),
      stages,
      workflow: {
        currentDepartmentCode: workflow?.currentDepartmentCode || 'SALES',
        completionPercentage: workflow?.completionPercentage || 20
      }
    };

    return res.status(200).json({
      success: true,
      order: sanitizedOrder
    });
  } catch (err) {
    console.error('Error in getCustomerOrderById:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order details.', error: err.message });
  }
};

/**
 * GET /api/portal/documents
 * All Customer-Permitted Documents & Drawings
 */
export const getCustomerDocuments = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const orders = await SalesOrder.find({ clientId }).select('_id orderNumber projectTitle');
    const orderIds = orders.map((o) => o._id);

    // Fetch permitted drawings
    const drawings = await EngineeringDrawing.find({
      salesOrderId: { $in: orderIds },
      status: { $in: ['Approved', 'Submitted', 'Under Customer Review'] }
    }).sort({ updatedAt: -1 });

    const orderMap = {};
    orders.forEach((o) => {
      orderMap[o._id.toString()] = o;
    });

    const documents = drawings.map((d) => {
      const order = orderMap[d.salesOrderId?.toString()];
      return {
        _id: d._id,
        documentName: d.drawingTitle,
        documentNumber: d.drawingNumber,
        documentType: `Engineering Drawing (${d.drawingType})`,
        category: 'DRAWING',
        orderNumber: order?.orderNumber || '—',
        projectTitle: order?.projectTitle || '—',
        revision: d.currentRevision,
        status: d.status,
        fileUrl: d.fileUrl,
        uploadedDate: d.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      documents
    });
  } catch (err) {
    console.error('Error in getCustomerDocuments:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch customer documents.', error: err.message });
  }
};

/**
 * GET /api/portal/payments
 * Customer Payment Overview & Receipts
 */
export const getCustomerPayments = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const [orders, payments] = await Promise.all([
      SalesOrder.find({ clientId }),
      CustomerPayment.find({ clientId }).sort({ receiptDate: -1 })
    ]);

    let totalOrderValue = 0;
    orders.forEach((o) => {
      totalOrderValue += Number(o.commercialPricing?.netPayableAmount || o.totalAmount || 0);
    });

    let totalPaid = 0;
    payments.forEach((p) => {
      totalPaid += Number(p.amount || 0);
    });

    const pendingBalance = Math.max(0, totalOrderValue - totalPaid);

    return res.status(200).json({
      success: true,
      summary: {
        totalOrderValue,
        totalPaid,
        pendingBalance,
        totalReceipts: payments.length
      },
      payments: payments.map((p) => ({
        _id: p._id,
        receiptNumber: p.receiptNumber,
        receiptDate: p.receiptDate,
        orderNumber: p.orderNumber,
        amount: p.amount,
        paymentMode: p.paymentMode,
        bankName: p.bankName,
        transactionReference: p.transactionReference,
        status: p.status,
        remarks: p.remarks
      }))
    });
  } catch (err) {
    console.error('Error in getCustomerPayments:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment details.', error: err.message });
  }
};

/**
 * GET /api/portal/profile
 * View Customer Company & Contact Profile
 */
export const getCustomerProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.user.clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found.' });
    }

    return res.status(200).json({
      success: true,
      profile: {
        clientCode: client.clientId,
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        email: req.user.email,
        mobile: client.mobile,
        officePhone: client.officePhone,
        website: client.website,
        customerType: client.customerType,
        gstNumber: client.gstNumber,
        billingAddress: client.billingAddress,
        siteAddress: client.siteAddress,
        clientLocation: client.clientLocation,
        portalEnabledDate: client.portalAccess?.activatedAt
      }
    });
  } catch (err) {
    console.error('Error in getCustomerProfile:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.', error: err.message });
  }
};

/**
 * PUT /api/portal/profile
 * Update Permitted Customer Profile Fields
 */
export const updateCustomerProfile = async (req, res) => {
  try {
    const { contactPerson, mobile, officePhone, website } = req.body;
    const client = await Client.findById(req.user.clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client record not found.' });
    }

    if (contactPerson) client.contactPerson = contactPerson.trim();
    if (mobile) client.mobile = mobile.trim();
    if (officePhone !== undefined) client.officePhone = officePhone.trim();
    if (website !== undefined) client.website = website.trim();

    await client.save();

    // Also update User record display name
    await User.findByIdAndUpdate(req.user._id, { name: client.contactPerson });

    return res.status(200).json({
      success: true,
      message: 'Contact details updated successfully.',
      client
    });
  } catch (err) {
    console.error('Error in updateCustomerProfile:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.', error: err.message });
  }
};

/**
 * PUT /api/portal/change-password
 * Change Customer Password
 */
export const changeCustomerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Current password and new password (min 6 characters) required.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('Error in changeCustomerPassword:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password.', error: err.message });
  }
};

/**
 * GET /api/portal/notifications
 * Customer Order Notifications & Alerts
 */
export const getCustomerNotifications = async (req, res) => {
  try {
    const clientId = req.user.clientId;
    const orders = await SalesOrder.find({ clientId }).sort({ updatedAt: -1 });

    const notifications = [];
    orders.forEach((o) => {
      if (o.timeline && o.timeline.length > 0) {
        o.timeline.forEach((evt) => {
          notifications.push({
            orderNumber: o.orderNumber,
            projectTitle: o.projectTitle,
            event: evt.event,
            notes: evt.notes,
            timestamp: evt.timestamp
          });
        });
      }
    });

    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({
      success: true,
      notifications: notifications.slice(0, 20)
    });
  } catch (err) {
    console.error('Error in getCustomerNotifications:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.', error: err.message });
  }
};

/* =========================================================================
   3. INTERNAL ERP: CUSTOMER PORTAL MANAGEMENT CONTROLLER
   ========================================================================= */

/**
 * POST /api/clients/:id/portal-access
 * Internal Sales/Admin enables customer portal account for a client
 */
export const enableCustomerPortalAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const portalEmail = (email || client.email || '').toLowerCase().trim();
    if (!portalEmail) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required to enable portal access.'
      });
    }

    // Default password or custom provided
    const userPassword = password || 'SkyPower@2026';
    const activationToken = crypto.randomBytes(24).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    let user = await User.findOne({ email: portalEmail });
    if (user) {
      // If user exists, update role and link client
      user.role = USER_ROLES.CUSTOMER;
      user.clientId = client._id;
      user.companyName = client.companyName;
      user.name = client.contactPerson;
      user.isActive = true;
      user.portalStatus = 'ACTIVE';
      user.activationToken = activationToken;
      user.activationTokenExpires = activationExpires;
      if (password) user.password = password;
      await user.save();
    } else {
      user = await User.create({
        name: client.contactPerson || client.companyName,
        email: portalEmail,
        password: userPassword,
        role: USER_ROLES.CUSTOMER,
        clientId: client._id,
        companyName: client.companyName,
        phone: client.mobile || '9876543210',
        department: 'Customer Access',
        portalStatus: 'ACTIVE',
        isActive: true,
        activationToken,
        activationTokenExpires: activationExpires
      });
    }

    // Update Client portal status
    client.portalAccess = {
      enabled: true,
      portalUserId: user._id,
      portalEmail,
      activatedAt: new Date(),
      status: 'ACTIVE'
    };
    await client.save();

    return res.status(200).json({
      success: true,
      message: `Customer portal enabled successfully for ${client.companyName}.`,
      credentials: {
        loginUrl: '/customer/login',
        activationUrl: `/customer/activate?token=${activationToken}`,
        activationToken,
        email: portalEmail,
        initialPassword: userPassword
      },
      client
    });
  } catch (err) {
    console.error('Error in enableCustomerPortalAccess:', err);
    return res.status(500).json({ success: false, message: 'Failed to enable customer portal.', error: err.message });
  }
};

/**
 * POST /api/clients/:id/portal-access/toggle
 * Internal Sales/Admin suspends or re-activates portal access
 */
export const toggleCustomerPortalAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    const currentStatus = client.portalAccess?.status || 'DISABLED';
    const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const newEnabled = newStatus === 'ACTIVE';

    client.portalAccess.enabled = newEnabled;
    client.portalAccess.status = newStatus;
    await client.save();

    if (client.portalAccess.portalUserId) {
      await User.findByIdAndUpdate(client.portalAccess.portalUserId, {
        isActive: newEnabled,
        portalStatus: newStatus === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Customer portal access ${newEnabled ? 'activated' : 'suspended'}.`,
      portalAccess: client.portalAccess
    });
  } catch (err) {
    console.error('Error in toggleCustomerPortalAccess:', err);
    return res.status(500).json({ success: false, message: 'Failed to update portal access.', error: err.message });
  }
};
