import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { resetPasswordWithToken } from '../services/auth';
import { Eye, EyeOff } from 'lucide-react';

const schema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

type FormData = yup.InferType<typeof schema>;

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const token = useMemo(
    () => new URLSearchParams(window.location.search).get('token') ?? '',
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  const handleReset = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid or expired reset link.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPasswordWithToken({
        token,
        password: data.password,
      });

      toast.success(response.data?.message ?? 'Password reset successful');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? error?.message ?? 'Unable to reset password';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">Reset Password</h1>
              <p className="mt-2 text-secondary-600">Invalid or expired reset link.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full btn-primary py-3"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-secondary-900">Reset Your Password</h1>
            <p className="text-secondary-600">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit(handleReset)} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field pr-10 ${errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  placeholder="Enter a new password"
                  {...register('password')}
                  value={passwordValue}
                  onChange={(event) => setValue('password', event.target.value, { shouldValidate: true })}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  className={`input-field pr-10 ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Confirm your new password"
                  {...register('confirmPassword')}
                  value={confirmPasswordValue}
                  onChange={(event) =>
                    setValue('confirmPassword', event.target.value, { shouldValidate: true, shouldDirty: true })
                  }
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-500"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
