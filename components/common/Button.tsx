import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const base = 'px-4 py-2 font-mono uppercase text-xs tracking-widest border transition-none';
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-black border-accent hover:bg-white hover:text-black',
    secondary: 'bg-transparent text-white border-gray-600 hover:border-accent hover:text-accent',
    ghost: 'bg-transparent text-gray-400 border-transparent hover:text-white',
  };

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
};

export default Button;
