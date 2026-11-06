import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  let style = {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  switch (status) {
    case 'Approved':
      style = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800 font-semibold',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500'
      };
      break;
    case 'Pending Approval':
    case 'Submitted for Approval':
      style = {
        bg: 'bg-blue-50',
        text: 'text-blue-700 font-semibold',
        border: 'border-blue-200',
        dot: 'bg-blue-500'
      };
      break;
    case 'Returned for Correction':
      style = {
        bg: 'bg-orange-50',
        text: 'text-orange-800 font-semibold',
        border: 'border-orange-200',
        dot: 'bg-[#FF7A18]'
      };
      break;
    case 'Rejected':
      style = {
        bg: 'bg-rose-50',
        text: 'text-rose-800 font-semibold',
        border: 'border-rose-200',
        dot: 'bg-rose-500'
      };
      break;
    case 'Draft':
      style = {
        bg: 'bg-slate-100',
        text: 'text-slate-600 font-medium',
        border: 'border-slate-200',
        dot: 'bg-slate-400'
      };
      break;
    case 'Resubmitted':
      style = {
        bg: 'bg-sky-50',
        text: 'text-sky-800 font-semibold',
        border: 'border-sky-200',
        dot: 'bg-sky-500'
      };
      break;
    case 'Won':
      style = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800 font-bold',
        border: 'border-emerald-300',
        dot: 'bg-emerald-600'
      };
      break;
    case 'Lost':
      style = {
        bg: 'bg-slate-100',
        text: 'text-slate-500 font-medium',
        border: 'border-slate-200',
        dot: 'bg-slate-400'
      };
      break;
    case 'Issued':
      style = {
        bg: 'bg-sky-50',
        text: 'text-sky-800 font-bold',
        border: 'border-sky-200',
        dot: 'bg-sky-600'
      };
      break;
    case 'Revised':
      style = {
        bg: 'bg-purple-50',
        text: 'text-purple-700 font-semibold',
        border: 'border-purple-200',
        dot: 'bg-purple-500'
      };
      break;
    case 'Superseded':
      style = {
        bg: 'bg-slate-50',
        text: 'text-slate-400 line-through',
        border: 'border-slate-200',
        dot: 'bg-slate-300'
      };
      break;
    default:
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs tracking-wide border whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border} transition-colors duration-150 ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${style.dot}`} />
      {status}
    </span>
  );
};
