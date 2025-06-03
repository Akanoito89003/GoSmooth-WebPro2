import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaRoute, FaHeart, FaRegHeart, FaShareAlt, FaMoneyBillWave, FaPhone, FaGlobe, FaClock, FaInfo } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ReactStars from 'react-stars';
import { Place, Review } from '../types/place';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { UserCircle, Heart } from 'lucide-react';
import { reviewsAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL;

interface UserReview {
  rating: number;
  comment: string;
}

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

  useEffect(() => { fetchPlaceDetails(); }, [id]);

  // Debug API_URL
  console.log('[DEBUG] API_URL:', API_URL);

  useEffect(() => {
    if (place) {
      console.log('[DEBUG] Render Hero backgroundImage:', place.coverImage ? `${API_URL}/uploads/${place.coverImage}` : place.imageUrl[0]);
    }
  }, [place]);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUserId(user.id || user._id || '');
    } catch {
      setUserId('');
    }
  }, []);

  const fetchPlaceDetails = async () => {
    try {
      console.log('[DEBUG] PlaceDetailPage id:', id);
      const response = await axios.get(`${API_URL}/api/places/${id}`);
      console.log('[DEBUG] API response:', response.data);
      const p = response.data.place || response.data;
      const placeData: Place = {
        id: p.id || p._id || p.ID || p.PlaceID || p.place_id || p.name,
        name: p.name || p.Name,
        location: p.location || p.Location || p.address || p.Address || '',
        description: p.description || p.Description || '',
        longDescription: p.longDescription || p.LongDescription || p.description || p.Description || '',
        coverImage: p.CoverImage || '',
        imageUrl: Array.isArray(p.HighlightImages) ? p.HighlightImages : [],
        gallery: Array.isArray(p.HighlightImages) ? p.HighlightImages.map((img: string) => `${API_URL}/uploads/${img}`) : [],
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
      console.log('[DEBUG] coverImage url:', `${API_URL}/uploads/${placeData.coverImage}`);
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

  const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    if (userReview.rating === 0) {
      alert('Please select a rating');
      return;
    }
    try {
      setIsSubmittingReview(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserReview({ rating: 0, comment: '' });
      setReviewSuccess(true);
      setTimeout(() => { setReviewSuccess(false); }, 3000);
    } catch (error) {
      // Handle error
    } finally {
      setIsSubmittingReview(false);
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
  return (
    <div className="page-container">
      {/* Hero Section */}
      <div className="place-detail-hero" style={{ backgroundImage: `url(${place.coverImage ? `${API_URL}/uploads/${place.coverImage}` : place.imageUrl[0]})`, minHeight: '400px', height: '40vh', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
        <div className="place-detail-hero-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 }}></div>
        <div className="container-custom px-6 pt-6" style={{ position: 'relative', zIndex: 2 }}>
          <div className="pb-8 md:pb-16 text-white max-w-3xl">
            <h1 className="place-detail-title text-white">{place.name}</h1>
            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <FaStar className="star-icon mr-1 text-white" />
                <span className="font-medium text-white">{place.rating.toFixed(1)}</span>
                <span className="text-white text-opacity-80 ml-1">({place.reviews.length} reviews)</span>
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
              <Link to={`/routes?destination=${encodeURIComponent(place.name)}`} className="btn btn-primary flex-1 sm:mr-2 flex items-center justify-center">
                <FaRoute className="mr-2" />
                Get Directions
              </Link>
              <button onClick={toggleFavorite} className="btn btn-outline flex-1 sm:ml-2 flex items-center justify-center">
                {isFavorite ? (<><FaHeart className="mr-2 text-primary-600" />Saved</>) : (<><FaRegHeart className="mr-2" />Save</>)}
              </button>
              <button className="btn btn-outline sm:ml-2 p-3 flex items-center justify-center"><FaShareAlt /></button>
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
                              src={`${API_URL}/uploads/${img}`}
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
                            src={photo}
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
                              onClick={async () => {
                                if (!reviewRating) return alert('กรุณาให้คะแนน');
                                if (!reviewText.trim()) return alert('กรุณากรอกข้อความรีวิว');
                                setPosting(true);
                                try {
                                  const placeAny = place as any;
                                  const placeIdToSend = placeAny.place_id || placeAny.PlaceID || placeAny.id;
                                  const placeNameToSend = placeAny.name || placeAny.Name;
                                  const payload = {
                                    placeId: placeIdToSend,
                                    placeName: placeNameToSend,
                                    rating: reviewRating,
                                    comment: reviewText,
                                  };
                                  console.log('DEBUG: POST REVIEW payload', payload);
                                  await api.post('/api/reviews', payload);
                                  setReviewText('');
                                  setReviewRating(0);
                                  fetchReviews(placeIdToSend); // refresh reviews
                                  alert('โพสต์รีวิวสำเร็จ!');
                                } catch (e: any) {
                                  console.error('POST REVIEW ERROR', e?.response?.data || e);
                                  alert('เกิดข้อผิดพลาด: ' + (e?.response?.data?.error || e.message || ''));
                                } finally {
                                  setPosting(false);
                                }
                              }}
                              disabled={posting}
                              style={{ minWidth: 130, fontSize: 17, padding: '10px 0', width: 160 }}
                            >
                              {posting ? 'กำลังโพสต์...' : 'โพสต์รีวิว'}
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Review List */}
                      <div className="space-y-6">
                        {reviews.map((r) => {
                          const review = r as any;
                          const isLiked = Array.isArray(review.liked_by) && review.liked_by.includes(userId);
                          return (
                            <div key={review.id} className="border-b border-neutral-200 pb-6 last:border-b-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center">
                                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, color: '#6366f1', marginRight: 12 }}>
                                    <UserCircle size={36} />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 600 }}>{review.username || 'Unknown'}</div>
                                    <div style={{ fontSize: 13, color: '#6b7280' }}>@{review.username?.toLowerCase().replace(/\s/g, '_') || 'user'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                      key={star}
                                      className={star <= Math.floor(review.rating) ? "text-accent-400" : "text-neutral-300"}
                                      size={14}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-neutral-700">{review.comment}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isLiked ? '#ef4444' : '#aaa', cursor: 'pointer' }} onClick={() => handleLikeReview(review.id)}>
                                  <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />{(review as any).likes}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {reviews.length === 0 && <div className="text-neutral-400">No reviews yet.</div>}
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
            {/* Additional Info */}
            <div className="card p-6">
              <div className="flex items-center bg-primary-50 text-primary-700 p-4 rounded-lg mb-4">
                <FaInfo className="mr-3 flex-shrink-0" />
                <p className="text-sm">Ready to visit? Use our route finder to get directions and explore the most convenient way to reach {place.name}.</p>
              </div>
              <Link 
                to={`/routes?destination=${encodeURIComponent(place.name)}`}
                className="btn btn-primary w-full"
              >
                Find Route to {place.name}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailPage; 