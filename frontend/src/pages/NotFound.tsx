import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Button from '../components/ui/Button';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 70vh;
  padding: 2rem;
`;

const IconWrapper = styled(motion.div)`
  width: 10rem;
  height: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 50%;
  margin-bottom: 2rem;
`;

const Title = styled(motion.h1)`
  font-size: 3rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const Description = styled(motion.p)`
  font-size: 1.25rem;
  max-width: 36rem;
  margin-bottom: 2.5rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  gap: 1rem;
`;

const NotFound = () => {
  return (
    <Container>
      <IconWrapper
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <MapPin size={80} />
      </IconWrapper>
      
      <Title
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        404 - Page Not Found
      </Title>
      
      <Description
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Oops! It looks like you've taken a wrong turn. The page you're looking for doesn't exist or has been moved.
      </Description>
      
      <ButtonGroup
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button as={Link} to="/" size="lg">
          Go to Home
        </Button>
        <Button as={Link} to="/route-planner" variant="outline" size="lg">
          Plan a Route
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default NotFound;