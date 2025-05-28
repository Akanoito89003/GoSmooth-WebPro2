import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Navbar from '../components/navigation/Navbar';
import Footer from '../components/navigation/Footer';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled(motion.main)`
  flex: 1;
  padding: 1rem;
  margin-top: 4rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 2rem;
  }
`;

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

const MainLayout = () => {
  return (
    <PageContainer>
      <Navbar />
      <Main
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
      >
        <Outlet />
      </Main>
      <Footer />
    </PageContainer>
  );
};

export default MainLayout;