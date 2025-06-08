import { motion } from 'framer-motion';
import { Users, AlertTriangle, Shield, Ban, CheckCircle2, XCircle, Eye, EyeOff, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'banned';
  banReason?: string;
  reports?: Report[];
  createdAt: string;
}

interface Report {
  id: string;
  type: 'review' | 'place';
  reason: string;
  reportedBy: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

interface ReviewReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reporter: string;
  type: string;
  detail: string;
  status: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banReasonDetail, setBanReasonDetail] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [visibilityUser, setVisibilityUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [banError, setBanError] = useState('');
  const [reviewReports, setReviewReports] = useState<ReviewReport[]>([]);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [reportedReview, setReportedReview] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
    fetchReviewReports();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      const users = response.data.users.map((u: any) => ({
        ...u,
        createdAt: u.created_at || u.createdAt,
      }));
      setUsers(users);
      setErrorMsg(null);
    } catch (error: any) {
      console.error('API /api/admin/users error:', error);
      const msg = error?.response?.data?.error || error?.message || 'Failed to fetch users';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewReports = async () => {
    try {
      const res = await api.get('/api/admin/review-reports?status=pending');
      setReviewReports(res.data.reports || []);
    } catch (e) {
      setReviewReports([]);
    }
  };

  const handleBanUser = async (userId: string) => {
    let reason = banReason;
    if (!reason || (reason === 'อื่น ๆ' && !banReasonDetail.trim())) {
      setBanError('กรุณาเลือกเหตุผลหรือระบุรายละเอียดในการแบน');
      return;
    }
    if (reason === 'อื่น ๆ') {
      reason = banReasonDetail;
    }
    setBanError('');
    try {
      await api.post(`/api/admin/users/${userId}/ban`, { reason });
      toast.success('User banned successfully');
      fetchUsers();
      setShowBanModal(false);
      setBanReason('');
      setBanReasonDetail('');
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await api.post(`/api/admin/users/${userId}/unban`);
      toast.success('User unbanned successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-8">จัดการผู้ใช้งาน</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 cursor-pointer" onClick={() => setShowReportsModal(true)}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {reviewReports.filter(r => r.status === 'pending').length}
          </h2>
          <p className="text-gray-600">รายงานที่รอดำเนินการ</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {users.filter(u => u.status === 'banned').length}
          </h2>
          <p className="text-gray-600">ผู้ใช้ที่ถูกแบน</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="ค้นหาผู้ใช้งาน..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input border rounded px-3 py-2 w-full md:w-1/3"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="input border rounded px-3 py-2 w-full md:w-1/4"
        >
          <option value="">ทุกบทบาท</option>
          <option value="user">ผู้ใช้</option>
          <option value="admin">แอดมิน</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input border rounded px-3 py-2 w-full md:w-1/4"
        >
          <option value="">ทุกสถานะ</option>
          <option value="active">ใช้งานอยู่</option>
          <option value="banned">ถูกแบน</option>
        </select>
      </div>

      {/* Users Card/List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">ผู้ใช้งาน ({users.length})</h2>
        {errorMsg && (
          <div className="text-center text-red-500 mb-4">{errorMsg}</div>
        )}
        {!errorMsg && users.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-8">
            ไม่พบผู้ใช้งานในระบบ หรือคุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้
          </div>
        )}
        <div className="space-y-4">
          {users
            .filter(user =>
              (!search || user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())) &&
              (!roleFilter || user.role === roleFilter) &&
              (!statusFilter || user.status === statusFilter)
            )
            .map((user) => (
              <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-gray-900">{user.name}</div>
                    <div className="text-gray-500 text-sm">{user.email}</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>{user.role === 'admin' ? 'แอดมิน' : 'ผู้ใช้'}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status === 'active' ? 'ใช้งานอยู่' : 'ถูกแบน'}</span>
                      <span className="text-xs text-gray-400">เป็นสมาชิกตั้งแต่: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <button
                    onClick={() => {
                      setEditUser(user);
                      setShowEditModal(true);
                    }}
                    className="p-2 rounded hover:bg-blue-100 text-blue-600"
                    title="แก้ไขข้อมูล"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setVisibilityUser(user);
                      setShowVisibilityModal(true);
                    }}
                    className="p-2 rounded hover:bg-gray-200 text-gray-600"
                    title={user.status === 'active' ? 'ซ่อนจากเว็บไซต์' : 'แสดงบนเว็บไซต์'}
                  >
                    {user.status === 'active' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    className="text-xs border rounded px-2 py-1 bg-white text-gray-900"
                  >
                    <option value="user">ผู้ใช้</option>
                    <option value="admin">แอดมิน</option>
                  </select>
                  {user.status === 'active' ? (
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowBanModal(true);
                      }}
                      className="p-2 rounded hover:bg-red-100 text-red-600"
                      title="แบนผู้ใช้"
                    >
                      <Ban className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnbanUser(user.id)}
                      className="p-2 rounded hover:bg-green-100 text-green-600"
                      title="ปลดแบน"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">แบนผู้ใช้</h3>
            <p className="text-gray-600 mb-4">
              คุณแน่ใจหรือไม่ว่าต้องการแบน {selectedUser.name}? ผู้ใช้นี้จะไม่สามารถเข้าสู่ระบบได้
            </p>
            <label htmlFor="banReason" className="block text-sm font-medium text-gray-700 mb-1">เหตุผลในการแบน</label>
            <select
              id="banReason"
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              required
              className="w-full border rounded p-2 mb-2"
            >
              <option value="">-- กรุณาเลือกเหตุผล --</option>
              <option value="ใช้ถ้อยคำไม่สุภาพ/หยาบคาย/ดูหมิ่น">ใช้ถ้อยคำไม่สุภาพ/หยาบคาย/ดูหมิ่น</option>
              <option value="โพสต์ข้อมูลเท็จหรือบิดเบือนความจริง">โพสต์ข้อมูลเท็จหรือบิดเบือนความจริง</option>
              <option value="โพสต์สแปมหรือเนื้อหาโฆษณา">โพสต์สแปมหรือเนื้อหาโฆษณา</option>
              <option value="เปิดเผยข้อมูลส่วนตัว">เปิดเผยข้อมูลส่วนตัว</option>
              <option value="อื่น ๆ">อื่น ๆ</option>
            </select>
            {banReason === 'อื่น ๆ' && (
              <textarea
                placeholder="กรุณาระบุรายละเอียดเพิ่มเติม..."
                value={banReasonDetail || ''}
                onChange={e => setBanReasonDetail(e.target.value)}
                className="w-full border rounded p-2 mb-4"
                rows={2}
              />
            )}
            {banError && <div className="text-red-500 text-sm mb-2">{banError}</div>}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedUser(null);
                  setBanReason('');
                  setBanReasonDetail('');
                  setBanError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleBanUser(selectedUser.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                แบนผู้ใช้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">แก้ไขข้อมูลผู้ใช้</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ</label>
              <input
                type="text"
                value={editUser.name}
                onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input
                type="email"
                value={editUser.email}
                onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.put(`/api/admin/users/${editUser.id}`, { name: editUser.name, email: editUser.email });
                    toast.success('บันทึกข้อมูลสำเร็จ');
                    fetchUsers();
                    setShowEditModal(false);
                    setEditUser(null);
                  } catch {
                    toast.error('ไม่สามารถบันทึกข้อมูลได้');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Modal */}
      {showVisibilityModal && visibilityUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">{visibilityUser.status === 'active' ? 'ซ่อนผู้ใช้' : 'แสดงผู้ใช้'}</h3>
            <p className="text-gray-600 mb-4">
              {visibilityUser.status === 'active'
                ? 'คุณแน่ใจหรือไม่ว่าต้องการซ่อนผู้ใช้นี้จากเว็บไซต์?'
                : 'คุณแน่ใจหรือไม่ว่าต้องการแสดงผู้ใช้นี้บนเว็บไซต์?'}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowVisibilityModal(false);
                  setVisibilityUser(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ยกเลิก
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.post(`/api/admin/users/${visibilityUser.id}/${visibilityUser.status === 'active' ? 'hide' : 'show'}`);
                    toast.success(visibilityUser.status === 'active' ? 'ซ่อนผู้ใช้เรียบร้อยแล้ว' : 'แสดงผู้ใช้เรียบร้อยแล้ว');
                    fetchUsers();
                    setShowVisibilityModal(false);
                    setVisibilityUser(null);
                  } catch {
                    toast.error('ไม่สามารถอัปเดตสถานะการแสดงผลได้');
                  }
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {visibilityUser.status === 'active' ? 'ซ่อน' : 'แสดง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal รายงานทั้งหมด */}
      <Modal open={showReportsModal} onClose={() => setShowReportsModal(false)}>
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <h3 className="text-lg font-medium mb-4">รายงานรีวิวที่รอดำเนินการ</h3>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {reviewReports.length === 0 && <div className="text-gray-400">ไม่มีรายงาน</div>}
            {reviewReports.filter(r => r.status !== 'resolved').map((r) => (
              <div key={r.id} className="border rounded p-3 bg-yellow-50 mb-2">
                <div
                  className="cursor-pointer"
                  onClick={async () => {
                    if (expandedReportId === r.id) {
                      setExpandedReportId(null);
                      setReportedReview(null);
                    } else {
                      setExpandedReportId(r.id);
                      try {
                        const res = await api.get(`/api/reviews/${r.reviewId}`);
                        setReportedReview(res.data.review);
                      } catch {
                        setReportedReview(null);
                      }
                    }
                  }}
                >
                  <div className="flex gap-2 items-center mb-1">
                    <span className="font-semibold text-yellow-700">{r.type}</span>
                    <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('th-TH')}</span>
                    <span className="text-xs text-gray-500">โดย {r.reporter}</span>
                  </div>
                  <div className="text-gray-700 mb-1">{r.detail || <span className="text-gray-400">(ไม่มีรายละเอียด)</span>}</div>
                  <div className="text-xs text-gray-500">สถานะ: {r.status}</div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await api.patch(`/api/admin/review-reports/${r.id}/status`, { status: 'resolved' });
                            setReviewReports(prev => prev.filter(report => report.id !== r.id));
                          } catch {
                            toast.error('ไม่สามารถอัปเดตสถานะรายงานได้');
                          }
                        }}
                      >
                        Complete
                      </button>
                    </div>
                  )}
                </div>
                {expandedReportId === r.id && (
                  <div className="mt-3 p-4 bg-gray-50 rounded border">
                    {reportedReview ? (
                      <div>
                        <div className="mb-2 font-semibold">{reportedReview.username}</div>
                        <div className="mb-2 text-sm text-gray-500">
                          {reportedReview?.createdAt || reportedReview?.created_at}
                        </div>
                        <div className="mb-2">คะแนน: {reportedReview.rating}/5</div>
                        <div className="mb-2">{reportedReview.comment}</div>
                      </div>
                    ) : (
                      <div className="text-gray-400">ไม่พบข้อมูลรีวิว</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={() => setShowReportsModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">ปิด</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default AdminDashboard;