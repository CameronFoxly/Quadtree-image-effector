import React from 'react';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`section-base ${className}`}>
      {title && (
        <div className="section-header">
          <h2>{title}</h2>
        </div>
      )}
      <div className="section-content">
        {children}
      </div>
    </div>
  );
};

export default Section; 