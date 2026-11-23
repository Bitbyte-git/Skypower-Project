import { Counter } from '../models/Counter.js';

export const generateNextERN = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `ern_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `ERN-${currentYear}-${paddedSeq}`;
};

export const generateNextQuotationNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `quotation_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `QT-${currentYear}-${paddedSeq}`;
};

export const generateNextClientID = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `sp_client_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `SP-CL-${currentYear}-${paddedSeq}`;
};

export const generateNextPOID = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `po_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `PO-${currentYear}-${paddedSeq}`;
};

export const generateNextProjectTrackingID = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `prj_tracking_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `PRJ-${currentYear}-${paddedSeq}`;
};

export const generateNextSalesOrderNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `sales_order_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `SP-ORD-${currentYear}-${paddedSeq}`;
};

export const generateNextOrderAcknowledgementNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `order_ack_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `OA-${currentYear}-${paddedSeq}`;
};

export const generateNextPaymentReceiptNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `payment_receipt_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `REC-${currentYear}-${paddedSeq}`;
};

export const generateNextEngineeringProjectNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `eng_project_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `SP-ENG-${currentYear}-${paddedSeq}`;
};

export const generateNextDrawingNumber = async (type = 'GA') => {
  const currentYear = new Date().getFullYear();
  const counterId = `eng_drawing_${currentYear}_${type}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `DWG-${type}-${currentYear}-${paddedSeq}`;
};

export const generateNextSubmissionNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `eng_sub_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `SUB-ENG-${currentYear}-${paddedSeq}`;
};

export const generateNextClarificationNumber = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `eng_tc_${currentYear}`;

  const counter = await Counter.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `TC-ENG-${currentYear}-${paddedSeq}`;
};

