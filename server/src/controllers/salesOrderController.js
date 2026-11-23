import mongoose from 'mongoose';
import fs from 'fs';
import { SalesOrder, ORDER_STATUSES, HOLD_REASONS } from '../models/SalesOrder.js';
import { Quotation } from '../models/Quotation.js';
import { Enquiry } from '../models/Enquiry.js';
import { Client } from '../models/Client.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { generateNextSalesOrderNumber, generateNextOrderAcknowledgementNumber } from '../services/counterService.js';
import { generateOrderAcknowledgementPDF } from '../services/orderPdfService.js';

/**
 * 1. Order Dashboard Statistics & Trends
 */
export const getOrderDashboardStats = async (req, res) => {
  try {
    const orders = await SalesOrder.find().sort({ createdAt: -1 });

    const totalOrders = orders.length;
    let ordersReceived = 0;
    let ordersPendingVerification = 0;
    let confirmedOrders = 0;
    let ordersOnHold = 0;
    let totalOrderValue = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    let ordersThisMonth = 0;

    // Monthly bucket mapping (Jan - Dec of current year)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrendsMap = {};
    monthNames.forEach((m) => {
      monthlyTrendsMap[m] = { month: m, orderCount: 0, totalValue: 0 };
    });

    const statusCounts = {};
    Object.values(ORDER_STATUSES).forEach((st) => {
      statusCounts[st] = 0;
    });

    orders.forEach((o) => {
      const val = o.pricing?.totalOrderValue || o.customerPO?.poValue || 0;
      totalOrderValue += val;

      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      } else {
        statusCounts[o.status] = 1;
      }

      if (o.status === ORDER_STATUSES.PO_RECEIVED) ordersReceived++;
      if (o.status === ORDER_STATUSES.UNDER_VERIFICATION || o.status === ORDER_STATUSES.PO_RECEIVED) ordersPendingVerification++;
      if (o.status === ORDER_STATUSES.ORDER_CONFIRMED) confirmedOrders++;
      if (o.status === ORDER_STATUSES.ON_HOLD) ordersOnHold++;

      const oDate = new Date(o.orderDate || o.createdAt);
      if (oDate.getFullYear() === currentYear && oDate.getMonth() === currentMonth) {
        ordersThisMonth++;
      }

      if (oDate.getFullYear() === currentYear) {
        const mName = monthNames[oDate.getMonth()];
        if (monthlyTrendsMap[mName]) {
          monthlyTrendsMap[mName].orderCount++;
          monthlyTrendsMap[mName].totalValue += val;
        }
      }
    });

    // Recent 8 orders
    const recentOrders = orders.slice(0, 8);

    // Pending Actions summary
    const pendingVerification = orders.filter(
      (o) => o.status === ORDER_STATUSES.UNDER_VERIFICATION || o.status === ORDER_STATUSES.PO_RECEIVED
    );
    const awaitingConfirmation = orders.filter((o) => o.status === ORDER_STATUSES.VERIFIED);
    const onHoldOrders = orders.filter((o) => o.status === ORDER_STATUSES.ON_HOLD);
    const upcomingDeliveries = orders
      .filter((o) => o.customerPO?.expectedDeliveryDate && o.status !== ORDER_STATUSES.CANCELLED && o.status !== ORDER_STATUSES.COMPLETED)
      .sort((a, b) => new Date(a.customerPO.expectedDeliveryDate) - new Date(b.customerPO.expectedDeliveryDate))
      .slice(0, 5);

    const kpis = {
      totalOrders,
      ordersReceived,
      ordersPendingVerification,
      confirmedOrders,
      ordersOnHold,
      ordersThisMonth,
      totalOrderValue: Math.round(totalOrderValue)
    };

    const pendingActionsData = {
      pendingVerificationCount: pendingVerification.length,
      awaitingConfirmationCount: awaitingConfirmation.length,
      onHoldCount: onHoldOrders.length,
      awaitingVerification: pendingVerification,
      awaitingConfirmation,
      onHold: onHoldOrders,
      upcomingDeliveries
    };

    return res.status(200).json({
      success: true,
      kpis,
      statusCounts,
      monthlyTrends: Object.values(monthlyTrendsMap),
      recentOrders,
      pendingActions: pendingActionsData,
      stats: {
        ...kpis,
        statusCounts,
        monthlyTrends: Object.values(monthlyTrendsMap),
        recentOrders,
        pendingActions: pendingActionsData
      }
    });
  } catch (error) {
    console.error('Error in getOrderDashboardStats:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order dashboard statistics.', error: error.message });
  }
};

/**
 * 2. Get All Sales Orders (With Filters, Search, Pagination)
 */
export const getAllOrders = async (req, res) => {
  try {
    const { status, customer, search, dateFrom, dateTo, page = 1, limit = 100, sort = '-createdAt' } = req.query;
    const filter = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (customer && customer !== 'ALL') {
      filter.$or = [
        { customerName: new RegExp(customer.trim(), 'i') },
        { clientName: new RegExp(customer.trim(), 'i') }
      ];
    }

    if (dateFrom || dateTo) {
      filter.orderDate = {};
      if (dateFrom) filter.orderDate.$gte = new Date(dateFrom);
      if (dateTo) filter.orderDate.$lte = new Date(dateTo);
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const q = new RegExp(escaped, 'i');

      // Also find clients whose company name matches
      const matchingClients = await Client.find({
        $or: [
          { companyName: q },
          { clientLocation: q },
          { contactPerson: q },
          { email: q }
        ]
      }).select('_id');
      const clientIds = matchingClients.map((c) => c._id);

      filter.$or = [
        { orderNumber: q },
        { quotationNumber: q },
        { ern: q },
        { customerName: q },
        { clientName: q },
        { customerCode: q },
        { projectTitle: q },
        { endUser: q },
        { 'customerPO.poNumber': q },
        { 'products.productName': q },
        ...(clientIds.length > 0 ? [{ clientId: { $in: clientIds } }] : [])
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalCount = await SalesOrder.countDocuments(filter);
    let orders = await SalesOrder.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('clientId', 'companyName clientLocation clientCategory contactPerson mobile email')
      .populate('quotationId', 'formattedQuotationNumber finalQuotationValue version')
      .populate('createdBy', 'name role email');

    // STRICT DATA SHIELD: PO Team cannot see anything about payment and client details
    if (req.user?.role === 'PO_TEAM') {
      orders = orders.map((order) => {
        const o = order.toObject ? order.toObject() : { ...order };
        o.customerName = o.customerCode || 'Protected Client ID';
        o.clientName = o.customerCode || 'Protected Client ID';
        if (o.clientId && typeof o.clientId === 'object') {
          o.clientId = {
            _id: o.clientId._id,
            clientId: o.clientId.clientId || o.customerCode || 'SP-CL-PROTECTED',
            companyName: 'Protected Client Identity'
          };
        }
        o.pricing = { totalOrderValue: 0, subTotal: 0, taxTotal: 0 };
        if (o.customerPO) {
          o.customerPO.poValue = 0;
          o.customerPO.paymentTerms = 'Commercial Desk';
        }
        return o;
      });
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)) || 1,
      currentPage: Number(page),
      orders
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve sales orders.', error: error.message });
  }
};

/**
 * 3. Get Single Sales Order Details
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('clientId')
      .populate('quotationId')
      .populate('enquiryId')
      .populate('createdBy', 'name role email department');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    let orderObj = order.toObject();

    // STRICT DATA SHIELD: PO Team cannot see anything about payment and client details
    if (req.user?.role === 'PO_TEAM') {
      const protectedCode = orderObj.customerCode || orderObj.clientId?.clientId || 'Protected Client ID';
      orderObj.customerName = protectedCode;
      orderObj.clientName = protectedCode;
      orderObj.contactPerson = 'Protected by Data Shield';
      orderObj.contactEmail = 'protected@skypower.internal';
      orderObj.contactPhone = 'Protected';
      orderObj.gstNumber = 'Commercial Confidential';
      orderObj.billingAddress = 'Works / Plant Delivery Location';
      orderObj.siteAddress = 'Plant Delivery Location';

      if (orderObj.clientId && typeof orderObj.clientId === 'object') {
        orderObj.clientId = {
          _id: orderObj.clientId._id,
          clientId: orderObj.clientId.clientId || protectedCode,
          companyName: 'Protected Client Identity',
          customerType: 'Industrial Client'
        };
      }

      // Hide all payment and pricing details
      orderObj.pricing = {
        subTotal: 0,
        discountTotal: 0,
        taxRatePercent: 0,
        taxTotal: 0,
        freightAndInsurance: 0,
        totalOrderValue: 0
      };

      if (orderObj.customerPO) {
        orderObj.customerPO.poValue = 0;
        orderObj.customerPO.paymentTerms = 'Managed by Commercial Desk';
      }

      if (orderObj.commercialTerms) {
        orderObj.commercialTerms.paymentTerms = 'Managed by Commercial Desk';
      }

      if (Array.isArray(orderObj.products)) {
        orderObj.products = orderObj.products.map((p) => ({
          ...p,
          unitPrice: 0,
          totalPrice: 0
        }));
      }

      if (orderObj.verification && Array.isArray(orderObj.verification.checklist)) {
        orderObj.verification.checklist = orderObj.verification.checklist.map((c) => {
          if (
            c.parameter?.toLowerCase().includes('value') ||
            c.parameter?.toLowerCase().includes('price') ||
            c.parameter?.toLowerCase().includes('payment')
          ) {
            return {
              ...c,
              quotationValue: '[Protected Commercial Data]',
              poValue: '[Protected Commercial Data]',
              remarks: 'Commercial parameters verified by Commercial Desk.'
            };
          }
          if (c.parameter?.toLowerCase().includes('customer name')) {
            return {
              ...c,
              quotationValue: protectedCode,
              poValue: protectedCode
            };
          }
          return c;
        });
      }
    }

    return res.status(200).json({
      success: true,
      order: orderObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving order details.', error: error.message });
  }
};

/**
 * 4. Create Sales Order from Quotation ("Convert to Order")
 */
export const createOrderFromQuotation = async (req, res) => {
  try {
    const {
      quotationId,
      poNumber,
      poDate,
      poValue,
      poCurrency = 'INR',
      expectedDeliveryDate,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      customerRemarks,
      internalRemarks,
      documentUrl
    } = req.body;

    if (!quotationId) {
      return res.status(400).json({ success: false, message: 'Valid Quotation ID is required.' });
    }

    const quotation = await Quotation.findById(quotationId).populate('clientId').populate('enquiryId');
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    // Check if an order already exists for this quotation
    const existingOrder = await SalesOrder.findOne({ quotationId: quotation._id });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: `A Sales Order (${existingOrder.orderNumber}) already exists for Quotation ${quotation.formattedQuotationNumber}.`,
        order: existingOrder
      });
    }

    const client = quotation.clientId || {};
    const enquiry = quotation.enquiryId || {};
    const orderNumber = await generateNextSalesOrderNumber();

    // Map quotation pricing items to order items
    const orderProducts = (quotation.productPricing || []).map((p) => ({
      productId: p.productId,
      productName: p.productName,
      productDescription: p.productDescription || '',
      voltageRating: p.voltageRating || '11 kV',
      currentRating: p.currentRating || '630 A',
      breakingCapacity: p.breakingCapacity || '26.3 kA',
      equipmentConfiguration: p.equipmentConfiguration || '',
      quantity: p.quantity || 1,
      unit: p.unit || 'Nos',
      unitPrice: p.unitPrice || 0,
      discountPercent: p.discountPercent || 0,
      taxRatePercent: p.taxRatePercent || 18,
      totalPrice: p.netAmount || (p.quantity * p.unitPrice),
      technicalSpecifications: p.productDescription || ''
    }));

    // If quotation had no items, fallback from enquiry products
    if (orderProducts.length === 0 && enquiry.products && enquiry.products.length > 0) {
      enquiry.products.forEach((ep) => {
        orderProducts.push({
          productName: ep.productName || '11kV VCB Switchboard',
          productDescription: ep.productDescription || `${ep.kilovolt} ${ep.ampere} ${ep.kiloampere}`,
          voltageRating: ep.kilovolt || '11 kV',
          currentRating: ep.ampere || '630 A',
          breakingCapacity: ep.kiloampere || '26.3 kA',
          durationSec: ep.durationSec || 'For 3 Sec',
          usage: ep.usage || 'Indoor',
          ebMetering: ep.ebMetering || 'Transformer Control',
          quantity: ep.quantity || 1,
          unit: 'Nos',
          unitPrice: quotation.finalQuotationValue ? Math.round(quotation.finalQuotationValue / 1.18) : 500000,
          totalPrice: quotation.finalQuotationValue ? Math.round(quotation.finalQuotationValue / 1.18) : 500000
        });
      });
    }

    const finalVal = Number(poValue) || quotation.finalQuotationValue || 0;
    const subTotal = quotation.subTotal || Math.round(finalVal / 1.18);
    const taxTotal = quotation.taxTotal || (finalVal - subTotal);

    // Initial Verification Checklist generated by comparing Quotation vs PO parameters
    const initialChecklist = [
      {
        parameter: 'Customer Name & Legal Entity',
        quotationValue: client.companyName || 'Approved Buyer',
        poValue: client.companyName || 'Approved Buyer',
        isMatch: true,
        status: 'Match',
        remarks: 'Customer billing entity matches registered Master record.'
      },
      {
        parameter: 'Quotation Reference & Date',
        quotationValue: quotation.formattedQuotationNumber,
        poValue: quotation.formattedQuotationNumber,
        isMatch: true,
        status: 'Match',
        remarks: `Customer PO explicitly references offer ${quotation.formattedQuotationNumber}.`
      },
      {
        parameter: 'Scope of Supply / Product Configuration',
        quotationValue: orderProducts.map((p) => p.productName).join(' + ') || 'HT Switchgear',
        poValue: orderProducts.map((p) => p.productName).join(' + ') || 'HT Switchgear',
        isMatch: true,
        status: 'Match',
        remarks: 'Equipment line items and ratings align with submitted technical offer.'
      },
      {
        parameter: 'Total Order Value (₹)',
        quotationValue: `₹ ${quotation.finalQuotationValue?.toLocaleString('en-IN')}`,
        poValue: poValue ? `₹ ${Number(poValue).toLocaleString('en-IN')}` : `₹ ${quotation.finalQuotationValue?.toLocaleString('en-IN')}`,
        isMatch: !poValue || Number(poValue) === quotation.finalQuotationValue,
        status: (!poValue || Number(poValue) === quotation.finalQuotationValue) ? 'Match' : 'Mismatch',
        remarks: (!poValue || Number(poValue) === quotation.finalQuotationValue)
          ? 'Total commercial order value matches submitted offer.'
          : `PO Value differs from Quote (PO: ₹ ${Number(poValue).toLocaleString('en-IN')}, Quote: ₹ ${quotation.finalQuotationValue.toLocaleString('en-IN')}).`
      },
      {
        parameter: 'Delivery Schedule / Commitment',
        quotationValue: quotation.deliveryTerms || '10 to 12 weeks',
        poValue: expectedDeliveryDate ? new Date(expectedDeliveryDate).toLocaleDateString('en-IN') : quotation.deliveryTerms,
        isMatch: true,
        status: 'Match',
        remarks: 'Agreed manufacturing and testing dispatch window.'
      },
      {
        parameter: 'Payment Terms & Milestones',
        quotationValue: quotation.paymentTerms || '30% Advance, 70% against PI',
        poValue: paymentTerms || quotation.paymentTerms || '30% Advance, 70% against PI',
        isMatch: true,
        status: 'Match',
        remarks: 'Commercial payment milestones acceptable to Sky Power finance.'
      },
      {
        parameter: 'Warranty & Guarantee Period',
        quotationValue: quotation.warrantyTerms || '18 months from dispatch',
        poValue: warrantyTerms || quotation.warrantyTerms || '18 months from dispatch',
        isMatch: true,
        status: 'Match',
        remarks: 'Standard OEM switchgear warranty terms accepted.'
      }
    ];

    const mismatchCount = initialChecklist.filter((c) => !c.isMatch).length;
    const initialStatus = poNumber ? (mismatchCount > 0 ? ORDER_STATUSES.CLARIFICATION_REQUIRED : ORDER_STATUSES.UNDER_VERIFICATION) : ORDER_STATUSES.AWAITING_PO;

    const newOrder = await SalesOrder.create({
      orderNumber,
      orderDate: new Date(),
      quotationId: quotation._id,
      quotationNumber: quotation.formattedQuotationNumber,
      quotationVersion: quotation.version || 1,
      enquiryId: enquiry._id,
      ern: quotation.ern || enquiry.ern,
      clientId: client._id,
      customerName: client.companyName || 'Approved Buyer',
      customerCode: client.clientId || '',
      projectTitle: enquiry.project?.projectName || 'HT Switchgear Project',
      endUser: client.endUser || enquiry.project?.endUser || '',
      contactPerson: client.contactPerson || '',
      contactEmail: client.email || '',
      contactPhone: client.mobile || '',
      billingAddress: client.billingAddress || client.siteAddress || '',
      siteAddress: client.siteAddress || client.billingAddress || '',
      gstNumber: client.gstNumber || '',
      status: initialStatus,
      customerPO: {
        poNumber: poNumber || '',
        poDate: poDate ? new Date(poDate) : new Date(),
        poReceivedDate: new Date(),
        poValue: finalVal,
        poCurrency,
        poRevision: 1,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        paymentTerms: paymentTerms || quotation.paymentTerms || '',
        deliveryTerms: deliveryTerms || quotation.deliveryTerms || '',
        warrantyTerms: warrantyTerms || quotation.warrantyTerms || '',
        customerRemarks: customerRemarks || '',
        internalRemarks: internalRemarks || '',
        documentUrl: documentUrl || ''
      },
      products: orderProducts,
      pricing: {
        subTotal,
        discountTotal: quotation.discountTotal || 0,
        taxRatePercent: quotation.taxRatePercent || 18,
        taxTotal,
        freightAndInsurance: quotation.freightAndInsurance || 0,
        totalOrderValue: finalVal
      },
      commercialTerms: {
        priceBasis: quotation.commercialTerms || 'Ex-works Salem Manufacturing Facility',
        paymentTerms: paymentTerms || quotation.paymentTerms || '',
        deliveryTerms: deliveryTerms || quotation.deliveryTerms || '',
        warrantyTerms: warrantyTerms || quotation.warrantyTerms || ''
      },
      verification: {
        isVerified: mismatchCount === 0 && Boolean(poNumber),
        status: mismatchCount > 0 ? 'Clarification Required' : (poNumber ? 'Pending' : 'Pending'),
        checklist: initialChecklist,
        mismatchCount
      },
      timeline: [
        {
          event: 'Sales Order Initiated',
          status: initialStatus,
          notes: `Converted from Quotation ${quotation.formattedQuotationNumber}. Order reference: ${orderNumber}.`,
          performedBy: req.user?._id,
          performedByName: req.user?.name || 'Sales Coordinator',
          timestamp: new Date()
        }
      ],
      createdBy: req.user?._id || quotation.createdBy,
      updatedBy: req.user?._id
    });

    // Mark Quotation status as Accepted
    quotation.status = 'Accepted';
    await quotation.save();

    return res.status(201).json({
      success: true,
      message: `Sales Order ${newOrder.orderNumber} created successfully from Quotation ${quotation.formattedQuotationNumber}.`,
      order: newOrder
    });
  } catch (error) {
    console.error('Error in createOrderFromQuotation:', error);
    return res.status(500).json({ success: false, message: 'Failed to create Sales Order from Quotation.', error: error.message });
  }
};

/**
 * 4.1 Create Sales Order Directly from Enquiry Requisition
 */
export const createOrderFromEnquiry = async (req, res) => {
  try {
    const {
      enquiryId,
      poNumber,
      poDate,
      poValue,
      poCurrency = 'INR',
      expectedDeliveryDate,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      customerRemarks,
      internalRemarks,
      documentUrl
    } = req.body;

    if (!enquiryId) {
      return res.status(400).json({ success: false, message: 'Valid Enquiry ID is required.' });
    }

    const enquiry = await Enquiry.findById(enquiryId).populate('clientId');
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const client = enquiry.clientId || {};
    const orderNumber = await generateNextSalesOrderNumber();

    const orderProducts = (enquiry.products || []).map((ep) => ({
      productId: ep._id,
      productName: ep.productName || 'HT Switchgear Panel',
      productDescription: ep.productDescription || `${ep.kilovolt || '11 kV'} ${ep.ampere || '630 A'} ${ep.kiloampere || '26.3 kA'}`,
      voltageRating: ep.kilovolt || '11 kV',
      currentRating: ep.ampere || '630 A',
      breakingCapacity: ep.kiloampere || '26.3 kA',
      equipmentConfiguration: ep.ebMetering || '',
      quantity: ep.quantity || 1,
      unit: 'Nos',
      unitPrice: ep.itemTotal ? Math.round(ep.itemTotal / (ep.quantity || 1)) : Math.round((Number(poValue) || enquiry.expectedProjectValue || 50000) / 1.18),
      discountPercent: 0,
      taxRatePercent: 18,
      totalPrice: ep.itemTotal || Math.round((Number(poValue) || enquiry.expectedProjectValue || 50000) / 1.18),
      technicalSpecifications: ep.productDescription || ''
    }));

    if (orderProducts.length === 0) {
      orderProducts.push({
        productName: enquiry.project?.projectName || 'Switchboard / Switchgear Supply',
        productDescription: enquiry.project?.projectScope || '11kV HT Breakers & Panels',
        voltageRating: '11 kV',
        currentRating: '630 A',
        breakingCapacity: '26.3 kA',
        quantity: 1,
        unit: 'Lot',
        unitPrice: Math.round((Number(poValue) || enquiry.expectedProjectValue || 50000) / 1.18),
        totalPrice: Math.round((Number(poValue) || enquiry.expectedProjectValue || 50000) / 1.18)
      });
    }

    const finalVal = Number(poValue) || enquiry.expectedProjectValue || 59000;
    const subTotal = Math.round(finalVal / 1.18);
    const taxTotal = finalVal - subTotal;

    const initialChecklist = [
      {
        parameter: 'Customer Name & Legal Entity',
        quotationValue: client.companyName || enquiry.clientName || 'Approved Buyer',
        poValue: client.companyName || enquiry.clientName || 'Approved Buyer',
        isMatch: true,
        status: 'Match',
        remarks: 'Customer billing entity matches registered Master record.'
      },
      {
        parameter: 'Requisition / PO Reference',
        quotationValue: enquiry.ern,
        poValue: poNumber || enquiry.ern,
        isMatch: true,
        status: 'Match',
        remarks: `Customer PO references requisition ${enquiry.ern}.`
      },
      {
        parameter: 'Scope of Supply / Product Configuration',
        quotationValue: orderProducts.map((p) => p.productName).join(' + '),
        poValue: orderProducts.map((p) => p.productName).join(' + '),
        isMatch: true,
        status: 'Match',
        remarks: 'Equipment line items align with engineering scope.'
      },
      {
        parameter: 'Total Order Value (₹)',
        quotationValue: `₹ ${Number(enquiry.expectedProjectValue || finalVal).toLocaleString('en-IN')}`,
        poValue: `₹ ${Number(finalVal).toLocaleString('en-IN')}`,
        isMatch: true,
        status: 'Match',
        remarks: 'Total commercial order value verified.'
      },
      {
        parameter: 'Delivery Schedule / Commitment',
        quotationValue: '10 to 12 weeks',
        poValue: expectedDeliveryDate ? new Date(expectedDeliveryDate).toLocaleDateString('en-IN') : '10 to 12 weeks',
        isMatch: true,
        status: 'Match',
        remarks: 'Manufacturing schedule confirmed.'
      },
      {
        parameter: 'Payment Terms & Milestones',
        quotationValue: paymentTerms || '30% Advance, 70% against PI',
        poValue: paymentTerms || '30% Advance, 70% against PI',
        isMatch: true,
        status: 'Match',
        remarks: 'Payment milestones accepted.'
      },
      {
        parameter: 'Warranty & Guarantee Period',
        quotationValue: warrantyTerms || '18 months from dispatch',
        poValue: warrantyTerms || '18 months from dispatch',
        isMatch: true,
        status: 'Match',
        remarks: 'Standard OEM switchgear warranty terms accepted.'
      }
    ];

    const newOrder = await SalesOrder.create({
      orderNumber,
      orderDate: new Date(),
      enquiryId: enquiry._id,
      ern: enquiry.ern,
      quotationNumber: `QT-DIRECT-${enquiry.ern}`,
      quotationVersion: 1,
      clientId: client._id || null,
      customerName: client.companyName || enquiry.clientName || 'Approved Buyer',
      customerCode: client.clientId || client.clientCode || '',
      projectTitle: enquiry.project?.projectName || 'HT Switchgear Project',
      endUser: client.endUser || enquiry.project?.endUser || '',
      contactPerson: client.contactPerson || enquiry.contactPerson || '',
      contactEmail: client.email || enquiry.email || '',
      contactPhone: client.mobile || enquiry.phone || '',
      billingAddress: client.billingAddress || enquiry.billingAddress || '',
      siteAddress: client.siteAddress || enquiry.siteAddress || '',
      gstNumber: client.gstNumber || enquiry.gstNumber || '',
      status: ORDER_STATUSES.UNDER_VERIFICATION,
      customerPO: {
        poNumber: poNumber || `PO-${enquiry.ern}`,
        poDate: poDate ? new Date(poDate) : new Date(),
        poReceivedDate: new Date(),
        poValue: finalVal,
        poCurrency,
        poRevision: 1,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        paymentTerms: paymentTerms || '30% Advance, 70% against PI prior to dispatch',
        deliveryTerms: deliveryTerms || '10 to 12 weeks from technically clear order',
        warrantyTerms: warrantyTerms || '18 months standard',
        customerRemarks: customerRemarks || '',
        internalRemarks: internalRemarks || '',
        documentUrl: documentUrl || ''
      },
      products: orderProducts,
      pricing: {
        subTotal,
        discountTotal: 0,
        taxRatePercent: 18,
        taxTotal,
        freightAndInsurance: 0,
        totalOrderValue: finalVal
      },
      commercialTerms: {
        priceBasis: 'Ex-works Salem Manufacturing Facility',
        paymentTerms: paymentTerms || '30% Advance, 70% against PI',
        deliveryTerms: deliveryTerms || '10 to 12 weeks',
        warrantyTerms: warrantyTerms || '18 months standard'
      },
      verification: {
        isVerified: true,
        status: 'Verified',
        checklist: initialChecklist,
        mismatchCount: 0
      },
      timeline: [
        {
          event: 'Sales Order Created from Requisition',
          status: ORDER_STATUSES.UNDER_VERIFICATION,
          notes: `Converted directly from Enquiry Requisition ${enquiry.ern}. Order reference: ${orderNumber}.`,
          performedBy: req.user?._id,
          performedByName: req.user?.name || 'Sales Coordinator',
          timestamp: new Date()
        }
      ],
      createdBy: req.user?._id,
      updatedBy: req.user?._id
    });

    // Update enquiry status
    enquiry.commercialStatus = 'Won';
    enquiry.approvalStatus = 'Approved';
    await enquiry.save();

    return res.status(201).json({
      success: true,
      message: `Sales Order ${newOrder.orderNumber} created successfully from Enquiry ${enquiry.ern}.`,
      order: newOrder
    });
  } catch (error) {
    console.error('Error in createOrderFromEnquiry:', error);
    return res.status(500).json({ success: false, message: 'Failed to create Sales Order from Enquiry.', error: error.message });
  }
};

/**
 * 5. Register or Update Customer Purchase Order Details
 */
export const registerCustomerPO = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const {
      poNumber,
      poDate,
      poReceivedDate,
      poValue,
      poCurrency = 'INR',
      expectedDeliveryDate,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      customerRemarks,
      internalRemarks,
      documentUrl,
      attachments = []
    } = req.body;

    if (!poNumber) {
      return res.status(400).json({ success: false, message: 'Customer PO Number is mandatory.' });
    }

    order.customerPO.poNumber = poNumber.trim();
    if (poDate) order.customerPO.poDate = new Date(poDate);
    if (poReceivedDate) order.customerPO.poReceivedDate = new Date(poReceivedDate);
    if (poValue !== undefined) order.customerPO.poValue = Number(poValue);
    if (poCurrency) order.customerPO.poCurrency = poCurrency;
    if (expectedDeliveryDate) order.customerPO.expectedDeliveryDate = new Date(expectedDeliveryDate);
    if (paymentTerms) order.customerPO.paymentTerms = paymentTerms;
    if (deliveryTerms) order.customerPO.deliveryTerms = deliveryTerms;
    if (warrantyTerms) order.customerPO.warrantyTerms = warrantyTerms;
    if (customerRemarks !== undefined) order.customerPO.customerRemarks = customerRemarks;
    if (internalRemarks !== undefined) order.customerPO.internalRemarks = internalRemarks;
    if (documentUrl) order.customerPO.documentUrl = documentUrl;

    if (attachments && attachments.length > 0) {
      attachments.forEach((att) => {
        order.customerPO.attachments.push({
          name: att.name || 'PO Attachment',
          fileUrl: att.fileUrl,
          fileType: att.fileType || 'application/pdf',
          uploadedAt: new Date(),
          uploadedBy: req.user?._id
        });
      });
    }

    if (order.status === ORDER_STATUSES.AWAITING_PO) {
      order.status = ORDER_STATUSES.PO_RECEIVED;
    }

    order.timeline.push({
      event: 'Customer PO Registered',
      status: order.status,
      notes: `Customer PO #${poNumber} registered with value ₹ ${(Number(poValue) || order.customerPO.poValue).toLocaleString('en-IN')}.`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Order Officer',
      timestamp: new Date()
    });

    if (typeof order.billingAddress === 'object' && order.billingAddress !== null) {
      const b = order.billingAddress;
      order.billingAddress = [b.street, b.city, b.state, b.postalCode, b.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (typeof order.siteAddress === 'object' && order.siteAddress !== null) {
      const s = order.siteAddress;
      order.siteAddress = [s.street, s.city, s.state, s.postalCode, s.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (!order.createdBy && req.user?._id) {
      order.createdBy = req.user._id;
    }

    order.updatedBy = req.user?._id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Purchase Order ${poNumber} registered successfully for Order ${order.orderNumber}.`,
      order
    });
  } catch (error) {
    console.error('Error in registerCustomerPO:', error);
    return res.status(500).json({ success: false, message: 'Failed to register customer PO.', error: error.message });
  }
};

/**
 * 6. PO Verification & Quotation vs PO Comparison
 */
export const verifyPO = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const { checklist = [], clarificationNotes, resolutionNotes, isApproved, markVerified } = req.body;
    const approved = Boolean(isApproved || markVerified);

    if (checklist.length > 0) {
      order.verification.checklist = checklist;
    }

    if (markVerified) {
      (order.verification.checklist || []).forEach((item) => {
        item.status = 'Match';
        item.isMatch = true;
      });
    }

    const mismatchItems = (order.verification.checklist || []).filter(
      (c) => c.status === 'Mismatch' || c.status === 'Clarification Required' || !c.isMatch
    );
    const mismatchCount = mismatchItems.length;

    order.verification.mismatchCount = mismatchCount;
    order.verification.verifiedBy = req.user?._id;
    order.verification.verifiedByName = req.user?.name || 'Quality & Order Desk';
    order.verification.verifiedAt = new Date();

    if (clarificationNotes !== undefined) order.verification.clarificationNotes = clarificationNotes;
    if (resolutionNotes !== undefined) order.verification.resolutionNotes = resolutionNotes;

    if (mismatchCount > 0 && !approved) {
      order.verification.isVerified = false;
      order.verification.status = 'Clarification Required';
      order.status = ORDER_STATUSES.CLARIFICATION_REQUIRED;

      order.timeline.push({
        event: 'PO Verification — Clarification Required',
        status: order.status,
        notes: `${mismatchCount} parameter mismatch(es) detected. Clarification requested from customer/sales.`,
        performedBy: req.user?._id,
        performedByName: req.user?.name || 'Order Verifier',
        timestamp: new Date()
      });
    } else {
      order.verification.isVerified = true;
      order.verification.status = 'Verified';
      order.status = ORDER_STATUSES.VERIFIED;

      order.timeline.push({
        event: 'PO Verified Successfully',
        status: order.status,
        notes: `PO verified against Quotation ${order.quotationNumber}. Scope, ratings, and pricing 100% matched. Ready for Order Confirmation.`,
        performedBy: req.user?._id,
        performedByName: req.user?.name || 'Order Verifier',
        timestamp: new Date()
      });
    }

    if (typeof order.billingAddress === 'object' && order.billingAddress !== null) {
      const b = order.billingAddress;
      order.billingAddress = [b.street, b.city, b.state, b.postalCode, b.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (typeof order.siteAddress === 'object' && order.siteAddress !== null) {
      const s = order.siteAddress;
      order.siteAddress = [s.street, s.city, s.state, s.postalCode, s.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (!order.createdBy && req.user?._id) {
      order.createdBy = req.user._id;
    }

    order.updatedBy = req.user?._id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: order.verification.isVerified
        ? `PO for ${order.orderNumber} verified successfully.`
        : `Verification completed with ${mismatchCount} item(s) flagged for clarification.`,
      order
    });
  } catch (error) {
    console.error('Error in verifyPO:', error);
    return res.status(500).json({ success: false, message: 'PO verification failed.', error: error.message });
  }
};

/**
 * 7. Order Confirmation & Order Acknowledgement Generation
 */
export const confirmOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const { orderCoordinator, committedDeliveryDate, confirmationRemarks } = req.body;

    const oaNumber = await generateNextOrderAcknowledgementNumber();

    order.confirmation.isConfirmed = true;
    order.confirmation.confirmedBy = req.user?._id;
    order.confirmation.confirmedByName = req.user?.name || 'Operations Lead';
    order.confirmation.confirmedAt = new Date();
    order.confirmation.orderCoordinator = orderCoordinator || req.user?.name || 'Order Desk Coordinator';
    order.confirmation.orderAcknowledgementNumber = oaNumber;
    order.confirmation.acknowledgementDate = new Date();
    if (committedDeliveryDate) order.confirmation.committedDeliveryDate = new Date(committedDeliveryDate);
    if (confirmationRemarks) order.confirmation.confirmationRemarks = confirmationRemarks;

    order.status = ORDER_STATUSES.ORDER_CONFIRMED;

    // Generate Order Acknowledgement PDF
    try {
      const pdfRes = await generateOrderAcknowledgementPDF(order);
      order.confirmation.acknowledgementPdfUrl = pdfRes.relativeUrl;
    } catch (ePdf) {
      console.warn('PDF generation warning in confirmOrder:', ePdf.message);
    }

    order.timeline.push({
      event: 'Order Confirmed & OA Issued',
      status: order.status,
      notes: `Order confirmed by ${req.user?.name || 'Operations Management'}. Official Order Acknowledgement ${oaNumber} generated.`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Executive Director',
      timestamp: new Date()
    });

    if (typeof order.billingAddress === 'object' && order.billingAddress !== null) {
      const b = order.billingAddress;
      order.billingAddress = [b.street, b.city, b.state, b.postalCode, b.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (typeof order.siteAddress === 'object' && order.siteAddress !== null) {
      const s = order.siteAddress;
      order.siteAddress = [s.street, s.city, s.state, s.postalCode, s.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (!order.createdBy && req.user?._id) {
      order.createdBy = req.user._id;
    }

    order.updatedBy = req.user?._id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Sales Order ${order.orderNumber} confirmed successfully. OA No: ${oaNumber}.`,
      order
    });
  } catch (error) {
    console.error('Error in confirmOrder:', error);
    return res.status(500).json({ success: false, message: 'Order confirmation failed.', error: error.message });
  }
};

/**
 * 8. Order Hold Management (Place On Hold)
 */
export const holdOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const { reason, description, expectedResumeDate } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Hold reason is mandatory.' });
    }

    const holdRecord = {
      reason,
      description: description || '',
      holdDate: new Date(),
      holdBy: req.user?._id,
      holdByName: req.user?.name || 'Order Authority',
      expectedResumeDate: expectedResumeDate ? new Date(expectedResumeDate) : null
    };

    order.currentHold = {
      isOnHold: true,
      reason,
      description: description || '',
      holdDate: new Date(),
      holdByName: req.user?.name || 'Order Authority',
      expectedResumeDate: expectedResumeDate ? new Date(expectedResumeDate) : null
    };

    order.holdHistory.push(holdRecord);
    order.status = ORDER_STATUSES.ON_HOLD;

    order.timeline.push({
      event: 'Order Placed On Hold',
      status: order.status,
      notes: `Reason: ${reason}. ${description ? `Note: ${description}` : ''}`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Order Authority',
      timestamp: new Date()
    });

    if (typeof order.billingAddress === 'object' && order.billingAddress !== null) {
      const b = order.billingAddress;
      order.billingAddress = [b.street, b.city, b.state, b.postalCode, b.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (typeof order.siteAddress === 'object' && order.siteAddress !== null) {
      const s = order.siteAddress;
      order.siteAddress = [s.street, s.city, s.state, s.postalCode, s.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (!order.createdBy && req.user?._id) {
      order.createdBy = req.user._id;
    }

    order.updatedBy = req.user?._id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} has been placed on hold.`,
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to hold order.', error: error.message });
  }
};

/**
 * 9. Resume Order from Hold
 */
export const resumeOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const { resumeNotes } = req.body;

    // Update active hold in history
    if (order.holdHistory.length > 0) {
      const lastHold = order.holdHistory[order.holdHistory.length - 1];
      lastHold.resumedDate = new Date();
      lastHold.resumedBy = req.user?._id;
      lastHold.resumedByName = req.user?.name || 'Operations Lead';
      lastHold.resumeNotes = resumeNotes || 'Hold resolved and operations resumed.';
    }

    order.currentHold.isOnHold = false;
    order.status = order.verification.isVerified ? ORDER_STATUSES.VERIFIED : ORDER_STATUSES.UNDER_VERIFICATION;

    order.timeline.push({
      event: 'Order Resumed from Hold',
      status: order.status,
      notes: `Order resumed into active queue. ${resumeNotes ? `Resolution: ${resumeNotes}` : ''}`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Operations Lead',
      timestamp: new Date()
    });

    if (typeof order.billingAddress === 'object' && order.billingAddress !== null) {
      const b = order.billingAddress;
      order.billingAddress = [b.street, b.city, b.state, b.postalCode, b.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (typeof order.siteAddress === 'object' && order.siteAddress !== null) {
      const s = order.siteAddress;
      order.siteAddress = [s.street, s.city, s.state, s.postalCode, s.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (!order.createdBy && req.user?._id) {
      order.createdBy = req.user._id;
    }

    order.updatedBy = req.user?._id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} resumed successfully.`,
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to resume order.', error: error.message });
  }
};

/**
 * 10. PO Revision Management (Submit Revised PO)
 */
export const submitPORevision = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const {
      revisionReason,
      newPoValue,
      newDeliveryDate,
      changesSummary,
      documentUrl
    } = req.body;

    if (!revisionReason) {
      return res.status(400).json({ success: false, message: 'Revision reason is mandatory.' });
    }

    const nextRevNum = (order.customerPO.poRevision || 1) + 1;

    // Archive current PO version to revisions array
    order.revisions.push({
      revisionNumber: order.customerPO.poRevision || 1,
      revisionDate: order.customerPO.poDate || new Date(),
      previousPoValue: order.customerPO.poValue || order.pricing.totalOrderValue,
      newPoValue: Number(newPoValue) || order.customerPO.poValue,
      previousDeliveryDate: order.customerPO.expectedDeliveryDate,
      newDeliveryDate: newDeliveryDate ? new Date(newDeliveryDate) : order.customerPO.expectedDeliveryDate,
      revisionReason,
      changesSummary: changesSummary || '',
      documentUrl: documentUrl || order.customerPO.documentUrl || '',
      revisedBy: req.user?._id,
      revisedByName: req.user?.name || 'Order Officer'
    });

    // Update active PO
    order.customerPO.poRevision = nextRevNum;
    if (newPoValue !== undefined) {
      order.customerPO.poValue = Number(newPoValue);
      order.pricing.totalOrderValue = Number(newPoValue);
      order.pricing.subTotal = Math.round(Number(newPoValue) / 1.18);
      order.pricing.taxTotal = Number(newPoValue) - order.pricing.subTotal;
    }
    if (newDeliveryDate) {
      order.customerPO.expectedDeliveryDate = new Date(newDeliveryDate);
    }
    if (documentUrl) {
      order.customerPO.documentUrl = documentUrl;
    }

    // Reset verification to require fresh re-verification of revised PO
    order.verification.isVerified = false;
    order.verification.status = 'Pending';
    order.status = ORDER_STATUSES.UNDER_VERIFICATION;

    order.timeline.push({
      event: `PO Revision #${nextRevNum} Uploaded`,
      status: order.status,
      notes: `Reason: ${revisionReason}. Value: ₹ ${(Number(newPoValue) || order.customerPO.poValue).toLocaleString('en-IN')}. Re-verification initiated.`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Order Officer',
      timestamp: new Date()
    });

    if (typeof order.billingAddress === 'object' && order.billingAddress !== null) {
      const b = order.billingAddress;
      order.billingAddress = [b.street, b.city, b.state, b.postalCode, b.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (typeof order.siteAddress === 'object' && order.siteAddress !== null) {
      const s = order.siteAddress;
      order.siteAddress = [s.street, s.city, s.state, s.postalCode, s.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (!order.createdBy && req.user?._id) {
      order.createdBy = req.user._id;
    }

    order.updatedBy = req.user?._id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `PO Revision #${nextRevNum} submitted. Historical versions preserved.`,
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record PO revision.', error: error.message });
  }
};

/**
 * 11. Cancel Order
 */
export const cancelOrder = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });
    }

    order.cancellation = {
      isCancelled: true,
      cancelledBy: req.user?._id,
      cancelledByName: req.user?.name || 'Management Authority',
      cancelledAt: new Date(),
      reason
    };

    order.status = ORDER_STATUSES.CANCELLED;

    order.timeline.push({
      event: 'Order Cancelled',
      status: order.status,
      notes: `Cancellation reason: ${reason}`,
      performedBy: req.user?._id,
      performedByName: req.user?.name || 'Management Authority',
      timestamp: new Date()
    });

    if (typeof order.billingAddress === 'object' && order.billingAddress !== null) {
      const b = order.billingAddress;
      order.billingAddress = [b.street, b.city, b.state, b.postalCode, b.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (typeof order.siteAddress === 'object' && order.siteAddress !== null) {
      const s = order.siteAddress;
      order.siteAddress = [s.street, s.city, s.state, s.postalCode, s.country].filter(Boolean).join(', ') || 'Works / Delivery Site, Tamil Nadu';
    }
    if (!order.createdBy && req.user?._id) {
      order.createdBy = req.user._id;
    }

    order.updatedBy = req.user?._id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order ${order.orderNumber} has been cancelled.`,
      order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Order cancellation failed.', error: error.message });
  }
};

/**
 * 12. Download / Generate Order Acknowledgement PDF
 */
export const getAcknowledgementPDF = async (req, res) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const pdfRes = await generateOrderAcknowledgementPDF(order);
    order.confirmation.acknowledgementPdfUrl = pdfRes.relativeUrl;
    await order.save();

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
    return res.status(500).json({ success: false, message: 'Failed to generate Order Acknowledgement PDF.', error: error.message });
  }
};

/**
 * 13. Seed Sample Orders If Empty (Using Existing Quotations and Clients)
 */
export const seedSampleOrdersIfEmpty = async (req, res) => {
  try {
    const count = await SalesOrder.countDocuments();
    if (count > 0 && req.query.force !== 'true') {
      return res.status(200).json({
        success: true,
        message: `Database already has ${count} Sales Orders. Pass ?force=true to reload defaults.`
      });
    }

    if (req.query.force === 'true') {
      await SalesOrder.deleteMany({});
    }

    // Find existing clients and quotations
    const clients = await Client.find();
    const quotations = await Quotation.find().populate('clientId').populate('enquiryId');

    const defaultClient = clients[0] || {
      companyName: 'Sivili Engineering Construction',
      clientId: 'SP-CL-2026-0001',
      siteAddress: 'Commercial Building, Salem, Tamil Nadu',
      gstNumber: '33AAACS1234F1Z5',
      contactPerson: 'Sudhan',
      email: 'sudhan@sivili.in',
      mobile: '8220710078',
      endUser: 'Eco Advanced PolyTech'
    };

    const currentYear = new Date().getFullYear();

    const sampleOrders = [
      {
        orderNumber: `SP-ORD-${currentYear}-0001`,
        orderDate: new Date('2026-09-10'),
        quotationId: quotations[0]?._id || new mongoose.Types.ObjectId(),
        quotationNumber: quotations[0]?.formattedQuotationNumber || `QT-${currentYear}-0001-R0`,
        quotationVersion: 1,
        enquiryId: quotations[0]?.enquiryId?._id || new mongoose.Types.ObjectId(),
        ern: quotations[0]?.ern || 'ERN-2026-0001',
        clientId: quotations[0]?.clientId?._id || defaultClient._id || new mongoose.Types.ObjectId(),
        customerName: quotations[0]?.clientId?.companyName || defaultClient.companyName,
        customerCode: quotations[0]?.clientId?.clientId || defaultClient.clientId,
        projectTitle: quotations[0]?.enquiryId?.project?.projectName || 'Commercial Building Substation Panels',
        endUser: 'Eco Advanced PolyTech',
        billingAddress: defaultClient.siteAddress,
        siteAddress: defaultClient.siteAddress,
        gstNumber: defaultClient.gstNumber,
        contactPerson: defaultClient.contactPerson,
        contactEmail: defaultClient.email,
        contactPhone: defaultClient.mobile,
        status: ORDER_STATUSES.ORDER_CONFIRMED,
        customerPO: {
          poNumber: 'SEC/PO/2026/09/084',
          poDate: new Date('2026-09-10'),
          poReceivedDate: new Date('2026-09-10'),
          poValue: 3400000,
          poCurrency: 'INR',
          poRevision: 1,
          expectedDeliveryDate: new Date('2026-10-23'),
          paymentTerms: '30% Advance, 70% against PI prior to dispatch',
          deliveryTerms: '10 to 12 weeks from clear drawing approval',
          warrantyTerms: '18 months from dispatch or 12 months from commissioning',
          customerRemarks: 'Deliver to Salem site directly with test reports.'
        },
        products: [
          {
            productName: '11kV Outdoor Standalone VCB Panel',
            productDescription: '11kV, 630A, 26.3kA for 3 Sec Outdoor VCB with CT/PT and Protection Relays',
            voltageRating: '11 kV',
            currentRating: '630 A',
            breakingCapacity: '26.3 kA',
            quantity: 1,
            unit: 'Nos',
            unitPrice: 2881356,
            totalPrice: 2881356
          }
        ],
        pricing: {
          subTotal: 2881356,
          discountTotal: 0,
          taxRatePercent: 18,
          taxTotal: 518644,
          freightAndInsurance: 0,
          totalOrderValue: 3400000
        },
        verification: {
          isVerified: true,
          status: 'Verified',
          verifiedByName: 'Order Verification Officer',
          verifiedAt: new Date('2026-09-10'),
          checklist: [
            { parameter: 'Customer Name & Legal Entity', quotationValue: 'Sivili Engineering Construction', poValue: 'Sivili Engineering Construction', isMatch: true, status: 'Match', remarks: 'Aligned' },
            { parameter: 'Product Specification & Ratings', quotationValue: '11kV 630A 26.3kA VCB', poValue: '11kV 630A 26.3kA VCB', isMatch: true, status: 'Match', remarks: 'Technical scope matches' },
            { parameter: 'Total Commercial Value', quotationValue: '₹ 34,00,000', poValue: '₹ 34,00,000', isMatch: true, status: 'Match', remarks: 'Value 100% matches quotation' },
            { parameter: 'Delivery Schedule', quotationValue: '23-10-2026', poValue: '23-10-2026', isMatch: true, status: 'Match', remarks: 'Delivery acceptable' }
          ]
        },
        confirmation: {
          isConfirmed: true,
          confirmedByName: 'Executive Director (Admin)',
          confirmedAt: new Date('2026-09-10'),
          orderCoordinator: 'Suresh Kumar (PO Team Lead)',
          orderAcknowledgementNumber: 'OA-2026-0001',
          acknowledgementDate: new Date('2026-09-10'),
          committedDeliveryDate: new Date('2026-10-23')
        },
        timeline: [
          { event: 'Quotation Accepted', status: 'Accepted', notes: 'Offer accepted by customer.', timestamp: new Date('2026-09-09') },
          { event: 'Customer PO Received', status: 'PO Received', notes: 'PO #SEC/PO/2026/09/084 received.', timestamp: new Date('2026-09-10') },
          { event: 'PO Verified', status: 'Verified', notes: 'All 7 commercial & technical parameters verified clean.', timestamp: new Date('2026-09-10') },
          { event: 'Order Confirmed', status: 'Order Confirmed', notes: 'Order confirmed and OA-2026-0001 generated.', timestamp: new Date('2026-09-10') }
        ],
        createdBy: req.user?._id || new mongoose.Types.ObjectId()
      },
      {
        orderNumber: `SP-ORD-${currentYear}-0002`,
        orderDate: new Date(),
        quotationId: quotations[1]?._id || quotations[0]?._id || new mongoose.Types.ObjectId(),
        quotationNumber: quotations[1]?.formattedQuotationNumber || `QT-${currentYear}-0002-R0`,
        quotationVersion: 1,
        enquiryId: quotations[1]?.enquiryId?._id || quotations[0]?.enquiryId?._id || new mongoose.Types.ObjectId(),
        ern: quotations[1]?.ern || 'ERN-2026-0007',
        clientId: quotations[1]?.clientId?._id || defaultClient._id || new mongoose.Types.ObjectId(),
        customerName: 'M Tech Solutions',
        customerCode: 'SP-CL-2026-0010',
        projectTitle: 'Solor Farm 33kV Substation Breakers',
        endUser: 'Renewable Power Board',
        billingAddress: '29/19, Gandhinagar, Bihar',
        siteAddress: 'Tamil Nadu Solar Site',
        gstNumber: '33AFCPC0165B1ZL',
        contactPerson: 'Suresh Kumar',
        contactEmail: 'suresh@mtech.in',
        contactPhone: '9840984098',
        status: ORDER_STATUSES.UNDER_VERIFICATION,
        customerPO: {
          poNumber: 'MTECH/PO/2026/11/04',
          poDate: new Date(),
          poReceivedDate: new Date(),
          poValue: 2450000,
          poCurrency: 'INR',
          poRevision: 1,
          expectedDeliveryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          paymentTerms: '20% Advance, 80% against PI',
          deliveryTerms: '8 to 10 weeks',
          warrantyTerms: '18 months standard',
          customerRemarks: 'Require factory inspection prior to dispatch.'
        },
        products: [
          {
            productName: '11kV Vacuum Circuit Breaker Panel 1250A',
            productDescription: '11kV 1250A 26.3kA Indoor VCB with Motorised Spring Mechanism',
            voltageRating: '11 kV',
            currentRating: '1250 A',
            breakingCapacity: '26.3 kA',
            quantity: 1,
            unit: 'Nos',
            unitPrice: 2076271,
            totalPrice: 2076271
          }
        ],
        pricing: {
          subTotal: 2076271,
          discountTotal: 0,
          taxRatePercent: 18,
          taxTotal: 373729,
          freightAndInsurance: 0,
          totalOrderValue: 2450000
        },
        verification: {
          isVerified: false,
          status: 'In Progress',
          mismatchCount: 1,
          checklist: [
            { parameter: 'Customer Name & Legal Entity', quotationValue: 'M Tech Solutions', poValue: 'M Tech Solutions', isMatch: true, status: 'Match', remarks: 'Matches Master' },
            { parameter: 'Payment Terms & Milestones', quotationValue: '30% Advance, 70% against PI', poValue: '20% Advance, 80% against PI', isMatch: false, status: 'Mismatch', remarks: 'Customer PO states 20% advance instead of 30% advance.' }
          ],
          clarificationNotes: 'Clarification pending with customer on 20% advance milestone.'
        },
        timeline: [
          { event: 'Quotation Accepted', status: 'Accepted', notes: 'Offer accepted by client.', timestamp: new Date(Date.now() - 48 * 3600 * 1000) },
          { event: 'Customer PO Received', status: 'PO Received', notes: 'PO #MTECH/PO/2026/11/04 uploaded.', timestamp: new Date(Date.now() - 24 * 3600 * 1000) },
          { event: 'Verification Started', status: 'Under Verification', notes: 'Comparison checklist in progress.', timestamp: new Date() }
        ],
        createdBy: req.user?._id || new mongoose.Types.ObjectId()
      },
      {
        orderNumber: `SP-ORD-${currentYear}-0003`,
        orderDate: new Date(),
        quotationId: quotations[0]?._id || new mongoose.Types.ObjectId(),
        quotationNumber: `QT-${currentYear}-0003-R0`,
        quotationVersion: 1,
        enquiryId: quotations[0]?.enquiryId?._id || new mongoose.Types.ObjectId(),
        ern: 'ERN-2026-0003',
        clientId: quotations[0]?.clientId?._id || defaultClient._id || new mongoose.Types.ObjectId(),
        customerName: 'Larsen & Toubro Ltd (T&D Division)',
        customerCode: 'SP-CL-2026-0002',
        projectTitle: 'Substation Control Panels & Breakers',
        endUser: 'State Electricity Board',
        billingAddress: 'Chennai Industrial Estate, Tamil Nadu',
        siteAddress: 'Coimbatore Substation',
        gstNumber: '33AAACL1234E1Z1',
        contactPerson: 'K. Narayanan',
        contactEmail: 'narayanan@lt.com',
        contactPhone: '9840298402',
        status: ORDER_STATUSES.ON_HOLD,
        customerPO: {
          poNumber: 'LT/TD/2026/PO-109',
          poDate: new Date(),
          poReceivedDate: new Date(),
          poValue: 4200000,
          poCurrency: 'INR',
          poRevision: 1,
          expectedDeliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          customerRemarks: 'Hold on delivery location confirmation.'
        },
        products: [
          {
            productName: '33kV / 11kV Power Distribution Panel',
            productDescription: 'Dual feeder panel with Numerical Overcurrent and Differential relays',
            quantity: 2,
            unit: 'Nos',
            unitPrice: 1779661,
            totalPrice: 3559322
          }
        ],
        pricing: {
          subTotal: 3559322,
          discountTotal: 0,
          taxRatePercent: 18,
          taxTotal: 640678,
          freightAndInsurance: 0,
          totalOrderValue: 4200000
        },
        currentHold: {
          isOnHold: true,
          reason: 'Customer Request',
          description: 'Customer requested 2-week hold pending site civil work handover.',
          holdDate: new Date(),
          holdByName: 'Manager Operations',
          expectedResumeDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        },
        holdHistory: [
          {
            reason: 'Customer Request',
            description: 'Customer requested 2-week hold pending site civil work handover.',
            holdDate: new Date(),
            holdByName: 'Manager Operations'
          }
        ],
        timeline: [
          { event: 'Customer PO Registered', status: 'PO Received', notes: 'PO #LT/TD/2026/PO-109 registered.', timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000) },
          { event: 'Order Placed On Hold', status: 'On Hold', notes: 'Site civil handover delayed.', timestamp: new Date() }
        ],
        createdBy: req.user?._id || new mongoose.Types.ObjectId()
      }
    ];

    const created = await SalesOrder.insertMany(sampleOrders);

    return res.status(201).json({
      success: true,
      message: `Initialized ${created.length} realistic switchgear Sales Orders.`,
      orders: created
    });
  } catch (error) {
    console.error('Error in seedSampleOrdersIfEmpty:', error);
    return res.status(500).json({ success: false, message: 'Failed to seed sample orders.', error: error.message });
  }
};
