import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Star, Filter, ChevronDown, ChevronUp, Image, UserCircle, Heart, Share2, MoreHorizontal, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { reviewsAPI } from '../services/api';
import { placesAPI } from '../services/api';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

// Types
interface User {
  id: string;
  name: string;
  username?: string;
  image?: string;
}

interface Place {
  id: string;
  name: string;
}

interface Comment {
  id: string;
  user_id: string;
  username: string;
  text: string;
  likes: number;
  liked_by?: string[];
  createdAt: string;
}

interface Review {
  id: string;
  user_id: string;
  username: string;
  place_id: string;
  place_name?: string;
  rating: number;
  comment: string;
  likes: number;
  comments: Comment[];
  createdAt: string;
  images?: ReviewImage[];
  liked_by?: string[];
}

interface ReviewImage {
  id: string;
  filename: string;
  path: string;
  createdAt: string;
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

const ReviewsContainer = styled.div``;

const FilterSection = styled.div`
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-wrap: nowrap;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FilterLabel = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.neutral[700]};
`;

const SortDropdown = styled.div`
  position: relative;
`;

const SortButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.neutral[700]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[50]};
  }
`;

const SortMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  width: 12rem;
  z-index: 10;
  overflow: hidden;
`;

const SortMenuItem = styled.button<{ isActive: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[50] : 'white'};
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[700] : theme.colors.neutral[700]};
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background-color: ${({ isActive, theme }) =>
      isActive ? theme.colors.primary[50] : theme.colors.neutral[50]};
  }
`;

const StarFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StarButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[50] : 'white'};
  border: 1px solid ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[500] : theme.colors.neutral[200]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 0.875rem;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[700] : theme.colors.neutral[700]};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ isActive, theme }) =>
      isActive ? theme.colors.primary[50] : theme.colors.neutral[50]};
  }
`;

const SearchBox = styled.div`
  flex: 1;
  max-width: 24rem;
`;

const ReviewsList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ReviewCard = styled(Card)`
  display: flex;
  flex-direction: column;
`;

const ReviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ReviewAuthor = styled.div``;

const AuthorName = styled.h4`
  font-size: 1.125rem;
  margin-bottom: 0.25rem;
`;

const ReviewDate = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.neutral[500]};
`;

const ReviewRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${({ theme }) => theme.colors.accent[500]};
`;

const ReviewContent = styled.div``;

const ReviewText = styled.p`
  margin-bottom: 1.5rem;
`;

const ReviewRoute = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.neutral[600]};
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral[100]};
`;

const ReviewImages = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  margin: 1rem 0;
  
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

const ReviewImage = styled.img`
  width: 6rem;
  height: 6rem;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radii.md};
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
`;

const PageButton = styled.button<{ isActive?: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[600] : 'white'};
  color: ${({ isActive, theme }) =>
    isActive ? 'white' : theme.colors.neutral[700]};
  border: 1px solid ${({ isActive, theme }) =>
    isActive ? theme.colors.primary[600] : theme.colors.neutral[200]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ isActive, theme }) =>
      isActive ? theme.colors.primary[700] : theme.colors.neutral[50]};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WriteReviewSection = styled.div`
  margin-top: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const ReviewForm = styled.form`
  max-width: 48rem;
  margin: 0 auto;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: inherit;
  font-size: 0.9375rem;
  min-height: 10rem;
  resize: vertical;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

const RatingSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const RatingStar = styled.button<{ isActive: boolean }>`
  padding: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ isActive, theme }) =>
    isActive ? theme.colors.accent[500] : theme.colors.neutral[300]};
  font-size: 1.5rem;
  line-height: 1;
  transition: ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    color: ${({ theme }) => theme.colors.accent[500]};
  }
`;

const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.neutral[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.neutral[700]};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.neutral[50]};
  }
  
  input {
    display: none;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
`;

const LIMIT = 10;

// เพิ่มฟังก์ชัน map id แบบ RoutePlanner
const getPlaceId = (p: any) => p._id || p.place_id || p.PlaceID || p.id || '';

// เพิ่ม helper function ตรวจสอบว่า user กด like review นี้หรือยัง
const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user._id || '';
  } catch {
    return '';
  }
};

const Reviews = () => {
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [rating, setRating] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const loaderRef = useRef<HTMLDivElement>(null);
  const [showWrite, setShowWrite] = useState(false);
  const [places, setPlaces] = useState<{id: string, name: string}[]>([]);
  const [selectedPlace, setSelectedPlace] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [posting, setPosting] = useState(false);
  const [placeInput, setPlaceInput] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<{id: string, name: string}[]>([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [userId, setUserId] = useState<string>('');

  // Fetch reviews (infinite scroll)
  useEffect(() => {
    fetchReviews(1, true);
    // eslint-disable-next-line
  }, [starFilter, sortOption, searchTerm]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          fetchReviews(page + 1);
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loaderRef.current, page, loading, hasMore]);

  useEffect(() => {
    // ดึงสถานที่ทั้งหมดสำหรับ dropdown
    async function fetchPlaces() {
      try {
        const res = await placesAPI.getPlaces();
        console.log('DEBUG: PLACES API RESPONSE', res.data);
        setPlaces(
          (res.data.places || []).map((p: any) => ({
            id: p._id?.$oid || p._id || p.place_id || p.id || '',
            name: p.name || p.Name
          }))
        );
      } catch (e) {
        setPlaces([]);
      }
    }
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (!placeInput) {
      setPlaceSuggestions(places);
    } else {
      setPlaceSuggestions(
        places.filter(p => p.name.toLowerCase().includes(placeInput.toLowerCase()))
      );
    }
  }, [placeInput, places]);

  useEffect(() => {
    if (places.length > 0) {
      fetchReviews(1, true);
    }
    // eslint-disable-next-line
  }, [places]);

  useEffect(() => {
    setUserId(getCurrentUserId());
  }, []);

  const fetchReviews = async (pageToFetch = 1, reset = false) => {
    setLoading(true);
    setError('');
    try {
      // Optionally pass filter/sort/search to backend
      const params: any = { page: pageToFetch, limit: LIMIT };
      if (starFilter) params.rating = starFilter;
      if (sortOption) params.sort = sortOption;
      if (searchTerm) params.q = searchTerm;
      const res = await reviewsAPI.getReviews(params.page, params.limit, params.sort, 'desc');
      let newReviews = (res.data.reviews || []) as Review[];
      setReviews(prev => reset ? newReviews : [...prev, ...newReviews]);
      setPage(pageToFetch);
      setHasMore(newReviews.length === LIMIT);
      console.log('DEBUG: Reviews mapped', newReviews);
    } catch (e: any) {
      setError(e.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // (Optional) filter/sort/search client-side if backend doesn't support
  let filteredReviews = reviews;
  // ... (สามารถเพิ่ม filter/sort client-side ได้ถ้าต้องการ)

  // Modified handlePostReview to include image upload
  const handlePostReview = async () => {
    console.log('DEBUG: handlePostReview called');
    console.log('selectedPlace:', selectedPlace);
    console.log('places:', places);
    const selectedPlaceObj = places.find(p => p.id === selectedPlace);
    if (!selectedPlace || !selectedPlaceObj) {
      toast.error('กรุณาเลือกสถานที่จากรายการ');
      console.log('DEBUG: Invalid selectedPlace:', selectedPlace);
      return;
    }
    if (!reviewRating) {
      toast.error('กรุณาให้คะแนน');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('กรุณากรอกข้อความรีวิว');
      return;
    }

    setPosting(true);
    try {
      // 1. สร้างรีวิว
      console.log('DEBUG: Creating review', {
        placeId: selectedPlace,
        placeName: selectedPlaceObj.name,
        rating: reviewRating,
        comment: reviewText,
      });
      const response = await reviewsAPI.createReview({
        placeId: selectedPlace,
        placeName: selectedPlaceObj.name,
        rating: reviewRating,
        comment: reviewText,
      });
      console.log('DEBUG: createReview response', response);

      if (!response.data || !response.data.id) {
        console.log('DEBUG: Invalid response from createReview', response.data);
        throw new Error('ไม่สามารถสร้างรีวิวได้');
      }

      // 3. ดึงรีวิวใหม่ทั้งหมด (refresh)
      await fetchReviews(1, true);

      // 4. Reset & ปิด popup
      setShowWrite(false);
      setSelectedPlace('');
      setPlaceInput('');
      setReviewText('');
      setReviewRating(0);
      toast.success('โพสต์รีวิวสำเร็จ!');
      console.log('DEBUG: Review post success, form reset');
    } catch (e: any) {
      console.error('Error posting review:', e);
      toast.error(e.response?.data?.error || e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setPosting(false);
      console.log('DEBUG: setPosting(false)');
    }
  };

  // Like review (toggle)
  const handleLikeReview = async (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const likedBy = r.liked_by || [];
      const liked = likedBy.includes(userId);
      return {
        ...r,
        likes: liked ? r.likes - 1 : r.likes + 1,
        liked_by: liked ? likedBy.filter((id: string) => id !== userId) : [...likedBy, userId],
      };
    }));
    try {
      await reviewsAPI.toggleLike(reviewId);
    } catch {}
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Traveler Reviews</PageTitle>
        <PageDescription>
          Read authentic reviews from fellow travelers to make informed decisions 
          about routes and services. Share your own experiences to help others.
        </PageDescription>
      </PageHeader>
      <ReviewsContainer>
        <FilterSection>
          <FilterGroup>
            <FilterLabel>Filter:</FilterLabel>
            <StarFilter>
              {[5, 4, 3, 2, 1].map(stars => (
                <StarButton
                  key={stars}
                  isActive={starFilter === stars}
                  onClick={() => setStarFilter(stars)}
                >
                  <Star size={16} fill={starFilter === stars ? 'currentColor' : 'none'} />
                  {stars}
                </StarButton>
              ))}
            </StarFilter>
          </FilterGroup>
          <SearchBox>
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
          </SearchBox>
          <SortDropdown>
            <SortButton onClick={() => setShowSortMenu(!showSortMenu)}>
              <Filter size={16} />
              Sort: {sortOption === 'newest' ? 'Newest' : 
                     sortOption === 'oldest' ? 'Oldest' :
                     sortOption === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
              {showSortMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </SortButton>
            {showSortMenu && (
              <SortMenu
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SortMenuItem isActive={sortOption === 'newest'} onClick={() => setSortOption('newest')}>Newest First</SortMenuItem>
                <SortMenuItem isActive={sortOption === 'oldest'} onClick={() => setSortOption('oldest')}>Oldest First</SortMenuItem>
                <SortMenuItem isActive={sortOption === 'highest'} onClick={() => setSortOption('highest')}>Highest Rated</SortMenuItem>
                <SortMenuItem isActive={sortOption === 'lowest'} onClick={() => setSortOption('lowest')}>Lowest Rated</SortMenuItem>
              </SortMenu>
            )}
          </SortDropdown>
        </FilterSection>
        {/* Write Review Box (moved here) */}
        <div style={{ maxWidth: 600, minWidth: 400, width: '100%', margin: '0 auto', marginBottom: 32 }}>
          {!showWrite ? (
            <div
              style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)', padding: 28, display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer' }}
              onClick={() => setShowWrite(true)}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, color: '#6366f1' }}>
                <UserCircle size={38} />
              </div>
              <div style={{ flex: 1, color: '#888', fontSize: 20 }}>แชร์ประสบการณ์การเดินทางของคุณ...</div>
              <Button variant="primary" style={{ background: '#a5b4fc', color: '#fff', fontWeight: 600, fontSize: 18, padding: '10px 24px' }}>เขียนรีวิว</Button>
            </div>
          ) : (
            <div style={{
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)',
              padding: 32,
              position: 'relative',
              maxWidth: 600,
              minWidth: 400,
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}>
              <button onClick={() => setShowWrite(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
              <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 10 }}>แชร์เรื่องราวการเดินทาง</div>
              <div style={{ color: '#888', fontSize: 16, marginBottom: 18 }}>บอกเล่าประสบการณ์ให้เพื่อนๆ ฟัง</div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={placeInput}
                    onChange={e => {
                      setPlaceInput(e.target.value);
                      setShowPlaceDropdown(true);
                      setSelectedPlace('');
                    }}
                    onFocus={() => setShowPlaceDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPlaceDropdown(false), 150)}
                    placeholder="คุณไปเที่ยวที่ไหนมา?"
                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 17 }}
                  />
                  {showPlaceDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 8,
                      zIndex: 10,
                      maxHeight: 220,
                      overflowY: 'auto',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      {placeSuggestions.length > 0 ? placeSuggestions.map(p => (
                        <div
                          key={p.id}
                          style={{ padding: 12, cursor: 'pointer', fontSize: 16 }}
                          onMouseDown={() => {
                            setSelectedPlace(p.id);
                            setPlaceInput(p.name);
                            setShowPlaceDropdown(false);
                            console.log('DEBUG: Select place', p);
                          }}
                        >
                          {p.name}
                        </div>
                      )) : (
                        <div style={{ padding: 12, color: '#888' }}>ไม่พบสถานที่</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 16 }}>ให้คะแนนสถานที่นี้</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1,2,3,4,5].map(i => (
                    <button key={i} type="button" onClick={() => setReviewRating(i)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Star size={32} fill={reviewRating >= i ? '#facc15' : 'none'} color="#facc15" />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder="เล่าให้ฟังหน่อยว่าที่นี่เป็นยังไงบ้าง? อาหารอร่อยไหม? ที่พักดีไหม? มีอะไรน่าสนใจบ้าง..."
                  style={{ width: '100%', minHeight: 90, borderRadius: 8, border: '1px solid #e5e7eb', padding: 12, fontSize: 17, resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" style={{ background: '#a5b4fc', color: '#fff', fontWeight: 600, minWidth: 130, fontSize: 17, padding: '10px 0', width: 160 }} onClick={handlePostReview} disabled={posting}>
                  {posting ? 'กำลังโพสต์...' : 'โพสต์รีวิว'}
                </Button>
              </div>
            </div>
          )}
        </div>
        {/* Feed Reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', margin: '0 auto', maxWidth: 600 }}>
          {filteredReviews.map((review, idx) => {
            const isLiked = Array.isArray(review.liked_by) && review.liked_by.includes(userId);
            // ฟังก์ชัน normalize id เพื่อเปรียบเทียบ id ที่อาจมีรูปแบบต่างกัน
            const normalizeId = (id: string) => id?.toString()?.toLowerCase()?.replace(/[^a-z0-9]/gi, '');
            // ฟังก์ชันตรวจสอบว่า string เป็น id (24 ตัวอักษร hex) หรือไม่
            const isIdString = (str: string) => /^[a-f0-9]{24}$/i.test(str);
            // logic แสดงชื่อสถานที่
            let placeName = '';
            if (review.place_name && !isIdString(review.place_name)) {
              placeName = review.place_name;
            } else if (places.length > 0) {
              const found = places.find(p => normalizeId(p.id) === normalizeId(review.place_id));
              if (found) placeName = found.name;
            }
            return (
              <div key={review.id} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.06)', padding: 24, position: 'relative' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, color: '#6366f1' }}>
                    <UserCircle size={36} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{review.username || 'Unknown'}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>@{review.username?.toLowerCase().replace(/\s/g, '_') || 'user'}</div>
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{review.createdAt ? new Date(review.createdAt).toLocaleString() : ''}</div>
                  <MoreHorizontal size={20} style={{ color: '#9ca3af', marginLeft: 8 }} />
                </div>
                {/* Location/Place */}
                <div style={{ marginBottom: 8 }}>
                  {placeName ? (
                    <span style={{ background: '#eef2ff', color: '#6366f1', fontSize: 13, borderRadius: 8, padding: '2px 10px', fontWeight: 500 }}>
                      {placeName}
                    </span>
                  ) : (
                    <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: 13, borderRadius: 8, padding: '2px 10px', fontWeight: 500 }}>
                      ไม่พบชื่อสถานที่
                    </span>
                  )}
                </div>
                {/* Review text */}
                <div style={{ fontSize: 16, marginBottom: 10 }}>{review.comment}</div>
                {/* Rating & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill={i < (review.rating || 0) ? '#facc15' : 'none'} color="#facc15" />
                    ))}
                    <span style={{ fontWeight: 600, color: '#f59e42', marginLeft: 4 }}>{review.rating}/5</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isLiked ? '#ef4444' : '#aaa', cursor: 'pointer' }} onClick={() => handleLikeReview(review.id)}>
                      <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />{review.likes}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {loading && <div style={{ textAlign: 'center', color: '#888', margin: 24 }}>Loading...</div>}
          {error && <div style={{ textAlign: 'center', color: 'red', margin: 24 }}>{error}</div>}
          <div ref={loaderRef} style={{ height: 1 }} />
          {!hasMore && !loading && <div style={{ textAlign: 'center', color: '#888', margin: 24 }}>No more reviews</div>}
        </div>
      </ReviewsContainer>
    </PageContainer>
  );
};

export default Reviews;