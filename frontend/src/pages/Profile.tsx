import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const EditProfileModal = ({ open, onClose, user, onSave }: { open: boolean, onClose: () => void, user: any, onSave: (data: any) => void }) => {
  const [name, setName] = useState(user?.name || '');
  const [addressLine, setAddressLine] = useState(user?.address?.addressLine || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [province, setProvince] = useState(user?.address?.province || '');
  const [zipcode, setZipcode] = useState(user?.address?.zipcode || '');
  const [country, setCountry] = useState(user?.address?.country || 'Thailand');
  const [lat, setLat] = useState(user?.address?.lat || 13.7563);
  const [lng, setLng] = useState(user?.address?.lng || 100.5018);
  const [loadingAddr, setLoadingAddr] = useState(false);

  // reverse geocode function
  async function reverseGeocode(lat: number, lng: number) {
    setLoadingAddr(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=th`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (!data.address) throw new Error('ไม่พบข้อมูลที่อยู่จากพิกัดนี้');
      const addr = data.address || {};
      setAddressLine(addr.road || addr.house_number || '');
      setCity(addr.suburb || addr.city || addr.town || '');
      setProvince(addr.state || '');
      setZipcode(addr.postcode || '');
      setCountry(addr.country || 'Thailand');
    } catch (e: any) {
      toast.error(e.message || 'เกิดข้อผิดพลาดในการดึงที่อยู่');
    } finally {
      setLoadingAddr(false);
    }
  }

  // Handler component สำหรับ map click
  function MapClickHandler({ setLat, setLng }: { setLat: (lat: number) => void, setLng: (lng: number) => void }) {
    useMapEvent('click', (e) => {
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
    return null;
  }

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave({ name, address: { addressLine, city, province, zipcode, country, lat, lng } });
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 520, maxWidth: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div className="mb-3">
              <label className="block text-sm mb-1">Full Name</label>
              <input className="w-full border rounded px-3 py-2" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">บ้านเลขที่/ถนน</label>
              <input className="w-full border rounded px-3 py-2" value={addressLine} onChange={e => setAddressLine(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">เขต/อำเภอ</label>
              <input className="w-full border rounded px-3 py-2" value={city} onChange={e => setCity(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">จังหวัด</label>
              <input className="w-full border rounded px-3 py-2" value={province} onChange={e => setProvince(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">รหัสไปรษณีย์</label>
              <input className="w-full border rounded px-3 py-2" value={zipcode} onChange={e => setZipcode(e.target.value)} required pattern="[0-9]{5}" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">ประเทศ</label>
              <select className="w-full border rounded px-3 py-2" value={country} onChange={e => setCountry(e.target.value)} required>
                <option value="Thailand">Thailand</option>
                {/* เพิ่มประเทศอื่น ๆ ได้ */}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1 flex items-center gap-2">
              ตำแหน่งบ้าน (ปักมุดบนแผนที่)
              {loadingAddr && (
                <span className="inline-flex items-center text-xs text-gray-400 ml-2">
                  <Loader2 className="animate-spin w-4 h-4 mr-1" />
                  กำลังดึงที่อยู่...
                </span>
              )}
            </label>
            <div style={{ height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
              <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler setLat={setLat} setLng={setLng} />
                <Marker position={[lat, lng]} draggable={true} eventHandlers={{
                  dragend: async (e: any) => {
                    const newLat = e.target.getLatLng().lat;
                    const newLng = e.target.getLatLng().lng;
                    setLat(newLat);
                    setLng(newLng);
                    await reverseGeocode(newLat, newLng);
                  }
                }}>
                  <Popup>บ้านของฉัน</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save</button>
            <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ open, onClose, onSave }: { open: boolean, onClose: () => void, onSave: (data: any) => void }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{old?: string, new?: string, confirm?: string}>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    let hasError = false;
    const newErrors: typeof errors = {};
    if (!oldPassword) {
      newErrors.old = "กรุณากรอกรหัสผ่านเดิม";
      hasError = true;
    }
    if (!newPassword || newPassword.length < 7 || !/[a-zA-Z]/.test(newPassword)) {
      newErrors.new = "รหัสผ่านใหม่ต้องมีอย่างน้อย 7 ตัวอักษรและมีตัวอักษร";
      hasError = true;
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirm = "รหัสผ่านใหม่กับยืนยันรหัสผ่านไม่ตรงกัน";
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;
    setLoading(true);
    try {
      await onSave({ oldPassword, newPassword, confirmPassword });
      // ถ้า onSave สำเร็จ จะปิด modal และ toast.success ที่ parent
    } catch (err: any) {
      // สมมติ err.message มี "current password is incorrect" หรือ error อื่น
      if (err.message && err.message.toLowerCase().includes("current password")) {
        setErrors({ ...newErrors, old: "รหัสผ่านเดิมไม่ถูกต้อง" });
      } else if (err.message && err.message.toLowerCase().includes("password")) {
        setErrors({ ...newErrors, new: err.message });
      } else {
        setErrors({ ...newErrors, confirm: err.message || "เกิดข้อผิดพลาด" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3 relative">
            <label className="block text-sm mb-1">Old Password</label>
            <input className="w-full border rounded px-3 py-2 pr-10" type={showOld ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
            <span className="absolute right-3 top-8 cursor-pointer" onClick={() => setShowOld(v => !v)}>
              {showOld ? <EyeOff size={18}/> : <Eye size={18}/>}
            </span>
            {errors.old && <p className="text-red-500 text-xs mt-1">{errors.old}</p>}
          </div>
          <div className="mb-3 relative">
            <label className="block text-sm mb-1">New Password</label>
            <input className="w-full border rounded px-3 py-2 pr-10" type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <span className="absolute right-3 top-8 cursor-pointer" onClick={() => setShowNew(v => !v)}>
              {showNew ? <EyeOff size={18}/> : <Eye size={18}/>}
            </span>
            {errors.new && <p className="text-red-500 text-xs mt-1">{errors.new}</p>}
          </div>
          <div className="mb-3 relative">
            <label className="block text-sm mb-1">Confirm Password</label>
            <input className="w-full border rounded px-3 py-2 pr-10" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            <span className="absolute right-3 top-8 cursor-pointer" onClick={() => setShowConfirm(v => !v)}>
              {showConfirm ? <EyeOff size={18}/> : <Eye size={18}/>}
            </span>
            {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={onClose} disabled={loading}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  // green icon for home
  const homeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  const address = user?.address;
  const [editOpen, setEditOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto px-2 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      <div className="w-full max-w-3xl mx-auto">
        <Card padding="lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Account Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Full Name</label>
                <p className="font-medium">{user?.name || '-'}</p>
              </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
                <label className="text-sm text-gray-500">Address</label>
              <p className="font-medium">
                  {address ? (
                    <>
                      {address.addressLine || ''}{address.city ? ', ' + address.city : ''}{address.province ? ', ' + address.province : ''}{address.zipcode ? ', ' + address.zipcode : ''}{address.country ? ', ' + address.country : ''}
                    </>
                  ) : 'N/A'}
              </p>
            </div>
              <div>
                <label className="text-sm text-gray-500">Member Since</label>
                <p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="" onClick={() => setEditOpen(true)}>
                  Edit Profile
                </Button>
                <Button variant="outline" className="" onClick={() => setChangePwOpen(true)}>
                  Change Password
                </Button>
          </div>
            </div>
            <div>
              {address && typeof address.lat === 'number' && typeof address.lng === 'number' && (
                <MapContainer
                  center={[address.lat, address.lng]}
                  zoom={15}
                  style={{ height: 180, width: '100%', borderRadius: 12 }}
                  scrollWheelZoom={false}
                  dragging={false}
                  doubleClickZoom={false}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[address.lat, address.lng]} icon={homeIcon}>
                    <Popup>บ้านของฉัน</Popup>
                  </Marker>
                </MapContainer>
              )}
          </div>
          </div>
        </Card>
      </div>
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} onSave={async (data) => {
        try {
          await updateProfile(data);
          toast.success('Profile updated successfully!');
          setEditOpen(false);
        } catch (err: any) {
          toast.error(err.message || 'Update failed');
        }
      }} />
      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} onSave={async (data) => {
        try {
          await changePassword({ currentPassword: data.oldPassword, newPassword: data.newPassword });
          toast.success('Password changed successfully!');
          setChangePwOpen(false);
        } catch (err: any) {
          toast.error(err.message || 'Change password failed');
        }
      }} />
    </motion.div>
  );
};

export default Profile;