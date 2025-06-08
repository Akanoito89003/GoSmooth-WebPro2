import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaRoute, FaHeart, FaRegHeart, FaShareAlt, FaMoneyBillWave, FaPhone, FaGlobe, FaClock, FaInfo } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ReactStars from 'react-stars';
import { Place, Review } from '../types/place';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { UserCircle, Heart, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { reviewsAPI } from '../services/api';
import { LuFlag, LuMapPin } from 'react-icons/lu';
import { toast } from 'react-hot-toast';
import ReviewOptionsMenu from '../components/ui/ReviewOptionsMenu';
import ReportReviewModal from '../components/ui/ReportReviewModal';
import styled from 'styled-components';

const API_URL = import.meta.env.VITE_API_URL;

interface UserReview {
  rating: number;
  comment: string;
}

const SuccessModal = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const SuccessContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  text-align: center;
`;

const SuccessIcon = styled.div`
  color: #22c55e;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
`;

const SuccessMessage = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 24px;
`;

const PlaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userReview, setUserReview] = useState<UserReview>({ rating: 0, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);
  const [pendingReview, setPendingReview] = useState<{
    rating: number;
    comment: string;
  } | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
  const [imgVersion, setImgVersion] = useState(Date.now());
  const [reportLoading, setReportLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchPlaceDetails(); }, [id]);

  // Debug API_URL
  console.log('[DEBUG] API_URL:', API_URL);

  useEffect(() => {
    if (place) {
      console.log('[DEBUG] Render Hero backgroundImage:', place.coverImage ? `${API_URL}/uploads/${place.coverImage}` : place.imageUrl[0]);
    }
  }, [place]);

  useEffect(() => {
    setImgVersion(Date.now());
  }, [place]);

  const fetchPlaceDetails = async () => {
    try {
      console.log('[DEBUG] PlaceDetailPage id:', id);
      const response = await axios.get(`${API_URL}/api/places/${id}`);
      console.log('[DEBUG] API response:', response.data);
      const p = response.data.place || response.data;
      const getPlaceId = (p: any) => (typeof p.place_id === 'string' && p.place_id) || (typeof p.PlaceID === 'string' && p.PlaceID) || (typeof p.id === 'string' && p.id) || '';
      const placeData: Place = {
        id: getPlaceId(p),
        name: p.name || p.Name,
        location: p.location || p.Location || p.address || p.Address || '',
        description: p.description || p.Description || '',
        longDescription: p.longDescription || p.LongDescription || p.description || p.Description || '',
        coverImage: p.coverImage || p.CoverImage || p.cover_image || '',
        imageUrl: Array.isArray(p.HighlightImages) ? p.HighlightImages : [],
        gallery: Array.isArray(p.HighlightImages) ? p.HighlightImages : [],
        rating: p.rating || p.Rating || 4.5,
        priceLevel: p.priceLevel || p.PriceLevel || 3,
        category: p.category || p.Category || 'attractions',
        coordinates: p.coordinates || p.Coordinates || { lat: 0, lng: 0 },
        tags: p.tags || (p.category ? [p.category] : []) || [],
        contact: {
          phone: p.phone || p.Phone || '',
          website: p.website || p.Website || '',
          hours: p.hours || p.Hours || '',
          address: p.address || p.Address || '',
        },
        phone: p.phone || p.Phone || '',
        website: p.website || p.Website || '',
        hours: p.hours || p.Hours || '',
        address: p.address || p.Address || '',
        highlights: p.highlights || [],
        reviews: p.reviews || [],
        nearbyPlaces: p.nearbyPlaces || [],
      };
      // Debug coverImage and url
      console.log('[DEBUG] coverImage:', placeData.coverImage);
      console.log('[DEBUG] coverImage url:', getImageUrl(placeData.coverImage));
      setPlace(placeData);
      setLoading(false);
    } catch (error) {
      console.error('[DEBUG] Error loading place details:', error);
      setError('Failed to load place details. Please try again later.');
      setLoading(false);
    }
  };

  const fetchReviews = async (placeIdToFetch?: string) => {
    try {
      if (!placeIdToFetch) return;
      const res = await api.get(`/api/reviews?placeId=${placeIdToFetch}`);
      setReviews(res.data.reviews || []);
      if (res.data.reviews && res.data.reviews.length > 0) {
        const avg = res.data.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / res.data.reviews.length;
        setRating(avg);
      } else {
        setRating(0);
      }
    } catch (e) {
      setReviews([]);
      setRating(0);
    }
  };

  useEffect(() => {
    const placeAny = place as any;
    if (placeAny && (placeAny.place_id || placeAny.PlaceID || placeAny.id)) {
      const placeIdToFetch = placeAny.place_id || placeAny.PlaceID || placeAny.id;
      fetchReviews(placeIdToFetch);
    }
  }, [place]);

  const toggleFavorite = async () => {
    if (!user) return;
    setIsFavorite(!isFavorite);
  };

  const handleReviewSubmit = () => {
    if (!user) return;
    if (reviewRating === 0) {
      alert('กรุณาให้คะแนน');
      return;
    }
    if (!reviewText.trim()) {
      alert('กรุณากรอกข้อความรีวิว');
      return;
    }
    // Show warning modal first
    setPendingReview({
      rating: reviewRating,
      comment: reviewText,
    });
    setShowWarning(true);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 2000); // ปิดอัตโนมัติหลัง 2 วินาที
  };

  const handleConfirmReview = async () => {
    if (!pendingReview || !place || !user) return;
    try {
      setIsSubmittingReview(true);
      const response = await reviewsAPI.createReview({
        placeId: place.id,
        placeName: place.name,
        rating: pendingReview.rating,
        comment: pendingReview.comment,
      });
      if (!response.data || !response.data.id) {
        throw new Error('ไม่สามารถสร้างรีวิวได้');
      }
      await fetchReviews(place.id);
      setReviewRating(0);
      setReviewText('');
      showSuccess('โพสต์รีวิวสำเร็จ!');
    } catch (error: any) {
      console.error('Error posting review:', error);
      toast.error(error.response?.data?.error || error.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmittingReview(false);
      setShowWarning(false);
      setPendingReview(null);
    }
  };

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

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await reviewsAPI.deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      showSuccess('ลบรีวิวสำเร็จ!');
    } catch (e) {
      console.error('Error deleting review:', e);
      toast.error('เกิดข้อผิดพลาดในการลบรีวิว');
    }
  };

  const getImageUrl = (img: string, version?: number) => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    const cleanImg = img.startsWith('/') ? img.slice(1) : img;
    const url = cleanImg.startsWith('uploads/') ? `${API_URL}/${cleanImg}` : `${API_URL}/uploads/${cleanImg}`;
    const finalUrl = version ? `${url}?v=${version}` : url;
    console.log('[DEBUG getImageUrl] img:', img, 'finalUrl:', finalUrl);
    return finalUrl;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Loading place details...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-container">
        <div className="card">
          <h2 className="text-2xl font-bold text-error-600 mb-4">Something went wrong</h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Link to="/places" className="btn btn-primary">Back to Places</Link>
        </div>
      </div>
    );
  }
  if (!place) {
    return (
      <div className="page-container">
        <div className="card">
          <h2 className="text-2xl font-bold text-neutral-800 mb-4">Place not found</h2>
          <p className="text-neutral-600 mb-6">The place you're looking for doesn't exist or has been removed.</p>
          <Link to="/places" className="btn btn-primary">Back to Places</Link>
        </div>
      </div>
    );
  }
  const heroBg = place.coverImage
    ? getImageUrl(place.coverImage, imgVersion)
    : (place.imageUrl && place.imageUrl.length > 0)
      ? getImageUrl(place.imageUrl[0], imgVersion)
      : '/default-cover.jpg';
  console.log('[DEBUG Hero backgroundImage]', heroBg);
  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="place-detail-hero" style={{ backgroundImage: `url(${heroBg})`, minHeight: '400px', height: '40vh', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div className="place-detail-hero-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 }}></div>
        <div className="container-custom px-6 pt-6" style={{ position: 'relative', zIndex: 2 }}>
          <div className="pb-8 md:pb-16 text-white max-w-3xl">
            <h1 className="place-detail-title text-white">{place.name}</h1>
            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <FaStar className="star-icon mr-1 text-white" />
                <span className="font-medium text-white">{rating.toFixed(1)}</span>
                <span className="text-white text-opacity-80 ml-1">({reviews.length} reviews)</span>
              </div>
              <div className="flex items-center mr-4">
                <FaMapMarkerAlt className="location-icon mr-1 text-white text-opacity-80" />
                <span className="text-white">{place.location}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {place.tags.map((tag, index) => (
                <span key={index} className="inline-block bg-white bg-opacity-20 text-white text-sm px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="container-custom py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* Action Buttons */}
            <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-center">
              {/* Find Route Button (Minimal, prominent, centered) */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0 18px 0' }}>
                <button
                  onClick={() => setShowRouteModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#e0f2fe',
                    color: '#2563eb',
                    fontWeight: 600,
                    fontSize: 16,
                    border: 'none',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px 0 rgba(30,64,175,0.07)',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    transition: 'background 0.18s',
                    outline: 'none',
                  }}
                  onMouseOver={e => e.currentTarget.style.background='#bae6fd'}
                  onMouseOut={e => e.currentTarget.style.background='#e0f2fe'}
                >
                  <FaRoute size={18} style={{ color: '#2563eb', marginBottom: -2 }} />
                  <span>Find Route to <span style={{ color: '#1e293b', fontWeight: 700 }}>{place.name}</span></span>
                </button>
              </div>
            </div>
            {/* Tabs Navigation */}
            <div className="card overflow-hidden mb-6">
              <div className="border-b border-neutral-200">
                <nav className="flex gap-6">
                  <button onClick={() => setActiveTab('overview')} className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}>Overview</button>
                  <button onClick={() => setActiveTab('photos')} className={`tab-button ${activeTab === 'photos' ? 'active' : ''}`}>Photos</button>
                  <button onClick={() => setActiveTab('reviews')} className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}>Reviews ({reviews.length})</button>
                </nav>
              </div>
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">About {place.name}</h2>
                    <p className="text-neutral-700 mb-6 whitespace-pre-line">{place.longDescription}</p>
                    <h3 className="text-xl font-bold mb-3">Highlights</h3>
                    <div className="mb-6">
                      {place.imageUrl && place.imageUrl.length > 0 ? (
                        <div className="flex gap-3 flex-wrap">
                          {place.imageUrl.slice(0, 5).map((img, idx) => (
                            <img
                              key={idx}
                              src={getImageUrl(img, imgVersion)}
                              alt={`Highlight ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded shadow border"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-sm">No highlights</span>
                      )}
                    </div>
                    {/* Map Preview */}
                    <h3 className="text-xl font-bold mb-3">Location</h3>
                    <div className="map-preview-container" style={{ height: 200, borderRadius: 12, overflow: 'hidden' }}>
                      {place.coordinates && place.coordinates.lat && place.coordinates.lng ? (
                        <MapContainer
                          center={[place.coordinates.lat, place.coordinates.lng]}
                          zoom={15}
                          style={{ height: '100%', width: '100%' }}
                          scrollWheelZoom={false}
                          dragging={false}
                          doubleClickZoom={false}
                          zoomControl={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[place.coordinates.lat, place.coordinates.lng]}>
                            <Popup>
                              {place.name}
                            </Popup>
                          </Marker>
                        </MapContainer>
                      ) : (
                        <div style={{ color: '#888', padding: 16 }}>No coordinates available</div>
                      )}
                    </div>
                  </div>
                )}
                {/* Photos Tab */}
                {activeTab === 'photos' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Photos</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {(place.gallery ?? []).map((photo, index) => (
                        <div key={index} className="rounded-lg overflow-hidden h-64">
                          <img
                            src={getImageUrl(photo, imgVersion)}
                            alt={`${place.name} - Photo ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Reviews</h2>
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <div className="bg-primary-100 text-primary-700 rounded-lg px-3 py-2 text-2xl font-bold mr-3">{rating.toFixed(1)}</div>
                          <div>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar key={star} className={star <= Math.round(rating) ? "text-accent-400" : "text-neutral-300"} />
                              ))}
                            </div>
                            <p className="text-neutral-500">Based on {reviews.length} reviews</p>
                          </div>
                        </div>
                      </div>
                      {/* Write a Review (เหมือน Reviews.tsx แต่ล็อก placeId) */}
                      {user && place && (
                        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                          <h3 className="font-medium mb-3">Write a Review</h3>
                          <div style={{ marginBottom: 18 }}>
                            <label style={{ color: '#666', fontSize: 16, marginBottom: 4, display: 'block' }}>สถานที่</label>
                            <input
                              type="text"
                              value={place.name}
                              readOnly
                              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#888', fontSize: 17 }}
                            />
                          </div>
                          <div style={{ marginBottom: 18 }}>
                            <div style={{ marginBottom: 8, color: '#666', fontSize: 16 }}>ให้คะแนนสถานที่นี้</div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {[1,2,3,4,5].map(i => (
                                <button key={i} type="button" onClick={() => setReviewRating(i)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                  <FaStar size={32} color={reviewRating >= i ? '#facc15' : '#e5e7eb'} />
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
                            <button
                              className="btn btn-primary"
                              onClick={handleReviewSubmit}
                              disabled={isSubmittingReview}
                              style={{ minWidth: 130, fontSize: 17, padding: '10px 0', width: 160 }}
                            >
                              {isSubmittingReview ? 'กำลังโพสต์...' : 'โพสต์รีวิว'}
                            </button>
                          </div>
                        </div>
                      )}
                      {!user && (
                        <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-center text-gray-500">
                          <span>เข้าสู่ระบบเพื่อเขียนรีวิว</span>
                          <button className="btn btn-primary ml-3" onClick={() => window.location.href = '/login'}>เข้าสู่ระบบ</button>
                        </div>
                      )}
                      {/* Warning Modal ภาษาไทย */}
                      {showWarning && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <div className="flex items-center gap-3 mb-4 text-yellow-600">
                              <AlertTriangle size={24} />
                              <h3 className="text-xl font-semibold">ข้อควรปฏิบัติในการรีวิว</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                              ก่อนโพสต์รีวิว กรุณาปฏิบัติตามข้อควรระวังดังต่อไปนี้:
                            </p>
                            <ul className="list-none space-y-2 mb-4">
                              <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span className="text-gray-600">ใช้ถ้อยคำสุภาพ หลีกเลี่ยงคำหยาบคายหรือดูหมิ่นผู้อื่น</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span className="text-gray-600">แบ่งปันประสบการณ์จริงและข้อมูลที่ถูกต้อง</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span className="text-gray-600">ห้ามโพสต์สแปมหรือเนื้อหาโฆษณา</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span className="text-gray-600">ห้ามเปิดเผยข้อมูลส่วนตัว</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span className="text-gray-600">ห้ามรีวิวเท็จหรือบิดเบือนความจริง</span>
                              </li>
                            </ul>
                            <p className="text-red-500 text-sm mb-6">
                              หากฝ่าฝืน อาจส่งผลให้บัญชีของคุณถูกระงับการใช้งาน
                            </p>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setShowWarning(false);
                                  setPendingReview(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                              >
                                ยกเลิก
                              </button>
                              <button
                                onClick={handleConfirmReview}
                                disabled={isSubmittingReview}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isSubmittingReview ? 'กำลังโพสต์...' : 'เข้าใจแล้ว, โพสต์รีวิว'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Feed Reviews (แสดงกับทุกคน) */}
                      <div>
                        {reviews.length === 0 ? (
                          <div className="text-neutral-400">No reviews yet.</div>
                        ) : (
                          reviews.map((review) => {
                            const likedBy = Array.isArray(review.liked_by) ? review.liked_by : [];
                            const isLiked: boolean = !!(user && user.id && likedBy.includes(user.id));
                            const isOwner: boolean = !!(user && review.user_id === user.id);
                            const reviewDate = review.createdAt;
                            return (
                              <div key={review.id} className="border-b border-neutral-200 pb-6 last:border-b-0">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center">
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, color: '#6366f1', marginRight: 12 }}>
                                      <UserCircle size={36} />
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600 }}>{review.username || 'Unknown'}</div>
                                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                                        {reviewDate && !isNaN(new Date(reviewDate).getTime())
                                          ? new Date(reviewDate).toLocaleString('th-TH')
                                          : '-'}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <FaStar
                                        key={star}
                                        className={star <= Math.floor(review.rating) ? "text-accent-400" : "text-neutral-300"}
                                        size={14}
                                      />
                                    ))}
                                    <ReviewOptionsMenu
                                      isOwner={isOwner}
                                      onDelete={() => handleDeleteReview(review.id || '')}
                                      onReport={user ? () => { setReportReviewId(review.id || ''); setShowReportModal(true); } : undefined}
                                    />
                                  </div>
                                </div>
                                <p className="text-neutral-700">{review.comment}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 }}>
                                  <span
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 4,
                                      color: isLiked ? '#ef4444' : '#aaa',
                                      cursor: user ? 'pointer' : 'not-allowed',
                                      opacity: user ? 1 : 0.5
                                    }}
                                    onClick={user ? () => handleLikeReview(review.id || '') : undefined}
                                    title={user ? '' : 'เข้าสู่ระบบเพื่อกดไลก์'}
                                  >
                                    <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#aaa'} />{review.likes}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Contact Information */}
            <div className="card p-8 rounded-xl shadow-lg bg-white mb-6">
              <h2 className="text-2xl font-bold mb-8">Contact Information</h2>
              <div className="space-y-7">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FaMapMarkerAlt className="text-primary-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Address</h3>
                    <p className="text-neutral-600">{place.address || place.contact.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FaPhone className="text-primary-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Phone</h3>
                    <p className="text-neutral-600">{place.phone || place.contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FaGlobe className="text-primary-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Website</h3>
                    <a 
                      href={place.website || place.contact.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary-600 hover:underline break-all"
                    >
                      {place.website || place.contact.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <FaClock className="text-primary-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Hours</h3>
                    <p className="text-neutral-600">{place.hours || place.contact.hours}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal เลือก Origin/Destination */}
      {showRouteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,64,175,0.10)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#f8fbff', borderRadius: 16, padding: 30, minWidth: 320, maxWidth: 370, boxShadow: '0 2px 16px 0 rgba(30,64,175,0.10)', textAlign: 'center', border: '1.5px solid #bae6fd', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <FaRoute size={32} style={{ color: '#2563eb', margin: 0 }} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 13, color: '#1e293b' }}>เลือกการวางตำแหน่งเส้นทาง</h3>
            <div style={{ fontSize: 15, color: '#2563eb', marginBottom: 18, fontWeight: 500 }}>ต้องการใช้ <span style={{ color: '#0ea5e9', fontWeight: 700 }}>&quot;{place.name}&quot;</span> เป็นจุดเริ่มต้นหรือจุดหมาย?</div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 18 }}>
              <button 
                className="btn" 
                style={{ minWidth: 104, background: '#e0f2fe', color: '#2563eb', fontWeight: 600, fontSize: 15, border: '1.5px solid #38bdf8', borderRadius: 8, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} 
                onClick={() => { 
                  setShowRouteModal(false); 
                  navigate(`/route-planner?origin=${place.id}`); 
                }} 
                onMouseOver={e => e.currentTarget.style.background='#bae6fd'} 
                onMouseOut={e => e.currentTarget.style.background='#e0f2fe'}
              >
                <LuFlag size={18} style={{ color: '#2563eb' }} /> จุดเริ่มต้น
              </button>
              <button 
                className="btn" 
                style={{ minWidth: 104, background: '#e0f2fe', color: '#0ea5e9', fontWeight: 600, fontSize: 15, border: '1.5px solid #38bdf8', borderRadius: 8, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} 
                onClick={() => { 
                  setShowRouteModal(false); 
                  navigate(`/route-planner?destination=${place.id}`); 
                }} 
                onMouseOver={e => e.currentTarget.style.background='#bae6fd'} 
                onMouseOut={e => e.currentTarget.style.background='#e0f2fe'}
              >
                <LuMapPin size={18} style={{ color: '#0ea5e9' }} /> จุดปลายทาง 
              </button>
            </div>
            <span style={{ position: 'absolute', top: 10, right: 16, cursor: 'pointer', color: '#60a5fa', fontSize: 20 }} onClick={() => setShowRouteModal(false)}>&times;</span>
          </div>
        </div>
      )}
      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <SuccessContent>
            <SuccessIcon>
              <CheckCircle2 size={48} />
            </SuccessIcon>
            <SuccessMessage>{successMessage}</SuccessMessage>
          </SuccessContent>
        </SuccessModal>
      )}
      {/* Report Review Modal */}
      {showReportModal && user && (
        <ReportReviewModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={async (type, detail) => {
            if (!reportReviewId) return;
            setReportLoading(true);
            try {
              await reviewsAPI.reportReview(reportReviewId, { type, detail });
              showSuccess('รายงานรีวิวสำเร็จ!');
              setShowReportModal(false);
            } catch (e: any) {
              toast.error(e?.response?.data?.error || 'เกิดข้อผิดพลาด');
            } finally {
              setReportLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default PlaceDetailPage; 