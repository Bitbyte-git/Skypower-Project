import mongoose from 'mongoose';
import dns from 'dns';
import { ENV } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { getProjectWorkflows } from './src/controllers/projectWorkflowController.js';
import { ProjectWorkflow } from './src/models/ProjectWorkflow.js';

async function testApprovedHistory() {
  console.log('=== TESTING DEPARTMENT APPROVED SECTION VISIBILITY ===\n');

  await connectDB();

  // Find the completed project (e.g. PSG College)
  const completedProject = await ProjectWorkflow.findOne({ overallStatus: 'Completed' });
  if (!completedProject) {
    console.error('No completed project found to test.');
    await disconnectDB();
    return;
  }

  console.log(`Testing Completed Project: ${completedProject.projectTrackingId}`);
  console.log(`Current Stage: ${completedProject.currentDepartmentSequence} (${completedProject.currentDepartmentCode})`);
  console.log(`Overall Status: ${completedProject.overallStatus}\n`);

  // Query each department 1 through 10 with status='Accepted'
  for (let seq = 1; seq <= 10; seq++) {
    const mockReq = {
      query: { departmentSequence: seq, status: 'Accepted' },
      user: { role: 'MANAGER' }
    };

    let resultData = null;
    const mockRes = {
      status: () => mockRes,
      json: (data) => {
        resultData = data;
      }
    };

    await getProjectWorkflows(mockReq, mockRes, (err) => {
      if (err) throw err;
    });

    const isFound = (resultData?.workflows || []).some(
      (w) => w.projectTrackingId === completedProject.projectTrackingId
    );

    console.log(
      `Stage ${seq.toString().padStart(2, ' ')} Accepted Queue: ${
        isFound ? 'VISIBLE (PASS)' : 'NOT FOUND (FAIL)'
      } (Total items in queue: ${resultData?.workflows?.length || 0})`
    );

    if (!isFound) {
      throw new Error(`Project ${completedProject.projectTrackingId} was NOT found in Stage ${seq} Accepted queue!`);
    }
  }

  console.log('\n=== ALL DEPARTMENTS (1-10) CORRECTLY SHOW THE APPROVED PROJECT! ===');
  await disconnectDB();
}

testApprovedHistory().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});

