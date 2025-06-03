import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertTriangle } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginResponse {
  user?: {
    status: 'active' | 'banned';
    banReason?: string;
  };
}

interface AuthContextType {
  login: (email: string, password: string, remember: boolean) => Promise<LoginResponse | void>;
  error: string | null;
  clearError: () => void;
}

const Form = styled.form`
  width: 100%;
`;

const FormTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const FormSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.neutral[600]};
  margin-bottom: 2rem;
`;

const FormError = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.error[50]};
  border: 1px solid ${({ theme }) => theme.colors.error[300]};
  color: ${({ theme }) => theme.colors.error[700]};
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
`;

const FormActions = styled.div`
  margin-top: 2rem;
`;

const ForgotPassword = styled(Link)`
  display: block;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.primary[600]};
  text-align: right;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary[700]};
  }
`;

const RegisterLink = styled.div`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
  
  a {
    color: ${({ theme }) => theme.colors.primary[600]};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary[700]};
    }
  }
`;

const RememberMeWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.neutral[700]};
  margin-bottom: 1rem;
  user-select: none;
`;

const BanMessage = styled(motion.div)`
  background-color: ${({ theme }) => theme.colors.error[50]};
  border: 1px solid ${({ theme }) => theme.colors.error[300]};
  color: ${({ theme }) => theme.colors.error[700]};
  padding: 1rem;
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Login = () => {
  const { login, error, clearError } = useAuth() as AuthContextType;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [banReason, setBanReason] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      const response = await login(data.email, data.password, rememberMe);
      
      // Check if user is banned
      if (response && response.user?.status === 'banned') {
        setBanReason(response.user.banReason || 'No reason provided');
        return;
      }
    } catch (error: any) {
      // Show specific error messages based on backend response
      if (error?.response?.data?.error) {
        if (error.response.data.error.includes('email')) {
          clearError();
          setFormError('Email not found');
        } else if (error.response.data.error.includes('password') || error.response.data.error.includes('credentials')) {
          clearError();
          setFormError('Incorrect password');
        } else if (error.response.data.error.includes('banned')) {
          setBanReason(error.response.data.banReason || 'No reason provided');
        } else {
          setFormError(error.response.data.error);
        }
      } else {
        setFormError('Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormTitle>Welcome back</FormTitle>
      <FormSubtitle>Log in to your account to continue</FormSubtitle>

      {banReason && (
        <BanMessage
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium">Your account has been banned</p>
            <p className="text-sm mt-1">Reason: {banReason}</p>
            <p className="text-sm mt-1">Please contact support if you believe this is a mistake.</p>
          </div>
        </BanMessage>
      )}

      {formError && !banReason && (
        <FormError
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {formError}
        </FormError>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          fullWidth
          leftIcon={<Mail size={18} />}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          onChange={() => {
            error && clearError();
            banReason && setBanReason(null);
          }}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          fullWidth
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          })}
          onChange={() => {
            error && clearError();
            banReason && setBanReason(null);
          }}
        />

        <RememberMeWrapper>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe((v) => !v)}
          />
          Remember me
        </RememberMeWrapper>

        <ForgotPassword to="/forgot-password">
          Forgot password?
        </ForgotPassword>

        <FormActions>
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting || !!banReason}
          >
            Log In
          </Button>
        </FormActions>

        <RegisterLink>
          Don't have an account? <Link to="/register">Sign up</Link>
        </RegisterLink>
      </Form>
    </>
  );
};

export default Login;