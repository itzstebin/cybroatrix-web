import { useState, type FormEvent } from 'react';
import {
  Lock, Globe, LogOut, ShieldCheck, ShieldAlert, Trash2, EyeOff, Mail, MailCheck, MailWarning,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { useNavigate } from '../lib/router';
import { DashboardLayout } from '../components/DashboardLayout';
import { Modal } from '../components/ui/Modal';
import { FormField, FormError, FormSuccess, PasswordField, Spinner } from '../components/ui/FormElements';
import { updateUserProfile, deleteUserProfileData } from '../lib/profile';
import { removeAvatar } from '../lib/storage';
import { getAuthErrorMessage } from '../lib/authErrors';
import {
  isGoogleUser, isPasswordUser, changePassword, sendVerificationEmail,
  sendResetPasswordEmail, reauthenticateWithGoogle, reauthenticateWithPassword,
  deleteFirebaseAccount,
} from '../lib/firebase';

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Email verification
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Privacy
  const [privacySaving, setPrivacySaving] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  // Security shortcuts
  const [signingOut, setSigningOut] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Danger zone
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user || !profile) return null; // RequireAuth guarantees this in practice

  const googleAccount = isGoogleUser(user);
  const passwordAccount = isPasswordUser(user);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError('New password should be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(getAuthErrorMessage(err));
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleResendVerification() {
    setResendState('sending');
    try {
      await sendVerificationEmail(user);
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  }

  async function handleVisibilityChange(visibility: 'public' | 'private') {
    if (visibility === profile.profileVisibility) return;
    setPrivacyError(null);
    setPrivacySaving(true);
    try {
      await updateUserProfile(user.uid, { profileVisibility: visibility });
    } catch (err) {
      setPrivacyError(getAuthErrorMessage(err));
    } finally {
      setPrivacySaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch {
      setSigningOut(false);
    }
  }

  async function handleSendResetToSelf() {
    if (!user.email) return;
    setSendingReset(true);
    try {
      await sendResetPasswordEmail(user.email);
      setResetSent(true);
    } catch {
      // Non-critical shortcut — silently ignore; they can use Forgot Password instead.
    } finally {
      setSendingReset(false);
    }
  }

  function closeDeleteModal() {
    if (deleteSubmitting) return;
    setDeleteModalOpen(false);
    setDeletePassword('');
    setDeleteConfirmText('');
    setDeleteError(null);
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }
    setDeleteSubmitting(true);
    try {
      if (passwordAccount) {
        if (!deletePassword) {
          setDeleteError('Please enter your password to confirm.');
          setDeleteSubmitting(false);
          return;
        }
        await reauthenticateWithPassword(deletePassword);
      } else {
        await reauthenticateWithGoogle();
      }
      await deleteUserProfileData(user.uid, profile.username);
      await removeAvatar(user.uid).catch(() => {});
      await deleteFirebaseAccount(user);
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(getAuthErrorMessage(err));
      setDeleteSubmitting(false);
    }
  }

  return (
    <DashboardLayout title="Settings" description="Manage your account, privacy, and security.">
      <div className="space-y-6">
        {/* Account */}
        <div className="feature-card p-6">
          <h2 className="font-cyber text-xs text-white/40 tracking-widest uppercase mb-4">Account</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm font-inter mb-6">
            <div>
              <p className="text-white/30 text-xs mb-1">Name</p>
              <p className="text-white">{profile.displayName}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-1">Username</p>
              <p className="text-white">@{profile.username}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-1">Email</p>
              <p className="text-white truncate">{user.email}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-1">Email verification</p>
              {user.emailVerified ? (
                <p className="text-emerald-400/80 flex items-center gap-1.5 text-xs">
                  <MailCheck className="w-3.5 h-3.5" /> Verified
                </p>
              ) : (
                <p className="text-amber-400/80 flex items-center gap-1.5 text-xs">
                  <MailWarning className="w-3.5 h-3.5" />
                  Not verified —{' '}
                  <button type="button" onClick={handleResendVerification} disabled={resendState !== 'idle'} className="underline hover:text-amber-300 disabled:opacity-60">
                    {resendState === 'sent' ? 'sent!' : resendState === 'sending' ? 'sending…' : 'resend'}
                  </button>
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-white/30 font-inter">
            Name, username, and profile picture are managed from{' '}
            <button type="button" onClick={() => navigate('/profile/edit')} className="text-blue-400 hover:text-cyan-400 underline">
              Edit Profile
            </button>.
          </p>

          <div className="h-px bg-white/10 my-6" />

          <h3 className="font-cyber text-xs text-white/40 tracking-widest uppercase mb-4">Password</h3>
          {passwordAccount ? (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <FormField label="Current Password" htmlFor="current-password" required>
                <PasswordField id="current-password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
              </FormField>
              <FormField label="New Password" htmlFor="new-password-settings" required hint="At least 6 characters.">
                <PasswordField id="new-password-settings" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
              </FormField>
              <FormField label="Confirm New Password" htmlFor="confirm-new-password" required>
                <PasswordField id="confirm-new-password" value={confirmNewPassword} onChange={setConfirmNewPassword} autoComplete="new-password" />
              </FormField>
              <FormError message={passwordError} />
              <FormSuccess message={passwordSuccess ? 'Password updated.' : null} />
              <button type="submit" disabled={passwordSaving} className="btn-outline text-xs disabled:opacity-60">
                {passwordSaving ? 'SAVING…' : 'UPDATE PASSWORD'}
              </button>
            </form>
          ) : (
            <p className="text-white/40 text-sm font-inter">
              You sign in with Google — there's no password to manage here.
            </p>
          )}
        </div>

        {/* Privacy */}
        <div className="feature-card p-6">
          <h2 className="font-cyber text-xs text-white/40 tracking-widest uppercase mb-4">Privacy</h2>
          <p className="text-white/40 text-sm font-inter mb-4">Control who can view your public profile page.</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleVisibilityChange('public')}
              disabled={privacySaving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-cyber tracking-wide border transition-colors disabled:opacity-60 ${
                profile.profileVisibility === 'public'
                  ? 'border-blue-400 bg-blue-500/10 text-white'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> PUBLIC
            </button>
            <button
              type="button"
              onClick={() => handleVisibilityChange('private')}
              disabled={privacySaving}
              className={`flex items-center gap-2 px-4 py-2.5 rounded text-xs font-cyber tracking-wide border transition-colors disabled:opacity-60 ${
                profile.profileVisibility === 'private'
                  ? 'border-blue-400 bg-blue-500/10 text-white'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" /> PRIVATE
            </button>
          </div>
          {privacyError && <p className="mt-3 text-xs text-red-400/80 font-inter">{privacyError}</p>}
        </div>

        {/* Security */}
        <div className="feature-card p-6">
          <h2 className="font-cyber text-xs text-white/40 tracking-widest uppercase mb-4">Security</h2>
          <div className="flex items-center gap-2 text-sm font-inter text-white/70 mb-4">
            {googleAccount ? (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Signed in with Google
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-blue-400" /> Signed in with email and password
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {passwordAccount && (
              <button type="button" onClick={handleSendResetToSelf} disabled={sendingReset || resetSent} className="btn-outline text-xs flex items-center gap-2 disabled:opacity-60">
                <Mail className="w-3.5 h-3.5" /> {resetSent ? 'RESET EMAIL SENT' : sendingReset ? 'SENDING…' : 'EMAIL ME A RESET LINK'}
              </button>
            )}
            <button type="button" onClick={handleSignOut} disabled={signingOut} className="btn-outline text-xs flex items-center gap-2 disabled:opacity-60">
              <LogOut className="w-3.5 h-3.5" /> {signingOut ? 'SIGNING OUT…' : 'LOG OUT'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-500/20 bg-red-950/5 rounded p-6">
          <h2 className="font-cyber text-xs text-red-400/70 tracking-widest uppercase mb-2 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Danger Zone
          </h2>
          <p className="text-white/40 text-sm font-inter mb-4">
            Permanently delete your account and all associated profile data. This cannot be undone.
          </p>
          <button type="button" onClick={() => setDeleteModalOpen(true)} className="btn-danger text-xs flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5" /> DELETE ACCOUNT
          </button>
        </div>
      </div>

      <Modal open={deleteModalOpen} onClose={closeDeleteModal} title="Delete Account">
        <p className="text-white/50 text-sm font-inter mb-4">
          This permanently deletes your account, profile, and username. This action cannot be undone.
        </p>
        <div className="space-y-4">
          {passwordAccount && (
            <FormField label="Confirm Your Password" htmlFor="delete-password" required>
              <PasswordField id="delete-password" value={deletePassword} onChange={setDeletePassword} autoComplete="current-password" />
            </FormField>
          )}
          {googleAccount && (
            <p className="text-white/40 text-xs font-inter">
              You'll be asked to confirm with Google when you click delete below.
            </p>
          )}
          <FormField label='Type "DELETE" to confirm' htmlFor="delete-confirm" required>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="input-cyber"
            />
          </FormField>
          <FormError message={deleteError} />
          <div className="flex gap-3">
            <button type="button" onClick={closeDeleteModal} disabled={deleteSubmitting} className="btn-outline flex-1 text-xs disabled:opacity-60">
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteSubmitting}
              className="btn-danger flex-1 text-xs flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {deleteSubmitting ? <Spinner /> : 'DELETE PERMANENTLY'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
