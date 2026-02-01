
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  isLoading, 
  className = '', 
  ...props 
}) => {
  // Engineering Focus: Compact, precise, no layout shifts
  const baseStyles = "inline-flex items-center justify-center gap-2 px-3 h-8 text-[12px] font-medium rounded-md border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    // Brand Primary: #007acc
    primary: "bg-[#007acc] text-white border-transparent hover:bg-[#006bb3] focus:ring-[#007acc]/50 shadow-sm",
    
    // Functional Secondary: Slate borders, clean white bg
    secondary: "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 focus:ring-slate-200 shadow-sm",
    
    // Danger: Functional red, no pulse animation
    danger: "bg-red-600 text-white border-transparent hover:bg-red-700 focus:ring-red-500/50 shadow-sm",
    
    // Ghost: Minimalist for dense toolbars
    ghost: "bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="w-3 h-3 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="text-current opacity-80 flex items-center justify-center">
          {/* Ensure icon size matches text density */}
          {/* Casting to React.ReactElement<any> to fix type error with cloneElement props */}
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-3.5 h-3.5" }) 
            : icon}
        </span>
      ) : null}
      
      <span className="leading-none pt-[1px]">{children}</span>
    </button>
  );
};

export default Button;
