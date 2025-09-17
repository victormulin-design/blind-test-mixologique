import React from 'react';

interface SetupStepWrapperProps {
  title: string;
  children: React.ReactNode;
}

const SetupStepWrapper: React.FC<SetupStepWrapperProps> = ({ title, children }) => {
  return (
    <div className="animate-fade-in">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-gold tracking-widest uppercase mb-6">
        {title}
      </h2>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default SetupStepWrapper;