import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { API_CONFIG } from '../config/api';
import { 
  MapPin, 
  Phone,
  Mail,
  ExternalLink, 
  Linkedin, 
  Github, 
  Youtube,
  Globe,
  Send,
  Share2,
  X,
  QrCode,
  Download,
  CreditCard,
  Copy
} from 'lucide-react';
import { generateMapUrl } from '../utils/mapUtils';
import { generateQRWithProfile } from '../utils/qrCodeGenerator';
import useDynamicFavicon from '../hooks/useFavicon';

// Custom Facebook Icon Component
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// Custom Instagram Icon Component
const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

// Custom WhatsApp Icon Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
  </svg>
);

const TwitterXIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 3h3.619l-7.884 9.058L22 21h-6.393l-4.613-5.414L5.6 21H2l8.533-9.823L2 3h6.393l4.193 4.923L18.244 3Z" />
  </svg>
);

// Custom Google My Business Icon Component
const GoogleBusinessIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 1.6c5.742 0 10.4 4.658 10.4 10.4S17.742 22.4 12 22.4 1.6 17.742 1.6 12 6.258 1.6 12 1.6z" fill="#4285F4"/>
    <path d="M12 6.4c-3.078 0-5.6 2.522-5.6 5.6s2.522 5.6 5.6 5.6 5.6-2.522 5.6-5.6-2.522-5.6-5.6-5.6zm0 1.6c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" fill="#4285F4"/>
    <circle cx="12" cy="12" r="2" fill="#FFFFFF"/>
  </svg>
);

interface ProfileData {
  name: string;
  tagline: string;
  location: string;
  phone: string;
  email: string;
  bio: string;
  profile_image: string;
  upi_id: string;
  upi_qr: string;
  social_links: SocialLink[];
  custom_links: CustomLink[];
  collaborations: Collaboration[];
}

interface SocialLink {
  id: number;
  platform: string;
  url: string;
  display_order: number;
}

interface CustomLink {
  id: number;
  label: string;
  url: string;
  icon: string;
  display_order: number;
}

interface Collaboration {
  id: number;
  logo: string;
  name: string;
  description: string;
  url: string;
  display_order: number;
}

// Helper function to convert relative image URLs to absolute URLs
const convertToAbsoluteImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  // Already absolute
  if (imageUrl.startsWith('http')) return imageUrl;
  // Convert /uploads/profiles/xxx.jpg to backend/public/image.php?file=xxx.jpg&type=profiles
  if (imageUrl.startsWith('/uploads/profiles/')) {
    const filename = imageUrl.split('/').pop();
    return `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=profiles`;
  }
  // Convert /uploads/qr/xxx.jpg to backend/public/image.php?file=xxx.jpg&type=qr
  if (imageUrl.startsWith('/uploads/qr/')) {
    const filename = imageUrl.split('/').pop();
    return `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=qr`;
  }
  // Convert /api/uploads/collaborations/xxx.jpg to backend/public/image.php?file=xxx.jpg&type=collaborations
  if (imageUrl.startsWith('/api/uploads/collaborations/')) {
    const filename = imageUrl.split('/').pop();
    return `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=collaborations`;
  }
  // Return as-is for other relative URLs
  return imageUrl;
};

const PublicProfile: React.FC = () => {
  const { profileUrl } = useParams<{ profileUrl: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrError, setQrError] = useState(false);

  const profileImageUrl = useMemo(() => {
    if (!profile?.profile_image) return '';
    return convertToAbsoluteImageUrl(profile.profile_image);
  }, [profile?.profile_image]);

  const buildProfileUrl = useCallback(
    (slug: string, { variant = 'connect' }: { variant?: 'connect' | 'user' | 'u' } = {}) => {
      return `${window.location.origin}/${variant}/${slug}`;
    },
    []
  );

  useDynamicFavicon(profileImageUrl || null, { fallbackHref: '/default-avatar.png' });

  useEffect(() => {
    if (profileUrl) {
      fetchProfile(profileUrl);
    }
  }, [profileUrl]);

  // Generate QR code when profileUrl or profile is available
  useEffect(() => {
    if (profileUrl && profile) {
      generateQRCode(profileUrl);
    }
  }, [profileUrl, profile]);

  // Generate QR code function
  const generateQRCode = async (profileUrl: string) => {
    try {
      setQrError(false); // Reset error state
      const url = buildProfileUrl(profileUrl);
      
      // Get full profile image URL using helper function
      const imageUrl = profile?.profile_image 
        ? convertToAbsoluteImageUrl(profile.profile_image)
        : undefined;
      
      // Generate QR with profile image overlay
      const compositeQR = await generateQRWithProfile(url, imageUrl, {
        size: 256,
        fgColor: '#000000',
        bgColor: '#FFFFFF',
        logoSize: 30,
        logoBorderWidth: 3
      });
      
      setQrCodeUrl(compositeQR);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setQrError(true); // Set error state
    }
  };

  // Download QR code function
  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = 'profile-qr-code.png';
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const copyUpiId = async () => {
    if (profile?.upi_id) {
      try {
        await navigator.clipboard.writeText(profile.upi_id);
        alert('UPI ID copied!');
      } catch (err) {
        console.error('Failed to copy UPI ID: ', err);
        alert('Failed to copy UPI ID');
      }
    }
  };

  const downloadUpiQR = () => {
    if (profile?.upi_qr) {
      const qrImageUrl = convertToAbsoluteImageUrl(profile.upi_qr);
      const link = document.createElement('a');
      link.download = 'upi-qr-code.jpg';
      link.href = qrImageUrl;
      link.click();
    }
  };

  const openUpiPayment = () => {
    if (profile?.upi_id && profile?.name) {
      const upiLink = `upi://pay?pa=${encodeURIComponent(profile.upi_id)}&pn=${encodeURIComponent(profile.name)}`;
      window.location.href = upiLink;
    }
  };

  // Generate share URL based on environment
  const getShareUrl = ({ variant = 'connect' }: { variant?: 'connect' | 'user' | 'u' } = {}) => {
    if (!profileUrl) return '';
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isDevelopment ? 'http://localhost:5173' : 'https://qr.dzyte.com';
    const segment = variant;
    return `${baseUrl}/${segment}/${profileUrl}`;
  };

  // Share functions for different platforms
  const shareToWhatsApp = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Check out ${profile?.name}'s profile!`);
    window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, '_blank');
  };

  const shareToLinkedIn = () => {
    const text = encodeURIComponent(`Check out ${profile?.name}'s profile! ${getShareUrl()}`);
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Check out ${profile?.name}'s profile!`);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      // Show toast message (you can replace this with your preferred toast library)
      alert('Profile link copied!');
      setShowShareModal(false);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy link');
    }
  };

  const fetchProfile = async (url: string) => {
    try {
      const response = await api.get(`/profiles/${url}`);
      if (response.data.success) {
        setProfile(response.data.profile);
      } else {
        setError('Profile not found');
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const iconClass = "h-5 w-5";
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <InstagramIcon className={iconClass} />;
      case 'twitter':
        return <TwitterXIcon className={iconClass} />;
      case 'linkedin':
        return <Linkedin className={iconClass} />;
      case 'github':
        return <Github className={iconClass} />;
      case 'youtube':
        return <Youtube className={iconClass} />;
      case 'website':
        return <Globe className={iconClass} />;
      case 'facebook':
        return <FacebookIcon className={iconClass} />;
      case 'whatsapp':
        return <WhatsAppIcon className={iconClass} />;
      case 'telegram':
        return <Send className={iconClass} />;
      case 'google-business':
        return <GoogleBusinessIcon className={iconClass} />;
      default:
        return <ExternalLink className={iconClass} />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return 'from-purple-500 to-pink-500';
      case 'twitter':
        return 'from-black to-black';
      case 'linkedin':
        return 'from-blue-600 to-blue-800';
      case 'github':
        return 'from-gray-700 to-gray-900';
      case 'youtube':
        return 'from-red-500 to-red-700';
      case 'website':
        return 'from-green-500 to-green-700';
      case 'facebook':
        return 'from-blue-600 to-blue-800';
      case 'whatsapp':
        return 'from-green-400 to-green-600';
      case 'telegram':
        return 'from-blue-500 to-blue-700';
      case 'google-business':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-primary-500 to-primary-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Profile Not Found</h1>
          <p className="text-secondary-600 mb-8">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <a
            href="/"
            className="btn-primary"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div style={{ backgroundColor: '#EDE7F6' }} className="p-8 relative">
            {/* View QR Button and Label */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <button
                onClick={() => setShowQRModal(true)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
                aria-label="View QR code"
              >
                <QrCode className="h-5 w-5 text-[#1E293B]" />
              </button>
              <span className="text-sm font-medium text-[#334155] hidden sm:block">
                View QR
              </span>
            </div>

            {/* Share Button and Label */}
            <div className="absolute top-4 right-4 flex items-center space-x-2">
              <button
                onClick={() => setShowShareModal(true)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
                aria-label="Share profile"
              >
                <Share2 className="h-5 w-5 text-[#1E293B]" />
              </button>
              <span className="text-sm font-medium text-[#334155] hidden sm:block">
                Share Profile
              </span>
            </div>
            
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {profile.profile_image ? (
                <img 
                  src={convertToAbsoluteImageUrl(profile.profile_image)}
                  alt={profile.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2 text-[#1E293B]">{profile.name}</h1>
            {profile.tagline && (
              <p className="text-[#334155] mb-2">{profile.tagline}</p>
            )}
            {profile.location && (
              <div className="flex items-center text-[#334155] text-sm font-semibold mb-1">
                <MapPin className="h-4 w-4 mr-1" />
                <a 
                  href={generateMapUrl(profile.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline cursor-pointer transition-all duration-200 hover:text-[#1E293B]"
                >
                  {profile.location}
                </a>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center text-[#334155] text-sm font-semibold">
                <Phone className="h-4 w-4 mr-1" />
                <a href={`tel:${profile.phone}`} className="hover:underline">
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center text-[#334155] text-sm font-semibold">
                <Mail className="h-4 w-4 mr-1" />
                <a href={`mailto:${profile.email}`} className="hover:underline">
                  {profile.email}
                </a>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="p-6 border-b border-secondary-200">
              <p className="text-secondary-700 text-center leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Social Links */}
          {profile.social_links && profile.social_links.length > 0 && (
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4 text-center">Connect</h2>
              <div className="space-y-3">
                {profile.social_links
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center p-4 rounded-xl text-white font-medium transition-transform hover:scale-105 bg-gradient-to-r ${getPlatformColor(link.platform)}`}
                    >
                      {getPlatformIcon(link.platform)}
                      <span className="ml-3 capitalize">{link.platform}</span>
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Custom Links */}
          {profile.custom_links && profile.custom_links.length > 0 && (
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4 text-center">Links</h2>
              <div className="space-y-3">
                {profile.custom_links
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium transition-transform hover:scale-105"
                    >
                      {link.icon ? (
                        <img src={link.icon} alt={link.label} className="h-5 w-5" />
                      ) : (
                        <ExternalLink className="h-5 w-5" />
                      )}
                      <span className="ml-3">{link.label}</span>
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Collaborations */}
          {profile.collaborations && profile.collaborations.length > 0 && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4 text-center">Proud Member of</h2>
              <div className="space-y-4">
                {profile.collaborations
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((collab) => (
                    <div key={collab.id} className="bg-secondary-50 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        {collab.logo && (
                          <img 
                            src={convertToAbsoluteImageUrl(collab.logo)}
                            alt={collab.name} 
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary-900 mb-1">{collab.name}</h3>
                          {collab.description && (
                            <p className="text-sm text-secondary-600 mb-2">{collab.description}</p>
                          )}
                          {collab.url && (
                            <a
                              href={collab.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center"
                            >
                              Learn More
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Make Payment Button */}
          {(profile.upi_id || profile.upi_qr) && (
            <div className="p-6 border-b border-secondary-200">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl text-white font-medium transition-transform hover:scale-105 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                <CreditCard className="h-5 w-5" />
                <span>Make Payment</span>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 bg-secondary-50 text-center">
            <p className="text-sm text-secondary-500">
              Powered by <span className="font-semibold text-primary-600">Linksphere</span>
            </p>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Share Profile</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-secondary-100 hover:bg-secondary-200 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-secondary-600" />
              </button>
            </div>

            {/* Share Options */}
            <div className="space-y-3">
              {/* WhatsApp */}
              <button
                onClick={shareToWhatsApp}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white transition-all duration-200 hover:scale-105"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <WhatsAppIcon className="h-5 w-5" />
                </div>
                <span className="font-medium">WhatsApp</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={shareToLinkedIn}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white transition-all duration-200 hover:scale-105"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Linkedin className="h-5 w-5" />
                </div>
                <span className="font-medium">LinkedIn</span>
              </button>

              {/* Telegram */}
              <button
                onClick={shareToTelegram}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white transition-all duration-200 hover:scale-105"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Send className="h-5 w-5" />
                </div>
                <span className="font-medium">Telegram</span>
              </button>


              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-700 hover:from-secondary-600 hover:to-secondary-800 text-white transition-all duration-200 hover:scale-105"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <span className="font-medium">Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Profile QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-8 h-8 rounded-full bg-secondary-100 hover:bg-secondary-200 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-secondary-600" />
              </button>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center mb-6">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Profile QR Code" className="w-full max-w-xs" />
              ) : qrError ? (
                <div className="w-full max-w-xs aspect-square bg-red-50 rounded-lg flex flex-col items-center justify-center p-4">
                  <X className="h-12 w-12 text-red-500 mb-2" />
                  <p className="text-red-600 text-sm text-center">Failed to generate QR code</p>
                </div>
              ) : (
                <div className="w-full max-w-xs aspect-square bg-secondary-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="space-y-3">
              <button
                onClick={downloadQRCode}
                disabled={!qrCodeUrl}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium">Download QR</span>
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-secondary-100 hover:bg-secondary-200 text-secondary-900 transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Make Payment</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-secondary-100 hover:bg-secondary-200 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-secondary-600" />
              </button>
            </div>

            {/* UPI QR Code Display */}
            {profile?.upi_qr && (
              <div className="flex justify-center mb-6">
                <img 
                  src={convertToAbsoluteImageUrl(profile.upi_qr)} 
                  alt="UPI QR Code" 
                  className="w-64 h-64 max-w-full object-contain border-2 border-secondary-200 rounded-lg"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="space-y-3">
              {profile?.upi_id && (
                <button
                  onClick={copyUpiId}
                  className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 hover:scale-105"
                >
                  <Copy className="h-5 w-5" />
                  <span className="font-medium">Copy UPI ID</span>
                </button>
              )}
              
              {profile?.upi_qr && (
                <button
                  onClick={downloadUpiQR}
                  className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-all duration-200 hover:scale-105"
                >
                  <Download className="h-5 w-5" />
                  <span className="font-medium">Download QR</span>
                </button>
              )}
              
              {profile?.upi_id && (
                <button
                  onClick={openUpiPayment}
                  className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-200 hover:scale-105"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Pay Now</span>
                </button>
              )}
              
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-secondary-100 hover:bg-secondary-200 text-secondary-900 transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;


