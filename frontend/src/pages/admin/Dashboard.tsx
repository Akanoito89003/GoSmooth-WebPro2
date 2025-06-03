import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { Edit, Eye, EyeOff, Trash2, UserCog, ShieldBan, User as UserIcon, Mail, Calendar, ShieldCheck } from 'lucide-react';

const roleColors: Record<string, string> = {
  user: 'bg-gray-200 text-gray-800',
  moderator: 'bg-blue-200 text-blue-800',
  admin: 'bg-red-200 text-red-800',
};
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  banned: 'bg-red-100 text-red-700',
  hidden: 'bg-gray-100 text-gray-500',
};

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminAPI.getUsers(1, 100)
      .then(res => setUsers(res.data.users || res.data))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this user?')) {
      await adminAPI.deleteUser(id);
      setRefresh(r => !r);
    }
  };
  const handleBan = async (user: any) => {
    if (window.confirm(user.status === 'banned' ? 'Unban this user?' : 'Ban this user?')) {
      await adminAPI.updateUser(user.id, { status: user.status === 'banned' ? 'active' : 'banned' });
      setRefresh(r => !r);
    }
  };
  const handleHide = async (user: any) => {
    await adminAPI.updateUser(user.id, { status: user.status === 'hidden' ? 'active' : 'hidden' });
    setRefresh(r => !r);
  };
  const handleRole = async (user: any) => {
    const nextRole = user.role === 'user' ? 'moderator' : user.role === 'moderator' ? 'admin' : 'user';
    await adminAPI.updateUser(user.id, { role: nextRole });
    setRefresh(r => !r);
  };

  const filtered = users.filter(u =>
    (!search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) &&
    (!roleFilter || u.role === roleFilter) &&
    (!statusFilter || u.status === statusFilter)
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input input-bordered w-60" placeholder="ค้นหาผู้ใช้งาน..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select select-bordered" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
        <select className="select select-bordered" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>
      <div className="space-y-3">
        {loading ? <div>Loading...</div> : filtered.length === 0 ? <div>No users found.</div> : filtered.map(user => (
          <div key={user.id} className="bg-white rounded-lg shadow flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold">{user.name?.[0] || '?'}</div>
              <div>
                <div className="font-bold text-lg flex items-center gap-2">{user.name} {user.status === 'hidden' && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-1">Hidden</span>}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</div>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${roleColors[user.role]}`}>{user.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[user.status || 'active']}`}>{user.status || 'active'}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-4 h-4" /> {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm btn-outline" title="Edit"><Edit className="w-4 h-4" /></button>
              <button className="btn btn-sm btn-outline" title={user.status === 'hidden' ? 'Show' : 'Hide'} onClick={() => handleHide(user)}>{user.status === 'hidden' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
              <button className="btn btn-sm btn-outline" title={user.status === 'banned' ? 'Unban' : 'Ban'} onClick={() => handleBan(user)}><ShieldBan className="w-4 h-4" /></button>
              <button className="btn btn-sm btn-outline" title="Change Role" onClick={() => handleRole(user)}><UserCog className="w-4 h-4" /></button>
              <button className="btn btn-sm btn-error" title="Delete" onClick={() => handleDelete(user.id)}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default UserManagement;