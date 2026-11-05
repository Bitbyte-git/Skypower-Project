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
