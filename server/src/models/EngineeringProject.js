import mongoose from 'mongoose';

export const PROJECT_STATUSES = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'Engineering In Progress',
  DRAWING_PREPARATION: 'Drawing Preparation',
  INTERNAL_REVIEW: 'Internal Review',
  CUSTOMER_SUBMISSION: 'Customer Submission',
  CUSTOMER_REVIEW: 'Customer Review',
  REVISION_IN_PROGRESS: 'Revision In Progress',
  PARTIALLY_APPROVED: 'Partially Approved',
  FULLY_APPROVED: 'Fully Approved',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed'
};

const technicalSpecsSchema = new mongoose.Schema(
  {
    // Switchgear Details
    equipmentType: { type: String, default: 'Indoor HT Switchboard' },
    switchgearType: { type: String, default: '11kV Metal-Clad VCB Switchgear' },
    voltageRating: { type: String, default: '11 kV' },
    currentRating: { type: String, default: '630 A' },
    shortCircuitRating: { type: String, default: '26.3 kA' },
    shortCircuitDuration: { type: String, default: '3 Seconds' },
    frequency: { type: String, default: '50 Hz' },
    indoorOutdoor: { type: String, default: 'Indoor' },
    panelType: { type: String, default: 'Floor Standing / Drawout VCB' },
    panelCount: { type: Number, default: 1 },

    // Electrical Details
    busbarMaterial: { type: String, default: 'EC Grade Electrolytic Copper' },
    busbarRating: { type: String, default: '800 A' },
    busbarConfiguration: { type: String, default: '3-Phase, 3-Wire Insulated' },
    insulationRequirements: { type: String, default: 'Heat Shrinkable PVC / Epoxy Sleeving' },
    cableEntry: { type: String, default: 'Bottom Cable Entry' },

    // CT Details
    ctType: { type: String, default: 'Resin Cast Dual Ratio CT' },
    ctRatio: { type: String, default: '200-100/5-5A' },
    primaryCurrent: { type: String, default: '200 A' },
    secondaryCurrent: { type: String, default: '5 A' },
    coreCount: { type: Number, default: 2 },
    coreClass: { type: String, default: 'Core 1: 0.5s (Metering), Core 2: 5P10 (Protection)' },
    burden: { type: String, default: '15 VA' },
    accuracy: { type: String, default: 'Class 0.5s' },
    meteringCoreDetails: { type: String, default: 'Class 0.5s, 15VA, ISF < 5' },
    protectionCoreDetails: { type: String, default: '5P10, 15VA, ALF 10' },
    ctMake: { type: String, default: 'Kappa / Pragati / Kalpa' },
    ctModel: { type: String, default: 'Indoor Block Type' },
    ctApprovalStatus: { type: String, enum: ['Draft', 'Submitted', 'Clarification Required', 'Approved'], default: 'Draft' },

    // PT Details
    ptType: { type: String, default: '3-Phase 3-Limb Resin Cast PT' },
    ptRatio: { type: String, default: '11000/sqrt(3) V to 110/sqrt(3) V' },
    primaryVoltage: { type: String, default: '11000 V' },
    secondaryVoltage: { type: String, default: '110 V' },
    ptAccuracy: { type: String, default: 'Class 0.5' },
    ptBurden: { type: String, default: '50 VA per phase' },
    ptMake: { type: String, default: 'Kappa / Pragati' },
    ptModel: { type: String, default: 'Drawout with Primary HRC Fuses' },
    ptApprovalStatus: { type: String, enum: ['Draft', 'Submitted', 'Clarification Required', 'Approved'], default: 'Draft' },

    // Protection Relay Details
    relayType: { type: String, default: 'Numerical Overcurrent & Earth Fault Relay' },
    relayMake: { type: String, default: 'Schneider / ABB / Siemens' },
    relayModel: { type: String, default: 'MiCOM P122 / REF615' },
    protectionFunctions: { type: String, default: '50/51 (OC), 50N/51N (EF), 50BF' },
    communicationProtocol: { type: String, default: 'IEC 61850 / Modbus RS485' },
    relayApprovalStatus: { type: String, enum: ['Draft', 'Submitted', 'Clarification Required', 'Approved'], default: 'Draft' },

    // Metering Details
    meterMake: { type: String, default: 'Schneider / Secure' },
    meterModel: { type: String, default: 'Digital Multi-Function Meter (MFM Class 0.5s)' },
    meteringRequirements: { type: String, default: 'RS485 Modbus, Active/Reactive Energy, V, I, PF, Freq, THD' },

    // Equipment & Auxiliary
    vcbSpecification: { type: String, default: '11kV, 630A, 26.3kA, 3-Pole Vacuum Circuit Breaker with Motorized Spring Charging (230V AC)' },
    controlVoltage: { type: String, default: '110V DC / 230V AC' },
    spaceHeaterAndThermostat: { type: String, default: '230V AC Space Heater with Rotary Switch & Hygrostat' },

    // Project & Environmental
    installationLocation: { type: String, default: 'Substation Control Room, Tamil Nadu' },
    customerStandard: { type: String, default: 'TANGEDCO / Industry Standards' },
    applicableStandards: { type: String, default: 'IEC 62271-200 / IS 13118' },
    environmentalRequirements: { type: String, default: 'Max Ambient: 45°C, Relative Humidity: 95%, Altitude: <1000m' },
    specialCustomerRequirements: { type: String, default: '' },
    engineeringRemarks: { type: String, default: '' },

    // Revision History of Specs
    specRevisions: [
      {
        revisionDate: { type: Date, default: Date.now },
        revisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        revisedByName: String,
        changeDescription: String,
        reason: String
      }
    ]
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'Engineering Desk' },
    role: { type: String, default: 'Design Engineer' },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    drawingNumber: { type: String, default: '' },
    submissionNumber: { type: String, default: '' }
  },
  { _id: false }
);

const engineeringProjectSchema = new mongoose.Schema(
  {
    projectNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    salesOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      index: true
    },
    customerPO: {
      type: String,
      default: ''
    },
    quotationNumber: {
      type: String,
      default: ''
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client'
    },
    customerName: {
      type: String,
      required: true
    },
    customerCode: {
      type: String,
      default: ''
    },
    projectName: {
      type: String,
      required: true
    },
    endUser: {
      type: String,
      default: 'Direct Industrial Supply'
    },

    // Assignment & Dates
    assignedEngineer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedEngineerName: {
      type: String,
      default: 'Unassigned'
    },
    engineeringTeam: {
      type: String,
      default: 'Electrical Design & Switchgear Engineering'
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: Object.values(PROJECT_STATUSES),
      default: PROJECT_STATUSES.NOT_STARTED,
      index: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    targetDate: {
      type: Date
    },
    actualCompletionDate: {
      type: Date
    },
    technicalRemarks: {
      type: String,
      default: ''
    },

    // Structured Technical Specifications
    technicalSpecs: {
      type: technicalSpecsSchema,
      default: () => ({})
    },

    // Progress KPI Aggregations (auto-updated)
    stats: {
      totalDrawings: { type: Number, default: 0 },
      completedDrawings: { type: Number, default: 0 },
      submittedDrawings: { type: Number, default: 0 },
      approvedDrawings: { type: Number, default: 0 },
      revisionPendingDrawings: { type: Number, default: 0 },
      totalSubmissions: { type: Number, default: 0 },
      openClarifications: { type: Number, default: 0 }
    },

    // Timeline History
    timeline: [timelineEventSchema],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export const EngineeringProject = mongoose.model('EngineeringProject', engineeringProjectSchema);
