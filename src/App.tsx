import { AuthProvider } from './hooks/useAuth';
import { BranchProvider } from './hooks/useBranch';
import MainApp from './components/MainApp';

function App() {
  return (
    <AuthProvider>
      <BranchProvider>
        <MainApp />
      </BranchProvider>
    </AuthProvider>
  );
}

export default App;
