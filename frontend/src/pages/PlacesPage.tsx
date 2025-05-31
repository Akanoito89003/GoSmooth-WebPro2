import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaSearch, FaFilter, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

type Place = {
  id: string;
  name: string;
  locationId: string;
  locationName?: string;
  description: string;
  coverImage: string;
  imageUrl: string[];
  rating: number;
  category: string;
  priceLevel: number;
  tags: string[];
};

interface PlaceCardProps {
  place: Place;
  currentUser: any;
  openEditModal?: () => void;
  openDeleteModal?: () => void;
}

const getImageUrl = (filename: string, apiUrl: string) => {
  if (!filename) return 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
  return `${apiUrl}/uploads/${encodeURIComponent(filename)}`;
};

const PlaceCard: React.FC<PlaceCardProps & { apiUrl: string }> = ({ place, currentUser, openEditModal, openDeleteModal, apiUrl }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="place-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full max-w-md w-80"
    >
      <Link to={`/places/${place.id}`}>
        <img
          src={getImageUrl(place.coverImage, apiUrl)}
          alt={place.name}
          className="w-full h-48 object-cover"
        />
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center mb-2">
            <FaStar className="text-yellow-400 mr-1" />
            <span className="font-semibold text-sm">{typeof place.rating === 'number' ? place.rating.toFixed(1) : 'N/A'}</span>
          </div>
          <h3 className="text-base font-bold mb-1 truncate">{place.name}</h3>
          <div className="flex items-center text-xs text-neutral-500 mb-1">
            <FaMapMarkerAlt className="mr-1" />
            <span className="truncate">{place.locationName}</span>
          </div>
          <p className="text-xs text-neutral-600 mb-2 line-clamp-2">{place.description}</p>
          <div className="mt-auto">
            <span className="inline-block bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded">{place.category}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const PlacesPage: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    rating: 0,
    priceRange: [0, 5],
  });
  const [locations, setLocations] = useState<{[key: string]: string}>({});
  const API_URL = import.meta.env.VITE_API_URL;
  const auth = useAuth();
  const user = auth?.user;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([ { id: 'all', name: 'All' } ]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/locations`);
      const locationsData = response.data.locations || [];
      const locationMap: {[key: string]: string} = {};
      locationsData.forEach((loc: any) => {
        locationMap[loc.LocationID] = loc.Name;
      });
      setLocations(locationMap);
      fetchPlaces(locationMap);
    } catch (error) {
      console.error('Error fetching locations:', error);
      fetchPlaces({});
    }
  };

  const fetchPlaces = async (locationMap: {[key: string]: string}) => {
    try {
      const response = await axios.get(`${API_URL}/api/places`);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.places || response.data.data || [];
      const placesData: Place[] = data.map((p: any) => {
        const locId = p.LocationID ?? p.location_id ?? p.locationId ?? '';
        return {
          id: p.place_id ?? p.PlaceID ?? '',
          name: p.Name ?? '-',
          locationId: locId,
          locationName: p.LocationName ?? locationMap[locId] ?? '-',
          description: p.Description ?? '-',
          coverImage: p.CoverImage ?? p.coverImage ?? p.cover_image ?? '',
          imageUrl: Array.isArray(p.HighlightImages) ? p.HighlightImages : [],
          rating: typeof p.Rating === 'number' ? p.Rating : 0,
          category: p.Category ?? '-',
          priceLevel: typeof p.PriceLevel === 'number' ? p.PriceLevel : 3,
          tags: Array.isArray(p.Tags) ? p.Tags : (p.Category ? [p.Category] : []),
        };
      });
      const uniqueCategories = Array.from(new Set(placesData.map(p => p.category).filter(Boolean)));
      setCategories([
        { id: 'all', name: 'All' },
        ...uniqueCategories.map(cat => ({ id: cat, name: cat.charAt(0).toUpperCase() + cat.slice(1) }))
      ]);
      setPlaces(placesData);
      setFilteredPlaces(placesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching places:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...places];
    if (searchTerm) {
      filtered = filtered.filter(place => 
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (place.tags && place.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    if (activeCategory !== 'all') {
      filtered = filtered.filter(place => place.category === activeCategory);
    }
    if (filters.rating > 0) {
      filtered = filtered.filter(place => place.rating >= filters.rating);
    }
    filtered = filtered.filter(place => 
      place.priceLevel >= filters.priceRange[0] && 
      place.priceLevel <= filters.priceRange[1]
    );
    setFilteredPlaces(filtered);
  }, [places, searchTerm, activeCategory, filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);
  const handleCategoryChange = (categoryId: string) => setActiveCategory(categoryId);
  const handleRatingChange = (rating: number) => setFilters({ ...filters, rating });
  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
    setFilters({ rating: 0, priceRange: [0, 5] });
  };

  return (
    <div className="page-container">
      <div className="container-custom">
        <div className="section-header text-center max-w-3xl mx-auto mb-12">
          <h1 className="section-title">Explore Amazing Places</h1>
          <p className="section-description">Discover destinations, hotels, restaurants, and attractions from around the world.</p>
        </div>
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="lg:w-2/3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search places, locations, or tags..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="lg:w-1/3 flex justify-end">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline flex items-center"
              >
                <FaFilter className="mr-2" />
                Filters
                {(filters.rating > 0 || filters.priceRange[0] > 0 || filters.priceRange[1] < 5) && (
                  <span className="filter-active-indicator">!</span>
                )}
              </button>
            </div>
          </div>
          {showFilters && (
            <div className="filter-panel mt-6 border-t border-neutral-200 pt-6">
              <div className="flex justify-between mb-4">
                <h3 className="font-medium">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-primary-600 text-sm hover:text-primary-800 flex items-center"
                >
                  <FaTimes className="mr-1" />
                  Reset All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <h4 className="text-sm font-medium mb-2">Minimum Rating</h4>
                  <div className="flex space-x-2">
                    {[0, 3, 3.5, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => handleRatingChange(rating)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          filters.rating === rating
                            ? 'bg-primary-600 text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mb-8 flex overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex space-x-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="loading-container h-64">
            <div className="loading-content">
              <div className="spinner"></div>
              <p className="loading-text">Loading places...</p>
            </div>
          </div>
        ) : (
          <>
            {filteredPlaces.length === 0 ? (
              <div className="card p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">No places found</h3>
                <p className="text-neutral-600 mb-6">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button
                  onClick={resetFilters}
                  className="btn btn-primary"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                <p className="text-neutral-600 mb-4">Showing {filteredPlaces.length} places</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-1 gap-y-6">
                  {filteredPlaces.map(place => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      currentUser={user}
                      apiUrl={API_URL}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlacesPage;