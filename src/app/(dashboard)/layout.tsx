import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import AIFloatingChat from '@/components/chat/AIFloatingChat';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />
      <div className="main-content">
        <TopBar />
        <main style={{ padding: '1.5rem' }}>
          {children}
        </main>
      </div>
      <AIFloatingChat />
    </div>
  );
}
