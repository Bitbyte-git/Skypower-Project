import { Quotation } from '../models/Quotation.js';
import { Enquiry } from '../models/Enquiry.js';
import { Client } from '../models/Client.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { generateNextQuotationNumber } from '../services/counterService.js';
import { generateQuotationPDF } from '../services/pdfService.js';
import { APPROVAL_STATUSES, QUOTATION_STATUSES } from '../constants/statuses.js';
import { logActivity } from '../services/auditService.js';
import path from 'path';
import fs from 'fs';

export const createQuotation = async (req, res, next) => {
  try {
    const {
      enquiryId,
      validityDays = 30,
      productPricing,
      commercialTerms,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      discountTotal = 0,
      freightAndInsurance = 0,
      taxRatePercent = 18
    } = req.body;

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.'
      });
    }

    // MANDATORY BUSINESS RULE: Only approved enquiries are eligible for quotation generation
    if (enquiry.approvalStatus !== APPROVAL_STATUSES.APPROVED) {
      return res.status(403).json({
        success: false,
        message: `Quotation generation prohibited: Enquiry ${enquiry.ern} is currently in '${enquiry.approvalStatus}' status. Only Approved enquiries are eligible.`
      });
    }

    const client = await Client.findById(enquiry.clientId);
    const settings = await SystemSetting.findOne({ key: 'master_config' });

    const baseQuotationNumber = await generateNextQuotationNumber();
    const formattedQuotationNumber = `${baseQuotationNumber}-V1`;

    // Compute Subtotal and Line items
    let subTotal = 0;
    const computedItems = productPricing.map((item) => {
      const lineGross = Number(item.quantity) * Number(item.unitPrice);
      const lineDiscount = lineGross * ((Number(item.discountPercent) || 0) / 100);
      const lineNet = lineGross - lineDiscount;
      subTotal += lineNet;
      return {
        ...item,
        netAmount: lineNet
      };
    });

    const netTaxable = Math.max(0, subTotal - Number(discountTotal) + Number(freightAndInsurance));
    const taxTotal = netTaxable * ((Number(taxRatePercent) || 18) / 100);
    const finalQuotationValue = Math.round(netTaxable + taxTotal);

    const quotationDate = new Date();
    const validityDate = new Date();
    validityDate.setDate(quotationDate.getDate() + Number(validityDays));

    const quotation = new Quotation({
      quotationNumber: baseQuotationNumber,
      version: 1,
      formattedQuotationNumber,
      enquiryId: enquiry._id,
      ern: enquiry.ern,
      clientId: client._id,
      quotationDate,
      validityDate,
      productPricing: computedItems,
      subTotal,
      discountTotal: Number(discountTotal),
      taxRatePercent: Number(taxRatePercent),
      taxTotal,
      freightAndInsurance: Number(freightAndInsurance),
      finalQuotationValue,
      commercialTerms,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      status: QUOTATION_STATUSES.ISSUED,
      createdBy: req.user._id
    });

    // Generate PDF
    const { relativeUrl } = await generateQuotationPDF(quotation, client, settings?.companyProfile);
    quotation.pdfFileUrl = relativeUrl;
    await quotation.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'QUOTATION_GENERATED',
      entityType: 'Quotation',
      entityId: quotation._id,
      ern: enquiry.ern,
      details: {
        quotationNumber: quotation.formattedQuotationNumber,
        finalQuotationValue
      },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Quotation ${quotation.formattedQuotationNumber} generated and PDF created successfully.`,
      quotation
    });
  } catch (err) {
    next(err);
  }
};

export const reviseQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      revisionRemarks,
      validityDays = 30,
      productPricing,
      commercialTerms,
      paymentTerms,
      deliveryTerms,
      warrantyTerms,
      discountTotal = 0,
      freightAndInsurance = 0,
      taxRatePercent = 18
    } = req.body;

    const previousQuotation = await Quotation.findById(id);
    if (!previousQuotation) {
      return res.status(404).json({
        success: false,
        message: 'Previous quotation record not found.'
      });
    }

    const enquiry = await Enquiry.findById(previousQuotation.enquiryId);
    const client = await Client.findById(previousQuotation.clientId);
    const settings = await SystemSetting.findOne({ key: 'master_config' });

    // Mark previous quotation as Superseded
    previousQuotation.status = QUOTATION_STATUSES.SUPERSEDED;
    await previousQuotation.save();

    const newVersion = previousQuotation.version + 1;
    const formattedQuotationNumber = `${previousQuotation.quotationNumber}-V${newVersion}`;

    let subTotal = 0;
    const computedItems = productPricing.map((item) => {
      const lineGross = Number(item.quantity) * Number(item.unitPrice);
      const lineDiscount = lineGross * ((Number(item.discountPercent) || 0) / 100);
      const lineNet = lineGross - lineDiscount;
      subTotal += lineNet;
      return {
        ...item,
        netAmount: lineNet
      };
    });

    const netTaxable = Math.max(0, subTotal - Number(discountTotal) + Number(freightAndInsurance));
    const taxTotal = netTaxable * ((Number(taxRatePercent) || 18) / 100);
    const finalQuotationValue = Math.round(netTaxable + taxTotal);

    const quotationDate = new Date();
    const validityDate = new Date();
    validityDate.setDate(quotationDate.getDate() + Number(validityDays));

    const revisedQuotation = new Quotation({
      quotationNumber: previousQuotation.quotationNumber,
      version: newVersion,
      formattedQuotationNumber,
      enquiryId: enquiry._id,
      ern: enquiry.ern,
      clientId: client._id,
      quotationDate,
      validityDate,
      productPricing: computedItems,
      subTotal,
      discountTotal: Number(discountTotal),
      taxRatePercent: Number(taxRatePercent),
      taxTotal,
      freightAndInsurance: Number(freightAndInsurance),
      finalQuotationValue,
      commercialTerms: commercialTerms || previousQuotation.commercialTerms,
      paymentTerms: paymentTerms || previousQuotation.paymentTerms,
      deliveryTerms: deliveryTerms || previousQuotation.deliveryTerms,
      warrantyTerms: warrantyTerms || previousQuotation.warrantyTerms,
      status: QUOTATION_STATUSES.ISSUED,
      revisionRemarks,
      createdBy: req.user._id
    });

    const { relativeUrl } = await generateQuotationPDF(revisedQuotation, client, settings?.companyProfile);
    revisedQuotation.pdfFileUrl = relativeUrl;
    await revisedQuotation.save();

    await logActivity({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'QUOTATION_REVISED',
      entityType: 'Quotation',
      entityId: revisedQuotation._id,
      ern: enquiry.ern,
      details: {
        previousVersion: previousQuotation.formattedQuotationNumber,
        newVersion: revisedQuotation.formattedQuotationNumber,
        revisionRemarks
      },
      req
    });

    return res.status(201).json({
      success: true,
      message: `Revised Quotation ${revisedQuotation.formattedQuotationNumber} issued. Previous version preserved in history.`,
      quotation: revisedQuotation
    });
  } catch (err) {
    next(err);
  }
};

export const getQuotations = async (req, res, next) => {
  try {
    const { enquiryId, status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (enquiryId) query.enquiryId = enquiryId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { formattedQuotationNumber: { $regex: search, $options: 'i' } },
        { ern: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query)
      .populate('clientId', 'companyName clientLocation contactPerson mobile')
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      quotations
    });
  } catch (err) {
    next(err);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id)
      .populate('clientId')
      .populate('enquiryId')
      .populate('createdBy', 'name email role');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      });
    }

    // Also fetch sibling versions for this quotation number
    const versions = await Quotation.find({ quotationNumber: quotation.quotationNumber })
      .select('version formattedQuotationNumber finalQuotationValue status createdAt revisionRemarks')
      .sort({ version: 1 });

    return res.status(200).json({
      success: true,
      quotation,
      versions
    });
  } catch (err) {
    next(err);
  }
};

