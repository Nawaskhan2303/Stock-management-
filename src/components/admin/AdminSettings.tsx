import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Branch, Profile } from '../../types/database';
import { Building2, Users, Plus, CreditCard as Edit2, Shield, UserCog, Trash2 } from 'lucide-react';
import BranchModal from './BranchModal';
import UserBranchModal from './UserBranchModal';

export default function AdminSettings() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'branches' | 'users'>('branches');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  // Per-user updating state instead of a global flag
  const [updatingRoleIds, setUpdatingRoleIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchData();
    }
  }, [profile]);

  // Realtime subscription for profiles
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const channel = supabase
      .channel('admin-profiles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Profile update received:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            setUsers(prev =>
              prev.map(u => u.id === (payload.new as Profile).id ? payload.new as Profile : u)
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setUsers(prev => prev.filter(u => u.id !== (payload.old as Profile).id));
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setUsers(prev => {
              const exists = prev.some(u => u.id === (payload.new as Profile).id);
              if (exists) return prev;
              return [payload.new as Profile, ...prev];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.role]);

  // Real-time subscription for branches
  useEffect(() => {
    if (profile?.role !== 'admin') return;

    const channel = supabase
      .channel('admin-branches-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'branches',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setBranches(prev =>
              prev.map(b => b.branch_id === (payload.new as Branch).branch_id ? payload.new as Branch : b)
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setBranches(prev => prev.filter(b => b.branch_id !== (payload.old as Branch).branch_id));
          } else if (payload.eventType === 'INSERT' && payload.new) {
            setBranches(prev => {
              const exists = prev.some(b => b.branch_id === (payload.new as Branch).branch_id);
              if (exists) return prev;
              return [payload.new as Branch, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.role]);

  async function fetchData() {
    setLoading(true);

    const { data: branchData } = await supabase
      .from('branches')
      .select('*')
      .order('name')

    if (branchData) setBranches(branchData);
    console.log("branchData:", branchData);

    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (userData) setUsers(userData);

    setLoading(false);
  }

  async function handleUpdateUserRole(userId: string, newRole: Profile['role']) {
    // Mark only this specific user as updating
    setUpdatingRoleIds(prev => new Set(prev).add(userId));
    setSuccessMessage(null);

    // Store the old role for potential revert
    const oldRole = users.find(u => u.id === userId)?.role;
    
    // Optimistically update state immediately so UI reflects instantly
    setUsers(prev =>
      prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
    );

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      const updated = users.find(u => u.id === userId);
      setSuccessMessage(`${updated?.full_name || 'User'} role updated to ${newRole}`);
      
      // After 500ms, verify the update from database
      setTimeout(async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (data) {
          setUsers(prev =>
            prev.map(u => u.id === userId ? data : u)
          );
        }
      }, 500);
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      console.error('Error updating role:', error);
      // Revert optimistic update on error
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: oldRole || 'staff' } : u)
      );
      setSuccessMessage(`Error: ${error.message}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setUpdatingRoleIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }

  async function handleDeleteUser(userId: string) {
    setDeletingUserId(userId);

    // Optimistically remove from UI immediately
    setUsers(prev => prev.filter(u => u.id !== userId));

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (!error) {
      setSuccessMessage('User removed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      console.error('Error deleting user:', error);
      // Revert on error by refetching
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setUsers(data);
      setSuccessMessage(`Error: ${error.message}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    setDeletingUserId(null);
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Admin Access Required</h2>
        <p className="text-gray-500 mt-2">
          You need admin privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">Manage branches, users, and access permissions</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium">
          <Shield className="w-4 h-4" />
          Admin
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('branches')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'branches'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Branches
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              Users
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === 'branches' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {branches.length} branch{branches.length !== 1 ? 'es' : ''} total
                </p>
                <button
                  onClick={() => {
                    setEditingBranch(null);
                    setShowBranchModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Branch
                </button>
              </div>

              <div className="space-y-3">
                {branches.map((branch) => (
                  <div
                    key={branch.branch_id}
                    className="flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        branch.is_active ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Building2 className={`w-5 h-5 ${
                          branch.is_active ? 'text-green-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{branch.name}</p>
                        {branch.address && (
                          <p className="text-sm text-gray-500">{branch.address}</p>
                        )}
                        {branch.phone && (
                          <p className="text-xs text-gray-400">{branch.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        branch.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingBranch(branch);
                          setShowBranchModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {users.length} user{users.length !== 1 ? 's' : ''} total
              </p>

              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || 'No name provided'}
                        </p>
                        <p className="text-xs text-gray-500">{user.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value as Profile['role'])}
                        // Only disable THIS user's dropdown, not all of them
                        disabled={updatingRoleIds.has(user.id)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Manage branch access"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove user ${user.full_name || user.id}?`)) {
                            handleDeleteUser(user.id);
                          }
                        }}
                        disabled={deletingUserId === user.id}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        title="Remove user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showBranchModal && (
        <BranchModal
          branch={editingBranch}
          onClose={() => {
            setShowBranchModal(false);
            setEditingBranch(null);
          }}
          onSave={() => {
            fetchData();
            setShowBranchModal(false);
            setEditingBranch(null);
          }}
        />
      )}

      {showUserModal && editingUser && (
        <UserBranchModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
