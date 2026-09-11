'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/20',
  secondary:
    'bg-[#12121a] text-gray-200 border border-white/10 hover:bg-[#1a1a24] hover:border-white/20',
  ghost: 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-lg gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${variantClasses[variant]} ${sizeClasses[size]} ${
          disabled ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100' : 'cursor-pointer'
        } ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;