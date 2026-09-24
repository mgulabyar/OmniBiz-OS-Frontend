import React, { useContext } from "react";
import {
  BriefcaseBusiness,
  CalendarRange,
  Car,
  ClipboardList,
  Dome,
  Home,
  RefreshCw,
  Scissors,
  Utensils,
  Users,
  X,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileSidebarOpen: boolean;
  onCloseMobileSidebar: () => void;
}

interface SidebarTab {
  id: string;
  name: string;
  icon: React.ElementType;
  allowedRoles: string[];
  section: "services" | "customer" | "management" | "expansion";
}

const roleLabels: Record<string, string> = {
  SuperAdmin: "Super Administrator",
  SalonAdmin: "Salon Administrator",
  Staff: "Staff Member",
  Customer: "Customer Account",
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
}) => {
  const auth = useContext(AuthContext);

  const userRole = auth?.user?.role || "";
  const roleLabel = roleLabels[userRole] || "Authorized User";

  const allTabs: SidebarTab[] = [
    {
      id: "salon",
      name: "Salon Services",
      icon: Scissors,
      allowedRoles: ["SuperAdmin", "SalonAdmin", "Staff", "Customer"],
      section: "services",
    },
    {
      id: "transport",
      name: "Transport Fleet",
      icon: Car,
      allowedRoles: ["SuperAdmin", "SalonAdmin", "Staff", "Customer"],
      section: "services",
    },
    {
      id: "hajj",
      name: "Hajj & Umrah",
      icon: Dome,
      allowedRoles: ["SuperAdmin", "SalonAdmin", "Staff", "Customer"],
      section: "services",
    },
    {
      id: "catering",
      name: "Catering Services",
      icon: Utensils,
      allowedRoles: ["SuperAdmin", "SalonAdmin", "Staff", "Customer"],
      section: "services",
    },
    {
      id: "rental",
      name: "Airbnb Rentals",
      icon: Home,
      allowedRoles: ["SuperAdmin", "SalonAdmin", "Staff", "Customer"],
      section: "services",
    },

    {
      id: "my_bookings",
      name: "My Salon Bookings",
      icon: CalendarRange,
      allowedRoles: ["Customer"],
      section: "customer",
    },
    {
      id: "my_transport_inquiries",
      name: "My Transport Inquiries",
      icon: Car,
      allowedRoles: ["Customer"],
      section: "customer",
    },
    {
      id: "my_hajj_inquiries",
      name: "My Hajj & Umrah Inquiries",
      icon: Dome,
      allowedRoles: ["Customer"],
      section: "customer",
    },
    {
      id: "my_catering_inquiries",
      name: "My Catering Inquiries",
      icon: Utensils,
      allowedRoles: ["Customer"],
      section: "customer",
    },
    {
      id: "my_rental_bookings",
      name: "My Stay Bookings",
      icon: Home,
      allowedRoles: ["Customer"],
      section: "customer",
    },
    {
      id: "dynamic_directory",
      name: "Explore New Services",
      icon: BriefcaseBusiness,
      allowedRoles: ["Customer"],
      section: "customer",
    },
    {
      id: "my_dynamic_requests",
      name: "My Service Requests",
      icon: ClipboardList,
      allowedRoles: ["Customer"],
      section: "customer",
    },

    {
      id: "salon_mgmt",
      name: "Manage Salon Services",
      icon: RefreshCw,
      allowedRoles: ["SuperAdmin", "SalonAdmin"],
      section: "management",
    },
    {
      id: "staff",
      name: "Manage Beauticians",
      icon: Users,
      allowedRoles: ["SuperAdmin", "SalonAdmin"],
      section: "management",
    },
    {
      id: "transport_mgmt",
      name: "Manage Transport",
      icon: Car,
      allowedRoles: ["SuperAdmin", "SalonAdmin"],
      section: "management",
    },
    {
      id: "hajj_mgmt",
      name: "Manage Hajj & Umrah",
      icon: Dome,
      allowedRoles: ["SuperAdmin", "SalonAdmin"],
      section: "management",
    },
    {
      id: "catering_mgmt",
      name: "Manage Catering",
      icon: Utensils,
      allowedRoles: ["SuperAdmin", "SalonAdmin"],
      section: "management",
    },
    {
      id: "rental_mgmt",
      name: "Manage Apartments",
      icon: Home,
      allowedRoles: ["SuperAdmin", "SalonAdmin"],
      section: "management",
    },

    {
      id: "dynamic_businesses",
      name: "Manage Future Businesses",
      icon: BriefcaseBusiness,
      allowedRoles: ["SuperAdmin"],
      section: "expansion",
    },
    {
      id: "dynamic_forms",
      name: "Manage Dynamic Forms",
      icon: ClipboardList,
      allowedRoles: ["SuperAdmin"],
      section: "expansion",
    },
  ];

  const visibleTabs = allTabs.filter((tab) =>
    tab.allowedRoles.includes(userRole),
  );

  const serviceTabs = visibleTabs.filter((tab) => tab.section === "services");
  const customerTabs = visibleTabs.filter((tab) => tab.section === "customer");
  const managementTabs = visibleTabs.filter(
    (tab) => tab.section === "management",
  );
  const expansionTabs = visibleTabs.filter(
    (tab) => tab.section === "expansion",
  );

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onCloseMobileSidebar();
  };

  const renderTab = (tab: SidebarTab) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => handleTabClick(tab.id)}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-3 text-left text-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#F45A2A]/25 ${
          isActive
            ? "bg-[#173C82] font-bold text-white shadow-md shadow-[#173C82]/15"
            : "font-semibold text-slate-600 hover:bg-[#FFF8F5] hover:text-[#173C82]"
        }`}
      >
        {isActive && (
          <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-md bg-[#F45A2A]" />
        )}

        <Icon
          className={`h-4 w-4 shrink-0 transition-colors duration-150 ${
            isActive
              ? "text-[#F45A2A]"
              : "text-slate-400 group-hover:text-[#F45A2A]"
          }`}
        />

        <span className="truncate">{tab.name}</span>
      </button>
    );
  };

  const renderSection = (
    title: string,
    tabs: SidebarTab[],
    showDivider = false,
  ) => {
    if (tabs.length === 0) {
      return null;
    }

    return (
      <section className={showDivider ? "mt-4 border-t border-slate-100 pt-4" : ""}>
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {title}
        </p>

        <div className="space-y-1">{tabs.map(renderTab)}</div>
      </section>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={onCloseMobileSidebar}
        aria-label="Close navigation overlay"
        className={`fixed inset-0 z-40 bg-[#173C82]/25 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden ${
          isMobileSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="OmniBiz main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-70 max-w-[84vw] flex-col border-r border-slate-200/80 bg-white font-sans antialiased shadow-xl transition-transform duration-300 ease-out lg:sticky lg:top-19 lg:z-30 lg:h-[calc(100vh-76px)] lg:w-66 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 p-4 select-none">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              OmniBiz Workspace
            </span>

            <h3 className="mt-0.5 text-[14px] font-semibold tracking-tight">
              <span className="text-[#173C82]">{roleLabel}</span>
              <span className="ml-1 text-[#F45A2A]">Access</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onCloseMobileSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[#173C82] transition-colors hover:bg-[#FFF4F0] hover:text-[#F45A2A] focus:outline-none focus:ring-2 focus:ring-[#F45A2A]/25 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav
          className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4"
          aria-label="OmniBiz navigation"
        >
          {renderSection("Business Services", serviceTabs)}

          {renderSection("My Account", customerTabs, serviceTabs.length > 0)}

          {renderSection(
            "Management",
            managementTabs,
            serviceTabs.length > 0 || customerTabs.length > 0,
          )}

          {renderSection(
            "Future Expansion",
            expansionTabs,
            serviceTabs.length > 0 ||
              customerTabs.length > 0 ||
              managementTabs.length > 0,
          )}
        </nav>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/30 px-4 py-3.5 text-center select-none">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            OmniBiz Business Group
          </p>

          <p className="mt-1 text-[10px] font-medium text-[#F45A2A]">
            Unified Business Operations
          </p>
        </div>
      </aside>
    </>
  );
};