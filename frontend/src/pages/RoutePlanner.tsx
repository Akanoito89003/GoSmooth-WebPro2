import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Map as MapIcon, Navigation, Clock, DownloadIcon } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

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

const RouteContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    flex-direction: row;
  }
`;

const RouteFormContainer = styled.div`
  flex: 1;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    max-width: 28rem;
  }
`;

const MapWrapper = styled.div`
  flex: 2;
  height: 500px;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const RouteForm = styled.form`
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

const RouteOptions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.neutral[100]};
    border-radius: ${({ theme }) => theme.radii.full};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.neutral[300]};
    border-radius: ${({ theme }) => theme.radii.full};
  }
`;

const RouteCard = styled(Card)<{ isSelected: boolean }>`
  min-width: 220px;
  flex: 1;
  cursor: pointer;
  border: 2px solid ${({ isSelected, theme }) => 
    isSelected ? theme.colors.primary[500] : 'transparent'};
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const RouteInfo = styled.div``;

const RouteType = styled.div`
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
  }
`;

const RouteTime = styled.div`
  font-size: 1.25rem;
  font-weight: ${({ theme }) => theme.fontWeights.semiBold};
  margin-bottom: 0.25rem;
`;

const RouteDistance = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
`;

const ExportSection = styled.div`
  margin-top: 2rem;
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 1rem;
`;

// Mock data for route options
const routeOptions = [
  {
    id: 1,
    type: 'Fastest Route',
    time: '1h 25m',
    distance: '85.4 km',
  },
  {
    id: 2,
    type: 'Shortest Distance',
    time: '1h 45m',
    distance: '76.2 km',
  },
  {
    id: 3,
    type: 'Eco-friendly',
    time: '1h 55m',
    distance: '82.7 km',
  },
];

// Map centering component
const SetViewOnChange = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

const RoutePlanner = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);
  const [isRouteCalculated, setIsRouteCalculated] = useState(false);

  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (origin && destination) {
      // In a real app, this would call the API to get the route
      // For demo, we'll simulate a successful route calculation
      setSelectedRoute(1);
      setIsRouteCalculated(true);
      // Update map center (in a real app, this would be based on the route)
      setMapCenter([51.515, -0.09]);
    }
  };

  const handleExportRoute = (format: 'pdf' | 'gpx') => {
    // In a real app, this would generate the export
    alert(`Exporting route in ${format.toUpperCase()} format`);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Route Planner</PageTitle>
        <PageDescription>
          Plan your journey with our interactive route planner. Find the best route, 
          compare alternatives, and export your route for offline use.
        </PageDescription>
      </PageHeader>

      <RouteContainer>
        <RouteFormContainer>
          <RouteForm onSubmit={handleCalculateRoute}>
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
            <Button type="submit" fullWidth>
              Calculate Route
            </Button>
          </RouteForm>

          {isRouteCalculated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SectionTitle>Route Options</SectionTitle>
              <RouteOptions>
                {routeOptions.map((route) => (
                  <RouteCard
                    key={route.id}
                    variant="elevated"
                    isSelected={selectedRoute === route.id}
                    onClick={() => setSelectedRoute(route.id)}
                    interactive
                  >
                    <RouteInfo>
                      <RouteType>
                        <Navigation size={16} />
                        {route.type}
                      </RouteType>
                      <RouteTime>{route.time}</RouteTime>
                      <RouteDistance>{route.distance}</RouteDistance>
                    </RouteInfo>
                  </RouteCard>
                ))}
              </RouteOptions>

              <ExportSection>
                <SectionTitle>Export Route</SectionTitle>
                <ExportButtons>
                  <Button
                    variant="outline"
                    onClick={() => handleExportRoute('pdf')}
                    leftIcon={<DownloadIcon size={16} />}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportRoute('gpx')}
                    leftIcon={<DownloadIcon size={16} />}
                  >
                    GPX
                  </Button>
                </ExportButtons>
              </ExportSection>
            </motion.div>
          )}
        </RouteFormContainer>

        <MapWrapper>
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <SetViewOnChange center={mapCenter} />
            <Marker position={mapCenter}>
              <Popup>
                A sample marker position. <br /> This would be dynamically generated based on the route.
              </Popup>
            </Marker>
          </MapContainer>
        </MapWrapper>
      </RouteContainer>
    </PageContainer>
  );
};

export default RoutePlanner;