import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCredentials } from '../../store/features/authSlice';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { normalizeUserProfile } from '../../utils/normalizers';
import { getApiErrorMessage } from '../../utils/errorMessages';
import { PageSpinner } from '../../components/ui/Spinner';
import { AlertCircle, Mail, Phone, MapPin, Lock, User, Shield } from 'lucide-react';
import PageShell from '../../components/layout/PageShell';

const inputCls = 'w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white placeholder:text-slate-300 font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed';
const inputNoPrefixCls = 'w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white placeholder:text-slate-300 font-medium text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed';
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5';

const Profile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [pageError, setPageError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsProfileLoading(true);
      setPageError('');

      try {
        const response = await api.get('/users/me');
        const normalizedProfile = normalizeUserProfile(response.data);

        setProfileData({
          name: normalizedProfile.name || '',
          phone: normalizedProfile.phone || '',
          city: normalizedProfile.city || ''
        });

        dispatch(setCredentials({
          user: {
            ...user,
            ...normalizedProfile
          },
          token
        }));
      } catch (err) {
        setPageError('Failed to load your profile. Please try again.');
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();
  }, [dispatch, token]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const response = await api.put('/users/me', profileData);
      const normalizedProfile = normalizeUserProfile(response.data);

      setProfileData({
        name: normalizedProfile.name || '',
        phone: normalizedProfile.phone || '',
        city: normalizedProfile.city || ''
      });

      dispatch(setCredentials({ user: { ...user, ...normalizedProfile }, token }));
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update profile.', 'profile'), 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setIsSavingPassword(true);

    try {
      await api.put('/users/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      
      showToast('Password updated successfully.', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update password.', 'change-password'), 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isProfileLoading) return <PageSpinner message="Loading your profile…" />;

  const NAV = [
    { key: 'profile',  label: 'Profile'  },
    { key: 'security', label: 'Security' },
  ];

  return (
    <PageShell
      label="Account Settings"
      icon={<User size={10} strokeWidth={2.5} />}
      title={<>Profile &amp; Security</>}
      subtitle="Manage your profile details and account security."
      accentHex="#64748b"
    >
      <div className="max-w-3xl mx-auto animate-slide-up">

        {pageError && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-600 text-sm mb-6">
            <AlertCircle size={16} strokeWidth={2} className="shrink-0" />
            {pageError}
          </div>
        )}

        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex min-h-[520px]">

          {/* Left sidebar */}
          <div className="w-48 shrink-0 border-r border-slate-100 py-6 px-3 flex flex-col gap-1">
            {NAV.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full text-left px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                  activeTab === key
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 flex flex-col">

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="flex flex-col flex-1 px-8 py-8">
                <div className="space-y-5 flex-1">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className={inputNoPrefixCls}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <div className="relative">
                      <Mail size={14} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="email" value={user?.email || ''} disabled className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className={inputNoPrefixCls}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className={inputNoPrefixCls}
                      placeholder="e.g. Mumbai"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Account Role</label>
                    <div className="relative">
                      <Shield size={14} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="text" value={user?.role || ''} disabled className={inputCls} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-8 py-2.5 text-sm font-bold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    style={{ backgroundColor: '#E9B38F', color: '#1e293b' }}
                  >
                    {isSavingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordUpdate} className="flex flex-col flex-1 px-8 py-8">
                <div className="space-y-5 flex-1">
                  <div>
                    <label className={labelCls}>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={inputNoPrefixCls}
                      placeholder="Your current password"
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={inputNoPrefixCls}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={inputNoPrefixCls}
                      placeholder="Repeat new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-8 py-2.5 text-sm font-bold rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSavingPassword ? 'Updating…' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </PageShell>
  );
};
export default Profile;
