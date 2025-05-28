import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Mail, Lock, User } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
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

const TermsText = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.neutral[500]};
  margin-top: 1rem;
  text-align: center;
  
  a {
    color: ${({ theme }) => theme.colors.primary[600]};
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary[700]};
    }
  }
`;

const LoginLink = styled.div`
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

const Register = () => {
  const { register: registerUser, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      await registerUser(data.name, data.email, data.password);
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormTitle>Create an account</FormTitle>
      <FormSubtitle>Sign up to get started with GoSmooth</FormSubtitle>

      {error && (
        <FormError
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {error}
        </FormError>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          fullWidth
          leftIcon={<User size={18} />}
          error={errors.name?.message}
          {...register('name', {
            required: 'Name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters',
            },
          })}
          onChange={() => error && clearError()}
        />

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
          onChange={() => error && clearError()}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a password"
          fullWidth
          leftIcon={<Lock size={18} />}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 7,
              message: 'Password must be at least 7 characters',
            },
            validate: (value) => /[A-Za-z]/.test(value) || 'Password must contain at least one letter',
          })}
          onChange={() => error && clearError()}
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          fullWidth
          leftIcon={<Lock size={18} />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === watch('password') || 'Passwords do not match',
          })}
          onChange={() => error && clearError()}
        />

        <FormActions>
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Account
          </Button>
          
          <TermsText>
            By signing up, you agree to our{' '}
            <Link to="/terms">Terms of Service</Link> and{' '}
            <Link to="/privacy">Privacy Policy</Link>.
          </TermsText>
        </FormActions>

        <LoginLink>
          Already have an account? <Link to="/login">Log in</Link>
        </LoginLink>
      </Form>
    </>
  );
};

export default Register;