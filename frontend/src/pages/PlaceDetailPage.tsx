import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaRoute, FaHeart, FaRegHeart, FaShareAlt, FaMoneyBillWave, FaPhone, FaGlobe, FaClock, FaInfo } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ReactStars from 'react-stars';
import { Place, Review } from '../types/place';

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

  useEffect(() => { fetchPlaceDetails(); }, [id]);

  const fetchPlaceDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/places/${id}`);
      const p = response.data.place || response.data;
      const placeData: Place = {
        id: p.id || p._id || p.ID || p.PlaceID || p.name,
        name: p.name || p.Name,
        location: p.location || p.Location || p.address || '',
        description: p.description || p.Description || '',
        longDescription: p.longDescription || p.LongDescription || p.description || p.Description || '',
        imageUrl: Array.isArray(p.imageUrl || p.ImageURL) ? (p.imageUrl || p.ImageURL) : [(p.imageUrl || p.ImageURL || 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')],
        gallery: Array.isArray(p.gallery || p.Gallery) ? (p.gallery || p.Gallery) : (Array.isArray(p.images) ? p.images : []),
        rating: p.rating || p.Rating || 4.5,
        priceLevel: p.priceLevel || p.PriceLevel || 3,
        category: p.category || p.Category || 'attractions',
        coordinates: p.coordinates || p.Coordinates || { lat: 0, lng: 0 },
        tags: p.tags || (p.category ? [p.category] : []) || [],
        contact: p.contact || {
          phone: '',
          website: '',
          hours: '',
          address: p.address || '',
        },
        highlights: p.highlights || [],
        reviews: p.reviews || [],
        nearbyPlaces: p.nearbyPlaces || [],
      };
      setPlace(placeData);
      setLoading(false);
    } catch (error) {
      setError('Failed to load place details. Please try again later.');
      setLoading(false);
    }
  };

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
      <div className="place-detail-hero" style={{ backgroundImage: `url(${place.imageUrl[0]})` }}>
        <div className="place-detail-hero-overlay"></div>
        <div className="container-custom">
          <div className="pb-8 md:pb-16 text-white max-w-3xl">
            <h1 className="place-detail-title">{place.name}</h1>
            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <FaStar className="star-icon mr-1" />
                <span className="font-medium">{place.rating.toFixed(1)}</span>
                <span className="text-white text-opacity-80 ml-1">({place.reviews.length} reviews)</span>
              </div>
              <div className="flex items-center mr-4">
                <FaMapMarkerAlt className="location-icon mr-1 text-white text-opacity-80" />
                <span>{place.location}</span>
              </div>
              <div className="hidden md:flex items-center">
                <span className="text-white text-opacity-80">{Array(place.priceLevel).fill('$').join('')}</span>
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
            <div className="card p-4 mb-6 flex justify-between">
              <Link to={`/routes?destination=${encodeURIComponent(place.name)}`} className="btn btn-primary flex-1 mr-2 flex items-center justify-center">
                <FaRoute className="mr-2" />
                Get Directions
              </Link>
              <button onClick={toggleFavorite} className="btn btn-outline flex-1 ml-2 flex items-center justify-center">
                {isFavorite ? (<><FaHeart className="mr-2 text-primary-600" />Saved</>) : (<><FaRegHeart className="mr-2" />Save</>)}
              </button>
              <button className="btn btn-outline ml-2 p-3 flex items-center justify-center"><FaShareAlt /></button>
            </div>
            {/* Tabs */}
            <div className="card overflow-hidden mb-6">
              <div className="border-b border-neutral-200">
                <nav className="flex">
                  <button onClick={() => setActiveTab('overview')} className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}>Overview</button>
                  <button onClick={() => setActiveTab('photos')} className={`tab-button ${activeTab === 'photos' ? 'active' : ''}`}>Photos</button>
                  <button onClick={() => setActiveTab('reviews')} className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}>Reviews ({place.reviews.length})</button>
                </nav>
              </div>
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">About {place.name}</h2>
                    <p className="text-neutral-700 mb-6 whitespace-pre-line">{place.longDescription}</p>
                    <h3 className="text-xl font-bold mb-3">Highlights</h3>
                    <ul className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {place.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start"><span className="text-primary-600 mr-2">•</span><span>{highlight}</span></li>
                      ))}
                    </ul>
                    {/* Map Preview */}
                    <h3 className="text-xl font-bold mb-3">Location</h3>
                    <div className="map-preview-container">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(place.name)}`}
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}
                {/* Photos Tab */}
                {activeTab === 'photos' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Photos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <div className="bg-primary-100 text-primary-700 rounded-lg px-3 py-2 text-2xl font-bold mr-3">{place.rating.toFixed(1)}</div>
                          <div>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar key={star} className={star <= Math.round(place.rating) ? "text-accent-400" : "text-neutral-300"} />
                              ))}
                            </div>
                            <p className="text-neutral-500">Based on {place.reviews.length} reviews</p>
                          </div>
                        </div>
                      </div>
                      {/* Write a Review */}
                      {user && (
                        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                          <h3 className="font-medium mb-3">Write a Review</h3>
                          {reviewSuccess ? (
                            <div className="alert alert-success">Thank you for your review! It has been submitted successfully.</div>
                          ) : (
                            <form onSubmit={handleReviewSubmit}>
                              <div className="form-group">
                                <label className="form-label">Your Rating</label>
                                <ReactStars
                                  count={5}
                                  value={userReview.rating}
                                  onChange={(newRating: number) => setUserReview({ ...userReview, rating: newRating })}
                                  size={24}
                                  color2={'#FFC107'}
                                  half={false}
                                />
                              </div>
                              <div className="form-group">
                                <label htmlFor="review-comment" className="form-label">Your Review</label>
                                <textarea
                                  id="review-comment"
                                  rows={3}
                                  value={userReview.comment}
                                  onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                                  className="input"
                                  placeholder="Share your experience with this place..."
                                ></textarea>
                              </div>
                              <button
                                type="submit"
                                disabled={isSubmittingReview}
                                className={`btn btn-primary ${isSubmittingReview ? 'opacity-70 cursor-not-allowed' : ''}`}
                              >
                                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                      {/* Review List */}
                      <div className="space-y-6">
                        {place.reviews.map((review) => (
                          <div key={review.id} className="border-b border-neutral-200 pb-6 last:border-b-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <img
                                  src={review.user.image}
                                  alt={review.user.name}
                                  className="w-10 h-10 rounded-full object-cover mr-3"
                                />
                                <div>
                                  <h4 className="font-medium">{review.user.name}</h4>
                                  <p className="text-neutral-500 text-sm">{review.date}</p>
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
                                {review.rating % 1 !== 0 && (
                                  <div className="text-sm ml-1 text-accent-400">+</div>
                                )}
                              </div>
                            </div>
                            <p className="text-neutral-700">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Nearby Places */}
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Nearby Places</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {place.nearbyPlaces.map((nearbyPlace) => (
                  <Link
                    key={nearbyPlace.id}
                    to={`/places/${nearbyPlace.id}`}
                    className="group"
                  >
                    <div className="rounded-lg overflow-hidden">
                      <div className="h-40 overflow-hidden">
                        <img
                          src={nearbyPlace.imageUrl}
                          alt={nearbyPlace.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium group-hover:text-primary-600 transition-colors">{nearbyPlace.name}</h3>
                          <div className="flex items-center text-accent-500">
                            <FaStar size={12} />
                            <span className="ml-1 text-sm">{nearbyPlace.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="lg:w-1/3">
            {/* Contact Information */}
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 flex-shrink-0 flex justify-center mt-1">
                    <FaMapMarkerAlt className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Address</h3>
                    <p className="text-neutral-600">{place.contact.address}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 flex-shrink-0 flex justify-center mt-1">
                    <FaPhone className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Phone</h3>
                    <p className="text-neutral-600">{place.contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 flex-shrink-0 flex justify-center mt-1">
                    <FaGlobe className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Website</h3>
                    <a 
                      href={place.contact.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary-600 hover:underline"
                    >
                      {place.contact.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 flex-shrink-0 flex justify-center mt-1">
                    <FaClock className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Hours</h3>
                    <p className="text-neutral-600">{place.contact.hours}</p>
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