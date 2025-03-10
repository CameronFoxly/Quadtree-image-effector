import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'action';
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  active = false,
  icon,
  className = '',
  children,
  ...props
}) => {
  const hasIcon = icon != null;

  return (
    <button
      className={`button-base ${active ? 'active' : ''} ${hasIcon ? styles.hasIcon : ''} ${className}`}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button; 