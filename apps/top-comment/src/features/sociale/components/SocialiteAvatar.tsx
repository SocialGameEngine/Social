// =============================================================================
// SOCIALITE AVATAR COMPONENT
// =============================================================================
// Displays a socialite's avatar with initials and optional status

import React from 'react';
import type { Socialite } from '../../../domain/types/sociale.types';

interface SocialiteAvatarProps {
  socialite: Socialite;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export function SocialiteAvatar({ 
  socialite, 
  size = 'md', 
  showStatus = false,
  className = '' 
}: SocialiteAvatarProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-6 h-6 text-xs';
      case 'md': return 'w-8 h-8 text-sm';
      case 'lg': return 'w-12 h-12 text-lg';
      default: return 'w-8 h-8 text-sm';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (socialiteId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
    ];
    
    const index = socialiteId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${getSizeClasses()} ${getAvatarColor(socialite.id)} rounded-full flex items-center justify-center text-white font-medium`}>
        {getInitials(socialite.displayName)}
      </div>
      
      {showStatus && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
}
