import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:Admin123@switchgear.nq2vyv3.mongodb.net/switchgear_erp?retryWrites=true&w=majority&appName=Switchgear');
  
  const orders = await mongoose.connection.db.collection('salesorders').find().toArray();
  console.log('=== SALES ORDERS IN DB ===', orders.length);
  for (const o of orders) {
    console.log({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      ern: o.ern,
      projectTitle: o.projectTitle,
      status: o.status
    });
  }

  const enqs = await mongoose.connection.db.collection('enquiries').find().toArray();
  console.log('=== ENQUIRIES IN DB ===', enqs.length);
  for (const e of enqs) {
    console.log({
      id: e._id.toString(),
      ern: e.ern,
      projectTitle: e.project?.projectName,
      approvalStatus: e.approvalStatus
    });
  }

  const wfs = await mongoose.connection.db.collection('projectworkflows').find().toArray();
  console.log('=== PROJECT WORKFLOWS IN DB ===', wfs.length);
  for (const w of wfs) {
    console.log({
      id: w._id.toString(),
      trackingId: w.projectTrackingId,
      currentDept: w.currentDepartmentCode,
      currentSeq: w.currentDepartmentSequence,
      overallStatus: w.overallStatus
    });
  }

  await mongoose.disconnect();
}
check();
