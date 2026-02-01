import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const base = 'px-6 py-3 font-semibold text-sm rounded-2xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg';
  
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-violet-500/30 hover:shadow-violet-500/50 hover:brightness-110 border border-white/10',
    secondary: 'bg-white/10 text-white border border-white/10 hover:bg-white/20 backdrop-blur-md',
    ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/5 shadow-none',
  };

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
};

export default Button;
