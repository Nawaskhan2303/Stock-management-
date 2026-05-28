import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg overflow-hidden mb-4">
          <img src="https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=160&h=160&fit=crop" alt="KAPITAN" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">KAPITAN <span className="text-blue-600 font-normal text-2xl">StockFlow</span></h1>
        <p className="text-gray-600 text-lg">Multi-Branch Restaurant Stock Manager</p>
      </div>

      {isLogin ? (
        <LoginForm onToggleMode={() => setIsLogin(false)} />
      ) : (
        <SignupForm onToggleMode={() => setIsLogin(true)} />
      )}

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Manage inventory across all your restaurant branches</p>
      </div>
    </div>
  );
}
