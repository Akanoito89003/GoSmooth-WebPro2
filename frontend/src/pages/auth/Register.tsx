import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Mail, Lock, User } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  addressLine: string;
  city: string;
  province: string;
  zipcode: string;
  country: string;
}

const FormContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: transparent;
`;

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

const AddressGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Register = () => {
  const { registerUser, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const [emailError, setEmailError] = useState<string | null>(null);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      setEmailError(null);
      // Geocode address
      const address = `${data.addressLine}, ${data.city}, ${data.province}, ${data.zipcode}, ${data.country}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const res = await fetch(url);
      const geo = await res.json();
      if (!geo || geo.length === 0) {
        toast.error('ไม่พบพิกัดที่อยู่ กรุณาตรวจสอบที่อยู่ให้ถูกต้อง');
        setIsSubmitting(false);
        return;
      }
      const lat = parseFloat(geo[0].lat);
      const lng = parseFloat(geo[0].lon);
      
      await registerUser(
        data.name,
        data.email,
        data.password,
        {
          addressLine: data.addressLine,
          city: data.city,
          province: data.province,
          zipcode: data.zipcode,
          country: data.country,
          lat,
          lng,
        }
      );
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error: any) {
      if (error.message && error.message.toLowerCase().includes('email')) {
        setEmailError('อีเมลนี้ถูกใช้ไปแล้ว');
      } else if (error.message) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer>
      <div style={{ width: '100%', maxWidth: 540, margin: '32px 0' }}>
        <FormTitle>Create an account</FormTitle>
        <FormSubtitle>Sign up to get started with GoSmooth</FormSubtitle>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <FormError
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error}
            </FormError>
          )}

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
            error={emailError || errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            onChange={() => {
              setEmailError(null);
              error && clearError();
            }}
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

          <div style={{ fontSize: 13, color: '#888', margin: '16px 0 8px 0' }}>
            ตัวอย่างที่อยู่: 123/45 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900 ประเทศไทย
          </div>

          <AddressGrid>
            <Input
              label="บ้านเลขที่/ถนน"
              placeholder="123/45 ถนนพหลโยธิน"
              error={errors.addressLine?.message}
              {...register('addressLine', { required: 'กรุณากรอกบ้านเลขที่/ถนน' })}
              onChange={() => error && clearError()}
            />
            <Input
              label="เขต/อำเภอ"
              placeholder="เขตจตุจักร"
              error={errors.city?.message}
              {...register('city', { required: 'กรุณากรอกเขต/อำเภอ' })}
              onChange={() => error && clearError()}
            />
            <Input
              label="จังหวัด"
              placeholder="กรุงเทพมหานคร"
              error={errors.province?.message}
              {...register('province', { required: 'กรุณากรอกจังหวัด' })}
              onChange={() => error && clearError()}
            />
            <Input
              label="รหัสไปรษณีย์"
              placeholder="10900"
              error={errors.zipcode?.message}
              {...register('zipcode', {
                required: 'กรุณากรอกรหัสไปรษณีย์',
                pattern: {
                  value: /^[0-9]{5}$/,
                  message: 'รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก',
                },
              })}
              onChange={() => error && clearError()}
            />
          </AddressGrid>
          <select
            {...register('country', { required: 'กรุณาเลือกประเทศ' })}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #ccc', marginBottom: 8 }}
            defaultValue=""
          >
            <option value="">เลือกประเทศ</option>
            <option value="Thailand">Thailand</option>
          </select>
          {errors.country && <div style={{ color: 'red', marginBottom: 8 }}>{errors.country.message}</div>}
          <div style={{ fontSize: 13, color: 'red', marginBottom: 16 }}>
            หมายเหตุ: ที่อยู่ที่กรอกอาจจะไม่ตรงกับที่อยู่จริง 100% แต่คุณสามารถแก้ไขหรือปักหมุดที่อยู่เองได้ในภายหลัง
          </div>

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
      </div>
    </FormContainer>
  );
};

export default Register;