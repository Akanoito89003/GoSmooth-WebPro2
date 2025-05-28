import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';

const AuthContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const ImageSide = styled.div`
  display: none;
  flex: 1;
  background-image: url('https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260');
  background-size: cover;
  background-position: center;
  position: relative;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: block;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(30, 64, 175, 0.4),
      rgba(30, 58, 138, 0.7)
    );
  }
`;

const ContentSide = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: ${({ theme }) => theme.colors.neutral[50]};
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary[700]};
  margin-bottom: 2rem;
  text-decoration: none;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const AuthCard = styled(motion.div)`
  width: 100%;
  max-width: 28rem;
  background-color: white;
  border-radius: ${({ theme }) => theme.radii.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding: 2rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2.5rem;
  }
`;

const Quote = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  right: 2rem;
  color: white;
  z-index: 10;
`;

const QuoteText = styled.p`
  font-size: 1.25rem;
  font-style: italic;
  margin-bottom: 0.5rem;
`;

const QuoteAuthor = styled.p`
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4 },
};

const AuthLayout = () => {
  return (
    <AuthContainer>
      <ImageSide>
        <Quote>
          <QuoteText>
            "The world is a book and those who do not travel read only one page."
          </QuoteText>
          <QuoteAuthor>– Saint Augustine</QuoteAuthor>
        </Quote>
      </ImageSide>
      <ContentSide>
        <Logo to="/">
          <Map size={24} />
          GoSmooth
        </Logo>
        <AuthCard
          initial="initial"
          animate="animate"
          exit="exit"
          variants={cardVariants}
        >
          <Outlet />
        </AuthCard>
      </ContentSide>
    </AuthContainer>
  );
};

export default AuthLayout;