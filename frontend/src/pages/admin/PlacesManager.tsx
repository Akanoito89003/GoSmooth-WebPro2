import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaUpload, FaSave, FaTimes, FaSearch, FaFilter } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { Place, PlaceFormData } from '../../types/place';

const API_URL = import.meta.env.VITE_API_URL || '';

const categories = [
  { id: 'attractions', name: 'Attractions' },
  { id: 'restaurants', name: 'Restaurants' },
  { id: 'hotels', name: 'Hotels' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'nature', name: 'Nature' },
];

// ฟังก์ชันแปลง path เป็น URL เต็ม พร้อม cache busting
const getImageUrl = (img: string, version?: number) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  const cleanImg = img.startsWith('/') ? img.slice(1) : img;
  const url = cleanImg.startsWith('uploads/') ? `${API_URL}/${cleanImg}` : `${API_URL}/uploads/${cleanImg}`;
  return version ? `${url}?v=${version}` : url;
};

const PlacesManager: React.FC = () => {
  const { user } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ open: boolean; place: Place | null }>({ open: false, place: null });
  const [imageUploading, setImageUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'cover' | 'highlight'>('cover');
  const [imgVersion, setImgVersion] = useState(Date.now());

  const emptyPlace = {
    id: '',
    _id: '',
    name: '',
    location: '',
    description: '',
    longDescription: '',
    coverImage: '',
    imageUrl: [],
    gallery: [],
    rating: 0,
    priceLevel: 0,
    category: categories[0].id,
    coordinates: { lat: 0, lng: 0 },
    tags: [],
    contact: { phone: '', website: '', hours: '', address: '' },
    highlights: [],
    reviews: [],
    nearbyPlaces: [],
    hours: '',
    address: '',
    phone: '',
    website: '',
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/places`, { withCredentials: true });
      const placesData = (res.data.places || []).map((p: any) => ({
        id: p._id || p.id || '',
        name: p.Name || p.name || '',
        location: p.LocationID || p.location_id || p.location || '',
        category: p.Category || p.category || '',
        rating: typeof p.Rating === 'number' ? p.Rating : (typeof p.rating === 'number' ? p.rating : 0),
        imageUrl: Array.isArray(p.HighlightImages) ? p.HighlightImages : (Array.isArray(p.highlight_images) ? p.highlight_images : (p.CoverImage ? [p.CoverImage] : (p.cover_image ? [p.cover_image] : []))),
        address: p.Address || p.address || '',
        phone: p.Phone || p.phone || '',
        website: p.Website || p.website || '',
        hours: p.Hours || p.hours || '',
        coordinates: p.Coordinates || p.coordinates || { lat: '', lng: '' },
        description: p.Description || p.description || '',
        coverImage: p.CoverImage || p.coverImage || '',
        highlights: p.HighlightImages || p.highlight_images || [],
      }));
      setPlaces(placesData);
      setError(null);
      setImgVersion(Date.now());
    } catch (e) {
      setError('Failed to fetch places');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (place: Place) => setEditModal({ open: true, place });
  const closeEditModal = () => {
    setEditModal({ open: false, place: null });
    setNewImageUrl('');
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editModal.place) return;
    const { name, value } = e.target;
    if (name === 'coordinates.lat' || name === 'coordinates.lng') {
      setEditModal((prev) => {
        const prevCoords = prev!.place!.coordinates || { lat: 0, lng: 0 };
        const key = name.split('.')[1];
        return {
          ...prev,
          place: {
            ...prev!.place!,
            coordinates: {
              lat: key === 'lat' ? (value === '' ? 0 : Number(value)) : prevCoords.lat ?? 0,
              lng: key === 'lng' ? (value === '' ? 0 : Number(value)) : prevCoords.lng ?? 0,
            },
          },
        };
      });
    } else {
      setEditModal((prev) => ({
        ...prev,
        place: { ...prev!.place!, [name]: value },
      }));
    }
  };

  const saveEdit = async () => {
    if (!editModal.place) return;
    try {
      const lat = typeof editModal.place.coordinates?.lat === 'number' ? editModal.place.coordinates.lat : editModal.place.coordinates?.lat || 0;
      const lng = typeof editModal.place.coordinates?.lng === 'number' ? editModal.place.coordinates.lng : editModal.place.coordinates?.lng || 0;
      const payload = {
        name: editModal.place.name,
        description: editModal.place.description,
        location_id: editModal.place.location,
        category: editModal.place.category,
        address: editModal.place.address,
        phone: editModal.place.phone,
        website: editModal.place.website,
        hours: editModal.place.hours,
        coverImage: editModal.place.coverImage,
        highlights: editModal.place.highlights,
        coordinates: {
          lat,
          lng,
        },
      };
      if (editModal.place.id && String(editModal.place.id).length > 0) {
        // แก้ไข Place เดิม
        await axios.put(`${API_URL}/api/admin/places/${editModal.place.id}`, payload, { withCredentials: true });
        setPlaces((prev) => prev.map((p) => (p.id === editModal.place!.id ? {
          ...p,
          name: payload.name,
          description: payload.description,
          location: payload.location_id,
          category: payload.category,
          address: payload.address,
          phone: payload.phone,
          website: payload.website,
          hours: payload.hours,
          coverImage: payload.coverImage,
          highlights: payload.highlights,
          coordinates: payload.coordinates,
        } : p)));
        closeEditModal();
        setSuccess('Update ข้อมูลเสร็จสิ้น');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // สร้าง Place ใหม่
        await axios.post(`${API_URL}/api/admin/places`, payload, { withCredentials: true });
        await fetchPlaces();
        closeEditModal();
        setSuccess('Create Place สำเร็จ');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError('Error updating/creating place');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'highlight') => {
    if (!editModal.place || !e.target.files || e.target.files.length === 0) return;
    setImageUploading(true);
    setUploadType(type);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/upload-image?imgType=${type}`,
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (type === 'cover') {
        setEditModal((prev) => {
          if (!prev.place) return prev;
          return {
            ...prev,
            place: { ...prev.place, coverImage: res.data.imageUrl }
          };
        });
      } else {
        setEditModal((prev) => {
          if (!prev.place) return prev;
          const currentHighlights = Array.isArray(prev.place.highlights) ? prev.place.highlights : [];
          return {
            ...prev,
            place: { ...prev.place, highlights: [...currentHighlights, res.data.imageUrl] }
          };
        });
      }
      setSuccess('Image uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
      await fetchPlaces();
    } catch (e) {
      setError('Upload failed');
      setTimeout(() => setError(null), 3000);
    } finally {
      setImageUploading(false);
      setImgVersion(Date.now());
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this place?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/places/${id}`, { withCredentials: true });
      setPlaces((prev) => prev.filter((p) => p.id !== id));
      setSuccess('Place deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Error deleting place');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveCoverImage = () => {
    setEditModal((prev) => ({
      ...prev,
      place: prev.place ? { ...prev.place, coverImage: '' } : prev.place,
    }));
    setImgVersion(Date.now());
    fetchPlaces();
  };

  const handleRemoveHighlightImage = (idx: number) => {
    setEditModal((prev) => ({
      ...prev,
      place: prev.place ? { ...prev.place, highlights: prev.place.highlights.filter((_, i) => i !== idx) } : prev.place,
    }));
    setImgVersion(Date.now());
    fetchPlaces();
  };

  const filteredPlaces = places.filter(place => {
    const matchesSearch = (place.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (place.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Places</h1>
        <button 
          onClick={() => setEditModal({ open: true, place: { ...emptyPlace } })}
          className="btn btn-primary flex items-center"
        >
          <FaPlus className="mr-2" /> Add New Place
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search places..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-4">
          {success}
        </div>
      )}

      {/* Places Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Loading places...</p>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Rating</th>
                  <th className="px-4 py-3 text-left">Images</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlaces.map((place) => (
                  <tr key={place.id} className="border-t border-neutral-200 hover:bg-neutral-50">
                    <td className="px-4 py-3">{place.name || '-'}</td>
                    <td className="px-4 py-3">{place.location || '-'}</td>
                    <td className="px-4 py-3">{place.category || '-'}</td>
                    <td className="px-4 py-3">
                      {typeof place.rating === 'number' ? place.rating.toFixed(1) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {Array.isArray(place.imageUrl) && place.imageUrl.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {place.imageUrl.map((img: string, idx: number) => (
                            <img key={idx} src={getImageUrl(img, imgVersion)} alt="place" className="w-12 h-12 object-cover rounded" />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">No images</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(place)}
                          className="btn btn-sm btn-outline"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(place.id)}
                          className="btn btn-sm btn-error"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal.open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative"
              style={{ maxHeight: '80vh', overflowY: 'auto' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h2 className="text-2xl font-bold mb-6 text-primary-700">
                {editModal.place ? 'Edit Place' : 'Add New Place'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    name="name"
                    value={editModal.place?.name || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="ชื่อสถานที่"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location ID</label>
                  <input
                    name="location"
                    value={editModal.place?.location || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="รหัสสถานที่ตั้ง"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category"
                    value={editModal.place?.category || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <input
                    name="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editModal.place?.rating ?? 0}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="0.0 = average from reviews"
                    disabled
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Coordinates (Lat)</label>
                  <input
                    name="coordinates.lat"
                    value={editModal.place?.coordinates?.lat ?? ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="ละติจูด"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Coordinates (Lng)</label>
                  <input
                    name="coordinates.lng"
                    value={editModal.place?.coordinates?.lng ?? ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="ลองจิจูด"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    name="address"
                    value={editModal.place?.address || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="ที่อยู่"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    name="phone"
                    value={editModal.place?.phone || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="เบอร์โทร"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    name="website"
                    value={editModal.place?.website || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="เว็บไซต์"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hours</label>
                  <input
                    name="hours"
                    value={editModal.place?.hours || ''}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    placeholder="เวลาเปิด-ปิด"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={editModal.place?.description || ''}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 bg-neutral-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  rows={3}
                  placeholder="คำอธิบาย"
                ></textarea>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-1">Cover Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleImageUpload(e, 'cover')}
                    disabled={imageUploading}
                    className="input"
                  />
                  {imageUploading && uploadType === 'cover' && (
                    <span className="text-sm text-neutral-500">Uploading...</span>
                  )}
                </div>
                {editModal.place?.coverImage && (
                  <div className="mt-3 flex justify-center">
                    <div className="relative inline-block shadow-lg rounded-lg">
                      <img
                        src={getImageUrl(editModal.place.coverImage, imgVersion)}
                        alt="cover"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-white"
                      />
                      <button
                        onClick={handleRemoveCoverImage}
                        className="absolute -top-3 -right-3 bg-red-600 text-white border-2 border-white rounded-full p-2 shadow-lg text-lg font-bold hover:bg-red-800 transition z-10"
                        title="Remove Cover Image"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-1">Highlight Images</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => handleImageUpload(e, 'highlight')}
                    disabled={imageUploading}
                    className="input"
                  />
                  {imageUploading && uploadType === 'highlight' && (
                    <span className="text-sm text-neutral-500">Uploading...</span>
                  )}
                </div>
                {editModal.place?.highlights && editModal.place.highlights.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {editModal.place.highlights.map((img: string, idx: number) => (
                      <div key={idx} className="relative group shadow rounded-lg">
                        <img
                          src={getImageUrl(img, imgVersion)}
                          alt="highlight"
                          className="w-24 h-24 object-cover rounded-lg border-2 border-white group-hover:scale-105 transition"
                        />
                        <button
                          onClick={() => handleRemoveHighlightImage(idx)}
                          className="absolute -top-3 -right-3 bg-red-600 text-white border-2 border-white rounded-full p-2 shadow-lg text-lg font-bold hover:bg-red-800 transition z-10"
                          title="Remove Highlight Image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={closeEditModal}
                  className="rounded-lg px-6 py-2 bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="rounded-lg px-6 py-2 bg-green-500 text-white hover:bg-green-600 transition"
                >
                  {editModal.place ? (editModal.place.id ? 'Save Changes' : 'Create Place') : 'Create Place'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlacesManager; 