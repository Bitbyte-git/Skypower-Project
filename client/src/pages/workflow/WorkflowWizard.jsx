import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { WorkflowProvider, useWorkflow } from '../../context/WorkflowContext';
import { Step1ClientRegister } from './steps/Step1ClientRegister';
import { Step2ProjectDetails } from './steps/Step2ProjectDetails';
import { Step3AddProducts } from './steps/Step3AddProducts';
import { Step4PricingOffering } from './steps/Step4PricingOffering';
import { Step5OfferingManagement } from './steps/Step5OfferingManagement';
import { Step6SendToPOTeam } from './steps/Step6SendToPOTeam';
import { Check, ArrowRight } from 'lucide-react';

const stepsMeta = [
  { step: 1, label: 'Client', fullLabel: '1. Client' },
  { step: 2, label: 'Project', fullLabel: '2. Project' },
  { step: 3, label: 'Products', fullLabel: '3. Products' },
  { step: 4, label: 'Pricing', fullLabel: '4. Pricing' },
  { step: 5, label: 'Offering', fullLabel: '5. Offering' },
  { step: 6, label: 'PO Team', fullLabel: '6. PO Team' }
];

const WizardContent = () => {
  const { currentStep, goToStep } = useWorkflow();

  // Scroll to top whenever step changes
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      mainEl.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentStep]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ============================================================
          ENTERPRISE TOP STEP PROGRESS INDICATOR
          Matching exact design: 1. Client -> 2. Project -> 3. Products -> 4. Pricing -> 5. Offering -> 6. PO Team
          ============================================================ */}
      <div
        className="rounded-2xl p-3 sm:p-4 select-none"
        style={{
          background: '#FFFFFF',
          border: '1px solid #DCE7F3',
          boxShadow: '0 3px 8px rgba(15, 55, 100, 0.05)'
        }}
      >
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-4 px-2">
          {stepsMeta.map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            const isFuture = currentStep < s.step;

            return (
              <React.Fragment key={s.step}>
                <div
                  onClick={() => {
                    // Allow navigating backwards or to completed steps
                    if (isCompleted) {
                      goToStep(s.step);
                    }
                  }}
                  className={`flex items-center space-x-2 shrink-0 transition-all ${
                    isCompleted ? 'cursor-pointer hover:opacity-85' : ''
                  }`}
                >
                  {/* Step Badge */}
                  {isCompleted ? (
                    /* Completed: Green Checkmark Badge */
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-2xs font-extrabold text-xs">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{s.label}</span>
                    </div>
                  ) : isCurrent ? (
                    /* Current: Active Orange Highlight Pill */
                    <div
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-white font-black text-xs tracking-tight"
                      style={{
                        background: 'linear-gradient(90deg, #FF8A20 0%, #FF6A0A 100%)',
                        boxShadow: '0 4px 12px rgba(255, 122, 24, 0.35)'
                      }}
                    >
                      <div className="w-4 h-4 rounded-full bg-white text-[#EA6208] flex items-center justify-center font-bold text-[10px]">
                        {s.step}
                      </div>
                      <span>{s.label}</span>
                    </div>
                  ) : (
                    /* Future: Inactive Grey Indicator */
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 text-slate-400 font-semibold text-xs">
                      <div className="w-4 h-4 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-[10px]">
                        {s.step}
                      </div>
                      <span>{s.label}</span>
                    </div>
                  )}
                </div>

                {/* Arrow Separator */}
                {idx < stepsMeta.length - 1 && (
                  <ArrowRight
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      currentStep > s.step ? 'text-emerald-500' : 'text-slate-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          ONE STEP = ONE PAGE RENDERED
          Never display all forms together on one page
          ============================================================ */}
      <main className="transition-all duration-300">
        {currentStep === 1 && <Step1ClientRegister />}
        {currentStep === 2 && <Step2ProjectDetails />}
        {currentStep === 3 && <Step3AddProducts />}
        {currentStep === 4 && <Step4PricingOffering />}
        {currentStep === 5 && <Step5OfferingManagement />}
        {currentStep === 6 && <Step6SendToPOTeam />}
      </main>
    </div>
  );
};

export const WorkflowWizard = () => {
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get('enquiryId') || searchParams.get('id') || '';

  return (
    // key forces a full remount when switching between new workflow vs loading an existing enquiry,
    // which guarantees useState([]) re-runs and no stale products from a previous session appear.
    <WorkflowProvider key={enquiryId || 'new'} initialEnquiryId={enquiryId || null}>
      <WizardContent />
    </WorkflowProvider>
  );
};

