import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const InputContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.neutral[700]};
  margin-bottom: 0.25rem;
`;

const InputWrapper = styled.div<{ fullWidth?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  ${({ fullWidth }) =>
    fullWidth &&
    css`
      width: 100%;
    `}
`;

const LeftIconWrapper = styled.div`
  position: absolute;
  left: 0.75rem;
  color: ${({ theme }) => theme.colors.neutral[500]};
  display: flex;
  align-items: center;
`;

const RightIconWrapper = styled.div`
  position: absolute;
  right: 0.75rem;
  color: ${({ theme }) => theme.colors.neutral[500]};
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{
  hasError: boolean;
  hasLeftIcon: boolean;
  hasRightIcon: boolean;
}>`
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.9375rem;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme, hasError }) =>
    hasError ? theme.colors.error[500] : theme.colors.neutral[300]};
  background-color: ${({ theme }) => theme.colors.neutral[50]};
  color: ${({ theme }) => theme.colors.neutral[900]};
  transition: ${({ theme }) => theme.transitions.default};
  
  ${({ hasLeftIcon }) =>
    hasLeftIcon &&
    css`
      padding-left: 2.5rem;
    `}
  
  ${({ hasRightIcon }) =>
    hasRightIcon &&
    css`
      padding-right: 2.5rem;
    `}
  
  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) =>
      hasError ? theme.colors.error[500] : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) =>
      hasError
        ? `rgba(239, 68, 68, 0.15)`
        : `rgba(59, 130, 246, 0.15)`};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral[400]};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.neutral[100]};
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.error[500]};
  margin-top: 0.25rem;
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      fullWidth = false,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <InputContainer fullWidth={fullWidth}>
        {label && <InputLabel htmlFor={inputId}>{label}</InputLabel>}
        <InputWrapper fullWidth={fullWidth}>
          {leftIcon && <LeftIconWrapper>{leftIcon}</LeftIconWrapper>}
          <StyledInput
            id={inputId}
            ref={ref}
            hasError={!!error}
            hasLeftIcon={!!leftIcon}
            hasRightIcon={!!rightIcon}
            aria-invalid={!!error}
            {...props}
          />
          {rightIcon && <RightIconWrapper>{rightIcon}</RightIconWrapper>}
        </InputWrapper>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </InputContainer>
    );
  }
);

Input.displayName = 'Input';

export default Input;