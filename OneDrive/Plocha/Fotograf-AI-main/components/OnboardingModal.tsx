
import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { LogoIcon, AutopilotIcon, YoutubeIcon, SparklesIcon } from './icons';

interface OnboardingModalProps {
    onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: t.onboarding_step1_title,
            desc: t.onboarding_step1_desc,
            icon: <LogoIcon className="w-20 h-20 text-accent" />
        },
        {
            title: t.onboarding_step2_title,
            desc: t.onboarding_step2_desc,
            icon: <AutopilotIcon className="w-20 h-20 text-accent" />
        },
        {
            title: t.onboarding_step3_title,
            desc: t.onboarding_step3_desc,
            icon: <div className="relative">
                    <SparklesIcon className="w-20 h-20 text-warning" />
                    <span className="absolute -top-2 -right-2 bg-accent text-void text-xs font-bold px-2 py-1 border border-accent">50 zdarma</span>
                  </div>
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 animate-fade-in">
            <div className="w-full max-w-md bg-surface border border-border-subtle overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-32 border-b border-border-subtle"></div>
                
                <div className="relative p-8 flex flex-col items-center text-center">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-6">{t.onboarding_title}</h2>
                    
                    <div className="mb-8 p-6 bg-elevated border border-border-subtle">
                        {steps[step].icon}
                    </div>

                    <h3 className="text-2xl font-black text-text-primary mb-3 animate-fade-in-up">{steps[step].title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed mb-8 min-h-[60px] animate-fade-in-up">
                        {steps[step].desc}
                    </p>

                    <div className="flex gap-2 mb-8">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1.5 transition-none ${i === step ? 'w-8 bg-accent' : 'w-2 bg-border-subtle'}`}></div>
                        ))}
                    </div>

                    <button 
                        onClick={handleNext}
                        className="w-full py-4 font-bold text-void bg-accent border border-accent transition-none"
                    >
                        {step === steps.length - 1 ? t.onboarding_btn_start : t.onboarding_btn_next}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;

