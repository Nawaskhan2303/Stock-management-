import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBranch } from '../hooks/useBranch';
import AuthPage from './auth/AuthPage';
import Header from './layout/Header';
import Dashboard from './dashboard/Dashboard';
import StockList from './stock/StockList';
import TransactionList from './transactions/TransactionList';
import CategoryList from './categories/CategoryList';
import AdminSettings from './admin/AdminSettings';

const STAFF_VIEWS = ['dashboard', 'stock'];

export default function MainApp() {
  const { user, profile, loading: authLoading } = useAuth();
  const { loading: branchLoading } = useBranch();
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = profile?.role || 'staff';
  const isStaff = role === 'staff';

  useEffect(() => {
    if (isStaff && !STAFF_VIEWS.includes(currentView)) {
      setCurrentView('dashboard');
    }
  }, [isStaff, currentView]);

  if (authLoading || branchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleViewChange = (view: string) => {
    if (isStaff && !STAFF_VIEWS.includes(view)) return;
    setCurrentView(view);
  };

  const renderView = () => {
    if (isStaff && !STAFF_VIEWS.includes(currentView)) {
      return <Dashboard />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'stock':
        return <StockList />;
      case 'transactions':
        return <TransactionList />;
      case 'categories':
        return <CategoryList />;
      case 'admin':
        return <AdminSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
}
