import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { numberToWords } from '../utils/numberToWords.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdfDir = path.resolve(__dirname, '../../uploads/receipts');
const logoPath = path.resolve(__dirname, '../../uploads/spsg-logo.png');
const fallbackLogoPath = path.resolve(__dirname, '../../uploads/brand-logo.jpg');
const watermarkPath = path.resolve(__dirname, '../../uploads/spsg-watermark.png');
const stampPath = path.resolve(__dirname, '../../uploads/spsg-stamp.png');

if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

export const generatePaymentReceiptPDF = async (payment, orderTerms = {}, companyProfile = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const receiptNo = payment.receiptNumber || 'REC-2026-0001';
      const safeId = receiptNo.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
      const fileName = `${safeId}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      const relativeUrl = `/uploads/receipts/${fileName}`;

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: `Official Payment Receipt - ${receiptNo}`,
          Author: 'SKY POWER SWITCHGEARS'
        }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Watermark helper
      const renderWatermark = () => {
        if (fs.existsSync(watermarkPath)) {
          try {
            doc.save();
            doc.opacity(0.07);
            doc.image(watermarkPath, 110, 240, { width: 380 });
            doc.restore();
          } catch (e) {}
        }
      };

      renderWatermark();

      // Top Header: Brand Name & Address
      const activeLogo = fs.existsSync(logoPath) ? logoPath : fs.existsSync(fallbackLogoPath) ? fallbackLogoPath : null;
      if (activeLogo) {
        try {
          doc.image(activeLogo, 490, 35, { width: 65 });
        } catch (e) {}
      }

      // Title & Company Name
      doc.fillColor('#0A4076').fontSize(18).font('Helvetica-Bold')
        .text('SKY POWER SWITCHGEARS', 40, 35);

      doc.fillColor('#374151').fontSize(8.5).font('Helvetica')
        .text('Switch to the Future — HT / LT Switchgears & Electrical Distribution Panels', 40, 56)
        .text('Manufacturing Facility: 3/97D, Sankari Main Road, Ariyanoor, Salem - 636 308, Tamil Nadu', 40, 68)
        .text('GSTIN: 33AAACS1234F1Z5 • Email: accounts@skypower.co.in • Phone: +91 82207 10078', 40, 80);

      // Header Dividing Line
      doc.moveTo(40, 96).lineTo(555, 96).lineWidth(1.2).strokeColor('#0A4076').stroke();
      doc.moveTo(40, 99).lineTo(555, 99).lineWidth(0.5).strokeColor('#FF7A18').stroke();

      // Official Receipt Banner
      doc.roundedRect(40, 110, 515, 26, 4).fillAndStroke('#F0F7FF', '#BAE6FD');
      doc.fillColor('#0A4076').fontSize(11).font('Helvetica-Bold')
        .text('OFFICIAL PAYMENT RECEIPT', 45, 117, { align: 'center', width: 505 });

      // Receipt Meta Box (Receipt No, Date, Order No)
      const metaY = 146;
      doc.roundedRect(40, metaY, 515, 52, 4).fillAndStroke('#FFFFFF', '#E2E8F0');

      doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text('RECEIPT NUMBER', 50, metaY + 8);
      doc.fillColor('#0A4076').fontSize(11).font('Helvetica-Bold').text(receiptNo, 50, metaY + 20);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 50, metaY + 34);

      doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text('RECEIPT DATE', 215, metaY + 8);
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold')
        .text(new Date(payment.paymentDate || payment.receiptDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 215, metaY + 20);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(`Mode: ${payment.paymentMode || 'RTGS'}`, 215, metaY + 34);

      doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text('LINKED SALES ORDER', 380, metaY + 8);
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold').text(payment.orderNumber || '—', 380, metaY + 20);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(`PO: ${payment.customerPONumber || '—'}`, 380, metaY + 34);

      // Customer Details Section
      const custY = 208;
      doc.roundedRect(40, custY, 515, 62, 4).fillAndStroke('#F8FAFC', '#E2E8F0');
      doc.fillColor('#0A4076').fontSize(8.5).font('Helvetica-Bold').text('RECEIVED WITH THANKS FROM:', 50, custY + 8);

      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(payment.customerName || 'Client M/s', 50, custY + 22);
      doc.fillColor('#475569').fontSize(8.5).font('Helvetica')
        .text(payment.customerAddress || 'Client Registered Address, Tamil Nadu, India', 50, custY + 36, { width: 490 });
      if (payment.customerGSTIN) {
        doc.text(`GSTIN: ${payment.customerGSTIN}`, 50, custY + 48);
      }

      // Received Amount Highlight Box
      const amtY = 280;
      doc.roundedRect(40, amtY, 515, 68, 6).fillAndStroke('#ECFDF5', '#6EE7B7');

      doc.fillColor('#065F46').fontSize(9).font('Helvetica-Bold').text('AMOUNT RECEIVED', 55, amtY + 10);
      const formattedAmount = `₹ ${(payment.amount || 0).toLocaleString('en-IN')}/-`;
      doc.fillColor('#047857').fontSize(19).font('Helvetica-Bold').text(formattedAmount, 55, amtY + 23);

      const words = payment.amountInWords || `${numberToWords(payment.amount || 0)} Rupees Only`;
      doc.fillColor('#065F46').fontSize(9).font('Helvetica-Bold')
        .text(`In Words: ${words}`, 55, amtY + 48, { width: 485 });

      // Transaction & Payment Particulars Table
      const partY = 358;
      doc.fillColor('#0A4076').fontSize(9.5).font('Helvetica-Bold').text('PAYMENT & TRANSACTION PARTICULARS', 40, partY);

      doc.roundedRect(40, partY + 14, 515, 88, 4).fillAndStroke('#FFFFFF', '#CBD5E1');

      const drawRow = (label, value, y, label2, value2) => {
        doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text(label, 50, y);
        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica').text(value || '—', 170, y);
        if (label2) {
          doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text(label2, 320, y);
          doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(value2 || '—', 430, y);
        }
      };

      drawRow('Payment Mode:', payment.paymentMode || 'RTGS', partY + 24, 'Payment Milestone:', payment.milestoneName || 'Advance');
      drawRow('Bank / Institution:', payment.bankName || 'HDFC Bank', partY + 42, 'Payment Date:', new Date(payment.paymentDate).toLocaleDateString('en-IN'));
      drawRow('Transaction Ref / UTR:', payment.transactionReference || payment.utrNumber || '—', partY + 60, 'Receipt Status:', payment.status || 'Cleared');
      drawRow('Remarks / Narration:', payment.remarks || 'Advance payment credited against confirmed switchgear order.', partY + 78);

      // Account Balance Summary Box
      const balY = 470;
      doc.roundedRect(40, balY, 515, 78, 4).fillAndStroke('#F1F5F9', '#CBD5E1');
      doc.fillColor('#0A4076').fontSize(9).font('Helvetica-Bold').text('ORDER FINANCIAL ACCOUNT SUMMARY', 50, balY + 10);

      const totalVal = orderTerms.totalOrderValue || 0;
      const totalRcvd = orderTerms.totalReceived || payment.amount || 0;
      const remBalance = payment.remainingOutstandingAmount !== undefined ? payment.remainingOutstandingAmount : Math.max(0, totalVal - totalRcvd);

      const colW = 160;
      // Col 1: Total Order Value
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Total Order Value', 55, balY + 28);
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(`₹ ${totalVal.toLocaleString('en-IN')}`, 55, balY + 40);

      // Col 2: Total Received Till Date
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Cumulative Amount Received', 220, balY + 28);
      doc.fillColor('#047857').fontSize(11).font('Helvetica-Bold').text(`₹ ${totalRcvd.toLocaleString('en-IN')}`, 220, balY + 40);

      // Col 3: Balance Due
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Remaining Balance Due', 385, balY + 28);
      doc.fillColor('#DC2626').fontSize(11).font('Helvetica-Bold').text(`₹ ${remBalance.toLocaleString('en-IN')}`, 385, balY + 40);

      doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
        .text('* Subject to final invoice reconciliation and applicable GST credits upon dispatch.', 55, balY + 62);

      // Terms & Conditions / Note
      const termsY = 560;
      doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text('TERMS & CONDITIONS:', 40, termsY);
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica')
        .text('1. All payments received by Cheque / RTGS / NEFT are subject to realization and bank settlement.', 40, termsY + 12)
        .text('2. This is an official system-generated receipt issued by Sky Power Switchgears Accounts & Finance Department.', 40, termsY + 22)
        .text('3. Any discrepancies must be brought to our notice within 7 days of the receipt date.', 40, termsY + 32);

      // Signature & Stamp Section
      const sigY = 625;
      if (fs.existsSync(stampPath)) {
        try {
          doc.image(stampPath, 395, sigY - 20, { width: 105 });
        } catch (e) {}
      }

      doc.fillColor('#0A4076').fontSize(8.5).font('Helvetica-Bold')
        .text('For SKY POWER SWITCHGEARS', 380, sigY, { width: 155, align: 'center' });

      doc.moveTo(380, sigY + 50).lineTo(535, sigY + 50).lineWidth(0.8).strokeColor('#64748B').stroke();
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold')
        .text('Authorized Finance Signatory', 380, sigY + 54, { width: 155, align: 'center' });
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica')
        .text(payment.receivedByName || 'Accounts & Finance Team', 380, sigY + 64, { width: 155, align: 'center' });

      // Bottom Footer Bar
      doc.moveTo(40, 755).lineTo(555, 755).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
      doc.fillColor('#94A3B8').fontSize(7.5).font('Helvetica')
        .text('Sky Power Switchgears • ISO 9001:2015 Certified Switchgear Manufacturing ERP System', 40, 762, { align: 'center', width: 515 });

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filePath, fileName, relativeUrl });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};
