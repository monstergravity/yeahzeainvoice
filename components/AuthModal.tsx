import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { authService } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userId: string) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // 登录
        const { data, error: signInError } = await authService.signIn(email, password);
        if (signInError) {
          setError(signInError.message || 'Sign in failed. Please check your email and password.');
          return;
        }
        if (data?.user) {
          onAuthSuccess(data.user.id);
          onClose();
        }
      } else {
        // 注册
        const { data, error: signUpError } = await authService.signUp(email, password);
        if (signUpError) {
          setError(signUpError.message || 'Sign up failed. Please try again.');
          return;
        }
        if (data?.user) {
          // 注册成功后自动登录
          onAuthSuccess(data.user.id);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'Sign in to access your expense data' : 'Create a new account to get started'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 items-start">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-800">
              {error.includes('登录失败') ? 'Sign in failed. Please check your email and password.' :
               error.includes('注册失败') ? 'Sign up failed. Please try again.' :
               error.includes('操作失败') ? 'Operation failed. Please try again.' :
               error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none"
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-green hover:bg-green-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-brand-green hover:text-green-600 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

