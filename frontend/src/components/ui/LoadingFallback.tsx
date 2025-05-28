import styled from 'styled-components';
import { motion } from 'framer-motion';

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  width: 100%;
`;

const LoadingText = styled.p`
  margin-top: 1.5rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.primary[600]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const LoadingIndicator = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Circle = styled(motion.span)`
  display: block;
  width: 0.75rem;
  height: 0.75rem;
  background-color: ${({ theme }) => theme.colors.primary[500]};
  border-radius: 50%;
  margin: 0 0.25rem;
`;

const circleFade = {
  initial: { opacity: 0.4 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse' as const,
      duration: 0.8,
    },
  },
};

const staggeredDelay = (delay: number) => ({
  animate: {
    opacity: [0.4, 1, 0.4],
    transition: {
      repeat: Infinity,
      duration: 1.6,
      delay,
    },
  },
});

const LoadingFallback = () => {
  return (
    <LoadingContainer>
      <LoadingIndicator>
        <Circle
          initial={{ opacity: 0.4 }}
          animate={staggeredDelay(0).animate}
        />
        <Circle
          initial={{ opacity: 0.4 }}
          animate={staggeredDelay(0.2).animate}
        />
        <Circle
          initial={{ opacity: 0.4 }}
          animate={staggeredDelay(0.4).animate}
        />
      </LoadingIndicator>
      <LoadingText>Loading content...</LoadingText>
    </LoadingContainer>
  );
};

export default LoadingFallback;