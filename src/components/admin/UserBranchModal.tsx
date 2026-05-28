import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Branch, Profile, BranchUser } from '../../types/database';
import { X, Plus, Trash2 } from 'lucide-react';

interface UserBranchModalProps {
  user: Profile;
  onClose: () => void;
}

interface BranchUserWithDetails extends BranchUser {
  branches: Branch;
}

export default function UserBranchModal({ user, onClose }: UserBranchModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userBranches, setUserBranches] = useState<BranchUserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRole, setSelectedRole] = useState<'manager' | 'staff'>('staff');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);

    const { data: allBranches } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (allBranches) {
      setBranches(allBranches);
    }

    const { data: userBranchData } = await supabase
      .from('branch_users')
      .select('*, branches(*)')
      .eq('user_id', user.id);

    if (userBranchData) {
      setUserBranches(userBranchData as BranchUserWithDetails[]);
    }

    setLoading(false);
  }

  async function handleAddBranch() {
    if (!selectedBranch) return;

    setAdding(true);

    const { error } = await supabase
      .from('branch_users')
      .insert({
        user_id: user.id,
        branch_id: selectedBranch,
        role: selectedRole,
      });

    if (!error) {
      fetchData();
    }
    setAdding(false);
  }

  async function handleRemoveBranch(branchUserId: string) {
    await supabase
      .from('branch_users')
      .delete()
      .eq('id', branchUserId);

    fetchData();
  }

  const assignedBranchIds = userBranches.map((ub) => ub.branch_id);
  const availableBranches = branches.filter(
    (b) => !assignedBranchIds.includes(b.branch_id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Branch Access</h2>
            <p className="text-sm text-gray-500 mt-1">{user.full_name || user.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">System Role:</span>{' '}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                user.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {user.role}
              </span>
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Current Branch Access</h3>
                {userBranches.length === 0 ? (
                  <p className="text-gray-500 text-sm">No branch access assigned</p>
                ) : (
                  <div className="space-y-2">
                    {userBranches.map((ub) => (
                      <div
                        key={ub.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{ub.branches?.name}</p>
                          <p className="text-xs text-gray-500">{ub.branches?.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            ub.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {ub.role}
                          </span>
                          <button
                            onClick={() => handleRemoveBranch(ub.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {availableBranches.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Add Branch Access</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select branch...</option>
                      {availableBranches.map((branch) => (
                        <option key={branch.branch_id} value={branch.branch_id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'manager' | 'staff')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                    </select>
                    <button
                      onClick={handleAddBranch}
                      disabled={!selectedBranch || adding}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
