import React from 'react'

export default function Logo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg viewBox="0 0 48 48" className="w-full h-full">
        {/* Background with white/light background */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>
        
        {/* Main circle with white background */}
        <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" stroke="#E2E8F0" strokeWidth="1" />
        
        {/* Letter L in purple */}
        <path 
          d="M16 14 L16 34 L28 34 M16 30 L24 30" 
          stroke="#8B5CF6" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Ledger lines in cyan */}
        <g stroke="#06B6D4" strokeWidth="1.5" opacity="0.8">
          <line x1="30" y1="16" x2="36" y2="16" />
          <line x1="30" y1="20" x2="34" y2="20" />
          <line x1="30" y1="24" x2="38" y2="24" />
          <line x1="30" y1="28" x2="35" y2="28" />
        </g>
        
        {/* Small dots in purple */}
        <circle cx="32" cy="32" r="1.5" fill="#8B5CF6" opacity="0.9" />
        <circle cx="36" cy="34" r="1" fill="#06B6D4" opacity="0.7" />
      </svg>
    </div>
  )
}