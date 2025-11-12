import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDropzone } from 'react-dropzone';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import QRCodeSVG from 'react-qr-code';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { generateQRWithProfile } from '../../utils/qrCodeGenerator';
import { API_CONFIG } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Upload, 
  QrCode as QrCodeIcon, 
  Download,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Instagram,
  Linkedin,
  Github,
  Youtube,
  Globe,
  Link as LinkIcon,
  X as CloseIcon,
  Check,
  Palette,
  Copy,
  Send,
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { PLAN_FEATURES } from '../../constants/subscriptions';

// Custom Facebook Icon Component
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
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
    <rect width="24" height="24" rx="4" fill="#4285F4"/>
    <path d="M12 4L8 6v2h8V6L12 4z" fill="#FFFFFF"/>
    <rect x="8" y="8" width="8" height="10" fill="#FFFFFF" rx="0.5"/>
    <rect x="10" y="10" width="2" height="2" fill="#4285F4"/>
    <rect x="13" y="10" width="2" height="2" fill="#4285F4"/>
    <rect x="10" y="13" width="2" height="2" fill="#4285F4"/>
    <rect x="13" y="13" width="2" height="2" fill="#4285F4"/>
    <rect x="10" y="16" width="5" height="2" fill="#4285F4"/>
    <circle cx="12" cy="5.5" r="1" fill="#4285F4"/>
  </svg>
);

// Types
interface ProfileData {
  id: number;
  name: string;
  tagline: string;
  location: string;
  phone: string;
  email: string;
  bio: string;
  profile_image: string;
  profile_url: string;
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

interface CroppedImage {
  file: File;
  preview: string;
}

interface QRCodeStyle {
  fgColor: string;
  bgColor: string;
  size: number;
  logo?: string;
}

// Social platform configurations
const SOCIAL_PLATFORMS = [
  { key: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { key: 'twitter', name: 'X (Twitter)', icon: TwitterXIcon, color: 'bg-black' },
  { key: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-gradient-to-r from-blue-600 to-blue-800' },
  { key: 'github', name: 'GitHub', icon: Github, color: 'bg-gradient-to-r from-gray-700 to-gray-900' },
  { key: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-gradient-to-r from-red-500 to-red-700' },
  { key: 'website', name: 'Website', icon: Globe, color: 'bg-gradient-to-r from-green-500 to-green-700' },
  { key: 'facebook', name: 'Facebook', icon: FacebookIcon, color: 'bg-gradient-to-r from-blue-600 to-blue-800' },
  { key: 'whatsapp', name: 'WhatsApp', icon: WhatsAppIcon, color: 'bg-gradient-to-r from-green-400 to-green-600' },
  { key: 'telegram', name: 'Telegram', icon: Send, color: 'bg-gradient-to-r from-blue-500 to-blue-700' },
  { key: 'google-business', name: 'Google My Business', icon: GoogleBusinessIcon, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
];

// Popular icons for custom links
const POPULAR_ICONS = [
  'link', 'mail', 'phone', 'map-pin', 'calendar', 'clock', 'star',
  'heart', 'thumbs-up', 'message-circle', 'share', 'bookmark', 'tag', 'user', 'users'
];

// Sortable Social Link Item
const SortableSocialLink: React.FC<{
  id: string;
  platform: string;
  index: number;
  register: any;
  removeSocial: (index: number) => void;
}> = ({ id, platform, index, register, removeSocial }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const platformConfig = SOCIAL_PLATFORMS.find(p => p.key === platform);
  const IconComponent = platformConfig?.icon || LinkIcon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-3 p-4 bg-white border rounded-lg transition-colors ${
        isDragging ? 'shadow-lg border-primary-300' : 'border-secondary-200'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-secondary-400 hover:text-secondary-600 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      
      <div className="flex items-center space-x-3 flex-1">
        <div className={`w-10 h-10 ${platformConfig?.color} rounded-lg flex items-center justify-center`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>
        <input
          {...register(`social_links.${index}.url`, {
            pattern: {
              value: /^https?:\/\/.+/,
              message: 'URL must start with http:// or https://'
            }
          })}
          type="url"
          placeholder={`Enter ${platformConfig?.name} URL`}
          className="flex-1 input-field"
        />
      </div>
      
      <button
        type="button"
        onClick={() => removeSocial(index)}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

// Sortable Custom Link Item
const SortableCustomLink: React.FC<{
  id: string;
  index: number;
  register: any;
  removeCustom: (index: number) => void;
}> = ({ id, index, register, removeCustom }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-3 p-4 bg-white border rounded-lg transition-colors ${
        isDragging ? 'shadow-lg border-primary-300' : 'border-secondary-200'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="text-secondary-400 hover:text-secondary-600 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      
      <div className="flex items-center space-x-3 flex-1">
        <select
          {...register(`custom_links.${index}.icon`)}
          className="input-field w-32"
        >
          {POPULAR_ICONS.map((icon) => (
            <option key={icon} value={icon}>{icon}</option>
          ))}
        </select>
        <input
          {...register(`custom_links.${index}.label`)}
          type="text"
          placeholder="Link label"
          className="input-field flex-1"
        />
        <input
          {...register(`custom_links.${index}.url`, {
            pattern: {
              value: /^https?:\/\/.+/,
              message: 'URL must start with http:// or https://'
            }
          })}
          type="url"
          placeholder="https://..."
          className="input-field flex-1"
        />
      </div>
      
      <button
        type="button"
        onClick={() => removeCustom(index)}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

// Sortable Collaboration Item
const SortableCollaboration: React.FC<{
  id: string;
  index: number;
  register: any;
  removeCollaboration: (index: number) => void;
  handleCollaborationLogoUpload: (file: File, index: number) => void;
}> = ({ id, index, register, removeCollaboration, handleCollaborationLogoUpload }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-white border rounded-lg transition-colors ${
        isDragging ? 'shadow-lg border-primary-300' : 'border-secondary-200'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="text-secondary-400 hover:text-secondary-600 mt-2 cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Logo
              </label>
              <input
                type="file"
                accept="image/*"
                className="input-field"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleCollaborationLogoUpload(file, index);
                  }
                }}
              />
              <p className="text-xs text-secondary-500 mt-1">
                Max 1MB - JPG, PNG, WEBP
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Name/Title
              </label>
              <input
                {...register(`collaborations.${index}.name`)}
                type="text"
                placeholder="Company or project name"
                className="input-field"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description
            </label>
            <textarea
              {...register(`collaborations.${index}.description`)}
              rows={2}
              placeholder="Brief description of the collaboration"
              className="input-field"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              External Link
            </label>
            <input
              {...register(`collaborations.${index}.url`, {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'URL must start with http:// or https://'
                }
              })}
              type="url"
              placeholder="https://..."
              className="input-field"
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => removeCollaboration(index)}
          className="text-red-500 hover:text-red-700 mt-2"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Helper function to convert relative image URLs to absolute URLs
const convertToAbsoluteImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return '';
  // Already absolute
  if (imageUrl.startsWith('http')) return imageUrl;
  // Convert /uploads/profiles/xxx.jpg to /backend/image.php?file=xxx.jpg&type=profiles
  if (imageUrl.startsWith('/uploads/profiles/')) {
    const filename = imageUrl.split('/').pop();
    return `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=profiles`;
  }
  // Convert /uploads/qr/xxx.jpg to /backend/image.php?file=xxx.jpg&type=qr
  if (imageUrl.startsWith('/uploads/qr/')) {
    const filename = imageUrl.split('/').pop();
    return `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=qr`;
  }
  // Convert /api/uploads/collaborations/xxx.jpg to /backend/image.php?file=xxx.jpg&type=collaborations
  if (imageUrl.startsWith('/api/uploads/collaborations/')) {
    const filename = imageUrl.split('/').pop();
    return `${API_CONFIG.BASE_URL}/image.php?file=${filename}&type=collaborations`;
  }
  // Return as-is for other relative URLs
  return imageUrl;
};

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeSvg, setQrCodeSvg] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState<CroppedImage | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [upiQRPreview, setUpiQRPreview] = useState<string>('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [qrCodeStyle, setQrCodeStyle] = useState<QRCodeStyle>({
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    size: 256
  });

  const { setProfileImage, subscription } = useAuth();
  const activePlan = subscription?.plan ?? 'free';
  const allowedFeatures = PLAN_FEATURES[activePlan] ?? PLAN_FEATURES.free;
  const hasFeature = (feature: string) => allowedFeatures.includes(feature);
  const renderLockedCard = (title: string, description: string) => (
    <div className="card border-dashed border-secondary-200 bg-secondary-50">
      <div className="flex items-start gap-3">
        <Lock className="h-5 w-5 text-secondary-400 mt-1" />
        <div>
          <h3 className="text-lg font-semibold text-secondary-900">{title}</h3>
          <p className="text-sm text-secondary-600">{description}</p>
          <a
            href="/dashboard/account"
            className="btn-primary mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    </div>
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { register, handleSubmit, control, setValue, reset, watch, formState: { errors } } = useForm<ProfileData>({
    defaultValues: {
      name: '',
      tagline: '',
      location: '',
      phone: '',
      email: '',
      bio: '',
      profile_image: '',
      profile_url: '',
      upi_id: '',
      upi_qr: '',
      social_links: [],
      custom_links: [],
      collaborations: []
    }
  });

  const buildProfileUrl = useCallback(
    (
      slug: string | undefined,
      options: { legacy?: boolean; variant?: 'connect' | 'user' | 'u'; relative?: boolean } = {}
    ) => {
      const { legacy = false, variant, relative = false } = options;
      const safeSlug = (slug ?? '').trim();
      let segment: 'connect' | 'user' | 'u';

      if (variant) {
        segment = variant;
      } else if (legacy) {
        segment = 'u';
      } else {
        segment = 'connect';
      }

      const path = safeSlug ? `${segment}/${safeSlug}` : segment;
      if (relative) {
        return `/${path}`;
      }
      return `${window.location.origin}/${path}`;
    },
    []
  );

  const profileSlug = watch('profile_url');
  const primaryProfileUrl = useMemo(() => (
    profileSlug ? buildProfileUrl(profileSlug) : ''
  ), [buildProfileUrl, profileSlug]);

  const userProfileUrl = useMemo(() => (
    profileSlug ? buildProfileUrl(profileSlug, { variant: 'user' }) : ''
  ), [buildProfileUrl, profileSlug]);

  const legacyProfileUrl = useMemo(() => (
    profileSlug ? buildProfileUrl(profileSlug, { variant: 'u' }) : ''
  ), [buildProfileUrl, profileSlug]);

  const { fields: socialFields, append: appendSocial, remove: removeSocial, move: moveSocial } = useFieldArray({
    control,
    name: 'social_links'
  });

  const { fields: customFields, append: appendCustom, remove: removeCustom, move: moveCustom } = useFieldArray({
    control,
    name: 'custom_links'
  });

  const { fields: collaborationFields, append: appendCollaboration, remove: removeCollaboration, move: moveCollaboration } = useFieldArray({
    control,
    name: 'collaborations'
  });

  // Define generateQRCode BEFORE useEffect that uses it
  const generateQRCode = useCallback(async (profileUrl: string) => {
    if (!profileUrl) return;
    
    try {
      const url = buildProfileUrl(profileUrl);
      
      // profileImageUrl is already converted to absolute URL by convertToAbsoluteImageUrl
      const absoluteImageUrl = profileImageUrl || undefined;
      
      // Generate QR with profile image overlay
      const compositeQR = await generateQRWithProfile(url, absoluteImageUrl, {
        size: qrCodeStyle.size,
        fgColor: qrCodeStyle.fgColor,
        bgColor: qrCodeStyle.bgColor,
        logoSize: 30, // 30% of QR size
        logoBorderWidth: 3
      });
      
      setQrCodeUrl(compositeQR);

      // Generate SVG QR code
      setQrCodeSvg(url);
    } catch (error: any) {
      console.error('Failed to generate QR code:', error);
      // Don't show toast for QR code errors as it's not critical
      setQrCodeSvg(buildProfileUrl(profileUrl, { variant: 'user' }));
    }
  }, [buildProfileUrl, profileImageUrl, qrCodeStyle]);

  // Load profile data
  useEffect(() => {
    // Ensure loading is set even if fetchProfile fails
    let mounted = true;
    
    const loadProfile = async () => {
      try {
        await fetchProfile();
      } catch (err) {
        console.error('Unexpected error in fetchProfile:', err);
        if (mounted) {
          setError('Unexpected error loading profile');
          setHasError(true);
          setLoading(false);
        }
      }
    };
    
    loadProfile();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate QR code when profile URL or profile image changes
  const profileUrl = watch('profile_url');
  useEffect(() => {
    if (profileUrl) {
      const timer = setTimeout(() => {
        generateQRCode(profileUrl);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [profileUrl, profileImageUrl, generateQRCode]);

  // Set image loaded when cropper image changes
  useEffect(() => {
    if (croppedImage) {
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
      };
      img.src = croppedImage.preview;
    }
  }, [croppedImage]);

  const fetchProfile = async () => {
    try {
      setError(null);
      setHasError(false);
      const response = await api.get('/profiles/me');
      
      console.log('Profile API Response:', response.data);
      
      if (response.data && response.data.success) {
        const profileData = response.data.profile;
        
        // Log the received data to help debug
        console.log('Profile Data Received:', profileData);
        
        // Ensure profileData exists and is an object
        if (!profileData || typeof profileData !== 'object') {
          console.error('Invalid profile data received:', profileData);
          setError('Invalid profile data received from server');
          setHasError(true);
          setLoading(false);
          return;
        }
        
        try {
          // Use reset() to properly initialize all form fields including nested arrays
          // Handle null/undefined values safely
          reset({
            name: profileData.name ?? '',
            tagline: profileData.tagline ?? '',
            location: profileData.location ?? '',
            phone: profileData.phone ?? '',
            email: profileData.email ?? '',
            bio: profileData.bio ?? '',
            profile_image: profileData.profile_image ?? '',
            profile_url: profileData.profile_url ?? '',
            upi_id: profileData.upi_id ?? '',
            upi_qr: profileData.upi_qr ?? '',
            social_links: Array.isArray(profileData.social_links) ? profileData.social_links : [],
            custom_links: Array.isArray(profileData.custom_links) ? profileData.custom_links : [],
            collaborations: Array.isArray(profileData.collaborations) ? profileData.collaborations : []
          });
        } catch (resetError: any) {
          console.error('Error resetting form:', resetError);
          setError('Failed to initialize form. Please refresh the page.');
          setHasError(true);
          toast.error('Failed to initialize form');
        }
        
        // Construct full URL for existing profile image
        try {
          const fullImageUrl = convertToAbsoluteImageUrl(profileData.profile_image ?? '');
          setProfileImageUrl(fullImageUrl);
          setProfileImage(fullImageUrl || null);
        } catch (imgError) {
          console.error('Error setting profile image:', imgError);
        }
        
        // Construct full URL for existing UPI QR code
        try {
          if (profileData.upi_qr) {
            const fullUpiQRUrl = convertToAbsoluteImageUrl(profileData.upi_qr);
            setUpiQRPreview(fullUpiQRUrl);
          }
        } catch (qrError) {
          console.error('Error setting UPI QR:', qrError);
        }
        
        // Generate QR code will be triggered by useEffect when profileUrl changes
      } else {
        const errorMsg = response.data?.message || 'Unknown error';
        setError('Failed to load profile: ' + errorMsg);
        setHasError(true);
        toast.error(errorMsg || 'Failed to load profile data');
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load profile data';
      setError(errorMessage);
      setHasError(true);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Image upload with drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload JPG, JPEG, PNG, or WEBP files only');
        return;
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      // Show cropper
      const reader = new FileReader();
      reader.onload = () => {
        setCroppedImage({
          file,
          preview: reader.result as string
        });
        setShowCropper(true);
        setImageLoaded(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = await createImage(imageSrc);
    
    // Ensure image is fully loaded
    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
      throw new Error('Image not fully loaded');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Set canvas dimensions to crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert to circular
    const circularCanvas = document.createElement('canvas');
    const circularCtx = circularCanvas.getContext('2d');
    
    if (!circularCtx) {
      throw new Error('No 2d context for circular canvas');
    }

    const size = Math.max(pixelCrop.width, pixelCrop.height);
    circularCanvas.width = size;
    circularCanvas.height = size;

    circularCtx.save();
    circularCtx.beginPath();
    circularCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    circularCtx.clip();
    circularCtx.drawImage(canvas, (size - pixelCrop.width) / 2, (size - pixelCrop.height) / 2);
    circularCtx.restore();

    return new Promise((resolve) => {
      circularCanvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleCropComplete = async () => {
    if (!croppedImage || !croppedAreaPixels) return;

    try {
      const croppedImageBlob = await getCroppedImg(croppedImage.preview, croppedAreaPixels);

      const formData = new FormData();
      formData.append('image', croppedImageBlob, 'profile.jpg');

      const response = await api.post('/upload/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        // Construct full URL for the image using the image serving script
        const fullImageUrl = convertToAbsoluteImageUrl(response.data.image_url);
        setProfileImageUrl(fullImageUrl);
        setProfileImage(fullImageUrl || null);
        setValue('profile_image', response.data.image_url); // Store original URL in form
        setShowCropper(false);
        setCroppedImage(null);
        setImageLoaded(false);
        toast.success('Profile image uploaded successfully');
      } else {
        toast.error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    }
  };

  // Social links management
  const addSocialLink = (platform: string) => {
    appendSocial({
      id: Date.now(),
      platform,
      url: '',
      display_order: socialFields.length
    });
  };

  // Custom links management
  const addCustomLink = () => {
    appendCustom({
      id: Date.now(),
      label: '',
      url: '',
      icon: 'link',
      display_order: customFields.length
    });
  };

  // Collaborations management
  const addCollaboration = () => {
    appendCollaboration({
      id: Date.now(),
      logo: '',
      name: '',
      description: '',
      url: '',
      display_order: collaborationFields.length
    });
  };

  // Drag and drop handlers
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Determine which array to update based on the active element's id
    if (active.id.toString().startsWith('social-')) {
      const oldIndex = socialFields.findIndex(item => `social-${item.id}` === active.id.toString());
      const newIndex = socialFields.findIndex(item => `social-${item.id}` === over.id.toString());
      if (oldIndex !== -1 && newIndex !== -1) {
        moveSocial(oldIndex, newIndex);
      }
    } else if (active.id.toString().startsWith('custom-')) {
      const oldIndex = customFields.findIndex(item => `custom-${item.id}` === active.id.toString());
      const newIndex = customFields.findIndex(item => `custom-${item.id}` === over.id.toString());
      if (oldIndex !== -1 && newIndex !== -1) {
        moveCustom(oldIndex, newIndex);
      }
    } else if (active.id.toString().startsWith('collaboration-')) {
      const oldIndex = collaborationFields.findIndex(item => `collaboration-${item.id}` === active.id.toString());
      const newIndex = collaborationFields.findIndex(item => `collaboration-${item.id}` === over.id.toString());
      if (oldIndex !== -1 && newIndex !== -1) {
        moveCollaboration(oldIndex, newIndex);
      }
    }
  };

  // Form submission
  const onSubmit = async (data: ProfileData) => {
    setSaving(true);

    try {
      // Prepare the payload with display_order set correctly
      const payload = {
        name: data.name || '',
        tagline: data.tagline || '',
        location: data.location || '',
        phone: data.phone || '',
        email: data.email || '',
        bio: data.bio || '',
        profile_image: data.profile_image || '',
        upi_id: data.upi_id || '',
        upi_qr: data.upi_qr || '',
        social_links: (data.social_links || []).map((link, index) => ({
          ...link,
          display_order: index
        })),
        custom_links: (data.custom_links || []).map((link, index) => ({
          ...link,
          display_order: index
        })),
        collaborations: (data.collaborations || []).map((collab, index) => ({
          ...collab,
          display_order: index
        }))
      };

      // Send as JSON
      const response = await api.post('/profiles/me', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        toast.success('Profile saved successfully!');
        // Refresh profile data to ensure form is updated with latest values
        await fetchProfile();
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const downloadQRCode = (format: 'png' | 'svg') => {
    if (format === 'png' && qrCodeUrl) {
      const link = document.createElement('a');
      link.download = 'profile-qr-code.png';
      link.href = qrCodeUrl;
      link.click();
    } else if (format === 'svg' && qrCodeSvg) {
      const svgElement = document.getElementById('qr-code-svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          
          const link = document.createElement('a');
          link.download = 'profile-qr-code.png';
          link.href = pngFile;
          link.click();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      }
    }
  };

  const handleCollaborationLogoUpload = async (file: File, index: number) => {
    // Validate file size (1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Logo size must be less than 1MB');
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await api.post('/upload/collaboration-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setValue(`collaborations.${index}.logo` as const, response.data.logo_url);
        toast.success('Logo uploaded successfully');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error('Failed to upload logo');
    }
  };

  const handleUpiQRUpload = async (file: File) => {
    // Validate file size (1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('QR code size must be less than 1MB');
      return;
    }

    // Show immediate preview using createObjectURL
    const previewUrl = URL.createObjectURL(file);
    setUpiQRPreview(previewUrl);

    const formData = new FormData();
    formData.append('qr', file);

    try {
      const response = await api.post('/upload/upi-qr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setValue('upi_qr', response.data.qr_url);
        // Replace preview URL with the server URL
        URL.revokeObjectURL(previewUrl);
        const fullUpiQRUrl = convertToAbsoluteImageUrl(response.data.qr_url);
        setUpiQRPreview(fullUpiQRUrl);
        toast.success('UPI QR code uploaded successfully');
      }
    } catch (error) {
      console.error('Failed to upload UPI QR code:', error);
      toast.error('Failed to upload UPI QR code');
      // Clean up preview URL on error
      URL.revokeObjectURL(previewUrl);
      setUpiQRPreview('');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || hasError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <CloseIcon className="h-12 w-12 mx-auto mb-2" />
              <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
              <p className="text-secondary-600 mb-4">{error || 'An error occurred while loading your profile'}</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setHasError(false);
                setLoading(true);
                fetchProfile();
              }}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Always render something - even if there's an issue, show the form
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 mb-2">Profile Settings</h1>
        <p className="text-secondary-600">
          Customize your public profile and manage your links
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Profile Image Upload */}
            <div className="card">
              <h2 className="text-xl font-semibold text-secondary-900 mb-6">Profile Image</h2>
              
              <div className="flex items-start space-x-6">
                {/* Image Preview */}
                <div className="w-24 h-24 bg-secondary-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {profileImageUrl ? (
                    <img 
                      src={profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="h-8 w-8 text-secondary-400" />
                  )}
                </div>

                {/* Upload Area */}
                <div className="flex-1">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-secondary-300 hover:border-primary-400 hover:bg-secondary-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
                    <p className="text-sm text-secondary-600 mb-1">
                      {isDragActive ? 'Drop the image here' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-secondary-500">
                      JPG, JPEG, PNG, WEBP up to 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-secondary-900 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    {...register('name', { required: 'Name is required', maxLength: 100 })}
                    type="text"
                    id="name"
                    className={`input-field ${errors.name ? 'border-red-300' : ''}`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Tagline */}
                <div className="md:col-span-2">
                  <label htmlFor="tagline" className="block text-sm font-medium text-secondary-700 mb-2">
                    Professional Tagline
                  </label>
                  <input
                    {...register('tagline', { maxLength: 150 })}
                    type="text"
                    id="tagline"
                    className="input-field"
                    placeholder="e.g., Digital Creator & Entrepreneur"
                  />
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    {...register('phone', {
                      pattern: {
                        value: /^[\+]?[0-9\s\-\(\)]+$/,
                        message: 'Please enter a valid phone number'
                      },
                      maxLength: 50
                    })}
                    type="tel"
                    id="phone"
                    className={`input-field ${errors.phone ? 'border-red-300' : ''}`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                    Email
                  </label>
                  <input
                    {...register('email', {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    type="email"
                    id="email"
                    className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-secondary-700 mb-2">
                    Location
                  </label>
                  <input
                    {...register('location', { maxLength: 100 })}
                    type="text"
                    id="location"
                    className="input-field"
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-secondary-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    {...register('bio', { maxLength: 500 })}
                    id="bio"
                    rows={4}
                    className="input-field"
                    placeholder="Tell people about yourself..."
                  />
                  <p className="mt-1 text-xs text-secondary-500">
                    {watch('bio')?.length || 0}/500 characters
                  </p>
                </div>

                {/* UPI Payment Section */}
                {hasFeature('payment') ? (
                <div className="md:col-span-2 border-t border-secondary-200 pt-6 mt-2">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">UPI Payment Settings</h3>
                  
                  {/* UPI ID */}
                  <div className="mb-6">
                    <label htmlFor="upi_id" className="block text-sm font-medium text-secondary-700 mb-2">
                      UPI ID (for Payments)
                    </label>
                    <input
                      {...register('upi_id', {
                        pattern: {
                          value: /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/,
                          message: 'Invalid UPI ID format. Expected: user@bank'
                        }
                      })}
                      type="text"
                      id="upi_id"
                      className={`input-field ${errors.upi_id ? 'border-red-300' : ''}`}
                      placeholder="yourname@bank"
                    />
                    {errors.upi_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.upi_id.message}</p>
                    )}
                    <p className="mt-1 text-xs text-secondary-500">
                      Example: john.doe@paytm or user123@ybl
                    </p>
                  </div>

                  {/* UPI QR Code */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      UPI QR Code
                    </label>
                    {upiQRPreview ? (
                      <div className="mb-4">
                        <img 
                          src={upiQRPreview} 
                          alt="UPI QR Code" 
                          className="w-32 h-32 border-2 border-secondary-200 rounded-lg object-contain bg-white"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 w-32 h-32 border-2 border-dashed border-secondary-300 rounded-lg flex items-center justify-center bg-secondary-50">
                        <ImageIcon className="h-12 w-12 text-secondary-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUpiQRUpload(file);
                        }
                      }}
                    />
                    <p className="mt-1 text-xs text-secondary-500">
                      Upload QR code for payments (max 1MB - JPG, PNG, WEBP)
                    </p>
                  </div>
                </div>
                ) : null}
              </div>
            </div>

            {/* Social Links */}
            {hasFeature('social_links') ? (
            <div className="card">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Social Links</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <button
                      key={platform.key}
                      type="button"
                      onClick={() => addSocialLink(platform.key)}
                      className="flex items-center px-3 py-1 text-xs bg-secondary-100 hover:bg-secondary-200 rounded-full transition-colors"
                    >
                      <platform.icon className="h-3 w-3 mr-1" />
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={socialFields.map(field => `social-${field.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {socialFields.map((field, index) => (
                      <SortableSocialLink
                        key={field.id}
                        id={`social-${field.id}`}
                        platform={field.platform}
                        index={index}
                        register={register}
                        removeSocial={removeSocial}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            ) : null}

            {/* Custom Links */}
            {hasFeature('custom_links') ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Custom Links</h2>
                <button
                  type="button"
                  onClick={addCustomLink}
                  className="btn-secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Link
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={customFields.map(field => `custom-${field.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {customFields.map((field, index) => (
                      <SortableCustomLink
                        key={field.id}
                        id={`custom-${field.id}`}
                        index={index}
                        register={register}
                        removeCustom={removeCustom}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            ) : null}

            {/* Collaborations */}
            {hasFeature('collaborations') ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Proud Member of</h2>
                <button
                  type="button"
                  onClick={addCollaboration}
                  className="btn-secondary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Collaboration
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={collaborationFields.map(field => `collaboration-${field.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {collaborationFields.map((field, index) => (
                      <SortableCollaboration
                        key={field.id}
                        id={`collaboration-${field.id}`}
                        index={index}
                        register={register}
                        removeCollaboration={removeCollaboration}
                        handleCollaborationLogoUpload={handleCollaborationLogoUpload}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            ) : null}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                <span className="whitespace-nowrap">{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">QR Code</h2>
              <button
                type="button"
                onClick={() => setQrCodeStyle({...qrCodeStyle, fgColor: qrCodeStyle.fgColor === '#000000' ? '#2563eb' : '#000000'})}
                className="btn-secondary text-xs"
              >
                <Palette className="h-3 w-3 mr-1" />
                Style
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-48 h-48 bg-white border-2 border-secondary-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                {qrCodeSvg ? (
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={qrCodeSvg}
                    size={180}
                    fgColor={qrCodeStyle.fgColor}
                    bgColor={qrCodeStyle.bgColor}
                  />
                ) : (
                  <QrCodeIcon className="h-12 w-12 text-secondary-400" />
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => downloadQRCode('png')}
                  className="btn-primary flex-1 text-sm"
                  disabled={!qrCodeUrl}
                >
                  <Download className="h-4 w-4 mr-1" />
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => downloadQRCode('svg')}
                  className="btn-secondary flex-1 text-sm"
                  disabled={!qrCodeSvg}
                >
                  <Download className="h-4 w-4 mr-1" />
                  SVG
                </button>
              </div>
              
              {/* Sharable URL */}
              {profileSlug && (
                <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-600 mb-2 font-medium">Your Profile URL:</p>
                  <div className="flex items-center space-x-2">
                    <a
                      href={primaryProfileUrl || userProfileUrl || legacyProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:text-primary-700 font-mono break-all flex-1"
                      data-user-url={userProfileUrl}
                      data-legacy-url={legacyProfileUrl}
                    >
                      {primaryProfileUrl || userProfileUrl || legacyProfileUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(primaryProfileUrl || userProfileUrl || legacyProfileUrl);
                        toast.success('URL copied to clipboard!');
                      }}
                      className="text-secondary-500 hover:text-secondary-700 p-1"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Preview removed intentionally */}
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && croppedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Crop Profile Image</h3>
                <button
                  onClick={() => setShowCropper(false)}
                  className="text-secondary-400 hover:text-secondary-600"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <Cropper
                    image={croppedImage.preview}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={(_, croppedAreaPixels) => {
                      setCroppedAreaPixels(croppedAreaPixels);
                    }}
                    onZoomChange={setZoom}
                    showGrid={true}
                    style={{
                      containerStyle: {
                        width: '100%',
                        height: '100%',
                        position: 'relative'
                      }
                    }}
                  />
                </div>
                
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Zoom:</span>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-24"
                    />
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCropper(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropComplete}
                  disabled={!imageLoaded || !croppedAreaPixels}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Crop & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
