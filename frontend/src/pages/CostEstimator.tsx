import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Car, 
  Bus, 
  Train, 
  Plane, 
  TrendingUp, 
  Share2, 
  Save 
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  text-align: center;
  max-width: 48rem;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const PageDescription = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const CostContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: row;
  }
`;

const FormContainer = styled.div`
  flex: 1;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    max-width: 28rem;
  }
`;

const ResultsContainer = styled(motion.div)`
  flex: 2;
`;

const CostForm = styled.form`
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.neutral[900]};
`;

const TransportOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const TransportOption = styled.div<{ isSelected: boolean }>`
  padding: 1rem;
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary[50] : 'white'};
  border: 2px solid ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary[500] : theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  display: flex;
  align-items: center;
  
  &:hover {
    border-color: ${({ isSelected, theme }) =>
      isSelected ? theme.colors.primary[600] : theme.colors.neutral[300]};
  }
`;

const TransportIcon = styled.div<{ isSelected: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary[100] : theme.colors.neutral[100]};
  color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary[600] : theme.colors.neutral[600]};
  border-radius: ${({ theme }) => theme.radii.full};
  margin-right: 0.75rem;
`;

const TransportLabel = styled.div<{ isSelected: boolean }>`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ isSelected, theme }) =>
    isSelected ? theme.colors.primary[700] : theme.colors.neutral[700]};
`;

const CostCards = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const CostCard = styled(Card)`
  padding: 1.5rem;
`;

const CostCardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const CostCardIcon = styled.div`
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  border-radius: ${({ theme }) => theme.radii.full};
  margin-right: 1rem;
`;

const CostCardTitle = styled.h4`
  font-size: 1.125rem;
  margin: 0;
`;

const PriceValue = styled.div`
  font-size: 2rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.neutral[900]};
  margin-bottom: 0.25rem;
`;

const PriceDetails = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const CostBreakdown = styled(Card)`
  margin-top: 2rem;
`;

const CostBreakdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const CostBreakdownTitle = styled.h4`
  font-size: 1.25rem;
  margin: 0;
`;

const CostBreakdownRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral[100]};
  
  &:last-child {
    border-bottom: none;
  }
`;

const CostBreakdownLabel = styled.span`
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const CostBreakdownValue = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const CostBreakdownTotal = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  margin-top: 0.5rem;
  border-top: 2px solid ${({ theme }) => theme.colors.neutral[200]};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: 1.125rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const PriceHistoryChart = styled.div`
  background-color: ${({ theme }) => theme.colors.neutral[50]};
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

// Transport mode options
const transportModes = [
  { id: 'car', label: 'Car', icon: <Car size={20} /> },
  { id: 'bus', label: 'Bus', icon: <Bus size={20} /> },
  { id: 'train', label: 'Train', icon: <Train size={20} /> },
  { id: 'plane', label: 'Plane', icon: <Plane size={20} /> },
];

const CostEstimator = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  const [transportMode, setTransportMode] = useState('car');
  const [showResults, setShowResults] = useState(false);

  const handleEstimateCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination && distance) {
      // In a real app, this would call the API to get the cost estimate
      setShowResults(true);
    }
  };

  const handleShare = () => {
    // In a real app, this would open a share dialog
    alert('Sharing cost estimation');
  };

  const handleSave = () => {
    // In a real app, this would save the cost estimation
    alert('Cost estimation saved');
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Cost Estimator</PageTitle>
        <PageDescription>
          Estimate and compare travel costs for different transportation modes. 
          Get detailed breakdowns and historical price information.
        </PageDescription>
      </PageHeader>

      <CostContainer>
        <FormContainer>
          <CostForm onSubmit={handleEstimateCost}>
            <FormGroup>
              <Input
                label="Origin"
                placeholder="Enter starting point"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                fullWidth
              />
            </FormGroup>
            <FormGroup>
              <Input
                label="Destination"
                placeholder="Enter destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                fullWidth
              />
            </FormGroup>
            <FormGroup>
              <Input
                label="Distance (km)"
                type="number"
                placeholder="Enter distance in kilometers"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                fullWidth
              />
            </FormGroup>

            <SectionTitle>Transportation Mode</SectionTitle>
            <TransportOptions>
              {transportModes.map((mode) => (
                <TransportOption
                  key={mode.id}
                  isSelected={transportMode === mode.id}
                  onClick={() => setTransportMode(mode.id)}
                >
                  <TransportIcon isSelected={transportMode === mode.id}>
                    {mode.icon}
                  </TransportIcon>
                  <TransportLabel isSelected={transportMode === mode.id}>
                    {mode.label}
                  </TransportLabel>
                </TransportOption>
              ))}
            </TransportOptions>

            <Button type="submit" fullWidth>
              Estimate Cost
            </Button>
          </CostForm>
        </FormContainer>

        {showResults && (
          <ResultsContainer
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SectionTitle>Cost Comparison</SectionTitle>
            <CostCards>
              <CostCard variant="elevated">
                <CostCardHeader>
                  <CostCardIcon>
                    <Car size={24} />
                  </CostCardIcon>
                  <CostCardTitle>Car</CostCardTitle>
                </CostCardHeader>
                <PriceValue>$45.80</PriceValue>
                <PriceDetails>Based on current fuel prices and average consumption</PriceDetails>
              </CostCard>
              
              <CostCard variant="elevated">
                <CostCardHeader>
                  <CostCardIcon>
                    <Bus size={24} />
                  </CostCardIcon>
                  <CostCardTitle>Bus</CostCardTitle>
                </CostCardHeader>
                <PriceValue>$25.50</PriceValue>
                <PriceDetails>Based on standard bus fares for this route</PriceDetails>
              </CostCard>
              
              <CostCard variant="elevated">
                <CostCardHeader>
                  <CostCardIcon>
                    <Train size={24} />
                  </CostCardIcon>
                  <CostCardTitle>Train</CostCardTitle>
                </CostCardHeader>
                <PriceValue>$32.75</PriceValue>
                <PriceDetails>Based on average train tickets for this route</PriceDetails>
              </CostCard>
              
              <CostCard variant="elevated">
                <CostCardHeader>
                  <CostCardIcon>
                    <Plane size={24} />
                  </CostCardIcon>
                  <CostCardTitle>Plane</CostCardTitle>
                </CostCardHeader>
                <PriceValue>$98.20</PriceValue>
                <PriceDetails>Based on typical economy class tickets</PriceDetails>
              </CostCard>
            </CostCards>

            <CostBreakdown variant="elevated">
              <CostBreakdownHeader>
                <CostBreakdownTitle>Cost Breakdown for {transportMode.charAt(0).toUpperCase() + transportMode.slice(1)}</CostBreakdownTitle>
              </CostBreakdownHeader>
              
              {transportMode === 'car' && (
                <>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Fuel</CostBreakdownLabel>
                    <CostBreakdownValue>$32.50</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Tolls</CostBreakdownLabel>
                    <CostBreakdownValue>$5.00</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Wear and tear</CostBreakdownLabel>
                    <CostBreakdownValue>$8.30</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownTotal>
                    <span>Total</span>
                    <span>$45.80</span>
                  </CostBreakdownTotal>
                </>
              )}
              
              {transportMode === 'bus' && (
                <>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Ticket fare</CostBreakdownLabel>
                    <CostBreakdownValue>$23.50</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Booking fee</CostBreakdownLabel>
                    <CostBreakdownValue>$2.00</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownTotal>
                    <span>Total</span>
                    <span>$25.50</span>
                  </CostBreakdownTotal>
                </>
              )}
              
              {transportMode === 'train' && (
                <>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Ticket fare</CostBreakdownLabel>
                    <CostBreakdownValue>$30.75</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Booking fee</CostBreakdownLabel>
                    <CostBreakdownValue>$2.00</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownTotal>
                    <span>Total</span>
                    <span>$32.75</span>
                  </CostBreakdownTotal>
                </>
              )}
              
              {transportMode === 'plane' && (
                <>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Base fare</CostBreakdownLabel>
                    <CostBreakdownValue>$75.00</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Airport fees</CostBreakdownLabel>
                    <CostBreakdownValue>$15.20</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownRow>
                    <CostBreakdownLabel>Booking fee</CostBreakdownLabel>
                    <CostBreakdownValue>$8.00</CostBreakdownValue>
                  </CostBreakdownRow>
                  <CostBreakdownTotal>
                    <span>Total</span>
                    <span>$98.20</span>
                  </CostBreakdownTotal>
                </>
              )}
            </CostBreakdown>

            <PriceHistoryChart>
              <div>Price history chart would be displayed here</div>
            </PriceHistoryChart>

            <ActionButtons>
              <Button
                variant="outline"
                leftIcon={<Share2 size={18} />}
                onClick={handleShare}
              >
                Share Estimation
              </Button>
              <Button
                variant="outline"
                leftIcon={<Save size={18} />}
                onClick={handleSave}
              >
                Save Estimation
              </Button>
            </ActionButtons>
          </ResultsContainer>
        )}
      </CostContainer>
    </PageContainer>
  );
};

export default CostEstimator;