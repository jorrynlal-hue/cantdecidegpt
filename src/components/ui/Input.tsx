'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface InputBaseProps {
  label?: string;
  className?: string;
}

interface SingleInputProps extends InputBaseProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  multiline?: false;
}

interface MultilineInputProps extends InputBaseProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  multiline: true;
}

type InputProps = SingleInputProps | MultilineInputProps;

const baseClasses =
  'w-full bg-[#12121a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:shadow-[0_0_0_1px_rgba(168,85,247,0.15)]';

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, className = '', multiline, ...props }, ref) => {
    const wrapperClasses = `flex flex-col gap-1.5 ${className}`;

    if (multiline) {
      const { multiline: _unused, ...textareaProps } = props as MultilineInputProps; // eslint-disable-line @typescript-eslint/no-unused-vars
      return (
        <div className={wrapperClasses}>
          {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`${baseClasses} min-h-[120px] resize-y`}
            {...textareaProps}
          />
        </div>
      );
    }

    return (
      <div className={wrapperClasses}>
        {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          className={baseClasses}
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
