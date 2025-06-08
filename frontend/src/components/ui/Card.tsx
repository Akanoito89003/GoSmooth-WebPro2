import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

interface CardProps {
  variant?: 'default' | 'outline' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const StyledCard = styled(motion.div)<{
  $variant: 'default' | 'outline' | 'elevated';
  $padding: 'none' | 'sm' | 'md' | 'lg';
  $fullWidth: boolean;
  $interactive: boolean;
}>`
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  transition: ${({ theme }) => theme.transitions.default};
  
  ${({ $fullWidth }) =>
    $fullWidth &&
    css`
      width: 100%;
    `}
  
  ${({ $padding, theme }) =>
    $padding === 'sm' &&
    css`
      padding: ${theme.space[3]};
    `}
  
  ${({ $padding, theme }) =>
    $padding === 'md' &&
    css`
      padding: ${theme.space[4]};
    `}
  
  ${({ $padding, theme }) =>
    $padding === 'lg' &&
    css`
      padding: ${theme.space[6]};
    `}
  
  ${({ $variant, theme }) =>
    $variant === 'default' &&
    css`
      background-color: ${theme.colors.neutral[50]};
      border: 1px solid ${theme.colors.neutral[200]};
    `}
  
  ${({ $variant, theme }) =>
    $variant === 'outline' &&
    css`
      background-color: transparent;
      border: 1px solid ${theme.colors.neutral[200]};
    `}
  
  ${({ $variant, theme }) =>
    $variant === 'elevated' &&
    css`
      background-color: white;
      border: none;
      box-shadow: ${theme.shadows.md};
    `}
  
  ${({ $interactive, theme }) =>
    $interactive &&
    css`
      cursor: pointer;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: ${theme.shadows.lg};
      }
      
      &:active {
        transform: translateY(0);
      }
    `}
`;

export const Card = ({
  variant = 'default',
  padding = 'md',
  fullWidth = false,
  interactive = false,
  onClick,
  children,
  ...props
}: CardProps) => {
  return (
    <StyledCard
      $variant={variant}
      $padding={padding}
      $fullWidth={fullWidth}
      $interactive={interactive}
      onClick={onClick}
      whileHover={interactive ? { y: -2 } : {}}
      whileTap={interactive ? { y: 0 } : {}}
      {...props}
    >
      {children}
    </StyledCard>
  );
};

export default Card;