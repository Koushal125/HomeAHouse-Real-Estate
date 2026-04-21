import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { ROUTES, ROLES } from '../../utils/constants';
import { getApiErrorMessage } from '../../utils/errorMessages';
import { AlertCircle, ArrowRight, Building2, CheckCircle, Lock, Mail, MapPin, Phone, User, Sparkles, Eye, EyeOff } from 'lucide-react';
import InlineNavbar from '../../components/layout/InlineNavbar';

const schema = yup.object({
  name: yup.string().trim().required('Full name is required.'),
  email: yup.string().email('Please enter a valid email address.').required('Email is required.'),
  phone: yup.string().trim().required('Phone number is required.'),
  city: yup.string().trim().optional(),
  role: yup.string().oneOf([ROLES.CUSTOMER, ROLES.BROKER]).required('Role is required.'),
  password: yup.string().min(8, 'Password must be at least 8 characters.').required('Password is required.'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match.')
    .required('Confirm password is required.'),
}).required();

const inputCls = 'w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 text-sm focus:outline-none transition-all duration-200 bg-white placeholder:text-slate-300 font-medium text-slate-900';
const labelCls = 'block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2';

const Register = () => {
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: ROLES.CUSTOMER }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApiError('');
    const { confirmPassword, ...registerPayload } = data;
    try {
      await api.post('/auth/register', registerPayload);
      navigate(ROUTES.LOGIN, { state: { message: 'Registration successful! Please log in.' } });
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Registration failed. Please try again.', 'register'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2071"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />
      </div>

      {/* Navbar over the image */}
      <div className="relative z-10">
        <InlineNavbar variant="dark" />
      </div>

      {/* Centered auth card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-5xl grid lg:grid-cols-[2fr_3fr] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-scale-in">

        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute -bottom-40 -right-20 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: '#E9B38F' }} />
          <div className="relative">
            <Link to={ROUTES.HOME} className="flex items-center gap-2.5 mb-14 group">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center group-hover:bg-white/20 transition-all duration-200">
                <Building2 size={18} strokeWidth={2} className="text-white" />
              </div>
              <span className="font-black text-xl tracking-tight">HaH <span style={{ color: '#E9B38F' }}>Estates</span></span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold mb-6 uppercase tracking-widest" style={{ color: '#E9B38F', border: '1px solid #E9B38F44', backgroundColor: '#E9B38F11' }}>
              <Sparkles size={10} strokeWidth={2} /> Join for free
            </div>

            <h1 className="text-4xl font-black leading-[0.9] tracking-tighter mb-5">Join the<br />platform.</h1>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Join as a customer to discover properties or as a broker to manage listings and close deals.
            </p>

            <div className="mt-10 space-y-3.5">
              {['Browse 2,400+ verified listings', 'Submit your property for review', 'Track every deal in real time'].map((t) => (
                <div key={t} className="flex items-center gap-2.5 text-sm text-white/60">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E9B38F22', border: '1px solid #E9B38F44' }}>
                    <CheckCircle size={11} strokeWidth={2.5} style={{ color: '#E9B38F' }} />
                  </div>
                  {t}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-[10px] text-white/30 font-bold uppercase tracking-widest">Free to join | No hidden fees</p>
        </div>

        {/* Right panel */}
        <div className="p-8 md:p-10 overflow-y-auto">
          {/* Mobile logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2 mb-7 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
              <Building2 size={15} strokeWidth={2} className="text-white" />
            </div>
            <span className="font-black text-slate-900">HaH <span style={{ color: '#E9B38F' }}>Estates</span></span>
          </Link>

          <div className="mb-7">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-[0.9]">Create your<br />account</h2>
            <p className="mt-2 text-sm text-slate-400">Set up your role and get started in under a minute.</p>
          </div>

          {apiError && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-600">
              <AlertCircle size={16} strokeWidth={2} className="shrink-0 mt-0.5" />{apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <div className="relative">
                  <User size={15} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input {...register('name')} placeholder="John Smith" className={inputCls} />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <div className="relative">
                  <Phone size={15} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input {...register('phone')} placeholder="+91 98765 43210" className={inputCls} />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone.message}</p>}
              </div>
            </div>

            <div>
              <label className={labelCls}>Email address</label>
              <div className="relative">
                <Mail size={15} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input {...register('email')} placeholder="you@example.com" className={inputCls} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className={labelCls}>City <span className="normal-case font-normal text-slate-300">(optional)</span></label>
              <div className="relative">
                <MapPin size={15} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input {...register('city')} placeholder="e.g. Mumbai" className={inputCls} />
              </div>
              {errors.city && <p className="mt-1 text-xs text-red-500 font-medium">{errors.city.message}</p>}
            </div>

            <div>
              <label className={labelCls}>Account type</label>
              <select {...register('role')} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-sm bg-white focus:outline-none transition-all duration-200 text-slate-700 font-medium">
                <option value={ROLES.CUSTOMER}>Customer - Buy or Rent properties</option>
                <option value={ROLES.BROKER}>Broker - List and manage properties</option>
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-500 font-medium">{errors.role.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock size={15} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Min 8 characters"
                    className={`${inputCls} pr-11`}
                  />
                  <button type="button" onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Confirm password</label>
                <div className="relative">
                  <Lock size={15} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Repeat password"
                    className={`${inputCls} pr-11`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                    {showConfirmPassword ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 text-slate-900 font-black rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] text-sm"
              style={{ backgroundColor: '#E9B38F', boxShadow: '0 8px 32px 0 #E9B38F55' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : (
                <>Create Account <ArrowRight size={16} strokeWidth={2.5} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-400">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="font-bold text-slate-900 hover:opacity-70 transition-opacity">Sign in</Link>
          </p>
        </div>
      </div>      </div>    </div>
  );
};

export default Register;
