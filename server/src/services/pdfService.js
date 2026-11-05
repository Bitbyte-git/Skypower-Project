import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { numberToWords } from '../utils/numberToWords.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pdfDir = path.resolve(__dirname, '../../uploads/quotations');
const logoPath = path.resolve(__dirname, '../../uploads/brand-logo.jpg');

if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

export const generateQuotationPDF = async (quotation, client, companyProfile = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const resolvedClient = client || quotation.clientId || {};
      const safeId = (quotation.formattedQuotationNumber || quotation.quotationNumber || 'QT-OFFER')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_');
      const fileName = `${safeId}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      const relativeUrl = `/uploads/quotations/${fileName}`;

      const doc = new PDFDocument({
        size: 'A4',
        margin: 45,
        bufferPages: true,
        info: {
          Title: `Offer Price - ${quotation.formattedQuotationNumber}`,
          Author: 'SKY POWER SWITCHGEARS'
        }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Helper function to render official header with SP logo
      const renderHeader = (isFirstPage = false) => {
        // Logo on right
        if (fs.existsSync(logoPath)) {
          try {
            doc.image(logoPath, 465, 40, { width: 85, height: 42 });
          } catch (e) {
            // Draw vector SP circular logo as fallback
            doc.circle(500, 60, 20).lineWidth(1.5).strokeColor('#1E3A5F').stroke();
            doc.fillColor('#1E3A5F').fontSize(14).font('Helvetica-Bold').text('SP', 491, 53);
            doc.fillColor('#1E3A5F').fontSize(8).font('Helvetica-Bold').text('SKY POWER', 472, 85);
            doc.fillColor('#EE6F2D').fontSize(6).font('Helvetica').text('Switch to Future', 472, 95);
          }
        } else {
          doc.circle(500, 60, 20).lineWidth(1.5).strokeColor('#1E3A5F').stroke();
          doc.fillColor('#1E3A5F').fontSize(14).font('Helvetica-Bold').text('SP', 491, 53);
          doc.fillColor('#1E3A5F').fontSize(8).font('Helvetica-Bold').text('SKY POWER', 472, 85);
          doc.fillColor('#EE6F2D').fontSize(6).font('Helvetica').text('Switch to Future', 472, 95);
        }
      };

      // Helper function to render official Salem footer on every page
      const renderFooter = () => {
        const bottomY = 760;
        doc.lineWidth(0.5).strokeColor('#94A3B8').moveTo(45, bottomY).lineTo(550, bottomY).stroke();

        doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold')
           .text('SKY POWER SWITCHGEARS', 45, bottomY + 6);

        doc.fillColor('#334155').fontSize(7.5).font('Helvetica')
           .text('3/97D,Sarkarkollapatty,Paaraivattam,Salem-636030.Tamil Nadu.', 45, bottomY + 20)
           .text('GST No:33AFCFS0165B1ZL ,Mobile: 8667033968/7904209057/6381185644', 45, bottomY + 31)
           .text('Email : sales.skypower@gmail.com', 45, bottomY + 42);
      };

      // =========================================================================
      // PAGE 1: TECHNO-COMMERCIAL OFFER & PRICE TABLE (Image 1)
      // =========================================================================
      renderHeader(true);

      // Reference & Date Box
      const refNumber = quotation.formattedQuotationNumber
        ? `REF: SKY/MKT/11 /${quotation.formattedQuotationNumber.replace('QT-', '')}/2026-27 -R1`
        : 'REF: SKY/MKT/11 /00155A/2026-27 -R1';

      const offerDate = new Date(quotation.quotationDate || Date.now()).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '-');

      doc.fillColor('#000000').fontSize(8.5).font('Helvetica-Bold')
         .text(refNumber, 45, 95);
      doc.text(`Date: ${offerDate}`, 430, 95, { align: 'right', width: 120 });

      // Client Address
      let y = 125;
      doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
         .text(`M/s. ${resolvedClient.companyName || 'Sivili Engineering Construction'},`, 45, y);
      y += 13;

      const clientAddr = resolvedClient.siteAddress || resolvedClient.clientLocation || resolvedClient.billingAddress?.city || 'Kancheepuram, Tamil Nadu.';
      doc.font('Helvetica')
         .text(clientAddr, 45, y, { width: 350 });
      y += 24;

      // Salutation & Subject
      doc.font('Helvetica').text('Dear Sir,', 45, y);
      y += 14;

      const mainProduct = quotation.productPricing?.[0]?.productDescription ||
        quotation.productPricing?.[0]?.productName ||
        '11kV Outdoor Type Standalone VCB Switchboard';

      doc.font('Helvetica-Bold')
         .text(`Sub: "Offer Price" for supply of ${mainProduct.slice(0, 70)} – Reg.,`, 45, y);
      y += 14;

      doc.font('Helvetica').fontSize(8.5)
         .text('With reference to the above, we are pleased to submit our techno commercial offer for your kind perusal', 45, y);
      y += 20;

      // 1. Scope of Supply
      doc.font('Helvetica-Bold').fontSize(8.5).text('1.  Scope of Supply:-', 45, y);
      y += 13;
      doc.font('Helvetica').fontSize(8)
         .text('Our scope shall be limited to design, Manufacturing and supply of the quoted HT switchgear panels only. Erection, testing and commissioning shall not be in our scope.', 65, y, { width: 480 });
      y += 24;

      // 2. Price Basis
      doc.font('Helvetica-Bold').fontSize(8.5).text('2.  Price Basis:-', 45, y);
      y += 13;
      const priceBasisText = quotation.commercialTerms || 'Ex-Works: Salem, Tamil Nadu';
      doc.font('Helvetica').fontSize(8)
         .text(priceBasisText, 65, y);
      y += 20;

      // 3. Price Table
      doc.font('Helvetica-Bold').fontSize(8.5).text('3.  Price:-', 45, y);
      y += 14;

      const tableLeft = 45;
      const colWidths = {
        sl: 35,
        desc: 260,
        unitPrice: 70,
        qty: 35,
        total: 105
      };
      const tableWidth = colWidths.sl + colWidths.desc + colWidths.unitPrice + colWidths.qty + colWidths.total;

      // Table Header Row
      const tableHeaderHeight = 22;
      doc.lineWidth(1).strokeColor('#000000');
      doc.rect(tableLeft, y, tableWidth, tableHeaderHeight).stroke();

      // Vertical separators in header
      let cx = tableLeft;
      doc.moveTo(cx + colWidths.sl, y).lineTo(cx + colWidths.sl, y + tableHeaderHeight).stroke();
      cx += colWidths.sl;
      doc.moveTo(cx + colWidths.desc, y).lineTo(cx + colWidths.desc, y + tableHeaderHeight).stroke();
      cx += colWidths.desc;
      doc.moveTo(cx + colWidths.unitPrice, y).lineTo(cx + colWidths.unitPrice, y + tableHeaderHeight).stroke();
      cx += colWidths.unitPrice;
      doc.moveTo(cx + colWidths.qty, y).lineTo(cx + colWidths.qty, y + tableHeaderHeight).stroke();

      doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold');
      doc.text('Sl.\nNo', tableLeft + 2, y + 3, { width: colWidths.sl - 4, align: 'center' });
      doc.text('Description', tableLeft + colWidths.sl + 5, y + 6);
      doc.text('Basic Price', tableLeft + colWidths.sl + colWidths.desc, y + 6, { width: colWidths.unitPrice, align: 'center' });
      doc.text('Qty.', tableLeft + colWidths.sl + colWidths.desc + colWidths.unitPrice, y + 6, { width: colWidths.qty, align: 'center' });
      doc.text('Total Basic Price', tableLeft + colWidths.sl + colWidths.desc + colWidths.unitPrice + colWidths.qty, y + 6, { width: colWidths.total, align: 'center' });

      y += tableHeaderHeight;

      // Product Rows
      quotation.productPricing.forEach((item, index) => {
        const descText = item.productDescription ||
          `${item.productName} as per our specification and bill of materials Make (Skypower switchgears)`;

        // Calculate dynamic height for description
        const textHeight = doc.heightOfString(descText, { width: colWidths.desc - 10, font: 'Helvetica', size: 7.5 });
        const rowHeight = Math.max(textHeight + 16, 45);

        doc.rect(tableLeft, y, tableWidth, rowHeight).stroke();

        // Vertical lines
        cx = tableLeft;
        doc.moveTo(cx + colWidths.sl, y).lineTo(cx + colWidths.sl, y + rowHeight).stroke();
        cx += colWidths.sl;
        doc.moveTo(cx + colWidths.desc, y).lineTo(cx + colWidths.desc, y + rowHeight).stroke();
        cx += colWidths.desc;
        doc.moveTo(cx + colWidths.unitPrice, y).lineTo(cx + colWidths.unitPrice, y + rowHeight).stroke();
        cx += colWidths.unitPrice;
        doc.moveTo(cx + colWidths.qty, y).lineTo(cx + colWidths.qty, y + rowHeight).stroke();

        const slStr = String(index + 1).padStart(2, '0');
        doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold')
           .text(slStr, tableLeft + 2, y + 10, { width: colWidths.sl - 4, align: 'center' });

        doc.font('Helvetica-Bold').fontSize(7.5)
           .text(descText, tableLeft + colWidths.sl + 5, y + 8, { width: colWidths.desc - 10, lineGap: 1.5 });

        const unitRate = `Rs. ${Number(item.unitPrice || 0).toLocaleString('en-IN')}`;
        doc.font('Helvetica').fontSize(8)
           .text(unitRate, tableLeft + colWidths.sl + colWidths.desc, y + 12, { width: colWidths.unitPrice, align: 'center' });

        doc.text(String(item.quantity || 1), tableLeft + colWidths.sl + colWidths.desc + colWidths.unitPrice, y + 12, { width: colWidths.qty, align: 'center' });

        const totalRate = `Rs. ${Number(item.netAmount || item.unitPrice * item.quantity).toLocaleString('en-IN')}`;
        doc.font('Helvetica-Bold')
           .text(totalRate, tableLeft + colWidths.sl + colWidths.desc + colWidths.unitPrice + colWidths.qty + 5, y + 12, { width: colWidths.total - 10, align: 'right' });

        y += rowHeight;
      });

      // Sub Total Row
      const summaryRowHeight = 18;
      doc.rect(tableLeft, y, tableWidth, summaryRowHeight).stroke();
      doc.moveTo(tableLeft + tableWidth - colWidths.total, y).lineTo(tableLeft + tableWidth - colWidths.total, y + summaryRowHeight).stroke();
      doc.font('Helvetica-Bold').fontSize(8)
         .text('Sub Total', tableLeft + tableWidth - colWidths.total - 80, y + 5, { width: 75, align: 'right' })
         .text(`Rs. ${Number(quotation.subTotal || 0).toLocaleString('en-IN')}`, tableLeft + tableWidth - colWidths.total + 5, y + 5, { width: colWidths.total - 10, align: 'right' });
      y += summaryRowHeight;

      // GST Row (18% GST / CGST 9% + SGST 9%)
      const gstLabel = quotation.taxRatePercent ? `${quotation.taxRatePercent}% GST` : '18% GST';
      doc.rect(tableLeft, y, tableWidth, summaryRowHeight).stroke();
      doc.moveTo(tableLeft + tableWidth - colWidths.total, y).lineTo(tableLeft + tableWidth - colWidths.total, y + summaryRowHeight).stroke();
      doc.font('Helvetica-Bold').fontSize(8)
         .text(gstLabel, tableLeft + tableWidth - colWidths.total - 80, y + 5, { width: 75, align: 'right' })
         .text(`Rs. ${Number(quotation.taxTotal || 0).toLocaleString('en-IN')}`, tableLeft + tableWidth - colWidths.total + 5, y + 5, { width: colWidths.total - 10, align: 'right' });
      y += summaryRowHeight;

      // Total Row
      doc.rect(tableLeft, y, tableWidth, summaryRowHeight).stroke();
      doc.moveTo(tableLeft + tableWidth - colWidths.total, y).lineTo(tableLeft + tableWidth - colWidths.total, y + summaryRowHeight).stroke();
      doc.font('Helvetica-Bold').fontSize(8.5)
         .text('Total', tableLeft + tableWidth - colWidths.total - 80, y + 5, { width: 75, align: 'right' })
         .text(`Rs. ${Number(quotation.finalQuotationValue || 0).toLocaleString('en-IN')}`, tableLeft + tableWidth - colWidths.total + 5, y + 5, { width: colWidths.total - 10, align: 'right' });
      y += summaryRowHeight;

      // Amount in Words Row
      const inWords = numberToWords(quotation.finalQuotationValue || 0);
      doc.rect(tableLeft, y, tableWidth, summaryRowHeight + 4).stroke();
      doc.font('Helvetica-Bold').fontSize(8)
         .text(`Amount in Words: ${inWords}`, tableLeft + 8, y + 6, { width: tableWidth - 16 });

      renderFooter();

      // =========================================================================
      // PAGE 2: COMMERCIAL TERMS AND CONDITIONS (Image 2)
      // =========================================================================
      doc.addPage();
      renderHeader(false);

      y = 100;
      doc.fillColor('#000000').fontSize(8.5).font('Helvetica');

      // 4. Sales Tax
      doc.font('Helvetica-Bold').text('4.  Sales Tax:- ', 45, y, { continued: true })
         .font('Helvetica').text('GST @18% extra at actual.');
      y += 20;

      // 5. Freight & Transit Insurance
      doc.font('Helvetica-Bold').text('5.  Freight & Transit Insurance: ', 45, y, { continued: true })
         .font('Helvetica').text(quotation.freightAndInsurance ? `Rs. ${Number(quotation.freightAndInsurance).toLocaleString('en-IN')} (Up and Down)` : 'Extra at actual / Client Own Transport.');
      y += 20;

      // 6. Payment Terms
      doc.font('Helvetica-Bold').text('6.  Payment Terms: ', 45, y, { continued: true })
         .font('Helvetica').text(quotation.paymentTerms || '50% as advance along with your valued purchase order and balance 50% against proforma Invoice after inspection and before dispatch.', { width: 495 });
      y += 26;

      // 7. Delivery
      doc.font('Helvetica-Bold').text('7.  Delivery: ', 45, y, { continued: true })
         .font('Helvetica').text(quotation.deliveryTerms || 'Within 4 weeks from the date of receipt of approved drawing, our drawing will be submitted within three working days from the date of receipt of purchase order.', { width: 495 });
      y += 26;

      // 8. Warranty
      doc.font('Helvetica-Bold').text('8.  Warranty: ', 45, y, { continued: true })
         .font('Helvetica').text(quotation.warrantyTerms || 'We offer a warranty period of 18 Months from the date of dispatch or 12 Months from the date of commissioning whichever is earlier', { width: 495 });
      y += 26;

      // 9. Inspection & Testing
      doc.font('Helvetica-Bold').text('9.  Inspection & Testing: ', 45, y, { continued: true })
         .font('Helvetica').text('Routine tests are carried out according to our standard practice as an essential internal process of quality assurance and could be witnessed by your engineer / representative', { width: 495 });
      y += 26;

      // 10. Supervision of commissioning
      doc.font('Helvetica-Bold').text('10. Supervision of commissioning: ', 45, y, { continued: true })
         .font('Helvetica').text('a time, we will depute our engineer for supervision of commissioning of equipment in our cost. Charges and terms of deputing our engineer would be finalized during negotiations if required more than a time.', { width: 495 });
      y += 32;

      // 11. Cancellation / Suspension of order
      doc.font('Helvetica-Bold').text('11. Cancellation / Suspension of order: ', 45, y, { continued: true })
         .font('Helvetica').text('In case of cancellation / suspension of order by purchaser, we shall be compensated to the extent of 20% of the order value of the equipment so supplied till the date of the cancellation, whichever is earlier; in addition to the cost of any material or equipment already procured by us by the date of suspension / cancellation of order and any of its liability towards our suppliers / contractors.', { width: 495 });
      y += 42;

      // 12. Validity
      doc.font('Helvetica-Bold').text('12. Validity: ', 45, y, { continued: true })
         .font('Helvetica').text('The above price & Terms are valid for 7 calendar days from the date of this offer. Hence, request you to get revalidated price, if finalized after the validity.', { width: 495 });

      renderFooter();

      // =========================================================================
      // PAGE 3: ACCEPTANCE & SIGN-OFF (Image 3)
      // =========================================================================
      doc.addPage();
      renderHeader(false);

      y = 120;
      doc.fillColor('#000000').fontSize(8.5).font('Helvetica')
         .text('We hope you will find our offer in line with your requirement and will be glad to receive your acceptance which will have our best attention. However in case you require any clarification please inform us which will be attended to promptly.', 45, y, { width: 495, lineGap: 2 });
      y += 45;

      doc.font('Helvetica').text('Thanking you', 45, y);
      y += 18;
      doc.text('Yours faithfully,', 45, y);
      y += 14;
      doc.font('Helvetica-Bold').text('For Sky Power Switchgears', 45, y);
      y += 35;

      // Stamp & Seal Graphic
      doc.circle(95, y + 25, 24).lineWidth(1.2).strokeColor('#1E3A5F').stroke();
      doc.circle(95, y + 25, 20).lineWidth(0.8).strokeColor('#1E3A5F').stroke();
      doc.fillColor('#1E3A5F').fontSize(5.5).font('Helvetica-Bold')
         .text('SKY POWER SWITCHGEARS', 74, y + 14, { width: 42, align: 'center' });
      doc.fontSize(6).text('SALEM', 82, y + 23)
         .fontSize(5).text('636 030', 82, y + 30);

      y += 65;
      doc.fillColor('#000000').fontSize(8.5).font('Helvetica-Bold')
         .text('Authorized signatory', 45, y);
      y += 14;
      doc.font('Helvetica').text('Mobile : +91 6380301817', 45, y);

      renderFooter();

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filePath, relativeUrl, fileName });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};
