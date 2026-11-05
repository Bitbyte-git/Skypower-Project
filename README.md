# Switchgear & Electrical Panel Manufacturing ERP
## Module 01: Marketing & Sales Management System

A production-ready enterprise MERN-stack Marketing & Sales Management System designed specifically for a **Switchgear and Electrical Panel Manufacturing Company** (HT/LT Switchgears, VCB Kiosks, Compact Substations, RMUs, Distribution Panels).

---

### 1. Key Business Rules & Architectural Enforcement

1. **Dual Status State Engine**:
   - `approvalStatus`: `Draft` → `Submitted for Approval` → `Pending Approval` → `Approved` | `Returned for Correction` | `Rejected`
   - `commercialStatus`: `In Progress` → `Won` | `Lost`
   - Approval status is decoupled from commercial status and cannot be bypassed.
2. **Mandatory Admin Approval**: Every enquiry submitted by Sales must be approved by Admin. Sales cannot approve their own enquiries.
3. **Admin-Only Quotation Engine**: Quotations can **only** be generated for enquiries in `Approved` status. Sales users cannot generate quotations.
4. **Quotation Version History**: Quotation revisions generate versioned numbers (`QT-2026-0001-V1`, `QT-2026-0001-V2`, etc.) while archiving superseded versions without overwriting.
5. **Atomic ERN Generation**: Unique `ERN-YYYY-XXXX` generated atomically via MongoDB counters to eliminate collisions.
6. **Strict Field Validation**:
   - Primary Mobile: Exactly 10 digits (`^[0-9]{10}$`), no spaces or special characters.
   - GSTIN: Valid 15-character Indian GST format.
   - Equipment Line Items: Mandatory positive quantities and non-negative valuation.
7. **Excel Business Terms Fidelity**: Preserves original business terms from `Book1.xlsx`, including a dedicated `commands` field for client technical directives and tender instructions.
8. **Automated PDF Quotation Engine**: Built-in PDF generation rendering company header, technical ratings (voltage, breaking capacity), itemized pricing table, commercial terms, and statutory details.

---

### 2. Default Access Credentials

| Role | Email | Password | Access Scope |
|:---|:---|:---|:---|
| **Admin** | `admin@voltaswitchgear.com` | `Admin@123` | Full administrative clearance: Enquiries approval queue, quotation generation, revisions, user provisioning, master settings, audit logs. |
| **Sales & Marketing** | `sales@voltaswitchgear.com` | `Sales@123` | Client registration, multi-product enquiry draft/submission, follow-up CRM, order confirmation, handover package to R&D. |

*(Quick-login buttons are also available on the login screen for instant role testing).*

---

### 3. Quick Start & Execution

#### Option A: Launch Unified Full-Stack Server
Starts the Express API and automatically serves the pre-built React Single Page Application on port 5000:
```bash
cd server
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

#### Option B: Launch Full-Stack in Development Mode (Vite HMR)
In Terminal 1 (Backend API):
```bash
cd server
npm start
```
In Terminal 2 (Frontend Client):
```bash
cd sky-power
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

#### Run the 20-Scenario Automated Verification Test Suite
```bash
cd server
node test-all-scenarios.js
```

---

### 4. Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router DOM v7, Axios, Lucide React, React Hook Form, Zod.
- **Backend**: Node.js, Express.js (Modular REST API), JWT, bcryptjs, Multer, PDFKit.
- **Database**: MongoDB with Mongoose (Automatic embedded MongoMemoryServer fallback for seamless execution without local daemon setup).

---

### 5. Verified Testing Matrix (20/20 Scenarios)

1. ✅ Sales user login & session issue
2. ✅ Admin user login & clearance issue
3. ✅ Role-Based Access Control: Sales blocked from Admin APIs (HTTP 403)
4. ✅ Admin global visibility across all sales enquiries
5. ✅ Strict 10-digit mobile validation (`^[0-9]{10}$`)
6. ✅ Client duplicate company and mobile checks (HTTP 409)
7. ✅ Atomic ERN sequence generation (`ERN-2026-0001`, `ERN-2026-0002`...)
8. ✅ Multi-product switchgear equipment line items in a single enquiry
9. ✅ Mandatory field enforcement on enquiry creation
10. ✅ Submitted enquiries appear immediately in Admin Pending Approvals queue
11. ✅ Admin approval workflow (unlocks quotation eligibility)
12. ✅ Admin return workflow with mandatory justification remarks
13. ✅ Sales editing and resubmission of returned enquiries with revision history
14. ✅ Rejected enquiries permanently blocked from quotation generation
15. ✅ Sales restricted from self-approving enquiries
16. ✅ Sales restricted from generating quotations
17. ✅ Admin-only quotation generation with itemized PDF creation
18. ✅ Quotation revision control (`QT-2026-0001-V1` -> `V2` with archived history)
19. ✅ Follow-up tracking linked to enquiries and clients
20. ✅ Immutable security and transactional audit logging

