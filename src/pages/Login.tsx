import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(0);
  
  const { user, login, register, sendCode } = useAuthStore();

  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (countdown > 0) return;
    if (!email) {
      setMessage('请输入邮箱地址');
      return;
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setMessage('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const { error } = await sendCode(email);
      if (error) throw new Error(error);
      setMessage('验证码已发送，请查收邮件');
      setShowCodeInput(true);
      setCountdown(60);
    } catch (err: any) {
      console.error('Failed to send code:', err);
      setMessage(err.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await login(email, password);
        if (error) throw new Error(error);
        setMessage('登录成功！');
      } else {
        if (!showCodeInput) {
           setMessage('请先获取验证码');
           setLoading(false);
           return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          throw new Error('请输入有效的邮箱地址');
        }
        
        const { error } = await register(email, password, code);
        if (error) throw new Error(error);
        setMessage('注册成功！');
      }
    } catch (err: any) {
      console.error('Operation failed:', err);
      setMessage(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* Left Side - Hero / Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0">
            <img 
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
                alt="Abstract Background" 
                className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col justify-between p-12 text-white">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">FluxVerse</span>
            </div>

            <div className="mb-12">
                <h1 className="text-5xl font-bold leading-tight mb-6">
                    连接中国 <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        AI 创新力量
                    </span>
                </h1>
                <p className="text-lg text-gray-300 max-w-md leading-relaxed">
                    加入 FluxVerse，探索全中国最优质的 AI 活动、黑客松与技术工坊。打破信息茧房，连接未来。
                </p>

                <div className="mt-8 flex gap-4">
                    <div className="flex -space-x-3">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 overflow-hidden">
                                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-sm font-bold">10,000+</span>
                        <span className="text-xs text-gray-400">创新者已加入</span>
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-500">
                © 2026 FluxVerse Inc. All rights reserved.
            </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 lg:p-24 bg-white relative">
        {/* Mobile Header (Only visible on small screens) */}
        <div className="absolute top-6 left-6 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">FluxVerse</span>
            </Link>
        </div>

        <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    {isLogin ? '欢迎回来' : '创建新账号'}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                    {isLogin ? '请输入您的账号信息以继续' : '免费注册，开启您的探索之旅'}
                </p>
            </div>

            {/* Error/Success Message */}
            <AnimatePresence mode="wait">
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                            message.includes('成功') 
                            ? 'bg-green-50 text-green-700 border border-green-100' 
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                    >
                        {message.includes('成功') ? <CheckCircle2 size={18} /> : <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        {message}
                    </motion.div>
                )}
            </AnimatePresence>

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">邮箱地址</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all sm:text-sm bg-gray-50/50 hover:bg-white focus:bg-white"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">密码</label>
                            {isLogin && (
                                <a href="#" className="text-xs font-medium text-gray-500 hover:text-black">忘记密码?</a>
                            )}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all sm:text-sm bg-gray-50/50 hover:bg-white focus:bg-white"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Verification Code (Register Only) */}
                    <AnimatePresence>
                        {!isLogin && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-1.5 overflow-hidden"
                            >
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700">验证码</label>
                                <div className="flex gap-3">
                                    <input
                                        id="code"
                                        name="code"
                                        type="text"
                                        required={!isLogin}
                                        className="block w-full px-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all sm:text-sm bg-gray-50/50 hover:bg-white focus:bg-white"
                                        placeholder="6位验证码"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendCode}
                                        disabled={loading || countdown > 0}
                                        className="whitespace-nowrap px-5 py-3 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        {countdown > 0 ? `${countdown}s` : (showCodeInput ? '重发' : '获取验证码')}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <span className="flex items-center">
                                {isLogin ? '登录' : '创建账号'}
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </button>
                </div>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">或者</span>
                </div>
            </div>

            <div className="text-center">
                <p className="text-sm text-gray-600">
                    {isLogin ? '还没有账号？' : '已有账号？'}
                    <button
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setMessage('');
                            setShowCodeInput(false);
                        }}
                        className="ml-2 font-bold text-black hover:underline focus:outline-none"
                    >
                        {isLogin ? '立即注册' : '直接登录'}
                    </button>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
