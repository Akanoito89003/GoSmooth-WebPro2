import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Map as MapIcon, Navigation, Clock, DownloadIcon } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import L from 'leaflet';
import React from 'react';

// Type Place รองรับทั้ง id, place_id, name, coordinates (และ fallback สำหรับ id)
interface Place {
  id?: string;
  place_id?: string;
  PlaceID?: string;
  name?: string;
  Name?: string;
  coordinates?: { lat: number; lng: number };
  Coordinates?: { lat: number; lng: number };
  address?: string;
  [key: string]: any;
}

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

const TRANSPORT_MODES = [
  { key: 'car', label: 'Car' },
  { key: 'bus', label: 'Bus' },
  { key: 'train', label: 'Train' },
  { key: 'plane', label: 'Plane' },
];

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

const fetchRoute = async (
  start: [number, number],
  end: [number, number],
  mode: string
): Promise<[number, number][]> => {
  if (mode === 'plane' || mode === 'train' || mode === 'bus') {
    // วาดเส้นตรง (great-circle) สำหรับโหมดที่ไม่มี routing จริง
    return [start, end];
  }
  const profile = mode === 'car' ? 'driving-car' : 'driving-car';
  const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${start[1]},${start[0]}&end=${end[1]},${end[0]}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('ORS API error:', res.status, res.statusText, url);
      throw new Error(`ORS API error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.features || !data.features[0]) return [start, end];
    return data.features[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
  } catch (err) {
    console.error('fetchRoute error:', err);
    throw err;
  }
};

const haversine = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateCost = (
  mode: string,
  start: [number, number] | null,
  end: [number, number] | null
): number => {
  if (!start || !end) return 0;
  const dist = haversine(start[0], start[1], end[0], end[1]);
  // ตัวอย่างสูตรคำนวณ (สามารถปรับได้)
  switch (mode) {
    case 'car': return dist * 4; // 4 บาท/กม.
    case 'bus': return 20 + dist * 1.5; // 20 บาท + 1.5 บาท/กม.
    case 'train': return 30 + dist * 2.5;
    case 'plane': return 500 + dist * 3.5;
    default: return 0;
  }
};

// Map centering component
const SetViewOnChange = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
};

const getPlaceId = (p: Place) => p._id?.$oid || p._id || p.place_id || p.PlaceID || p.id || '';
const getPlaceName = (p: Place) => p.name || p.Name || '';
const getPlaceCoordinates = (p: Place) => p.coordinates || p.Coordinates;

// สร้าง green icon สำหรับบ้านของฉัน
const homeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RoutePlanner = () => {
  const { user } = useAuth();
  // DEBUG: log user address
  console.log('DEBUG: user.address', user?.address);
  if (user?.address) {
    console.log('DEBUG: user.address.lat', user.address.lat, 'user.address.lng', user.address.lng);
  }
  const [places, setPlaces] = useState<Place[]>([]);
  const [origin, setOrigin] = useState('');
  const [originId, setOriginId] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [mode, setMode] = useState('car');
  const [originCoord, setOriginCoord] = useState<[number, number] | null>(null);
  const [destCoord, setDestCoord] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [cost, setCost] = useState(0);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.7563, 100.5018]); // Default: Bangkok
  const [isRouteCalculated, setIsRouteCalculated] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Autocomplete states
  const [originSuggestions, setOriginSuggestions] = useState<Place[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Place[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // เพิ่ม myHomeOption ถ้ามี user.address
  const myHomeOption = user && user.address && typeof user.address.lat === 'number' && typeof user.address.lng === 'number'
    ? [{
        id: 'my-home',
        name: 'บ้านของฉัน',
        coordinates: { lat: user.address.lat, lng: user.address.lng },
        address: `${user.address.addressLine || ''}${user.address.city ? ', ' + user.address.city : ''}${user.address.province ? ', ' + user.address.province : ''}${user.address.zipcode ? ', ' + user.address.zipcode : ''}${user.address.country ? ', ' + user.address.country : ''}`
      }]
    : [];

  const [showModeWarning, setShowModeWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState<string | null>(null);

  // ฟังก์ชันสำหรับ handle mode change
  const handleModeChange = (modeKey: string) => {
    if (["bus", "train", "plane"].includes(modeKey)) {
      setPendingMode(modeKey);
      setShowModeWarning(true);
    } else {
      setMode(modeKey);
    }
  };
  const handleAcceptWarning = () => {
    if (pendingMode) setMode(pendingMode);
    setShowModeWarning(false);
    setPendingMode(null);
  };

  useEffect(() => {
    axios.get('/api/places')
      .then(res => {
        setPlaces(res.data.places || []);
        console.log('places from API:', res.data.places);
      });
  }, []);

  useEffect(() => {
    let oCoord: [number, number] | null = null;
    let dCoord: [number, number] | null = null;
    if (originId === 'my-home' && user?.address) {
      oCoord = [user.address.lat, user.address.lng];
    } else {
    const o = places.find(p => getPlaceId(p) === originId);
      const coord = o ? getPlaceCoordinates(o) : null;
      if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
        oCoord = [coord.lat, coord.lng];
      } else {
        oCoord = null;
      }
    }
    if (destinationId === 'my-home' && user?.address) {
      dCoord = [user.address.lat, user.address.lng];
    } else {
    const d = places.find(p => getPlaceId(p) === destinationId);
      const coord = d ? getPlaceCoordinates(d) : null;
      if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
        dCoord = [coord.lat, coord.lng];
      } else {
        dCoord = null;
      }
    }
    setOriginCoord(oCoord);
    setDestCoord(dCoord);
    if (oCoord) setMapCenter(oCoord);
  }, [originId, destinationId, places, user]);

  useEffect(() => {
    const getRoute = async () => {
      setErrorMsg('');
      // DEBUG: log origin/dest coords
      console.log('DEBUG: originCoord', originCoord, 'destCoord', destCoord);
      if (originCoord && destCoord) {
        setLoadingRoute(true);
        try {
          const coords = await fetchRoute(originCoord, destCoord, mode);
          setRouteCoords(coords);
          const dist = haversine(originCoord[0], originCoord[1], destCoord[0], destCoord[1]);
          setDistance(dist);
          setDuration(dist * (mode === 'car' ? 2 : mode === 'bus' ? 3 : mode === 'train' ? 2.5 : 1));
          setCost(calculateCost(mode, originCoord, destCoord));
          setIsRouteCalculated(true);
        } catch (error: any) {
          setErrorMsg('ไม่สามารถดึงเส้นทางถนนจริงจาก ORS API ได้ กรุณาตรวจสอบ API Key, พิกัด, หรืออินเทอร์เน็ต\n' + (error?.message || ''));
          setRouteCoords([]);
          setIsRouteCalculated(false);
          // DEBUG: log error
          console.error('DEBUG: ORS API error', error);
        } finally {
          setLoadingRoute(false);
        }
      } else {
        setRouteCoords([]);
        setCost(0);
        setDistance(0);
        setDuration(0);
        setIsRouteCalculated(false);
        if (origin && destination) setErrorMsg('ไม่พบข้อมูลพิกัดของสถานที่ที่เลือก (origin/destination)');
        // DEBUG: log missing coords
        if (!originCoord) console.warn('DEBUG: originCoord is missing or invalid', originCoord);
        if (!destCoord) console.warn('DEBUG: destCoord is missing or invalid', destCoord);
      }
    };
    getRoute();
  }, [originCoord, destCoord, mode]);

  // Autocomplete handlers
  const handleOriginInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrigin(value);
    setOriginId('');
    let filtered = [
      ...myHomeOption,
      ...places.filter(p => typeof getPlaceName(p) === 'string' && getPlaceName(p).trim() !== '')
    ];
    if (value.length > 0) {
      filtered = filtered.filter(p => getPlaceName(p).toLowerCase().includes(value.toLowerCase()) || (p.name === 'บ้านของฉัน' && 'บ้านของฉัน'.includes(value)));
    }
      setOriginSuggestions(filtered);
      setShowOriginDropdown(true);
  };
  const handleDestInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestination(value);
    setDestinationId('');
    let filtered = [
      ...myHomeOption,
      ...places.filter(p => typeof getPlaceName(p) === 'string' && getPlaceName(p).trim() !== '')
    ];
    if (value.length > 0) {
      filtered = filtered.filter(p => getPlaceName(p).toLowerCase().includes(value.toLowerCase()) || (p.name === 'บ้านของฉัน' && 'บ้านของฉัน'.includes(value)));
    }
      setDestSuggestions(filtered);
      setShowDestDropdown(true);
  };
  const selectOrigin = (place: Place) => {
    setOrigin(getPlaceName(place));
    setOriginId(getPlaceId(place));
    setShowOriginDropdown(false);
    setOriginSuggestions([]);
    const coord = getPlaceCoordinates(place);
    if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
      setMapCenter([coord.lat, coord.lng]);
    }
    if (getPlaceId(place) === 'my-home' && user?.address) {
      setOrigin('บ้านของฉัน');
      setOriginId('my-home');
      setOriginCoord([user.address.lat, user.address.lng]);
    }
  };
  const selectDestination = (place: Place) => {
    setDestination(getPlaceName(place));
    setDestinationId(getPlaceId(place));
    setShowDestDropdown(false);
    setDestSuggestions([]);
    const coord = getPlaceCoordinates(place);
    if (coord && typeof coord.lat === 'number' && typeof coord.lng === 'number') {
      setMapCenter([coord.lat, coord.lng]);
    }
    if (getPlaceId(place) === 'my-home' && user?.address) {
      setDestination('บ้านของฉัน');
      setDestinationId('my-home');
      setDestCoord([user.address.lat, user.address.lng]);
    }
  };

  const handleCalculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!originId || !destinationId) {
      setErrorMsg('กรุณาเลือกสถานที่จากรายการแนะนำ');
      return;
    }
    setSelectedRoute(1);
    setIsRouteCalculated(true);
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
              <label>Origin</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={origin}
                  onChange={handleOriginInput}
                  onFocus={() => handleOriginInput({ target: { value: origin } } as any)}
                  onBlur={() => setTimeout(() => setShowOriginDropdown(false), 150)}
                  placeholder="Enter starting point"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    marginTop: '4px'
                  }}
                  autoComplete="off"
                />
                {showOriginDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 8,
                    zIndex: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    {originSuggestions.length > 0 ? originSuggestions.map(s => (
                      <div
                        key={getPlaceId(s)}
                        style={{ padding: 10, cursor: 'pointer' }}
                        onMouseDown={() => selectOrigin(s)}
                      >
                        {getPlaceName(s)}
                        {(
                          !getPlaceCoordinates(s) ||
                          typeof getPlaceCoordinates(s)?.lat !== 'number' ||
                          typeof getPlaceCoordinates(s)?.lng !== 'number'
                        ) && (
                          <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>(ไม่มีพิกัด)</span>
                        )}
                        {s.id === 'my-home' && <span style={{color:'#888',fontSize:12}}>({s.address})</span>}
                      </div>
                    )) : (
                      <div style={{ padding: 10, color: '#888' }}>ไม่พบสถานที่</div>
                    )}
                  </div>
                )}
              </div>
            </FormGroup>
            <FormGroup>
              <label>Destination</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={destination}
                  onChange={handleDestInput}
                  onFocus={() => handleDestInput({ target: { value: destination } } as any)}
                  onBlur={() => setTimeout(() => setShowDestDropdown(false), 150)}
                  placeholder="Enter destination"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    marginTop: '4px'
                  }}
                  autoComplete="off"
                />
                {showDestDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 8,
                    zIndex: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}>
                    {destSuggestions.length > 0 ? destSuggestions.map(s => (
                      <div
                        key={getPlaceId(s)}
                        style={{ padding: 10, cursor: 'pointer' }}
                        onMouseDown={() => selectDestination(s)}
                      >
                        {getPlaceName(s)}
                        {(
                          !getPlaceCoordinates(s) ||
                          typeof getPlaceCoordinates(s)?.lat !== 'number' ||
                          typeof getPlaceCoordinates(s)?.lng !== 'number'
                        ) && (
                          <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>(ไม่มีพิกัด)</span>
                        )}
                        {s.id === 'my-home' && <span style={{color:'#888',fontSize:12}}>({s.address})</span>}
                      </div>
                    )) : (
                      <div style={{ padding: 10, color: '#888' }}>ไม่พบสถานที่</div>
                    )}
                  </div>
                )}
              </div>
            </FormGroup>
            <FormGroup>
              <label>Transportation Mode</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {TRANSPORT_MODES.map(m => (
                  <button
                    key={m.key}
                    onClick={() => handleModeChange(m.key)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: mode === m.key ? '2px solid #2563eb' : '1px solid #ccc',
                      background: mode === m.key ? '#eff6ff' : '#fff',
                      color: '#222',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </FormGroup>
            <Button type="submit" fullWidth>
              Calculate Route
            </Button>
            {errorMsg && <div style={{ color: 'red', marginTop: 12 }}>{errorMsg}</div>}
          </RouteForm>

          {isRouteCalculated && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Route Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <strong>Distance:</strong> {distance.toFixed(1)} km
                </div>
                <div>
                  <strong>Duration:</strong> {duration.toFixed(0)} minutes
                </div>
                <div>
                  <strong>Cost:</strong> {cost.toFixed(0)} THB
                </div>
                <div>
                  <strong>Mode:</strong> {TRANSPORT_MODES.find(m => m.key === mode)?.label}
                </div>
              </div>
            </div>
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
            {/* บ้านของฉัน (มุดสีเขียว) */}
            {user?.address && typeof user.address.lat === 'number' && typeof user.address.lng === 'number' && (
              <Marker position={[user.address.lat, user.address.lng]} icon={homeIcon}>
                <Popup>บ้านของฉัน</Popup>
              </Marker>
            )}
            {/* Origin (มุดปกติ) */}
            {originCoord && <Marker position={originCoord}><Popup>Origin: {origin}</Popup></Marker>}
            {/* Destination (มุดปกติ) */}
            {destCoord && <Marker position={destCoord}><Popup>Destination: {destination}</Popup></Marker>}
            {/* เส้นทาง */}
            {routeCoords.length > 1 && <Polyline positions={routeCoords} color="#2563eb" weight={5} />}
          </MapContainer>
          {loadingRoute && <div style={{ textAlign: 'center', marginTop: 8 }}>กำลังคำนวณเส้นทาง...</div>}
        </MapWrapper>
      </RouteContainer>
      {/* Popup แจ้งเตือนโหมด Bus/Train/Plane */}
      {showModeWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            maxWidth: 420,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            textAlign: 'center',
          }}>
            <h3 style={{ marginBottom: 16, color: '#eab308' }}>หมายเหตุสำหรับโหมด {pendingMode === 'bus' ? 'รถโดยสาร' : pendingMode === 'train' ? 'รถไฟ' : 'เครื่องบิน'}</h3>
            <div style={{ color: '#444', fontSize: 16, marginBottom: 20, textAlign: 'left' }}>
              เส้นทางที่แสดงสำหรับโหมดรถโดยสาร, รถไฟ, หรือเครื่องบิน เป็นเพียงเส้นตรงโดยประมาณเท่านั้น<br />
              ผลลัพธ์อาจไม่ตรงกับเส้นทางจริง กรุณาตรวจสอบข้อมูลเส้นทาง ตารางเวลา และราคากับผู้ให้บริการโดยตรง<br /><br />
              <b>ตัวอย่างแหล่งข้อมูล:</b><br />
              - รถเมล์: <a href="https://viabus.co" target="_blank" rel="noopener noreferrer">ViaBus</a>, <a href="https://www.bmta.co.th" target="_blank" rel="noopener noreferrer">ขสมก.</a><br />
              - รถไฟ: <a href="https://www.railway.co.th" target="_blank" rel="noopener noreferrer">การรถไฟแห่งประเทศไทย</a><br />
              - เครื่องบิน: <a href="https://www.skyscanner.co.th" target="_blank" rel="noopener noreferrer">Skyscanner</a>, <a href="https://www.traveloka.com" target="_blank" rel="noopener noreferrer">Traveloka</a>
            </div>
            <button
              onClick={handleAcceptWarning}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ยอมรับ
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default RoutePlanner;