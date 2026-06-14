"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10",
            "text-white placeholder-gray-500",
            "focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
            "transition-all duration-200",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
