import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Map, DollarSign, Star, Route } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { reviewsAPI } from '../services/api';

// เพิ่มตัวแปรสำหรับ URL รูปภาพ
const HERO_BACKGROUND_IMAGE = 'https://www.ananda.co.th/blog/thegenc/wp-content/uploads/2024/03/%E0%B8%94%E0%B8%B5%E0%B9%84%E0%B8%8B%E0%B8%99%E0%B9%8C%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%B1%E0%B8%87%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B9%84%E0%B8%94%E0%B9%89%E0%B8%95%E0%B8%B1%E0%B9%89%E0%B8%87%E0%B8%8A%E0%B8%B7%E0%B9%88%E0%B8%AD-2024-05-23T123322.980.png';

const HeroSection = styled.section`
  position: relative;
  height: 85vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  overflow: hidden;
  margin: -2rem -2rem 0;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 90vh;
  }
`;

const HeroBg = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${HERO_BACKGROUND_IMAGE});
  background-size: cover;
  background-position: center;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.5),
      rgba(0, 0, 0, 0.7)
    );
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 10;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
  color: white;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 2.5rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  margin-bottom: 1.5rem;
  max-width: 36rem;
  color: white;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 3.5rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.125rem;
  margin-bottom: 2.5rem;
  max-width: 32rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1.25rem;
  }
`;

const HeroButtons = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const FeaturesSection = styled.section`
  max-width: 1280px;
  margin: 5rem auto;
  padding: 0 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 1.125rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.neutral[600]};
  max-width: 36rem;
  margin: 0 auto 4rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const FeatureCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const FeatureIconWrapper = styled.div`
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary[50]};
  color: ${({ theme }) => theme.colors.primary[600]};
  border-radius: ${({ theme }) => theme.radii.full};
  margin-bottom: 1.5rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.neutral[600]};
  margin-bottom: 1.5rem;
`;

const CtaSection = styled.section`
  background-color: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  padding: 5rem 1rem;
  margin: 5rem -2rem -2rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 6rem 2rem;
  }
`;

const CtaContainer = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
`;

const CtaTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
`;

const CtaText = styled.p`
  font-size: 1.125rem;
  max-width: 36rem;
  margin: 0 auto 2.5rem;
`;

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredPlaces, setFeaturedPlaces] = useState<any[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [locations, setLocations] = useState<{[key: string]: string}>({});
  const [latestReviews, setLatestReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (user) {
      setLoadingPlaces(true);
      // ดึง location map
      axios.get(`${import.meta.env.VITE_API_URL}/api/locations`)
        .then(res => {
          const locationsData = res.data.locations || [];
          const locationMap: {[key: string]: string} = {};
          locationsData.forEach((loc: any) => {
            locationMap[loc.location_id || loc.LocationID] = loc.name || loc.Name;
          });
          setLocations(locationMap);
        });
      // ดึง place
      axios.get(`${import.meta.env.VITE_API_URL}/api/places`)
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : res.data.places || res.data.data || [];
          setFeaturedPlaces(data.slice(0, 3));
        })
        .catch(() => setFeaturedPlaces([]))
        .finally(() => setLoadingPlaces(false));
    }
  }, [user]);

  useEffect(() => {
    // ดึง 3 รีวิวล่าสุด (ไม่ต้อง login ก็เห็นได้)
    setLoadingReviews(true);
    reviewsAPI.getReviews(1, 3, 'newest', 'desc')
      .then(res => {
        const data = res.data.reviews || [];
        setLatestReviews(data);
      })
      .catch(() => setLatestReviews([]))
      .finally(() => setLoadingReviews(false));
  }, []);

  if (!user) {
  return (
    <>
      <HeroSection>
        <HeroBg />
        <HeroContent>
          <HeroTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Travel Smarter, Journey Smoother
          </HeroTitle>
          <HeroSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            วางแผนการเดินทางของคุณอย่างง่ายดาย ประเมินค่าใช้จ่ายได้แม่นยำ
            และตัดสินใจได้อย่างมั่นใจด้วย GoSmooth
          </HeroSubtitle>
          <HeroButtons
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              as={Link}
              to="/route-planner"
              size="lg"
            >
              Plan Your Route
            </Button>
            <Button
              as={Link}
              to="/register"
              variant="outline"
              size="lg"
              style={{ borderColor: 'white', color: 'white' }}
            >
              Sign Up Free
            </Button>
          </HeroButtons>
        </HeroContent>
      </HeroSection>

      <FeaturesSection>
        <SectionTitle>Why Choose GoSmooth?</SectionTitle>
        <SectionSubtitle>
          GoSmooth ช่วยให้การวางแผนท่องเที่ยวของคุณเป็นเรื่องง่าย สะดวก และมั่นใจ ด้วยเครื่องมือครบครันสำหรับค้นหาเส้นทางและอ่านรีวิวจากนักเดินทางจริง
        </SectionSubtitle>

        <FeaturesGrid>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureCard variant="elevated">
              <FeatureIconWrapper>
                <Route size={28} />
              </FeatureIconWrapper>
              <FeatureTitle>Smart Route Planning</FeatureTitle>
              <FeatureDescription>
                วางแผนเส้นทางเดินทางที่เหมาะสมที่สุด พร้อมเปรียบเทียบตัวเลือกและข้อมูลจราจรแบบเรียลไทม์
              </FeatureDescription>
              <Button
                as={Link}
                to="/route-planner"
                variant="ghost"
                style={{ marginTop: 'auto' }}
              >
                วางแผนเลย
              </Button>
            </FeatureCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureCard variant="elevated">
              <FeatureIconWrapper>
                <DollarSign size={28} />
              </FeatureIconWrapper>
              <FeatureTitle>Flexible Route Options</FeatureTitle>
              <FeatureDescription>
                เลือกเส้นทางและวิธีเดินทางที่หลากหลาย ให้เหมาะกับไลฟ์สไตล์และความต้องการของคุณ
              </FeatureDescription>
              <Button
                as={Link}
                to="/route-planner"
                variant="ghost"
                style={{ marginTop: 'auto' }}
              >
                วางแผนเลย
              </Button>
            </FeatureCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <FeatureCard variant="elevated">
              <FeatureIconWrapper>
                <Star size={28} />
              </FeatureIconWrapper>
              <FeatureTitle>Trusted Reviews</FeatureTitle>
              <FeatureDescription>
                อ่านรีวิวสถานที่จริงจากนักเดินทาง เพื่อประกอบการตัดสินใจเลือกเส้นทางและจุดหมายปลายทาง
              </FeatureDescription>
              <Button
                as={Link}
                to="/reviews"
                variant="ghost"
                style={{ marginTop: 'auto' }}
              >
                อ่านรีวิว
              </Button>
            </FeatureCard>
          </motion.div>
        </FeaturesGrid>
      </FeaturesSection>

      <CtaSection>
        <CtaContainer>
          <CtaTitle>พร้อมเดินทางอย่างชาญฉลาดไปกับ GoSmooth หรือยัง?</CtaTitle>
          <CtaText>
            เข้าร่วมกับนักเดินทางมากมายที่เลือกใช้ GoSmooth ในการวางแผนทริป ค้นหาเส้นทาง และประเมินค่าใช้จ่าย สมัครสมาชิกฟรีวันนี้ แล้วสัมผัสประสบการณ์ใหม่ในการเดินทางของคุณ
          </CtaText>
          <Button
            as={Link}
            to="/register"
            size="lg"
            variant="secondary"
          >
            Get Started for Free
          </Button>
        </CtaContainer>
      </CtaSection>
      </>
    );
  }

  // --- แบบ Login แล้ว ---
  return (
    <>
      <HeroSection>
        <HeroBg />
        <HeroContent>
          <HeroTitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Travel Smarter, Journey Smoother
          </HeroTitle>
          <HeroSubtitle
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            วางแผนการเดินทางของคุณอย่างง่ายดาย ประเมินค่าใช้จ่ายได้
            และตัดสินใจได้อย่างมั่นใจด้วย GoSmooth
          </HeroSubtitle>
          <HeroButtons
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              as={Link}
              to="/route-planner"
              size="lg"
            >
              Plan Your Route
            </Button>
          </HeroButtons>
        </HeroContent>
      </HeroSection>

      {/* Featured Destinations */}
      <FeaturesSection>
        <SectionTitle>
          Featured <span style={{ color: '#6366f1' }}>Destinations</span>
        </SectionTitle>
        <SectionSubtitle>
          Discover amazing places around the world
        </SectionSubtitle>
        {loadingPlaces ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
        ) : featuredPlaces.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>No featured places found or failed to load places.</div>
        ) : (
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {featuredPlaces.map((place) => (
              <div key={place.place_id || place.PlaceID || place.id} style={{ width: 300, cursor: 'pointer' }} onClick={() => navigate(`/places/${place.place_id || place.PlaceID || place.id}`)}>
                <Card interactive padding="none">
                  <img
                    src={place.CoverImage ? `${import.meta.env.VITE_API_URL}/uploads/${place.CoverImage}` : 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                    alt={place.Name || place.name}
                    style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }}
                  />
                  <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{place.Name || place.name}</div>
                    <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
                      {locations[place.location_id || place.LocationID] || 'Unknown Location'}
                    </div>
                    <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{place.Description || place.description}</div>
                    <Button as={Link} to={`/places/${place.place_id || place.PlaceID || place.id}`} size="sm" style={{ marginTop: 8 }}>
                      Explore
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Button as={Link} to="/places" size="lg" variant="secondary">
            View All
          </Button>
        </div>
      </FeaturesSection>

      {/* What Our Users Say */}
      <section style={{ background: '#6366f1', color: 'white', padding: '4rem 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>รีวิวสถานที่จากผู้ใช้งาน</h2>
          <p style={{ fontSize: 18, marginBottom: 40 }}>
            ประสบการณ์จริงจากนักเดินทางที่ไปเยือนสถานที่ต่าง ๆ ด้วย GoSmooth
          </p>
          {loadingReviews ? (
            <div style={{ color: '#fff', fontSize: 18 }}>กำลังโหลดรีวิว...</div>
          ) : latestReviews.length === 0 ? (
            <div style={{ color: '#fff', fontSize: 18 }}>ยังไม่มีรีวิวจากผู้ใช้</div>
          ) : (
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
              {latestReviews.slice(0, 3).map((review, idx) => (
                <div key={review.id || idx} style={{ background: 'white', color: '#222', borderRadius: 16, padding: 24, minWidth: 280, maxWidth: 340, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textAlign: 'left' }}>
                  <div style={{ color: '#facc15', fontSize: 20, marginBottom: 8 }}>
                    {'★'.repeat(review.rating || 0)}
                  </div>
                  <div style={{ fontSize: 15, marginBottom: 8, fontWeight: 600, color: '#6366f1' }}>
                    {review.place_name ? `สถานที่: ${review.place_name}` : ''}
                  </div>
                  <div style={{ fontSize: 15, marginBottom: 12 }}>{review.comment}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span role="img" aria-label="user">👤</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{review.username || 'ผู้ใช้ไม่ระบุชื่อ'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Home;