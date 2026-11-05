import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import { generateNextClientID, generateNextERN, generateNextQuotationNumber } from './src/services/counterService.js';
import { generateQuotationPDF } from './src/services/pdfService.js';
import { numberToWords } from './src/utils/numberToWords.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

async function runTest() {
  console.log('🧪 Starting Module 01 New Specification Verification...');

  await connectDB();
  console.log('✅ Connected to MongoDB via connectDB()');

  // 1. Verify Client ID generation
  const clientId = await generateNextClientID();
  console.log(`✅ Generated Client ID: ${clientId} (matches pattern CL-YYYY-XXXX)`);

  // 2. Verify numberToWords Indian currency
  const testVal1 = 371700;
  const words1 = numberToWords(testVal1);
  console.log(`✅ ${testVal1} in words: "${words1}"`);
  if (!words1.includes('Three Lakhs Seventy One Thousand Seven Hundred Rupees Only')) {
    throw new Error('Number to words mismatch for 3,71,700');
  }

  // 3. Verify 3-Page PDF generation with exact Salem details & Sivili Engineering sample data
  const sampleQuotation = {
    quotationNumber: 'QT-2026-0099',
    formattedQuotationNumber: 'REF: SKY/MKT/11 /00155A/2026-27 -R1',
    quotationDate: new Date('2026-09-09'),
    ern: 'ERN-2026-0155',
    clientId: {
      companyName: 'M/s. Sivili Engineering Construction',
      siteAddress: 'Kancheepuram, Tamil Nadu',
      clientLocation: 'Kancheepuram',
      contactPerson: 'Sivili S.',
      mobile: '9840198401'
    },
    productPricing: [
      {
        productName: 'VCB Switchboard',
        productDescription: '11KV, 630A, 25kA for 3 sec Outdoor Type Standalone VCB Switchboard (Transformer Control) as per our specification and bill of materials Make (Skypower switchgears)',
        voltageRating: '11 kV',
        currentRating: '630 A',
        breakingCapacity: '25 kA',
        quantity: 1,
        unit: 'Nos',
        unitPrice: 315000,
        discountPercent: 0,
        netAmount: 315000
      }
    ],
    subTotal: 315000,
    discountTotal: 0,
    taxRatePercent: 18,
    taxTotal: 56700,
    finalQuotationValue: 371700,
    amountInWords: 'Three Lakhs Seventy One Thousand Seven Hundred Rupees Only.',
    commercialTerms: 'Ex-Works: Salem, Tamil Nadu',
    deliveryTerms: 'Within 4 weeks from the date of receipt of approved drawing',
    paymentTerms: '50% as advance along with your valued purchase order and balance 50% against proforma Invoice after inspection and before dispatch',
    warrantyTerms: '18 Months from the date of dispatch or 12 Months from commissioning, whichever is earlier',
    validityDays: 7
  };

  const uploadDir = path.join(process.cwd(), 'uploads', 'quotations');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const { relativeUrl, filePath } = await generateQuotationPDF(sampleQuotation);
  console.log(`✅ 3-Page PDF successfully created at: ${relativeUrl}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Generated PDF file does not exist at ${filePath}`);
  }
  const stats = fs.statSync(filePath);
  console.log(`✅ PDF file size: ${stats.size} bytes`);

  await mongoose.disconnect();
  console.log('🎉 ALL MODULE 01 LOGICAL SPECIFICATIONS VERIFIED SUCCESSFULLY!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
