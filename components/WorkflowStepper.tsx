
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import type { WorkflowStep } from '../types';

interface WorkflowStepperProps {
  currentStep: WorkflowStep;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStep }) => {
  const { t } = useTranslation();

  const steps: { id: WorkflowStep, label: string }[] = [
    { id: 'import', label: t.pipeline_step_import },
    { id: 'culling', label: t.pipeline_step_culling },
    { id: 'edit', label: t.pipeline_step_edit },
    { id: 'retouch', label: t.pipeline_step_retouch },
    { id: 'export', label: t.pipeline_step_export },
  ];

  const currentIdx = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full bg-slate-900/20 border-b border-white/5 py-4 px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 -translate-y-1/2 z-0 transition-all duration-700 ease-out"
          style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${
                isActive ? 'bg-cyan-400 border-cyan-400 scale-125 ring-4 ring-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 
                isCompleted ? 'bg-indigo-500 border-indigo-500 shadow-lg' : 'bg-slate-900 border-slate-700'
              }`}></div>
              <span className={`absolute top-6 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                isActive ? 'text-cyan-400' : 'text-slate-600'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
