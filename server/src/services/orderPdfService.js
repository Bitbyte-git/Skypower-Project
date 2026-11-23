import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { numberToWords } from '../utils/numberToWords.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdfDir = path.resolve(__dirname, '../../uploads/orders');
const logoPath = path.resolve(__dirname, '../../uploads/spsg-logo.png');
const fallbackLogoPath = path.resolve(__dirname, '../../uploads/brand-logo.jpg');
const watermarkPath = path.resolve(__dirname, '../../uploads/spsg-watermark.png');
const stampPath = path.resolve(__dirname, '../../uploads/spsg-stamp.png');

if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

export const generateOrderAcknowledgementPDF = async (salesOrder, companyProfile = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const oaNumber = salesOrder.confirmation?.orderAcknowledgementNumber || `OA-${salesOrder.orderNumber.replace(/^SP-ORD-/, '')}`;
      const safeId = oaNumber.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
      const fileName = `${safeId}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      const relativeUrl = `/uploads/orders/${fileName}`;

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true,
        info: {
          Title: `Order Acknowledgement - ${oaNumber}`,
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
            doc.opacity(0.08);
            doc.image(watermarkPath, 90, 210, { width: 420 });
            doc.restore();
          } catch (e) {}
        }
      };

      // Header helper
      const renderHeader = (pageNumber = 1) => {
        renderWatermark();

        // Circled page number
        doc.fillColor('#374151').fontSize(9).font('Helvetica')
          .text(`Page ${pageNumber}`, 470, 20, { align: 'right', width: 85 });

        // Logo on right
        const activeLogo = fs.existsSync(logoPath) ? logoPath : fs.existsSync(fallbackLogoPath) ? fallbackLogoPath : null;
        if (activeLogo) {
          try {
            doc.image(activeLogo, 495, 32, { width: 60 });
          } catch (e) {
            doc.circle(520, 50, 18).lineWidth(1.2).strokeColor('#0A4076').stroke();
            doc.fillColor('#0A4076').fontSize(12).font('Helvetica-Bold').text('SP', 513, 44);
          }
        }

        // Company Title & Badge
        doc.fillColor('#062B59').fontSize(16).font('Helvetica-Bold').text('SKY POWER SWITCHGEARS', 40, 32);
        doc.fillColor('#FF7A18').fontSize(8.5).font('Helvetica-Bold').text('SWITCH TO THE FUTURE — HT / LT SWITCHGEARS & PANELS', 40, 50);
        doc.fillColor('#4B5563').fontSize(7.5).font('Helvetica')
          .text('Works: 3/97D, Sarkarkollapatty, Paaraivattam, Salem - 636030, Tamil Nadu.', 40, 62)
          .text('GSTIN: 33AFCFS0165B1ZL | Email: sales@skypower.co.in | Web: www.skypower.co.in', 40, 72);

        // Document Banner
        doc.rect(40, 88, 515, 24).fill('#062B59');
        doc.fillColor('#FFFFFF').fontSize(10.5).font('Helvetica-Bold')
          .text('ORDER ACKNOWLEDGEMENT & CONFIRMATION', 40, 95, { align: 'center', width: 515 });
      };

      // Footer helper
      const renderFooter = () => {
        const bottomY = 760;
        doc.rect(40, bottomY - 5, 515, 0.5).fill('#CBD5E1');
        doc.fillColor('#1F2937').fontSize(8.5).font('Helvetica-Bold')
          .text('SKY POWER SWITCHGEARS — ORDER DESK', 40, bottomY);
        doc.fillColor('#6B7280').fontSize(7.5).font('Helvetica')
          .text('This is an official computer-generated Order Acknowledgement valid with corporate stamp & authorization.', 40, bottomY + 11)
          .text(`Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`, 40, bottomY + 21);
      };

      renderHeader(1);

      // Meta Info Grid (Order Number, Dates, Quotation Ref, PO Ref)
      const dateStr = new Date(salesOrder.orderDate || Date.now()).toLocaleDateString('en-IN');
      const poDateStr = salesOrder.customerPO?.poDate ? new Date(salesOrder.customerPO.poDate).toLocaleDateString('en-IN') : 'N/A';
      const deliveryDateStr = salesOrder.customerPO?.expectedDeliveryDate ? new Date(salesOrder.customerPO.expectedDeliveryDate).toLocaleDateString('en-IN') : '10-12 Weeks';

      let y = 122;
      doc.rect(40, y, 515, 60).fillAndStroke('#F8FAFC', '#E2E8F0');

      doc.fillColor('#062B59').fontSize(8.5).font('Helvetica-Bold').text('OA NUMBER:', 50, y + 8);
      doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold').text(oaNumber, 150, y + 8);

      doc.fillColor('#062B59').fontSize(8.5).font('Helvetica-Bold').text('SALES ORDER NO:', 320, y + 8);
      doc.fillColor('#0878C9').fontSize(9).font('Helvetica-Bold').text(salesOrder.orderNumber, 430, y + 8);

      doc.fillColor('#062B59').fontSize(8.5).font('Helvetica-Bold').text('OA DATE:', 50, y + 24);
      doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text(dateStr, 150, y + 24);

      doc.fillColor('#062B59').fontSize(8.5).font('Helvetica-Bold').text('QUOTATION REF:', 320, y + 24);
      doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text(salesOrder.quotationNumber || 'N/A', 430, y + 24);

      doc.fillColor('#062B59').fontSize(8.5).font('Helvetica-Bold').text('CUSTOMER PO NO:', 50, y + 40);
      doc.fillColor('#059669').fontSize(8.5).font('Helvetica-Bold').text(salesOrder.customerPO?.poNumber || 'PO PENDING', 150, y + 40);

      doc.fillColor('#062B59').fontSize(8.5).font('Helvetica-Bold').text('CUSTOMER PO DATE:', 320, y + 40);
      doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text(poDateStr, 430, y + 40);

      // Customer & Project Section
      y = 192;
      doc.rect(40, y, 250, 80).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.rect(40, y, 250, 16).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('CUSTOMER INFORMATION', 48, y + 4);

      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(salesOrder.customerName, 48, y + 22, { width: 235 });
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
        .text(`Code: ${salesOrder.customerCode || 'SP-CL-APPROVED'} | GST: ${salesOrder.gstNumber || '33XXXXX1234Z1'}`, 48, y + 34)
        .text(`Contact: ${salesOrder.contactPerson || 'Commercial Desk'} (${salesOrder.contactPhone || 'N/A'})`, 48, y + 44)
        .text(`Address: ${salesOrder.billingAddress || salesOrder.siteAddress || 'Works / Delivery Site'}`, 48, y + 54, { width: 235, height: 22 });

      // Project Section
      doc.rect(305, y, 250, 80).fillAndStroke('#FFFFFF', '#CBD5E1');
      doc.rect(305, y, 250, 16).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('PROJECT & REQUISITION CONTEXT', 313, y + 4);

      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(salesOrder.projectTitle, 313, y + 22, { width: 235 });
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
        .text(`Linked ERN: ${salesOrder.ern}`, 313, y + 34)
        .text(`End User: ${salesOrder.endUser || 'Direct Industrial Supply'}`, 313, y + 44)
        .text(`Delivery Commitment: ${deliveryDateStr}`, 313, y + 54)
        .text(`Order Coordinator: ${salesOrder.confirmation?.orderCoordinator || 'Sky Power Order Desk'}`, 313, y + 64);

      // Salutation
      y = 282;
      doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica-Bold').text('Dear Sir / Madam,', 40, y);
      doc.fillColor('#334155').fontSize(8).font('Helvetica')
        .text(
          `We gratefully acknowledge with thanks the receipt of your Purchase Order for the switchgear equipment detailed below. We confirm acceptance of the order subject to our standard terms and agreed technical specifications.`,
          40,
          y + 12,
          { width: 515, align: 'justify' }
        );

      // Product Table Header
      y = 318;
      doc.rect(40, y, 515, 18).fill('#062B59');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('SI.', 45, y + 5);
      doc.text('Equipment Description & Technical Scope', 75, y + 5);
      doc.text('Qty', 350, y + 5, { width: 35, align: 'center' });
      doc.text('Unit Rate (₹)', 390, y + 5, { width: 70, align: 'right' });
      doc.text('Amount (₹)', 470, y + 5, { width: 75, align: 'right' });

      // Product Rows
      y += 18;
      const products = salesOrder.products && salesOrder.products.length > 0 ? salesOrder.products : [
        {
          productName: '11kV Outdoor Type Standalone VCB Switchboard',
          productDescription: '11kV, 630A, 26.3kA for 3 Sec, Indoor/Outdoor Panel with CT/PT and Protection Relays',
          quantity: 1,
          unit: 'Nos',
          unitPrice: salesOrder.pricing?.totalOrderValue ? Math.round(salesOrder.pricing.totalOrderValue / 1.18) : 500000,
          totalPrice: salesOrder.pricing?.totalOrderValue ? Math.round(salesOrder.pricing.totalOrderValue / 1.18) : 500000
        }
      ];

      products.forEach((p, idx) => {
        const rowHeight = 36;
        const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(40, y, 515, rowHeight).fillAndStroke(bg, '#E2E8F0');

        doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold').text(String(idx + 1), 45, y + 6);
        doc.fillColor('#062B59').fontSize(8.5).font('Helvetica-Bold').text(p.productName, 75, y + 6, { width: 265 });
        doc.fillColor('#64748B').fontSize(7.5).font('Helvetica')
          .text(p.productDescription || `${p.voltageRating || '11kV'} | ${p.currentRating || '630A'} | ${p.breakingCapacity || '26.3kA'}`, 75, y + 18, { width: 265, height: 16 });

        doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica-Bold').text(`${p.quantity} ${p.unit || 'Nos'}`, 350, y + 10, { width: 35, align: 'center' });
        doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text((p.unitPrice || 0).toLocaleString('en-IN'), 390, y + 10, { width: 70, align: 'right' });
        doc.fillColor('#062B59').fontSize(8.5).font('Helvetica-Bold').text((p.totalPrice || (p.quantity * p.unitPrice) || 0).toLocaleString('en-IN'), 470, y + 10, { width: 75, align: 'right' });

        y += rowHeight;
      });

      // Commercial Summary Box
      y += 6;
      const subTotal = salesOrder.pricing?.subTotal || products.reduce((acc, p) => acc + (p.totalPrice || 0), 0);
      const taxRate = salesOrder.pricing?.taxRatePercent || 18;
      const taxAmount = salesOrder.pricing?.taxTotal || Math.round((subTotal * taxRate) / 100);
      const grandTotal = salesOrder.pricing?.totalOrderValue || (subTotal + taxAmount);

      doc.rect(330, y, 225, 68).fillAndStroke('#F8FAFC', '#CBD5E1');

      doc.fillColor('#475569').fontSize(8).font('Helvetica').text('Sub Total (Basic):', 340, y + 8);
      doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica-Bold').text(`₹ ${subTotal.toLocaleString('en-IN')}`, 440, y + 8, { width: 105, align: 'right' });

      doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`GST (${taxRate}%):`, 340, y + 24);
      doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica-Bold').text(`₹ ${taxAmount.toLocaleString('en-IN')}`, 440, y + 24, { width: 105, align: 'right' });

      doc.rect(330, y + 42, 225, 26).fill('#062B59');
      doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold').text('TOTAL ORDER VALUE:', 340, y + 50);
      doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold').text(`₹ ${grandTotal.toLocaleString('en-IN')}`, 440, y + 49, { width: 105, align: 'right' });

      // Amount in Words
      doc.rect(40, y, 280, 68).fillAndStroke('#FFFFFF', '#E2E8F0');
      doc.fillColor('#062B59').fontSize(8).font('Helvetica-Bold').text('AMOUNT IN WORDS:', 48, y + 8);
      doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold')
        .text(`Indian Rupees ${numberToWords(grandTotal)} Only.`, 48, y + 22, { width: 265 });

      // Agreed Terms & Conditions
      y += 80;
      doc.rect(40, y, 515, 14).fill('#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('AGREED COMMERCIAL TERMS & DISPATCH CONDITIONS', 48, y + 3);

      y += 18;
      const terms = [
        { label: 'Price Basis:', val: salesOrder.commercialTerms?.priceBasis || 'Ex-works Salem manufacturing facility. Freight extra.' },
        { label: 'Payment Terms:', val: salesOrder.commercialTerms?.paymentTerms || '30% advance with PO, 70% against Proforma Invoice prior to dispatch.' },
        { label: 'Delivery Commitment:', val: salesOrder.commercialTerms?.deliveryTerms || '10 to 12 weeks from receipt of technically clear PO & drawing approval.' },
        { label: 'Warranty:', val: salesOrder.commercialTerms?.warrantyTerms || '18 months from date of dispatch or 12 months from commissioning.' }
      ];

      terms.forEach((t) => {
        doc.fillColor('#062B59').fontSize(8).font('Helvetica-Bold').text(t.label, 48, y, { width: 120 });
        doc.fillColor('#334155').fontSize(8).font('Helvetica').text(t.val, 170, y, { width: 375 });
        y += 13;
      });

      // Signature & Rubber Stamp Block
      y = 665;
      const activeStamp = fs.existsSync(stampPath) ? stampPath : null;
      if (activeStamp) {
        try {
          doc.image(activeStamp, 410, y - 10, { width: 85 });
        } catch (e) {}
      }

      doc.fillColor('#062B59').fontSize(9).font('Helvetica-Bold')
        .text('For SKY POWER SWITCHGEARS', 380, y + 55, { align: 'center', width: 155 });
      doc.fillColor('#475569').fontSize(8).font('Helvetica')
        .text('Authorized Commercial Signatory', 380, y + 68, { align: 'center', width: 155 });

      renderFooter();
      doc.end();

      writeStream.on('finish', () => resolve({ filePath, relativeUrl, fileName }));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};
