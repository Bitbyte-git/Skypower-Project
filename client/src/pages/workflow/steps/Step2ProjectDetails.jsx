import React, { useState } from 'react';
import { useWorkflow } from '../../../context/WorkflowContext';
import { FolderGit2, ArrowRight, ArrowLeft, Sun, Wind, Factory, Building, Layers, Sparkles } from 'lucide-react';

export const Step2ProjectDetails = () => {
  const { project, submitStep2Project, prevStep, client } = useWorkflow();

  const [formValues, setFormValues] = useState({
    standardType: project.standardType || 'Standard',
    projectName: project.projectName || '',
    segment: project.segment || 'Renewable',
    subSegment: project.subSegment || 'Wind',
    customSubSegment: project.customSubSegment || ''
  });

  const [error, setError] = useState('');

  // Dynamic sub-segments
  const getSubSegmentOptions = (seg) => {
    switch (seg) {
      case 'Renewable':
        return ['Wind', 'Solar', 'Others'];
      case 'Industry & Commercial':
        return ['Industry', 'Building', 'Colleges', 'Commercial', 'Others'];
      case 'Others':
        return ['Others'];
      default:
        return ['Others'];
    }
  };

  const handleSegmentChange = (newSeg) => {
    const opts = getSubSegmentOptions(newSeg);
    setFormValues({
      ...formValues,
      segment: newSeg,
      subSegment: opts[0] || 'Others',
      customSubSegment: ''
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError('');

    if (!formValues.projectName.trim()) {
      setError('Project Title is mandatory.');
      return;
    }

    if (formValues.subSegment === 'Others' && !formValues.customSubSegment.trim()) {
      setError('Please specify the custom sub-segment.');
      return;
    }

    submitStep2Project(formValues);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF5EE] border border-[#FCDCC9] flex items-center justify-center text-[#EE6F2D]">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#0A1E3F] tracking-tight">Project Details</h2>
            <p className="text-xs text-slate-500 font-medium">
              Step 2: Define project parameters for client <strong>{client.companyName || client.clientId}</strong>
            </p>
          </div>
        </div>

        {client.clientId && (
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#1E5BB8] border border-blue-200">
            Client ID: {client.clientId}
          </span>
        )}
      </div>

      <div className="p-6 md:p-8 max-w-4xl">
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleNext} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Project Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Project Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formValues.standardType}
                onChange={(e) => setFormValues({ ...formValues, standardType: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
              >
                <option value="Standard">Standard</option>
                <option value="Non-Standard">Non-Standard</option>
              </select>
            </div>

            {/* Project Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 11kV VCB Switchboard for Wind Farm"
                value={formValues.projectName}
                onChange={(e) => setFormValues({ ...formValues, projectName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
              />
            </div>

            {/* Segment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Segment <span className="text-rose-500">*</span>
              </label>
              <select
                value={formValues.segment}
                onChange={(e) => handleSegmentChange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
              >
                <option value="Renewable">Renewable</option>
                <option value="Industry & Commercial">Industry &amp; Commercial</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Sub-Segment (Dynamic) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Sub-Segment <span className="text-rose-500">*</span>
              </label>
              <select
                value={formValues.subSegment}
                onChange={(e) => setFormValues({ ...formValues, subSegment: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
              >
                {getSubSegmentOptions(formValues.segment).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Sub-Segment if "Others" */}
            {formValues.subSegment === 'Others' && (
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Custom Sub-Segment Specification <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Data Center / Hydropower / Special Processing Plant"
                  value={formValues.customSubSegment}
                  onChange={(e) => setFormValues({ ...formValues, customSubSegment: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#EE6F2D]/20 focus:border-[#EE6F2D]"
                />
              </div>
            )}
          </div>

          {/* Segment & Sub-Segment Reference Cards */}
          <div className="pt-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-3">
              <span className="text-[#EE6F2D]">+</span>
              <span>Segment &amp; Sub-Segment Reference</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Renewable */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-950">Renewable</h4>
                  <p className="text-[11px] text-emerald-800 font-medium mt-0.5">Wind / Solar / Others</p>
                </div>
              </div>

              {/* Industry */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1E5BB8] flex items-center justify-center shrink-0">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-blue-950">Industry</h4>
                  <p className="text-[11px] text-blue-800 font-medium mt-0.5">Chemical / Process / Others</p>
                </div>
              </div>

              {/* Commercial */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-purple-950">Commercial</h4>
                  <p className="text-[11px] text-purple-800 font-medium mt-0.5">Building / Colleges / Others</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#EE6F2D] to-[#D95B1B] hover:from-[#E46220] hover:to-[#C65015] text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Next: Add Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

