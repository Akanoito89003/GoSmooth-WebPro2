import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  as?: React.ElementType;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  children: React.ReactNode;
  [key: string]: any;
}

const StyledButton = styled(motion.button)<{
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth: boolean;
  isLoading: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: ${({ theme }) => theme.transitions.default};
  white-space: nowrap;
  cursor: pointer;
  
  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}
  
  ${({ disabled, isLoading }) =>
    (disabled || isLoading) &&
    css`
      opacity: 0.7;
      cursor: not-allowed;
    `}
  
  /* Size variants */
  ${({ size }) =>
    size === 'sm' &&
    css`
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    `}
  
  ${({ size }) =>
    size === 'md' &&
    css`
      padding: 0.625rem 1.25rem;
      font-size: 0.9375rem;
    `}
  
  ${({ size }) =>
    size === 'lg' &&
    css`
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    `}
  
  /* Color variants */
  ${({ variant, theme }) =>
    variant === 'primary' &&
    css`
      background-color: ${theme.colors.primary[600]};
      color: white;
      border: 1px solid ${theme.colors.primary[600]};
      
      &:hover:not(:disabled) {
        background-color: ${theme.colors.primary[700]};
        border-color: ${theme.colors.primary[700]};
      }
      
      &:active:not(:disabled) {
        background-color: ${theme.colors.primary[800]};
        border-color: ${theme.colors.primary[800]};
      }
    `}
  
  ${({ variant, theme }) =>
    variant === 'secondary' &&
    css`
      background-color: ${theme.colors.accent[500]};
      color: white;
      border: 1px solid ${theme.colors.accent[500]};
      
      &:hover:not(:disabled) {
        background-color: ${theme.colors.accent[600]};
        border-color: ${theme.colors.accent[600]};
      }
      
      &:active:not(:disabled) {
        background-color: ${theme.colors.accent[700]};
        border-color: ${theme.colors.accent[700]};
      }
    `}
  
  ${({ variant, theme }) =>
    variant === 'outline' &&
    css`
      background-color: transparent;
      color: ${theme.colors.primary[600]};
      border: 1px solid ${theme.colors.primary[600]};
      
      &:hover:not(:disabled) {
        background-color: ${theme.colors.primary[50]};
      }
      
      &:active:not(:disabled) {
        background-color: ${theme.colors.primary[100]};
      }
    `}
  
  ${({ variant, theme }) =>
    variant === 'ghost' &&
    css`
      background-color: transparent;
      color: ${theme.colors.primary[600]};
      border: 1px solid transparent;
      
      &:hover:not(:disabled) {
        background-color: ${theme.colors.primary[50]};
      }
      
      &:active:not(:disabled) {
        background-color: ${theme.colors.primary[100]};
      }
    `}
  
  ${({ variant, theme }) =>
    variant === 'danger' &&
    css`
      background-color: ${theme.colors.error[600]};
      color: white;
      border: 1px solid ${theme.colors.error[600]};
      
      &:hover:not(:disabled) {
        background-color: ${theme.colors.error[700]};
        border-color: ${theme.colors.error[700]};
      }
      
      &:active:not(:disabled) {
        background-color: ${theme.colors.error[800]};
        border-color: ${theme.colors.error[800]};
      }
    `}
`;

const Spinner = styled.div`
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const Button = ({
  as,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  type = 'button',
  onClick,
  children,
  ...props
}: ButtonProps) => {
  return (
    <StyledButton
      as={as}
      type={type}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      isLoading={isLoading}
      disabled={disabled || isLoading}
      onClick={onClick}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      {...props}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </StyledButton>
  );
};

export default Button;