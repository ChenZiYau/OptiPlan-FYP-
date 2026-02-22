import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

export function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (error) {
        if (error.message === 'Email not confirmed') {
          setErrors({
            form: 'Your email address has not been verified. Please check your inbox and click the confirmation link before signing in.',
          });
        } else {
          setErrors({ form: error.message });
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrors({ form: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-opti-bg relative">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Back to home */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="flex items-center gap-2 text-opti-text-secondary hover:text-opti-accent transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side — Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Link to="/" className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-opti-accent to-[#8B5CF6] flex items-center justify-center">
                <span className="text-opti-bg font-bold text-lg">O</span>
              </div>
              <span className="font-display font-semibold text-2xl text-opti-text-primary">
                OptiPlan
              </span>
            </Link>

            <h1 className="font-display font-bold text-opti-text-primary leading-tight mb-6" style={{ fontSize: 'clamp(32px, 3.5vw, 52px)' }}>
              Welcome back to{' '}
              <span className="text-gradient">OptiPlan</span>
            </h1>
            <p className="text-opti-text-secondary text-lg leading-relaxed max-w-lg">
              Your intelligent productivity companion is ready to help you achieve more.
            </p>

            {/* Decorative stats */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { value: '10k+', label: 'Active users' },
                { value: '98%', label: 'Satisfaction' },
                { value: '2M+', label: 'Tasks completed' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-4 text-center">
                  <p className="font-display font-bold text-xl text-opti-accent">{stat.value}</p>
                  <p className="text-xs text-opti-text-secondary mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side — Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12">
          <motion.div
            initial="hidden"
            animate="visible"
            className="w-full max-w-md"
          >
            {/* Mobile logo */}
            <motion.div custom={0} variants={fadeIn} className="lg:hidden mb-8 text-center">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-opti-accent to-[#8B5CF6] flex items-center justify-center">
                  <span className="text-opti-bg font-bold text-sm">O</span>
                </div>
                <span className="font-display font-semibold text-xl text-opti-text-primary">OptiPlan</span>
              </Link>
            </motion.div>

            <motion.div custom={1} variants={fadeIn} className="glass-card p-8">
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl text-opti-text-primary">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-opti-text-secondary">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-opti-accent hover:underline font-medium">
                    Sign Up
                  </Link>
                </p>
              </div>

              {errors.form && (
                <div className="mb-4 p-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
                  {errors.form}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-opti-text-primary mb-1.5">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="bg-white/5 border-white/10 text-opti-text-primary placeholder:text-opti-text-secondary/40 focus-visible:border-opti-accent focus-visible:ring-opti-accent/30"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-opti-text-primary mb-1.5">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="bg-white/5 border-white/10 text-opti-text-primary placeholder:text-opti-text-secondary/40 focus-visible:border-opti-accent focus-visible:ring-opti-accent/30 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-opti-text-secondary hover:text-opti-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="border-white/20 data-[state=checked]:bg-opti-accent data-[state=checked]:border-opti-accent"
                    />
                    <Label htmlFor="remember" className="text-sm text-opti-text-secondary font-normal cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-opti-accent hover:underline font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-opti-text-secondary font-mono uppercase tracking-wider">Or continue with</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-opti-text-primary text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-opti-text-primary text-sm font-medium hover:bg-white/10 hover:border-white/20 transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
