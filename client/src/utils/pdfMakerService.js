import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { PDFDocument } from 'pdf-lib';
import { numberToWords } from './numberToWords';

// Initialize fonts
try {
  const vfs = pdfFonts?.default || pdfFonts?.pdfMake?.vfs || pdfFonts;
  if (pdfMake && vfs) {
    pdfMake.vfs = vfs;
    if (typeof pdfMake.addVirtualFileSystem === 'function') {
      pdfMake.addVirtualFileSystem(vfs);
    }
  }
} catch (e) {
  console.warn('pdfMake vfs initialization error:', e);
}

// Convert image URL to Base64
async function getBase64ImageFromUrl(imageUrl) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`Could not load image ${imageUrl} for PDF:`, e);
    return null;
  }
}

/**
 * Generates and downloads the Official 3-Page Techno-Commercial Offer Letter PDF
 * using SPSG-Letterpad.pdf as the template for Header (Logo), Watermark, and Footer.
 *
 * Layers:
 * 1. Underlay Template: SPSG-Letterpad.pdf (Official SP Logo, Watermark, Salem Footer)
 * 2. Overlay Content: Page numbers ( 1 ), ( 2 ), ( 3 ), Reference, Client, Scope,
 *    Bordered Price Table, Clauses 4-12, Acceptance, Rubber Stamp & E-Signature.
 */
export async function downloadEnquiryPDF(enquiryData) {
  // Load stamp and letterpad
  const [stampBase64, letterpadRes] = await Promise.all([
    getBase64ImageFromUrl('/spsg-stamp.jpg').then(res => res || getBase64ImageFromUrl('/spsg-stamp.png')),
    fetch('/SPSG-Letterpad.pdf').catch(() => null)
  ]);

  const ern = enquiryData.ern || '00155A';
  const cleanRef = ern.replace(/^ERN-/, '');
  const versionTag = enquiryData.versionId || enquiryData.currentOfferingVersion || 'OFR-001';
  const clientIdTag = enquiryData.clientCustomId || enquiryData.clientId?.clientId || enquiryData.client?.clientId || 'SP-CL-2026-0001';
  const refCode = `SKY/MKT/11 /${cleanRef}/2026-27 - ${versionTag}`;

  // Format Date: DD-MM-YYYY
  let offerDateFormatted = '09-09-2026';
  try {
    const d = enquiryData.offerDate ? new Date(enquiryData.offerDate) : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    offerDateFormatted = `${day}-${month}-${year}`;
  } catch (e) {
    offerDateFormatted = '09-09-2026';
  }

  // Client Details
  const client = enquiryData.clientId || enquiryData.client || {};
  const companyName = client.companyName || 'Sivili Engineering Construction';
  const siteAddress =
    enquiryData.project?.projectSiteAddress ||
    client.siteAddress ||
    client.clientLocation ||
    client.billingAddress?.city ||
    'Kancheepuram, Tamil Nadu.';

  // Commercial Pricing & Totals
  const comm = enquiryData.commercialPricing || {};
  const products = (enquiryData.products && enquiryData.products.length > 0)
    ? enquiryData.products
    : [
        {
          productName: 'VCB Switchboard',
          productDescription: '11KV, 630A, 25kA for 3 sec Outdoor Type Standalone VCB Switchboard (Transformer Control) as per our specification and bill of materials Make(Skypower switchgears)',
          basicPrice: 315000,
          quantity: 1,
          totalBasicPrice: 315000
        }
      ];

  const calculatedSubTotal = products.reduce((acc, p) => {
    const qty = Number(p.quantity || 1);
    const price = Number(p.basicPrice || p.estimatedUnitValue || 315000);
    return acc + Number(p.totalBasicPrice || p.totalProductValue || (price * qty));
  }, 0);

  const subTotal = Number(comm.subTotal || comm.totalBasicPrice || calculatedSubTotal || 315000);
  const gstAmount = Number(comm.totalTaxAmount || comm.gst || comm.totalGst || Math.round(subTotal * 0.18));
  const finalTotal = Number(comm.totalAmount || enquiryData.expectedProjectValue || (subTotal + gstAmount));
  const words = comm.amountInWords || numberToWords(finalTotal);

  // Subject line product summary
  const subjectProduct =
    products[0]?.productDescription?.slice(0, 75) ||
    '11kV Outdoor Type Standalone VCB Switchboard';

  // Transport details — fully dynamic from form data
  const forBasis        = comm.forBasis || 'Client Own Transport';
  const transportType   = comm.transportType || 'Up & Down';
  const transportPrice  = Number(comm.transportPrice || 0);
  const isClientOwn     = forBasis === 'Client Own Transport';

  // Point 2 – Price Basis line
  let priceBasisLine;
  if (isClientOwn) {
    priceBasisLine = 'Ex-Works: Salem, Tamil Nadu (Client Own Transport — No freight charged by Sky Power)';
  } else {
    const tLabel  = transportType === 'One Way' ? 'One Way' : 'Up & Down';
    const tAmount = transportPrice > 0 ? 'Rs. ' + transportPrice.toLocaleString('en-IN') : 'At Actual';
    priceBasisLine = 'Ex-Works: Salem, Tamil Nadu (Transport ' + tLabel + ': ' + tAmount + ')';
  }

  // Point 4 – Sales Tax (CGST+SGST vs IGST)
  const gstType      = comm.gstType || 'INTRA_STATE';
  const salesTaxLine = gstType === 'INTRA_STATE'
    ? 'GST @18% extra at actual (CGST 9% + SGST 9%).'
    : 'GST @18% extra at actual (IGST 18%).';

  // Point 5 – Freight & Transit Insurance
  let freightLine;
  if (isClientOwn) {
    freightLine = 'Not applicable — client arranges own transport and bears freight / transit insurance.';
  } else {
    const tLabel = transportType === 'One Way' ? 'One Way' : 'Up and Down';
    freightLine  = transportPrice > 0
      ? 'Extra at actual / Rs. ' + transportPrice.toLocaleString('en-IN') + ' (' + tLabel + ')'
      : 'Extra at actual';
  }

  // Point 6 – Payment Terms
  const paymentTermsLine = comm.paymentTerms ||
    '50% as advance along with your valued purchase order and balance 50% against proforma Invoice after inspection and before dispatch.';

  // Point 7 – Delivery weeks
  const deliveryWeeks = comm.deliveryWeeks || 4;
  const deliveryLine  = 'Within ' + deliveryWeeks + ' weeks from the date of receipt of approved drawing, our drawing will be submitted within three working days from the date of receipt of purchase order.';

  // Point 8 – Warranty months
  const warrantyMonthsDispatch   = comm.warrantyMonthsDispatch   || 18;
  const warrantyMonthsCommission = comm.warrantyMonthsCommission || 12;
  const warrantyLine = 'We offer a warranty period of ' + warrantyMonthsDispatch + ' Months from the date of dispatch or ' + warrantyMonthsCommission + ' Months from the date of commissioning whichever is earlier';

  // Point 12 – Validity days
  const validityDays = comm.validityDays || 7;
  const validityLine = 'The above price & Terms are valid for ' + validityDays + ' calendar days from the date of this offer. Hence, request you to get revalidated price, if finalized after the validity.';

  // Signature image
  const signatureData =
    enquiryData.eSignature?.signatureData ||
    enquiryData.eSignature ||
    null;

  // Build Table Rows for Page 1
  const priceTableBody = [
    // Header
    [
      { text: 'Sl.\nNo', bold: true, fontSize: 8.5, alignment: 'center' },
      { text: 'Description', bold: true, fontSize: 8.5, alignment: 'left' },
      { text: 'Basic Price', bold: true, fontSize: 8.5, alignment: 'center' },
      { text: 'Qty.', bold: true, fontSize: 8.5, alignment: 'center' },
      { text: 'Total Basic Price', bold: true, fontSize: 8.5, alignment: 'center' }
    ]
  ];

  products.forEach((p, index) => {
    const slNo = String(index + 1).padStart(2, '0');
    const desc =
      p.productDescription ||
      `${p.kilovolt || '11kV'}, ${p.ampere || '630A'}, ${p.kiloampere || '25kA'} for ${p.durationSec || '3 sec'} ${p.usage || 'Outdoor'} Type Standalone ${p.productName || 'VCB Switchboard'} ${p.ebMetering || '(Transformer Control)'} as per our specification and bill of materials Make(Skypower switchgears)`;

    const unitPriceFormatted = `Rs. ${Number(p.basicPrice || p.estimatedUnitValue || 315000).toLocaleString('en-IN')}`;
    const qty = Number(p.quantity || 1);
    const totalPriceFormatted = `Rs. ${Number(p.totalBasicPrice || p.totalProductValue || (Number(p.basicPrice || 315000) * qty)).toLocaleString('en-IN')}`;

    priceTableBody.push([
      { text: slNo, alignment: 'center', fontSize: 8.5, bold: true },
      { text: desc, fontSize: 8, alignment: 'left', lineHeight: 1.2 },
      { text: unitPriceFormatted, alignment: 'center', fontSize: 8.5 },
      { text: String(qty), alignment: 'center', fontSize: 8.5 },
      { text: totalPriceFormatted, alignment: 'right', fontSize: 8.5, bold: true }
    ]);
  });

  // Summary Rows
  priceTableBody.push(
    [
      { text: 'Sub Total', colSpan: 4, alignment: 'right', bold: true, fontSize: 8.5 },
      {},
      {},
      {},
      { text: `Rs. ${subTotal.toLocaleString('en-IN')}`, alignment: 'right', bold: true, fontSize: 8.5 }
    ],
    [
      { text: '18% GST', colSpan: 4, alignment: 'right', bold: true, fontSize: 8.5 },
      {},
      {},
      {},
      { text: `Rs. ${gstAmount.toLocaleString('en-IN')}`, alignment: 'right', bold: true, fontSize: 8.5 }
    ],
    [
      { text: 'Total', colSpan: 4, alignment: 'right', bold: true, fontSize: 9 },
      {},
      {},
      {},
      { text: `Rs. ${finalTotal.toLocaleString('en-IN')}`, alignment: 'right', bold: true, fontSize: 9 }
    ],
    [
      {
        text: `Amount in Words: ${words}`,
        colSpan: 5,
        bold: true,
        fontSize: 8.5,
        alignment: 'left'
      },
      {},
      {},
      {},
      {}
    ]
  );

  // Document definition: margins leave exact room for the SPSG-Letterpad header and footer
  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [42, 85, 42, 80],

    // Header: Prints circled page indicator at top right; SPSG-Letterpad underlay provides SP logo
    header: function (currentPage) {
      return {
        margin: [42, 22, 42, 0],
        columns: [
          { text: '', width: '*' },
          {
            text: `( ${currentPage} )`,
            fontSize: 9.5,
            bold: true,
            color: '#374151',
            alignment: 'right',
            width: 80,
            margin: [0, 0, 8, 0]
          }
        ]
      };
    },

    content: [
      // =========================================================================
      // PAGE 1: TECHNO-COMMERCIAL OFFER & PRICE TABLE
      // =========================================================================
      {
        columns: [
          {
            stack: [
              { text: `REF: ${refCode}`, fontSize: 8.5, bold: true, color: '#000000' },
              { text: `Client ID: ${clientIdTag}  |  Version: ${versionTag}`, fontSize: 8, bold: true, color: '#1E3A5F', margin: [0, 2, 0, 0] }
            ]
          },
          {
            text: `Date: ${offerDateFormatted}`,
            fontSize: 8.5,
            bold: true,
            alignment: 'right',
            color: '#000000'
          }
        ],
        margin: [0, 5, 0, 16]
      },

      // Client Address
      {
        stack: [
          { text: `M/s. ${companyName},`, fontSize: 9, bold: true, color: '#000000' },
          { text: siteAddress, fontSize: 8.5, color: '#1F2937', margin: [0, 2, 0, 0] }
        ],
        margin: [0, 0, 0, 16]
      },

      // Salutation & Subject
      { text: 'Dear Sir,', fontSize: 8.5, color: '#000000', margin: [0, 0, 0, 8] },
      {
        text: `Sub: "Offer Price" for supply of ${subjectProduct} – Reg.,`,
        fontSize: 8.5,
        bold: true,
        color: '#000000',
        margin: [0, 0, 0, 4]
      },
      {
        text: '**********',
        alignment: 'center',
        fontSize: 8,
        color: '#374151',
        margin: [0, 0, 0, 8]
      },
      {
        text: 'With reference to the above, we are pleased to submit our techno commercial offer for your kind perusal',
        fontSize: 8.5,
        color: '#1F2937',
        margin: [0, 0, 0, 16]
      },

      // 1. Scope of Supply
      {
        stack: [
          { text: '1.  Scope of Supply:-', fontSize: 8.5, bold: true, color: '#000000' },
          {
            text: 'Our scope shall be limited to design, Manufacturing and supply of the quoted HT switchgear panels only. Erection, testing and commissioning shall not be in our scope.',
            fontSize: 8,
            color: '#1F2937',
            margin: [20, 3, 0, 0]
          }
        ],
        margin: [0, 0, 0, 14]
      },

      // 2. Price Basis
      {
        stack: [
          { text: '2.  Price Basis:-', fontSize: 8.5, bold: true, color: '#000000' },
          {
            text: priceBasisLine,
            fontSize: 8,
            color: '#1F2937',
            margin: [20, 3, 0, 0]
          }
        ],
        margin: [0, 0, 0, 14]
      },

      // 3. Price Table
      { text: '3.  Price:-', fontSize: 8.5, bold: true, color: '#000000', margin: [0, 0, 0, 6] },
      {
        table: {
          widths: [30, '*', 78, 32, 90],
          body: priceTableBody
        },
        layout: {
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
          hLineColor: () => '#1F2937',
          vLineColor: () => '#1F2937',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 5,
          paddingBottom: () => 5
        },
        margin: [0, 0, 0, 10]
      },

      // =========================================================================
      // PAGE 2: COMMERCIAL TERMS AND CONDITIONS (Clauses 4 through 12)
      // =========================================================================
      {
        text: '',
        pageBreak: 'before'
      },

      {
        text: [
          { text: '4.  Sales Tax:- ', bold: true },
          { text: salesTaxLine }
        ],
        fontSize: 8.5,
        margin: [0, 15, 0, 14]
      },
      {
        text: [
          { text: '5.  Freight & Transit Insurance: ', bold: true },
          { text: freightLine }
        ],
        fontSize: 8.5,
        margin: [0, 0, 0, 14]
      },
      {
        text: [
          { text: '6.  Payment Terms: ', bold: true },
          {
            text:
              paymentTermsLine
          }
        ],
        fontSize: 8.5,
        lineHeight: 1.25,
        margin: [0, 0, 0, 14]
      },
      {
        text: [
          { text: '7.  Delivery: ', bold: true },
          {
            text:
              deliveryLine
          }
        ],
        fontSize: 8.5,
        lineHeight: 1.25,
        margin: [0, 0, 0, 14]
      },
      {
        text: [
          { text: '8.  Warranty: ', bold: true },
          {
            text:
              warrantyLine
          }
        ],
        fontSize: 8.5,
        lineHeight: 1.25,
        margin: [0, 0, 0, 14]
      },
      {
        text: [
          { text: '9.  Inspection & Testing: ', bold: true },
          {
            text:
              'Routine tests are carried out according to our standard practice as an essential internal process of quality assurance and could be witnessed by your engineer / representative'
          }
        ],
        fontSize: 8.5,
        lineHeight: 1.25,
        margin: [0, 0, 0, 14]
      },
      {
        text: [
          { text: '10. Supervision of commissioning: ', bold: true },
          {
            text:
              'a time, we will depute our engineer for supervision of commissioning of equipment in our cost. Charges and terms of deputing our engineer would be finalized during negotiations if required more than a time.'
          }
        ],
        fontSize: 8.5,
        lineHeight: 1.25,
        margin: [0, 0, 0, 14]
      },
      {
        text: [
          { text: '11. Cancellation / Suspension of order: ', bold: true },
          {
            text:
              'In case of cancellation / suspension of order by purchaser, we shall be compensated to the extent of 20% of the order value of the equipment so supplied till the date of the cancellation, whichever is earlier, in addition to the cost of any material or equipment already procured by us by the date of suspension / cancellation of order and any of its liability towards our suppliers / contractors.'
          }
        ],
        fontSize: 8.5,
        lineHeight: 1.25,
        margin: [0, 0, 0, 14]
      },
      {
        text: [
          { text: '12. Validity: ', bold: true },
          {
            text:
              validityLine
          }
        ],
        fontSize: 8.5,
        lineHeight: 1.25,
        margin: [0, 0, 0, 14]
      },

      // =========================================================================
      // PAGE 3: ACCEPTANCE & SIGN-OFF
      // =========================================================================
      {
        text: '',
        pageBreak: 'before'
      },

      {
        text:
          'We hope you will find our offer in line with your requirement and will be glad to receive your acceptance which will have our best attention. However in case you require any clarification please inform us which will be attended to promptly.',
        fontSize: 8.5,
        lineHeight: 1.35,
        color: '#1F2937',
        margin: [0, 20, 0, 30]
      },

      { text: 'Thanking you', fontSize: 8.5, margin: [0, 0, 0, 16] },
      { text: 'Yours faithfully,', fontSize: 8.5, margin: [0, 0, 0, 6] },
      { text: 'For Sky Power Switchgears', fontSize: 9, bold: true, margin: [0, 0, 0, 24] },

      // Rubber Stamp and E-Signature Block
      {
        columns: [
          stampBase64
            ? {
                image: stampBase64,
                width: 72,
                margin: [0, 0, 10, 0]
              }
            : { text: '' },
          signatureData && typeof signatureData === 'string' && signatureData.startsWith('data:image')
            ? {
                image: signatureData,
                width: 100,
                margin: [-15, 12, 0, 0]
              }
            : { text: '' }
        ],
        margin: [0, 0, 0, 25]
      },

      { text: 'Authorized signatory', fontSize: 8.5, bold: true, margin: [0, 0, 0, 4] },
      { text: 'Mobile : +91 6380301817', fontSize: 8.5, color: '#1F2937' }
    ],

    defaultStyle: {
      font: 'Roboto'
    }
  };

  const fileName = `${ern}_${versionTag}_Offer_Price_Quotation.pdf`;

  // 1. Generate content via pdfmake as raw Blob
  const pdfDocGenerator = pdfMake.createPdf(docDefinition);
  let contentBlob;
  const blobOrPromise = pdfDocGenerator.getBlob((blob) => {
    if (blob) contentBlob = blob;
  });
  if (blobOrPromise && typeof blobOrPromise.then === 'function') {
    contentBlob = await blobOrPromise;
  } else if (!contentBlob) {
    contentBlob = await new Promise((resolve) => {
      pdfDocGenerator.getBlob((blob) => resolve(blob));
    });
  }

  // 2. Overlay onto SPSG-Letterpad.pdf template using pdf-lib
  let finalPdfBytes;
  try {
    if (letterpadRes && letterpadRes.ok) {
      const [letterpadBytes, contentBytes] = await Promise.all([
        letterpadRes.arrayBuffer(),
        contentBlob.arrayBuffer()
      ]);

      const [letterpadDoc, contentDoc] = await Promise.all([
        PDFDocument.load(letterpadBytes),
        PDFDocument.load(contentBytes)
      ]);

      const [templatePage] = letterpadDoc.getPages();
      const { width, height } = templatePage.getSize();

      const finalDoc = await PDFDocument.create();
      const embeddedTemplate = await finalDoc.embedPage(templatePage);

      const contentPages = contentDoc.getPages();
      for (let i = 0; i < contentPages.length; i++) {
        const embeddedContent = await finalDoc.embedPage(contentPages[i]);
        const newPage = finalDoc.addPage([width, height]);

        // Layer 1: Official SPSG-Letterpad (Header SP logo, Watermark, Salem Footer)
        newPage.drawPage(embeddedTemplate, {
          x: 0,
          y: 0,
          width,
          height
        });

        // Layer 2: Form Content (Page Number, Reference, Table, Clauses, Stamp, Sign)
        newPage.drawPage(embeddedContent, {
          x: 0,
          y: 0,
          width,
          height
        });
      }

      finalPdfBytes = await finalDoc.save();
    } else {
      finalPdfBytes = new Uint8Array(await contentBlob.arrayBuffer());
    }
  } catch (err) {
    console.warn('Could not merge with SPSG-Letterpad.pdf, downloading direct content:', err);
    finalPdfBytes = new Uint8Array(await contentBlob.arrayBuffer());
  }

  // 3. Trigger download in browser
  const finalBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(finalBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}
