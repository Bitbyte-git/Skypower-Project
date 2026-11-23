import mongoose from 'mongoose';
import fs from 'fs';
import { OrderPaymentTerms, PAYMENT_STATUSES, PAYMENT_MODES } from '../models/OrderPaymentTerms.js';
import { CustomerPayment } from '../models/CustomerPayment.js';
import { PaymentFollowup } from '../models/PaymentFollowup.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { Client } from '../models/Client.js';
import { ProjectWorkflow } from '../models/ProjectWorkflow.js';
import { generateNextPaymentReceiptNumber } from '../services/counterService.js';
import { generatePaymentReceiptPDF } from '../services/paymentPdfService.js';
import { numberToWords } from '../utils/numberToWords.js';

const round2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

/**
 * Helper: Ensure an Order has an initialized OrderPaymentTerms record
 */
const getOrInitOrderPaymentTerms = async (orderId, currentUser = null) => {
  let terms = await OrderPaymentTerms.findOne({ orderId });
  if (!terms) {
    const order = await SalesOrder.findById(orderId).populate('clientId');
    if (!order) return null;

    const totalVal = round2(order.pricing?.totalOrderValue || order.customerPO?.poValue || 0);
    const advPct = 30; // standard default 30% advance
    const advAmount = round2((totalVal * advPct) / 100);
    const finalAmount = Math.max(0, round2(totalVal - advAmount));

    const defaultMilestones = [
      {
        milestoneName: 'Advance Payment (PO)',
        percentage: advPct,
        amount: advAmount,
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days from PO
        trigger: 'Order confirmation',
        amountReceived: 0,
        pendingAmount: advAmount,
        status: 'Pending',
        remarks: 'Advance payable upon official order confirmation'
      },
      {
        milestoneName: 'Balance Before Dispatch',
        percentage: 100 - advPct,
        amount: finalAmount,
        dueDate: order.deliveryCommitment?.expectedDeliveryDate || new Date(Date.now() + 60 * 24 * 3600 * 1000),
        trigger: 'Before dispatch',
        amountReceived: 0,
        pendingAmount: finalAmount,
        status: 'Pending',
        remarks: 'Final balance against proforma invoice prior to factory dispatch'
      }
    ];

    terms = new OrderPaymentTerms({
      orderId: order._id,
      orderNumber: order.orderNumber,
      clientId: order.clientId?._id || order.clientId,
      customerName: order.clientName || order.customerName || order.clientId?.companyName || 'Valued Client',
      customerPONumber: order.customerPO?.poNumber || '',
      projectTitle: order.projectTitle || '',
      totalOrderValue: totalVal,
      termsType: 'Percentage',
      termsDescription: `${advPct}% Advance with PO, ${100 - advPct}% against PI prior to dispatch`,
      advancePercentage: advPct,
      advanceAmountRequired: advAmount,
      totalReceived: 0,
      pendingAmount: totalVal,
      advanceReceived: 0,
      advancePending: advAmount,
      paymentStatus: PAYMENT_STATUSES.ADVANCE_PENDING,
      milestones: defaultMilestones,
      auditTrail: [
        {
          action: 'Terms Initialized',
          userName: currentUser?.name || 'System Auto-Init',
          user: currentUser?._id,
          timestamp: new Date(),
          remarks: 'Auto-initialized standard payment terms from Sales Order'
        }
      ],
      createdBy: currentUser?._id || order.createdBy
    });

    await terms.save();
  }

  return terms;
};

/**
 * 1. Payment Dashboard Statistics & Real-time Metrics
 */
export const getPaymentDashboardStats = async (req, res) => {
  try {
    const orders = await SalesOrder.find({ status: { $ne: 'Cancelled' } });
    const termsList = await OrderPaymentTerms.find();
    const payments = await CustomerPayment.find({ status: 'Cleared' }).sort({ paymentDate: -1 });

    let totalOrderValue = 0;
    orders.forEach((o) => {
      totalOrderValue += round2(o.pricing?.totalOrderValue || o.customerPO?.poValue || 0);
    });

    let totalPaymentsReceived = 0;
    payments.forEach((p) => {
      totalPaymentsReceived += round2(p.amount);
    });

    let totalAdvanceReceived = 0;
    let totalAdvanceRequired = 0;
    let overdueCount = 0;
    let pendingPaymentsCount = 0;

    termsList.forEach((t) => {
      totalAdvanceReceived += round2(t.advanceReceived || 0);
      totalAdvanceRequired += round2(t.advanceAmountRequired || 0);

      if (t.paymentStatus === PAYMENT_STATUSES.OVERDUE) {
        overdueCount++;
      }
      if (t.pendingAmount > 0 && t.paymentStatus !== PAYMENT_STATUSES.FULLY_PAID) {
        pendingPaymentsCount++;
      }
    });

    const outstandingAmount = Math.max(0, round2(totalOrderValue - totalPaymentsReceived));

    // Current Month & Current Year summaries
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let receivedThisMonth = 0;
    let receivedThisYear = 0;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrendsMap = {};
    monthNames.forEach((m) => {
      monthlyTrendsMap[m] = { month: m, amount: 0, transactionCount: 0 };
    });

    payments.forEach((p) => {
      const pDate = new Date(p.paymentDate || p.createdAt);
      const pAmount = round2(p.amount);

      if (pDate.getFullYear() === currentYear) {
        receivedThisYear += pAmount;
        const m = monthNames[pDate.getMonth()];
        if (monthlyTrendsMap[m]) {
          monthlyTrendsMap[m].amount = round2(monthlyTrendsMap[m].amount + pAmount);
          monthlyTrendsMap[m].transactionCount++;
        }
      }

      if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
        receivedThisMonth += pAmount;
      }
    });

    // Recent 8 payments
    const recentPayments = payments.slice(0, 8);

    // Pending Orders needing payment attention
    const pendingOrders = termsList
      .filter((t) => t.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 6);

    // Upcoming Payment Expectations (Next milestones due)
    const upcomingExpectations = [];
    termsList.forEach((t) => {
      t.milestones.forEach((m) => {
        if (m.pendingAmount > 0 && m.dueDate) {
          upcomingExpectations.push({
            orderId: t.orderId,
            orderNumber: t.orderNumber,
            customerName: t.customerName,
            milestoneName: m.milestoneName,
            dueDate: m.dueDate,
            expectedAmount: m.pendingAmount,
            status: m.status
          });
        }
      });
    });

    upcomingExpectations.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const kpis = {
      totalOrderValue: Math.round(totalOrderValue),
      totalPaymentsReceived: Math.round(totalPaymentsReceived),
      totalAdvanceReceived: Math.round(totalAdvanceReceived),
      outstandingAmount: Math.round(outstandingAmount),
      paymentsPending: pendingPaymentsCount,
      overduePayments: overdueCount
    };

    return res.status(200).json({
      success: true,
      kpis,
      summary: {
        receivedThisMonth: Math.round(receivedThisMonth),
        receivedThisYear: Math.round(receivedThisYear),
        pendingAdvance: Math.max(0, Math.round(totalAdvanceRequired - totalAdvanceReceived)),
        outstandingAmount: Math.round(outstandingAmount)
      },
      recentPayments,
      pendingOrders,
      upcomingExpectations: upcomingExpectations.slice(0, 6),
      monthlyTrends: Object.values(monthlyTrendsMap)
    });
  } catch (error) {
    console.error('Error in getPaymentDashboardStats:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment dashboard statistics.', error: error.message });
  }
};

/**
 * 2. Get Order Payment Details & Terms
 */
export const getOrderPaymentSummary = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await SalesOrder.findById(orderId).populate('clientId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const terms = await getOrInitOrderPaymentTerms(orderId, req.user);
    const transactions = await CustomerPayment.find({ orderId }).sort({ paymentDate: -1 });
    const followups = await PaymentFollowup.find({ orderId }).sort({ followupDate: -1 });

    // Recalculate to ensure absolute up-to-date values
    terms.recalculateBalances(transactions);
    await terms.save();

    return res.status(200).json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.clientName || order.customerName,
        customerCode: order.clientCode || order.customerCode,
        customerPONumber: order.customerPO?.poNumber || '',
        customerPODate: order.customerPO?.poDate,
        projectTitle: order.projectTitle,
        orderValue: order.pricing?.totalOrderValue || 0,
        expectedDeliveryDate: order.deliveryCommitment?.expectedDeliveryDate,
        orderStatus: order.status
      },
      terms,
      transactions,
      followups
    });
  } catch (error) {
    console.error('Error in getOrderPaymentSummary:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order payment summary.', error: error.message });
  }
};

/**
 * 3. Configure Payment Terms & Milestones
 */
export const configurePaymentTerms = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { termsType, termsDescription, advancePercentage, milestones, remarks } = req.body;

    const terms = await getOrInitOrderPaymentTerms(orderId, req.user);
    if (!terms) {
      return res.status(404).json({ success: false, message: 'Sales order payment terms not found.' });
    }

    // Validation: if percentage-based, sum must equal 100%
    if (termsType === 'Percentage' && Array.isArray(milestones) && milestones.length > 0) {
      const totalPct = milestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
      if (Math.round(totalPct) !== 100) {
        return res.status(400).json({
          success: false,
          message: `The sum of milestone percentages must equal 100%. Current sum: ${totalPct}%.`
        });
      }
    }

    const previousMilestones = terms.milestones;

    if (termsType) terms.termsType = termsType;
    if (termsDescription) terms.termsDescription = termsDescription;
    if (advancePercentage !== undefined) terms.advancePercentage = Number(advancePercentage);

    if (Array.isArray(milestones) && milestones.length > 0) {
      terms.milestones = milestones.map((m) => {
        const pct = Number(m.percentage) || 0;
        const amt = m.amount ? Number(m.amount) : round2((terms.totalOrderValue * pct) / 100);
        return {
          milestoneName: m.milestoneName,
          percentage: pct,
          amount: amt,
          dueDate: m.dueDate ? new Date(m.dueDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
          trigger: m.trigger || 'Order confirmation',
          amountReceived: 0,
          pendingAmount: amt,
          status: 'Pending',
          remarks: m.remarks || ''
        };
      });
    }

    // Refresh balances against existing transactions
    const transactions = await CustomerPayment.find({ orderId });
    terms.recalculateBalances(transactions);

    terms.auditTrail.push({
      action: 'Payment Terms Configured',
      user: req.user?._id,
      userName: req.user?.name || 'Authorized Finance User',
      timestamp: new Date(),
      previousValue: { milestoneCount: previousMilestones.length },
      newValue: { milestoneCount: terms.milestones.length, termsDescription: terms.termsDescription },
      remarks: remarks || 'Updated milestone schedule and payment parameters'
    });

    terms.updatedBy = req.user?._id;
    await terms.save();

    return res.status(200).json({
      success: true,
      message: 'Payment terms and milestone schedule updated successfully.',
      terms
    });
  } catch (error) {
    console.error('Error in configurePaymentTerms:', error);
    return res.status(500).json({ success: false, message: 'Failed to configure payment terms.', error: error.message });
  }
};

/**
 * 4. Record Customer Payment & Generate Receipt
 */
export const recordCustomerPayment = async (req, res) => {
  try {
    const orderId = req.params.orderId || req.body.orderId;
    const {
      amount,
      paymentDate = new Date(),
      paymentMode = 'RTGS',
      transactionReference,
      bankName = 'HDFC Bank',
      utrNumber,
      chequeNumber,
      chequeDate,
      milestoneId,
      milestoneName = 'Advance',
      remarks = '',
      attachmentUrl = ''
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Sales Order ID is required.' });
    }

    const payAmount = round2(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
    }

    if (!transactionReference || !transactionReference.trim()) {
      return res.status(400).json({ success: false, message: 'Transaction Reference / UTR Number is required.' });
    }

    // Check duplicate reference in active transactions
    const duplicateTxn = await CustomerPayment.findOne({
      transactionReference: transactionReference.trim(),
      status: 'Cleared'
    });
    if (duplicateTxn) {
      return res.status(400).json({
        success: false,
        message: `Transaction Reference ${transactionReference.trim()} has already been recorded for receipt ${duplicateTxn.receiptNumber}.`
      });
    }

    const order = await SalesOrder.findById(orderId).populate('clientId');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const terms = await getOrInitOrderPaymentTerms(orderId, req.user);

    // Financial validation: Payment cannot exceed remaining receivable (with minor 1-rupee rounding tolerance)
    const currentOutstanding = terms.pendingAmount;
    if (payAmount > currentOutstanding + 1) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount.toLocaleString('en-IN')}) cannot exceed remaining outstanding balance (₹${currentOutstanding.toLocaleString('en-IN')}).`
      });
    }

    // Generate Unique Receipt Number: REC-YYYY-XXXX
    const receiptNumber = await generateNextPaymentReceiptNumber();
    const inWords = `${numberToWords(payAmount)} Rupees Only`;

    const remainingAfterThis = Math.max(0, round2(currentOutstanding - payAmount));

    const payment = new CustomerPayment({
      receiptNumber,
      receiptDate: new Date(),
      orderId: order._id,
      orderNumber: order.orderNumber,
      clientId: order.clientId?._id || order.clientId,
      customerName: order.clientName || order.customerName,
      customerAddress: order.billingAddress || order.siteAddress || order.clientId?.siteAddress || '',
      customerPONumber: order.customerPO?.poNumber || '',
      amount: payAmount,
      amountInWords: inWords,
      paymentDate: new Date(paymentDate),
      paymentMode,
      transactionReference: transactionReference.trim(),
      bankName: bankName.trim(),
      utrNumber: utrNumber ? utrNumber.trim() : transactionReference.trim(),
      chequeNumber: chequeNumber ? chequeNumber.trim() : undefined,
      chequeDate: chequeDate ? new Date(chequeDate) : undefined,
      milestoneId: milestoneId ? new mongoose.Types.ObjectId(milestoneId) : undefined,
      milestoneName: milestoneName || 'Advance',
      remainingOutstandingAmount: remainingAfterThis,
      remarks: remarks.trim(),
      attachmentUrl: attachmentUrl || '',
      status: 'Cleared',
      receivedBy: req.user?._id,
      receivedByName: req.user?.name || 'Accounts Officer',
      createdBy: req.user?._id
    });

    await payment.save();

    // Re-sync all cleared transactions into terms
    const allTxns = await CustomerPayment.find({ orderId, status: 'Cleared' });
    terms.recalculateBalances(allTxns);

    terms.auditTrail.push({
      action: 'Payment Recorded',
      user: req.user?._id,
      userName: req.user?.name || 'Accounts Officer',
      timestamp: new Date(),
      newValue: {
        receiptNumber,
        amount: payAmount,
        paymentMode,
        remainingBalance: terms.pendingAmount
      },
      remarks: `Recorded payment of ₹${payAmount.toLocaleString('en-IN')} via ${paymentMode} (Ref: ${transactionReference.trim()})`
    });

    await terms.save();

    // Generate Official PDF Receipt
    try {
      const pdfRes = await generatePaymentReceiptPDF(payment, terms);
      payment.receiptPdfUrl = pdfRes.relativeUrl;
      await payment.save();
    } catch (pdfErr) {
      console.warn('PDF Receipt background generation warning:', pdfErr.message);
    }

    // Synchronize with Stage 3: Advance Payment in ProjectWorkflow if available
    try {
      if (order.projectWorkflowId || order.projectTrackingId) {
        const wf = await ProjectWorkflow.findOne({
          $or: [
            { _id: order.projectWorkflowId },
            { projectTrackingId: order.projectTrackingId }
          ]
        });

        if (wf) {
          wf.advancePaymentDetails = {
            ...(wf.advancePaymentDetails || {}),
            advanceAmountReceived: terms.advanceReceived,
            advancePercentage: terms.advancePercentage,
            paymentMode,
            utrNumber: transactionReference.trim(),
            bankName: bankName.trim(),
            paymentReceivedDate: new Date(paymentDate),
            clearedForStage4: terms.advancePending === 0,
            updatedAt: new Date(),
            updatedByName: req.user?.name || 'Accounts'
          };
          await wf.save();
        }
      }
    } catch (wfErr) {
      console.warn('Workflow Stage 3 sync notice:', wfErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount.toLocaleString('en-IN')} recorded successfully. Receipt #${receiptNumber} generated.`,
      payment,
      terms
    });
  } catch (error) {
    console.error('Error in recordCustomerPayment:', error);
    return res.status(500).json({ success: false, message: 'Failed to record customer payment.', error: error.message });
  }
};

/**
 * 5. Get Payment Receipts Register
 */
export const getPaymentReceipts = async (req, res) => {
  try {
    const { search, orderId, paymentMode, startDate, endDate } = req.query;

    const query = {};

    if (orderId) {
      query.orderId = orderId;
    }

    if (paymentMode && paymentMode !== 'ALL') {
      query.paymentMode = paymentMode;
    }

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    if (search) {
      const s = search.trim();
      query.$or = [
        { receiptNumber: { $regex: s, $options: 'i' } },
        { orderNumber: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
        { transactionReference: { $regex: s, $options: 'i' } },
        { utrNumber: { $regex: s, $options: 'i' } }
      ];
    }

    const receipts = await CustomerPayment.find(query).sort({ paymentDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: receipts.length,
      receipts
    });
  } catch (error) {
    console.error('Error in getPaymentReceipts:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payment receipts.', error: error.message });
  }
};

/**
 * 6. Stream / Download Official Payment Receipt PDF
 */
export const getReceiptPDF = async (req, res) => {
  try {
    const payment = await CustomerPayment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment receipt not found.' });
    }

    const terms = await OrderPaymentTerms.findOne({ orderId: payment.orderId }) || {};
    const pdfRes = await generatePaymentReceiptPDF(payment, terms);

    payment.receiptPdfUrl = pdfRes.relativeUrl;
    await payment.save();

    if (req.query.json === 'true') {
      return res.status(200).json({
        success: true,
        pdfUrl: pdfRes.relativeUrl,
        fileName: pdfRes.fileName
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdfRes.fileName}"`);
    return fs.createReadStream(pdfRes.filePath).pipe(res);
  } catch (error) {
    console.error('Error in getReceiptPDF:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate receipt PDF.', error: error.message });
  }
};

/**
 * 7. Cancel Payment with Authorization & Re-calculate
 */
export const cancelCustomerPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A valid cancellation reason is required.' });
    }

    const payment = await CustomerPayment.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'This payment has already been cancelled.' });
    }

    payment.status = 'Cancelled';
    payment.cancellation = {
      isCancelled: true,
      cancelledBy: req.user?._id,
      cancelledByName: req.user?.name || 'Finance Administrator',
      cancelledAt: new Date(),
      reason: reason.trim()
    };
    await payment.save();

    // Recalculate balances on order terms without this cancelled payment
    const terms = await OrderPaymentTerms.findOne({ orderId: payment.orderId });
    if (terms) {
      const activeTxns = await CustomerPayment.find({ orderId: payment.orderId, status: 'Cleared' });
      terms.recalculateBalances(activeTxns);

      terms.auditTrail.push({
        action: 'Payment Cancelled',
        user: req.user?._id,
        userName: req.user?.name || 'Finance Administrator',
        timestamp: new Date(),
        remarks: `Receipt #${payment.receiptNumber} of ₹${payment.amount.toLocaleString('en-IN')} cancelled: ${reason.trim()}`
      });

      await terms.save();
    }

    return res.status(200).json({
      success: true,
      message: `Receipt #${payment.receiptNumber} has been successfully cancelled. Balance updated.`,
      payment,
      terms
    });
  } catch (error) {
    console.error('Error in cancelCustomerPayment:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel payment record.', error: error.message });
  }
};

/**
 * 8. Pending & Overdue Payments List
 */
export const getPendingPayments = async (req, res) => {
  try {
    const termsList = await OrderPaymentTerms.find({
      paymentStatus: { $ne: PAYMENT_STATUSES.FULLY_PAID },
      pendingAmount: { $gt: 0 }
    }).sort({ earliestOverdueDate: 1, pendingAmount: -1 });

    const now = new Date();

    const pendingList = termsList.map((t) => {
      // Find earliest pending milestone
      const pendingMilestones = t.milestones.filter((m) => m.pendingAmount > 0);
      let earliestDueDate = null;
      let isOverdue = false;
      let daysPending = 0;

      if (pendingMilestones.length > 0) {
        pendingMilestones.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        earliestDueDate = pendingMilestones[0].dueDate;

        if (earliestDueDate && new Date(earliestDueDate) < now) {
          isOverdue = true;
          daysPending = Math.floor((now - new Date(earliestDueDate)) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        _id: t._id,
        orderId: t.orderId,
        orderNumber: t.orderNumber,
        customerName: t.customerName,
        customerPONumber: t.customerPONumber,
        totalOrderValue: t.totalOrderValue,
        termsDescription: t.termsDescription,
        totalReceived: t.totalReceived,
        pendingAmount: t.pendingAmount,
        advanceAmountRequired: t.advanceAmountRequired,
        advanceReceived: t.advanceReceived,
        advancePending: t.advancePending,
        paymentStatus: isOverdue ? PAYMENT_STATUSES.OVERDUE : t.paymentStatus,
        earliestDueDate,
        daysPending,
        isOverdue
      };
    });

    return res.status(200).json({
      success: true,
      count: pendingList.length,
      pendingPayments: pendingList
    });
  } catch (error) {
    console.error('Error in getPendingPayments:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve pending payments.', error: error.message });
  }
};

/**
 * 9. Payment Follow-up Management
 */
export const createPaymentFollowup = async (req, res) => {
  try {
    const {
      orderId,
      followupMethod = 'Phone',
      contactPerson = '',
      remarks,
      customerResponse = '',
      nextFollowupDate,
      assignedTo
    } = req.body;

    if (!orderId || !remarks) {
      return res.status(400).json({ success: false, message: 'Order ID and follow-up remarks are required.' });
    }

    const terms = await OrderPaymentTerms.findOne({ orderId });
    if (!terms) {
      return res.status(404).json({ success: false, message: 'Order payment terms not found.' });
    }

    const followup = new PaymentFollowup({
      orderId: terms.orderId,
      orderNumber: terms.orderNumber,
      clientId: terms.clientId,
      customerName: terms.customerName,
      pendingAmount: terms.pendingAmount,
      followupDate: new Date(),
      followupMethod,
      contactPerson,
      remarks: remarks.trim(),
      customerResponse: customerResponse.trim(),
      nextFollowupDate: nextFollowupDate ? new Date(nextFollowupDate) : undefined,
      assignedTo: assignedTo || req.user?._id,
      assignedToName: req.user?.name || 'Sales Officer',
      status: 'Completed',
      completedAt: new Date(),
      createdBy: req.user?._id
    });

    await followup.save();

    terms.auditTrail.push({
      action: 'Follow-up Logged',
      user: req.user?._id,
      userName: req.user?.name || 'Sales Officer',
      timestamp: new Date(),
      remarks: `[${followupMethod}] ${remarks.trim()}`
    });
    await terms.save();

    return res.status(201).json({
      success: true,
      message: 'Payment follow-up recorded successfully.',
      followup
    });
  } catch (error) {
    console.error('Error in createPaymentFollowup:', error);
    return res.status(500).json({ success: false, message: 'Failed to record payment follow-up.', error: error.message });
  }
};

export const getPaymentFollowups = async (req, res) => {
  try {
    const { orderId } = req.query;
    const query = orderId ? { orderId } : {};
    const followups = await PaymentFollowup.find(query).sort({ followupDate: -1 });

    return res.status(200).json({
      success: true,
      count: followups.length,
      followups
    });
  } catch (error) {
    console.error('Error in getPaymentFollowups:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve follow-ups.', error: error.message });
  }
};

/**
 * 10. Financial Reports Aggregation
 */
export const getPaymentReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.paymentDate = {};
      if (startDate) dateQuery.paymentDate.$gte = new Date(startDate);
      if (endDate) dateQuery.paymentDate.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const clearedPayments = await CustomerPayment.find({ status: 'Cleared', ...dateQuery }).sort({ paymentDate: -1 });
    const termsList = await OrderPaymentTerms.find();

    // 1. By Customer
    const customerMap = {};
    clearedPayments.forEach((p) => {
      const c = p.customerName || 'Unknown';
      if (!customerMap[c]) {
        customerMap[c] = { customer: c, totalReceived: 0, transactionCount: 0 };
      }
      customerMap[c].totalReceived = round2(customerMap[c].totalReceived + p.amount);
      customerMap[c].transactionCount++;
    });

    // 2. By Payment Mode
    const modeMap = {};
    clearedPayments.forEach((p) => {
      const m = p.paymentMode || 'Other';
      if (!modeMap[m]) {
        modeMap[m] = { mode: m, amount: 0, count: 0 };
      }
      modeMap[m].amount = round2(modeMap[m].amount + p.amount);
      modeMap[m].count++;
    });

    // 3. By Sales Order
    const orderMap = {};
    clearedPayments.forEach((p) => {
      const o = p.orderNumber || 'Unknown';
      if (!orderMap[o]) {
        orderMap[o] = { orderNumber: o, customer: p.customerName, amountReceived: 0, transactions: 0 };
      }
      orderMap[o].amountReceived = round2(orderMap[o].amountReceived + p.amount);
      orderMap[o].transactions++;
    });

    return res.status(200).json({
      success: true,
      totalReceived: round2(clearedPayments.reduce((s, p) => s + p.amount, 0)),
      transactionCount: clearedPayments.length,
      byCustomer: Object.values(customerMap),
      byPaymentMode: Object.values(modeMap),
      byOrder: Object.values(orderMap),
      termsSummary: {
        totalOrdersCount: termsList.length,
        totalReceivable: round2(termsList.reduce((s, t) => s + t.totalOrderValue, 0)),
        totalCollected: round2(termsList.reduce((s, t) => s + t.totalReceived, 0)),
        totalOutstanding: round2(termsList.reduce((s, t) => s + t.pendingAmount, 0))
      }
    });
  } catch (error) {
    console.error('Error in getPaymentReports:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate payment reports.', error: error.message });
  }
};

/**
 * 11. Seed Sample Payment Records If Empty
 */
export const seedSamplePaymentsIfEmpty = async (req, res) => {
  try {
    const existingPaymentsCount = await CustomerPayment.countDocuments();
    if (existingPaymentsCount > 0 && req.query.force !== 'true') {
      return res.status(200).json({
        success: true,
        message: `System already contains ${existingPaymentsCount} payment receipts. Pass ?force=true to reload defaults.`
      });
    }

    if (req.query.force === 'true') {
      await CustomerPayment.deleteMany({});
      await OrderPaymentTerms.deleteMany({});
      await PaymentFollowup.deleteMany({});
    }

    const orders = await SalesOrder.find().sort({ createdAt: 1 });
    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No sales orders found to seed payments against. Please seed orders first.'
      });
    }

    const currentYear = new Date().getFullYear();
    const seededPayments = [];

    // Order 1: SIVII Engineering Construction - 50% Advance received (₹17,00,000 against ₹34,00,000)
    const order1 = orders[0];
    const terms1 = await getOrInitOrderPaymentTerms(order1._id, req.user);
    terms1.advancePercentage = 50;
    terms1.advanceAmountRequired = 1700000;
    terms1.termsDescription = '50% Advance with PO, 50% against PI before dispatch';
    terms1.milestones = [
      {
        milestoneName: '50% Advance Payment',
        percentage: 50,
        amount: 1700000,
        dueDate: new Date('2026-09-15'),
        trigger: 'Order confirmation',
        amountReceived: 0,
        pendingAmount: 1700000,
        status: 'Pending'
      },
      {
        milestoneName: '50% Balance Before Dispatch',
        percentage: 50,
        amount: 1700000,
        dueDate: new Date('2026-11-25'),
        trigger: 'Before dispatch',
        amountReceived: 0,
        pendingAmount: 1700000,
        status: 'Pending'
      }
    ];
    await terms1.save();

    const p1 = new CustomerPayment({
      receiptNumber: `REC-${currentYear}-0001`,
      receiptDate: new Date('2026-09-11'),
      orderId: order1._id,
      orderNumber: order1.orderNumber,
      clientId: order1.clientId?._id || order1.clientId,
      customerName: order1.clientName || order1.customerName,
      customerAddress: order1.billingAddress || 'Commercial Building, Salem, Tamil Nadu',
      customerPONumber: order1.customerPO?.poNumber || 'SEC/PO/2026/09/084',
      amount: 1700000,
      amountInWords: 'Seventeen Lakh Rupees Only',
      paymentDate: new Date('2026-09-11'),
      paymentMode: 'RTGS',
      transactionReference: 'HDFCR9823482749',
      bankName: 'HDFC Bank',
      utrNumber: 'HDFCR9823482749',
      milestoneName: '50% Advance Payment',
      remainingOutstandingAmount: 1700000,
      remarks: '50% Advance payment credited for Stage 4 Drawing & OA clearance.',
      status: 'Cleared',
      receivedBy: req.user?._id || order1.createdBy,
      receivedByName: 'Accounts & Finance Team',
      createdBy: req.user?._id || order1.createdBy
    });
    await p1.save();
    seededPayments.push(p1);

    // Sync terms 1
    terms1.recalculateBalances([p1]);
    await terms1.save();

    // Order 2: M Tech Solutions - Partial payment ₹5,00,000 received against ₹24,50,000
    if (orders.length > 1) {
      const order2 = orders[1];
      const terms2 = await getOrInitOrderPaymentTerms(order2._id, req.user);
      terms2.advancePercentage = 30;
      terms2.advanceAmountRequired = 735000;
      await terms2.save();

      const p2 = new CustomerPayment({
        receiptNumber: `REC-${currentYear}-0002`,
        receiptDate: new Date('2026-11-18'),
        orderId: order2._id,
        orderNumber: order2.orderNumber,
        clientId: order2.clientId?._id || order2.clientId,
        customerName: order2.clientName || order2.customerName,
        customerAddress: order2.billingAddress || 'Gandhinagar, Bihar',
        customerPONumber: order2.customerPO?.poNumber || 'MTECH/PO/2026/11/04',
        amount: 500000,
        amountInWords: 'Five Lakh Rupees Only',
        paymentDate: new Date('2026-11-18'),
        paymentMode: 'NEFT',
        transactionReference: 'SBIN9840928301',
        bankName: 'State Bank of India',
        utrNumber: 'SBIN9840928301',
        milestoneName: 'Advance Payment (PO)',
        remainingOutstandingAmount: 1950000,
        remarks: 'Partial advance received; balance advance of ₹2,35,000 awaited.',
        status: 'Cleared',
        receivedBy: req.user?._id || order2.createdBy,
        receivedByName: 'Accounts & Finance Team',
        createdBy: req.user?._id || order2.createdBy
      });
      await p2.save();
      seededPayments.push(p2);

      terms2.recalculateBalances([p2]);
      await terms2.save();

      // Sample follow-up for order 2
      const f2 = new PaymentFollowup({
        orderId: order2._id,
        orderNumber: order2.orderNumber,
        clientId: order2.clientId?._id || order2.clientId,
        customerName: order2.clientName || order2.customerName,
        pendingAmount: 1950000,
        followupDate: new Date('2026-11-19'),
        followupMethod: 'Phone',
        contactPerson: order2.contactPerson || 'Suresh Kumar',
        remarks: 'Called client regarding balance advance amount of ₹2,35,000.',
        customerResponse: 'Finance department promised remittance by end of week.',
        nextFollowupDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
        status: 'Completed',
        completedAt: new Date(),
        createdBy: req.user?._id || order2.createdBy
      });
      await f2.save();
    }

    return res.status(201).json({
      success: true,
      message: `Seeded ${seededPayments.length} realistic payment receipts and terms.`,
      payments: seededPayments
    });
  } catch (error) {
    console.error('Error in seedSamplePaymentsIfEmpty:', error);
    return res.status(500).json({ success: false, message: 'Failed to seed sample payments.', error: error.message });
  }
};
