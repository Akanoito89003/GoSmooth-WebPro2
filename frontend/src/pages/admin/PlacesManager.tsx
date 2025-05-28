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

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/places`, { withCredentials: true });
      setPlaces(res.data.places || []);
      setError(null);
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
    setEditModal((prev) => ({
      ...prev,
      place: { ...prev!.place!, [name]: value },
    }));
  };

  const saveEdit = async () => {
    if (!editModal.place) return;
    try {
      await axios.put(`${API_URL}/api/admin/places/${editModal.place.id}`, editModal.place, { withCredentials: true });
      setPlaces((prev) => prev.map((p) => (p.id === editModal.place!.id ? editModal.place! : p)));
      setSuccess('Place updated successfully');
      closeEditModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Error updating place');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editModal.place || !e.target.files || e.target.files.length === 0) return;
    setImageUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/upload-image?type=places&name=${encodeURIComponent(editModal.place.name)}`,
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setNewImageUrl(res.data.imageUrl);
      setEditModal((prev) => {
        if (!prev.place) return prev;
        const currentImages = Array.isArray(prev.place.imageUrl) ? prev.place.imageUrl : [prev.place.imageUrl];
        return {
          ...prev,
          place: { ...prev.place, imageUrl: [...currentImages, res.data.imageUrl] }
        };
      });
      setSuccess('Image uploaded successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError('Upload failed');
      setTimeout(() => setError(null), 3000);
    } finally {
      setImageUploading(false);
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

  const filteredPlaces = places.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         place.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Places</h1>
        <button 
          onClick={() => setEditModal({ open: true, place: null })}
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
                    <td className="px-4 py-3">{place.name}</td>
                    <td className="px-4 py-3">{place.location}</td>
                    <td className="px-4 py-3">{place.category}</td>
                    <td className="px-4 py-3">{place.rating}</td>
                    <td className="px-4 py-3">
                      {Array.isArray(place.imageUrl) && place.imageUrl.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {place.imageUrl.map((img: string, idx: number) => (
                            <img key={idx} src={img} alt="place" className="w-12 h-12 object-cover rounded" />
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
              className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <h2 className="text-xl font-bold mb-4">
                {editModal.place ? 'Edit Place' : 'Add New Place'}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Name</label>
                    <input
                      name="name"
                      value={editModal.place?.name || ''}
                      onChange={handleEditChange}
                      className="input w-full"
                      placeholder="Place name"
                    />
                  </div>
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      name="location"
                      value={editModal.place?.location || ''}
                      onChange={handleEditChange}
                      className="input w-full"
                      placeholder="Location"
                    />
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <select
                      name="category"
                      value={editModal.place?.category || 'attractions'}
                      onChange={handleEditChange}
                      className="input w-full"
                    >
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Rating</label>
                    <input
                      name="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={editModal.place?.rating || 0}
                      onChange={handleEditChange}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    name="description"
                    value={editModal.place?.description || ''}
                    onChange={handleEditChange}
                    className="input w-full"
                    rows={3}
                    placeholder="Description"
                  ></textarea>
                </div>
                <div>
                  <label className="form-label">Upload Image</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                      className="input"
                    />
                    {imageUploading && (
                      <span className="text-sm text-neutral-500">Uploading...</span>
                    )}
                  </div>
                  {editModal.place?.imageUrl && Array.isArray(editModal.place.imageUrl) && editModal.place.imageUrl.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {editModal.place.imageUrl.map((img: string, idx: number) => (
                        <img
                          key={idx}
                          src={img}
                          alt="place"
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={closeEditModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="btn btn-primary"
                >
                  {editModal.place ? 'Save Changes' : 'Create Place'}
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