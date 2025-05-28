import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings, User } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Personal Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Member Since</label>
              <p className="font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary/10 p-3 rounded-full">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Account Settings</h2>
          </div>
          
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Notification Preferences
            </Button>
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default Profile;