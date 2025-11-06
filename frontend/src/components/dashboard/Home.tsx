import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Link as LinkIcon, 
  Users, 
  QrCode, 
  BarChart3, 
  ArrowRight,
  Plus,
  Activity
} from 'lucide-react';

const Home: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Profile Views', value: '0', icon: BarChart3, trend: '+0%' },
    { label: 'Total Links', value: '0', icon: LinkIcon, trend: '+0' },
    { label: 'Collaborations', value: '0', icon: Users, trend: '+0' },
  ];

  const primaryActions = [
    {
      title: 'Complete Profile',
      description: 'Add your photo and bio',
      icon: User,
      href: '/dashboard/profile',
      color: 'bg-blue-500 hover:bg-blue-600',
      progress: 25
    },
    {
      title: 'Add Links',
      description: 'Connect your social media',
      icon: LinkIcon,
      href: '/dashboard/profile',
      color: 'bg-green-500 hover:bg-green-600',
      progress: 0
    },
    {
      title: 'View QR Code',
      description: 'Share your profile easily',
      icon: QrCode,
      href: '/dashboard/profile',
      color: 'bg-purple-500 hover:bg-purple-600',
      progress: 100
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-primary-100 text-lg">
              Ready to build your perfect link hub? Let's get started.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <span className="text-sm font-medium text-green-600">{stat.trend}</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-secondary-900 mb-1">{stat.value}</p>
                <p className="text-sm text-secondary-600">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Action Row */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">Quick Actions</h2>
          <p className="text-secondary-600">Complete these steps to get the most out of Linksphere</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {primaryActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                to={action.href}
                className="group relative overflow-hidden rounded-lg p-6 border border-secondary-200 hover:border-secondary-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-secondary-400 group-hover:text-secondary-600 transition-colors" />
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-secondary-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-secondary-600">{action.description}</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      action.progress === 100 ? 'bg-green-500' : 
                      action.progress > 0 ? 'bg-blue-500' : 'bg-secondary-300'
                    }`}
                    style={{ width: `${action.progress}%` }}
                  ></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-secondary-900">Recent Activity</h2>
          <Link 
            to="/dashboard/profile"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No activity yet</h3>
          <p className="text-secondary-600 mb-6 max-w-sm mx-auto">
            Start building your profile and adding links to see your activity here
          </p>
          <Link
            to="/dashboard/profile"
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
