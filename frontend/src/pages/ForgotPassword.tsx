import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { requestPasswordReset } from '../services/auth';
import { ArrowLeft } from 'lucide-react';

const schema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Enter a valid email address'),
});

type FormData = yup.InferType<typeof schema>;

const ForgotPassword: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await requestPasswordReset({ email: data.email });
      setMessage(
        response.data?.message ??
          'If the email exists in our system, a reset link has been sent. Please check your inbox.'
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unable to process request.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/login" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Link>
          <h1 className="text-3xl font-bold text-secondary-900">Forgot your password?</h1>
          <p className="mt-2 text-secondary-600">
            Enter the email address associated with your account and we’ll send you a reset link.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={`input-field ${errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending reset link…' : 'Send reset link'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-secondary-500">
          Don’t have access to your email?{' '}
          <a href="mailto:support@linksphere.com" className="text-primary-600 hover:text-primary-700 font-medium">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;





