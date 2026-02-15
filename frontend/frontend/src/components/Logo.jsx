import React from 'react';
import { Brain } from 'lucide-react';

// BrainLoop logo with Brain icon
const Logo = ({ size = 80 }) => {
  const iconSize = size * 0.5; // Brain icon is 50% of total size
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div 
        style={{ 
          width: size, 
          height: size, 
          background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
          borderRadius: size * 0.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
        }}
      >
        <Brain style={{ width: iconSize, height: iconSize, color: 'white' }} />
      </div>
      <span style={{ 
        fontWeight: 'bold', 
        fontSize: size * 0.28, 
        background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontFamily: 'Montserrat, sans-serif' 
      }}>
        BrainLoop
      </span>
    </div>
  );
};

export default Logo;
