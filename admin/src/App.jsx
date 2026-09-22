import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import PageHeader from './components/PageHeader';
import DramaIngestModal from './components/DramaIngestModal';
import MobileAppDrawer from './components/MobileAppDrawer';

// Dedicated OTT Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DramasPage from './pages/dramas/DramasPage';
import EpisodesPage from './pages/episodes/EpisodesPage';
import CurationPage from './pages/curation/CurationPage';
import GenresPage from './pages/genres/GenresPage';
import UsersPage from './pages/users/UsersPage';
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import AdmobPage from './pages/admob/AdmobPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import AuditlogPage from './pages/auditlog/AuditlogPage';
import SettingsPage from './pages/settings/SettingsPage';
import UploadContentPage from './pages/upload/UploadContentPage';
import SubscribersPage from './pages/subscribers/SubscribersPage';
import PromosPage from './pages/promos/PromosPage';
import LegalPage from './pages/legal/LegalPage';
import AppNotificationsPage from './pages/notifications/AppNotificationsPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState('summary');
  const [selectedDramaId, setSelectedDramaId] = useState('DRM-101');
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleLogout = () => {
    try {
      localStorage.removeItem('admin_authenticated');
    } catch {}
    setIsAuthenticated(false);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const getPageMeta = () => {
    switch (activeTab) {
      case 'summary':
        return {
          title: "Dashboard",
          subtitle: "Real-time viewer numbers, active VIP subscriptions, revenue, and video status."
        };
      case 'dramas':
        return {
          title: "Content Library",
          subtitle: "Upload, manage, and publish your vertical short series."
        };
      case 'upload':
        return {
          title: "Upload Content",
          subtitle: "Publish new vertical short-dramas, episodes, and trailers to the streaming catalog."
        };
      case 'episodes':
        return {
          title: "Episodes",
          subtitle: "Upload episode videos, subtitle files, and set free or locked episodes."
        };
      case 'curation':
        return {
          title: "Featured & Feed",
          subtitle: "Choose home screen banners, top 10 rankings, and suggested series."
        };
      case 'genres':
        return {
          title: "Genres",
          subtitle: "Manage categories and tags shown to catalog viewers."
        };
      case 'admob':
        return {
          title: "AdMob",
          subtitle: "Track monthly ad revenue, eCPM performance, fill rate, ad units, and impression stats."
        };
      case 'users':
        return {
          title: "Users",
          subtitle: "Search registered users, check watch history, and manage subscriber access."
        };
      case 'subscribers':
        return {
          title: "Subscribers",
          subtitle: "Monitor active VIP members, recurring subscriptions, and member retention."
        };
      case 'subscriptions':
        return {
          title: "Subscription Plans",
          subtitle: "Set monthly (₹199) and yearly (₹1,499) plans, pricing, and member benefits."
        };
      case 'promos':
        return {
          title: "Promos & Vouchers",
          subtitle: "Create coupon discount codes, referral vouchers, and VIP trial promotions."
        };
      case 'transactions':
        return {
          title: "Transactions",
          subtitle: "View customer payments, payment status, receipts, and export CSV."
        };
      case 'notifications':
        return {
          title: "Push Notifications",
          subtitle: "Send instant push notifications about new episodes and special offers."
        };
      case 'app_notifications':
        return {
          title: "Notifications",
          subtitle: "Broadcast in-app notices, maintenance announcements, and user receipts."
        };
      case 'legal':
        return {
          title: "Legal",
          subtitle: "Manage terms of service, privacy policy, and statutory compliance."
        };
      case 'auditlog':
        return {
          title: "Activity Log",
          subtitle: "Track recent changes, uploads, and actions taken by admins."
        };
      case 'settings':
        return {
          title: "Settings",
          subtitle: "Manage default video quality, cloud storage, payment keys, and system rules."
        };
      default:
        return {
          title: "Admin Panel",
          subtitle: "E² Stories Admin Panel"
        };
    }
  };

  const meta = getPageMeta();

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F7] dark:bg-[#0A0A0A] flex font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* Fixed Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <Topbar
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          title={meta.title}
          subtitle={meta.subtitle}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">

          


          {/* Active Page View */}
          {activeTab === 'summary' && (
            <DashboardPage
              onOpenIngestModal={() => setIsIngestModalOpen(true)}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'dramas' && (
            <DramasPage
              onOpenIngestModal={() => setIsIngestModalOpen(true)}
              onSelectDramaForEpisodes={(id) => {
                setSelectedDramaId(id);
                setActiveTab('episodes');
              }}
            />
          )}

          {activeTab === 'upload' && (
            <UploadContentPage onNavigate={setActiveTab} />
          )}

          {activeTab === 'episodes' && (
            <EpisodesPage
              initialDramaId={selectedDramaId}
            />
          )}

          {activeTab === 'curation' && (
            <CurationPage />
          )}

          {activeTab === 'genres' && (
            <GenresPage />
          )}

          {activeTab === 'users' && (
            <UsersPage />
          )}

          {activeTab === 'subscribers' && (
            <SubscribersPage />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionsPage />
          )}

          {activeTab === 'promos' && (
            <PromosPage />
          )}

          {activeTab === 'transactions' && (
            <TransactionsPage />
          )}

          {activeTab === 'admob' && (
            <AdmobPage />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPage />
          )}

          {activeTab === 'app_notifications' && (
            <AppNotificationsPage />
          )}

          {activeTab === 'legal' && (
            <LegalPage />
          )}

          {activeTab === 'auditlog' && (
            <AuditlogPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}

        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-[#0D0D0D] border-t border-slate-200 dark:border-slate-800 py-3.5 text-center text-xs text-slate-400 dark:text-slate-600 font-medium shrink-0">
          <p>© 2026 E² Stories (Entertainment Squared) — Vertical Micro-Drama OTT Platform Dashboard</p>
        </footer>


      </div>

      {/* Drama Ingestion Modal */}
      <DramaIngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
      />

      {/* Mobile App UI Reference Drawer */}
      <MobileAppDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

    </div>
  );
}
