import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { logAdminActivity } from '@/hooks/useAdminData';
import type { AdminUser } from '@/types/admin';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function UserDeleteConfirm() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reasoning, setReasoning] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUser() {
      if (!userId) return;
      const { data } = await supabase
        .from('profiles')
        .select('id, email, display_name, role, created_at')
        .eq('id', userId)
        .single();
      setUser(data);
      setLoading(false);
    }
    fetchUser();
  }, [userId]);

  const canDelete = reasoning.trim().length >= 10 && confirmText === 'Confirm';

  const handleDelete = async () => {
    if (!canDelete || !user || !profile) return;
    setDeleting(true);
    setError('');

    const { error: delError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (delError) {
      setError(delError.message);
      setDeleting(false);
      return;
    }

    await logAdminActivity(
      profile.id,
      profile.display_name ?? profile.email,
      'user_delete',
      null,
      {
        deleted_user_id: user.id,
        deleted_user_email: user.email,
        deleted_user_name: user.display_name,
        reasoning,
      },
    );

    navigate('/admin/users');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">User not found.</p>
        <button onClick={() => navigate('/admin/users')} className="mt-4 text-purple-400 hover:underline text-sm">
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => navigate('/admin/users')}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users
      </button>

      <div className="rounded-xl bg-[#18162e] border border-red-500/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] bg-red-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-sm font-semibold text-red-400">Delete User Confirmation</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* User info */}
          <div className="rounded-lg bg-white/[0.03] p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-purple-300">
                  {(user.display_name ?? user.email).substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user.display_name ?? user.email.split('@')[0]}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 pt-1">
              <span>Role: <span className="text-gray-300">{user.role}</span></span>
              <span>Joined: <span className="text-gray-300">{formatDate(user.created_at)}</span></span>
            </div>
          </div>

          {/* Reasoning */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reasoning for deletion <span className="text-gray-500">(min 10 characters)</span>
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain why this user is being removed..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-red-500/40 transition-colors resize-none"
            />
            <p className="text-xs text-gray-600 mt-1">{reasoning.trim().length}/10 characters</p>
          </div>

          {/* Confirm typing */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type <span className="text-red-400 font-mono">"Confirm"</span> to proceed
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "Confirm"'
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder:text-gray-600 outline-none focus:border-red-500/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-sm font-medium text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
