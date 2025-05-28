import { FallbackProps } from 'react-error-boundary';
import styled from 'styled-components';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  width: 100%;
  padding: 2rem;
  text-align: center;
`;

const IconWrapper = styled.div`
  color: ${({ theme }) => theme.colors.error[500]};
  margin-bottom: 1.5rem;
  
  svg {
    width: 3rem;
    height: 3rem;
  }
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.neutral[900]};
  margin-bottom: 0.5rem;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
  margin-bottom: 1.5rem;
  max-width: 36rem;
`;

const ErrorDetail = styled.pre`
  font-size: 0.875rem;
  background-color: ${({ theme }) => theme.colors.neutral[100]};
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: auto;
  max-width: 100%;
  margin-bottom: 1.5rem;
  text-align: left;
  color: ${({ theme }) => theme.colors.neutral[800]};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <ErrorContainer role="alert">
      <IconWrapper>
        <AlertTriangle />
      </IconWrapper>
      <ErrorTitle>Something went wrong</ErrorTitle>
      <ErrorMessage>
        We encountered an unexpected error. Please try again or contact support if the problem persists.
      </ErrorMessage>
      <ErrorDetail>{error.message}</ErrorDetail>
      <ButtonGroup>
        <Button onClick={() => window.location.href = '/'}>
          Go to Home
        </Button>
        <Button variant="outline" onClick={resetErrorBoundary}>
          Try Again
        </Button>
      </ButtonGroup>
    </ErrorContainer>
  );
};

export default ErrorFallback;