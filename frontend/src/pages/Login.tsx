import React, { useState } from 'react';
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Button, Input } from '../components/ui';
import type { User } from '../types';
import { api } from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'login' | 'first-login'>('login');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passError, setPassError] = useState('');
  const [success, setSuccess] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await api.login(userId, password, remember);
      if (resp.phase === 'first-login') {
        setPendingUser(resp.user);
        setPhase('first-login');
      } else if (resp.user) {
        onLogin(resp.user);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFirstLogin(e: React.FormEvent) {
    e.preventDefault();
    setPassError('');
    if (newPass.length < 12) { setPassError('Password must be at least 12 characters.'); return; }
    if (!/[A-Z]/.test(newPass)) { setPassError('Password must contain at least one uppercase letter.'); return; }
    if (!/[a-z]/.test(newPass)) { setPassError('Password must contain at least one lowercase letter.'); return; }
    if (!/[0-9]/.test(newPass)) { setPassError('Password must contain at least one number.'); return; }
    if (!/[^A-Za-z0-9]/.test(newPass)) { setPassError('Password must contain at least one special character.'); return; }
    if (newPass !== confirmPass) { setPassError('Passwords do not match.'); return; }
    
    setLoading(true);
    try {
      if (pendingUser) {
        const resp = await api.firstLogin(newPass, confirmPass);
        setSuccess(true);
        setTimeout(() => onLogin(resp.user || pendingUser), 1000);
      }
    } catch (err: any) {
      setPassError(err.message || 'Unable to update the password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (phase === 'first-login') {
    const reqs = [
      { label: 'At least 12 characters', met: newPass.length >= 12 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(newPass) },
      { label: 'One lowercase letter', met: /[a-z]/.test(newPass) },
      { label: 'One number', met: /[0-9]/.test(newPass) },
      { label: 'One special character', met: /[^A-Za-z0-9]/.test(newPass) },
    ];
    return (
      <div className="min-h-screen bg-[#F4F1E6] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#F5EBD7] rounded-3xl border border-[#E8E2D0] shadow-sm overflow-hidden">
            <div className="bg-[#243B2D] px-8 py-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#E8D36A] flex items-center justify-center">
                  <BookOpen size={18} className="text-[#243B2D]" />
                </div>
                <p className="text-[#F4F1E6] font-bold text-lg">SmartClass</p>
              </div>
              <h1 className="text-[#F4F1E6] text-xl font-bold">Welcome to SmartClass</h1>
              <p className="text-[#9abaaa] text-sm mt-1">For security, please create a new password before continuing.</p>
            </div>

            <form onSubmit={handleFirstLogin} className="px-8 py-6 space-y-4">
              {success ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#e6f4ec] border border-[#c0e0cd]">
                  <CheckCircle size={18} className="text-[#1a6b3c]" />
                  <p className="text-sm text-[#1a6b3c] font-medium">Password changed successfully. Redirecting…</p>
                </div>
              ) : null}

              <div className="relative">
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">New Password <span className="text-[#D98282]">*</span></label>
                <input
                  type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-8 text-[#7a6a55]">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="space-y-1.5 pl-1">
                {reqs.map(r => (
                  <div key={r.label} className={`flex items-center gap-2 text-xs ${r.met ? 'text-[#1a6b3c]' : 'text-[#9a8a75]'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${r.met ? 'bg-[#1a6b3c] border-[#1a6b3c]' : 'border-[#b0a090]'}`}>
                      {r.met && <span className="text-white text-[8px]">✓</span>}
                    </div>
                    {r.label}
                  </div>
                ))}
              </div>

              <div className="relative">
                <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Confirm Password <span className="text-[#D98282]">*</span></label>
                <input
                  type={showConfirm ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-8 text-[#7a6a55]">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {passError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fdf0f0] border border-[#f0c8c8]">
                  <AlertCircle size={15} className="text-[#b04040]" />
                  <p className="text-xs text-[#b04040]">{passError}</p>
                </div>
              )}

              <Button type="submit" variant="primary" className="w-full justify-center py-3">
                Set Password & Continue
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1E6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#F5EBD7] rounded-3xl border border-[#E8E2D0] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-[#243B2D] px-8 py-7 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E8D36A] flex items-center justify-center mx-auto mb-4">
              <BookOpen size={26} className="text-[#243B2D]" />
            </div>
            <h1 className="text-[#F4F1E6] text-2xl font-bold">SmartClass</h1>
            <p className="text-[#9abaaa] text-sm mt-1">College Academic Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 py-7 space-y-4">
            <h2 className="text-base font-bold text-[#1a2e1e]">Sign in to your account</h2>

            <Input label="User ID" placeholder="Enter your User ID (e.g. STU001)" value={userId} onChange={setUserId} required />

            <div>
              <label className="text-xs font-semibold text-[#4a3a2a] uppercase tracking-wider block mb-1">Password <span className="text-[#D98282]">*</span></label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[#E8E2D0] bg-[#F4F1E6] text-sm focus:outline-none focus:ring-2 focus:ring-[#7DB7C9]"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6a55]">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-[#E8E2D0] accent-[#2F4F3A]" />
              <label htmlFor="remember" className="text-sm text-[#5a4a35]">Remember me</label>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fdf0f0] border border-[#f0c8c8]">
                <AlertCircle size={15} className="text-[#b04040]" />
                <p className="text-xs text-[#b04040]">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full justify-center py-3">
              Sign In
            </Button>

            <p className="text-xs text-[#9a8a75] text-center">Contact your administrator if you have forgotten your credentials.</p>
          </form>

        </div>
      </div>
    </div>
  );
}
