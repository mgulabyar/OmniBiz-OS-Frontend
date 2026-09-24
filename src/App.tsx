import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";

import { Navbar } from "./components/common/Navbar";
import { Sidebar } from "./components/common/Sidebar";

import { LoginPage } from "./pages/auth/LoginPage";

import { SalonCatalogPage } from "./pages/salon/SalonCatalogPage";
import { MyBookingsPage } from "./pages/salon/MyBookingsPage";
import { ServiceManagementPage } from "./pages/salon/ServiceManagementPage";
import { StaffManagementPage } from "./pages/salon/StaffManagementPage";

import { TransportFleetPage } from "./pages/transport/TransportFleetPage";
import { MyTransportInquiriesPage } from "./pages/transport/MyTransportInquiriesPage";
import { TransportManagementPage } from "./pages/transport/TransportManagementPage";

import { HajjPackagesPage } from "./pages/hajj/HajjPackagesPage";
import { MyHajjBookingsPage } from "./pages/hajj/MyHajjBookingsPage";
import { HajjManagementPage } from "./pages/hajj/HajjManagementPage";

import { CateringPage } from "./pages/catering/CateringPage";
import { MyCateringInquiriesPage } from "./pages/catering/MyCateringInquiriesPage";
import { CateringManagementPage } from "./pages/catering/CateringManagementPage";

import { RentalApartmentsPage } from "./pages/rental/RentalApartmentsPage";
import { MyRentalBookingsPage } from "./pages/rental/MyRentalBookingsPage";
import { ApartmentManagementPage } from "./pages/rental/ApartmentManagementPage";

import { DynamicBusinessManagementPage } from "./pages/dynamic/DynamicBusinessManagementPage";
import { DynamicFormBuilderPage } from "./pages/dynamic/DynamicFormBuilderPage";
import { DynamicBusinessDirectoryPage } from "./pages/dynamic/DynamicBusinessDirectoryPage";
import { MyDynamicRequestsPage } from "./pages/dynamic/MyDynamicRequestsPage";

const RootRouteGuard: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useContext(AuthContext);

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

interface DashboardLayoutProps {
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  isMobileSidebarOpen,
  onCloseMobileSidebar,
}) => {
  const [activeTab, setActiveTab] = useState<string>("salon");

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseMobileSidebar();
      }
    };

    window.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [onCloseMobileSidebar]);

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  return (
    <>
      {isMobileSidebarOpen && (
        <button
          type="button"
          onClick={onCloseMobileSidebar}
          className="fixed inset-0 z-60 cursor-default bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation menu"
        />
      )}

      <div className="flex min-h-[calc(100vh-76px)] bg-brand-light">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onCloseMobileSidebar={onCloseMobileSidebar}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden bg-brand-light">
          {activeTab === "salon" && <SalonCatalogPage />}
          {activeTab === "my_bookings" && <MyBookingsPage />}
          {activeTab === "salon_mgmt" && <ServiceManagementPage />}
          {activeTab === "staff" && <StaffManagementPage />}

          {activeTab === "transport" && <TransportFleetPage />}
          {activeTab === "my_transport_inquiries" && (
            <MyTransportInquiriesPage />
          )}
          {activeTab === "transport_mgmt" && <TransportManagementPage />}

          {activeTab === "hajj" && <HajjPackagesPage />}
          {activeTab === "my_hajj_inquiries" && <MyHajjBookingsPage />}
          {activeTab === "hajj_mgmt" && <HajjManagementPage />}

          {activeTab === "catering" && <CateringPage />}
          {activeTab === "my_catering_inquiries" && (
            <MyCateringInquiriesPage />
          )}
          {activeTab === "catering_mgmt" && <CateringManagementPage />}

          {activeTab === "rental" && <RentalApartmentsPage />}
          {activeTab === "my_rental_bookings" && <MyRentalBookingsPage />}
          {activeTab === "rental_mgmt" && <ApartmentManagementPage />}

          {activeTab === "dynamic_businesses" && (
            <DynamicBusinessManagementPage />
          )}
          {activeTab === "dynamic_forms" && <DynamicFormBuilderPage />}
          {activeTab === "dynamic_directory" && (
            <DynamicBusinessDirectoryPage />
          )}
          {activeTab === "my_dynamic_requests" && (
            <MyDynamicRequestsPage />
          )}
        </main>
      </div>
    </>
  );
};

const ApplicationLayout: React.FC = () => {
  const auth = useContext(AuthContext);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isLoggedIn = Boolean(auth?.token && auth?.user);

  const openMobileSidebar = () => {
    if (isLoggedIn) {
      setIsMobileSidebarOpen(true);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      <Navbar
        onOpenMobileSidebar={openMobileSidebar}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <RootRouteGuard>
              <DashboardLayout
                isMobileSidebarOpen={isMobileSidebarOpen}
                onCloseMobileSidebar={closeMobileSidebar}
              />
            </RootRouteGuard>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-brand-light">
          <ApplicationLayout />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;