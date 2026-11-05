import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  let style = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  switch (status) {
    case 'Approved':
      style = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500'
      };
      break;
    case 'Pending Approval':
    case 'Submitted for Approval':
      style = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500'
      };
      break;
    case 'Returned for Correction':
      style = {
        bg: 'bg-[#FFF5EE]',
        text: 'text-[#D65A1A]',
        border: 'border-[#FCDCC9]',
        dot: 'bg-[#EE6F2D]'
      };
      break;
    case 'Rejected':
      style = {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500'
      };
      break;
    case 'Draft':
      style = {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400'
      };
      break;
    case 'Resubmitted':
      style = {
        bg: 'bg-[#F0F5FD]',
        text: 'text-[#1E5BB8]',
        border: 'border-[#D0E1F9]',
        dot: 'bg-[#1E5BB8]'
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
        text: 'text-slate-500',
        border: 'border-slate-200',
        dot: 'bg-slate-400'
      };
      break;
    case 'Issued':
      style = {
        bg: 'bg-[#F0F5FD]',
        text: 'text-[#1E5BB8] font-bold',
        border: 'border-[#D0E1F9]',
        dot: 'bg-[#1E5BB8]'
      };
      break;
    case 'Revised':
      style = {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide border whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border} transition-colors duration-150 ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${style.dot}`} />
      {status}
    </span>
  );
};
