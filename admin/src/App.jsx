import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import PageHeader from './components/PageHeader';
import MobileAppDrawer from './components/MobileAppDrawer';
import ErrorBoundary from './components/ErrorBoundary';

// Dedicated OTT Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DramasPage from './pages/dramas/DramasPage';
import GenresPage from './pages/genres/GenresPage';
import UsersPage from './pages/users/UsersPage';
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
import AdmobPage from './pages/admob/AdmobPage';
import CustomAdsPage from './pages/admob/CustomAdsPage';
import AdControlPage from './pages/admob/AdControlPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import UploadContentPage from './pages/upload/UploadContentPage';
import SubscribersPage from './pages/subscribers/SubscribersPage';
import PromosPage from './pages/promos/PromosPage';
import LegalPage from './pages/legal/LegalPage';
import AppNotificationsPage from './pages/notifications/AppNotificationsPage';
import BannersPage from './pages/banners/BannersPage';
import CategoryPriorityPage from './pages/genres/CategoryPriorityPage';
import PageLoader from './components/common/PageLoader';
import { subscribeToAuthChanges, logoutAdmin } from './services/firebase';

export default function App() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  // Listen to Firebase Authentication state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        setAdminUser(firebaseUser);
        setIsAuthenticated(true);
        try {
          localStorage.setItem('admin_authenticated', 'true');
          localStorage.setItem('admin_user_email', firebaseUser.email || '');
          if (firebaseUser.displayName) {
            localStorage.setItem('admin_user_name', firebaseUser.displayName);
          }
        } catch (e) {
          console.error('Error syncing auth state', e);
        }
      } else {
        setAdminUser(null);
        setIsAuthenticated(false);
        try {
          localStorage.removeItem('admin_authenticated');
        } catch (e) {}
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const getInitialTab = () => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) return hash;
      const stored = localStorage.getItem('admin_active_tab');
      if (stored) return stored;
    } catch {}
    return 'summary';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = (tab) => {
    setSelectedDramaId(null);
    setActiveTabState(tab);
    try {
      localStorage.setItem('admin_active_tab', tab);
      window.location.hash = tab;
    } catch {}
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && hash !== activeTab) {
        setActiveTabState(hash);
        try {
          localStorage.setItem('admin_active_tab', hash);
        } catch {}
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);
  const [selectedDramaId, setSelectedDramaId] = useState(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.error('Error logging out from Firebase:', err);
    }
    try {
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_user_email');
    } catch {}
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  const getPageMeta = () => {
    switch (activeTab) {
      case 'summary':
        return {
          title: "Dashboard",
          subtitle: "Real-time viewer numbers, active subscriptions, revenue, and video status."
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
      case 'banners':
        return {
          title: "Banners & Hero Carousel",
          subtitle: "Upload 16:9 landscape hero banners, promo slides, and manage top carousel placements."
        };
      case 'genres':
        return {
          title: "Genres",
          subtitle: "Manage categories and tags shown to catalog viewers."
        };
      case 'category_priority':
        return {
          title: "Homepage Feed & Section Priority",
          subtitle: "Decide the exact rank priority (1, 2, 3...) for homepage sections, trending, popular genres, and category trays."
        };
      case 'admob':
        return {
          title: "Google AdMob Monetization",
          subtitle: "Manage Google AdMob App IDs, live ad units, performance metrics, and eCPM tracking."
        };
      case 'custom_ads':
        return {
          title: "Custom Ads & Direct Sponsors",
          subtitle: "Publish and manage high-impact direct sponsor campaigns, video pre-rolls, banners, and in-house promos."
        };
      case 'ad_control':
        return {
          title: "Ad Control & Synchronized Delivery",
          subtitle: "Central control room to synchronize whether to show Custom ads, AdMob, or both across all OTT placements."
        };
      case 'users':
        return {
          title: "User Directory & Access Control",
          subtitle: "Search registered users, check watch history, and manage subscriber access."
        };
      case 'subscribers':
        return {
          title: "Subscribers",
          subtitle: "Monitor active subscribers, recurring subscriptions, and member retention."
        };
      case 'subscriptions':
        return {
          title: "Subscription Plans & Pricing",
          subtitle: "Manage E² Stories subscription tiers (1M ₹99, 6M ₹499, 12M ₹899), 7-day trials (₹2), and AutoPay mandates."
        };
      case 'promos':
        return {
          title: "Promos & Vouchers",
          subtitle: "Create coupon discount codes, referral vouchers, and subscription trial promotions."
        };
      case 'transactions':
        return {
          title: "Transactions",
          subtitle: "View customer payments, payment status, receipts, and export CSV."
        };
      case 'notifications':
        return {
          title: "Push Notifications",
          subtitle: "Broadcast instant FCM push alerts to registered mobile devices and lockscreens."
        };
      case 'app_notifications':
        return {
          title: "Notifications",
          subtitle: "Broadcast system notifications, maintenance announcements, and promotional offers to user inboxes."
        };
      case 'legal':
        return {
          title: "Legal",
          subtitle: "Manage terms of service, privacy policy, and statutory compliance."
        };
      case 'settings':
        return {
          title: "Admin Settings",
          subtitle: "Manage your admin profile name, login email address, and account password."
        };
      default:
        return {
          title: "Admin Panel",
          subtitle: "E² Stories Admin Panel"
        };
    }
  };

  const meta = getPageMeta();

  if (isAuthChecking) {
    return (
      <PageLoader
        fullScreen
        text="Loading..."
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F3F4F7] dark:bg-[#080B08] flex font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* Fixed Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedDramaId(null);
          setActiveTab(tab);
        }}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
      />

      {/* Main Content Area (Fixed layout, clean top header docking) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar (Fixed / Pinned) */}
        <Topbar
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          title={meta.title}
          subtitle={meta.subtitle}
          onLogout={handleLogout}
          onNavigate={(tab) => {
            setSelectedDramaId(null);
            setActiveTab(tab);
          }}
          onSelectDrama={(id) => {
            setSelectedDramaId(id);
            setActiveTab('dramas');
          }}
          onOpenIngestModal={() => {
            setSelectedDramaId(null);
            setActiveTab('upload');
          }}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 w-full overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 py-4 min-h-full">
            <ErrorBoundary key={activeTab}>
              {/* Active Page View */}
              {activeTab === 'summary' && (
                <DashboardPage
                  onOpenIngestModal={() => setActiveTab('upload')}
                  onNavigate={setActiveTab}
                />
              )}

              {(activeTab === 'dramas' || activeTab === 'episodes') && (
                <DramasPage
                  onOpenIngestModal={() => setActiveTab('upload')}
                  onNavigate={setActiveTab}
                  selectedDramaId={selectedDramaId}
                  onClearSelectedDrama={() => setSelectedDramaId(null)}
                />
              )}

              {activeTab === 'upload' && (
                <UploadContentPage onNavigate={setActiveTab} />
              )}

              {activeTab === 'banners' && (
                <BannersPage onNavigate={setActiveTab} />
              )}

              {activeTab === 'genres' && (
                <GenresPage onNavigate={setActiveTab} />
              )}

              {activeTab === 'category_priority' && (
                <CategoryPriorityPage onNavigate={setActiveTab} />
              )}

              {activeTab === 'users' && (
                <UsersPage onNavigate={setActiveTab} />
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
                <AdmobPage onNavigate={setActiveTab} />
              )}

              {activeTab === 'custom_ads' && (
                <CustomAdsPage onNavigate={setActiveTab} />
              )}

              {activeTab === 'ad_control' && (
                <AdControlPage onNavigate={setActiveTab} />
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

              {activeTab === 'settings' && (
                <SettingsPage />
              )}
            </ErrorBoundary>
          </div>
        </main>



      </div>

      {/* Mobile App UI Reference Drawer */}
      <MobileAppDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

    </div>
  );
}
