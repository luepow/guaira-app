import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`card ${noPadding ? 'p-0' : ''} ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className={`flex items-start justify-between ${noPadding ? 'p-6 pb-0' : 'mb-4'}`}>
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={noPadding ? 'p-6 pt-4' : ''}>
        {children}
      </div>
    </div>
  );
};
