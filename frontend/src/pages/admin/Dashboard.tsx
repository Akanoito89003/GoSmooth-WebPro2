import { motion } from 'framer-motion';
import { BarChart3, Users, TruckIcon, ClipboardList } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      icon: <Users className="w-6 h-6" />,
      change: '+12%',
    },
    {
      title: 'Active Routes',
      value: '156',
      icon: <TruckIcon className="w-6 h-6" />,
      change: '+8%',
    },
    {
      title: 'Revenue',
      value: '$45,678',
      icon: <BarChart3 className="w-6 h-6" />,
      change: '+23%',
    },
    {
      title: 'Pending Reviews',
      value: '28',
      icon: <ClipboardList className="w-6 h-6" />,
      change: '-5%',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                {stat.icon}
              </div>
              <span className={`text-sm font-semibold ${
                stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.change}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h2>
            <p className="text-gray-600">{stat.title}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {/* Placeholder for recent activity list */}
            <p className="text-gray-600">No recent activity to display</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-4">
            {/* Placeholder for system status */}
            <p className="text-gray-600">All systems operational</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;