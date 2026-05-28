import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Branch } from '../types/database';
import { useAuth } from './useAuth';

interface BranchContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  loading: boolean;
  setCurrentBranch: (branch: Branch | null) => void;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchBranches();
    } else {
      setBranches([]);
      setCurrentBranch(null);
      setLoading(false);
    }
  }, [user, profile]);

  async function fetchBranches() {
    setLoading(true);
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setBranches(data);
      if (data.length > 0 && !currentBranch) {
        setCurrentBranch(data[0]);
      }
    }
    setLoading(false);
  }

  const value = {
    branches,
    currentBranch,
    loading,
    setCurrentBranch,
    refreshBranches: fetchBranches,
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
