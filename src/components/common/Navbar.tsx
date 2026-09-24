import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Menu, UserCircle2 } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

interface NavbarProps {
  onOpenMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

const getRoleLabel = (role?: string) => {
  const roleLabels: Record<string, string> = {
    SuperAdmin: "Super Administrator",
    SalonAdmin: "Salon Administrator",
    Staff: "Staff Member",
    Customer: "Customer Account",
  };
  return roleLabels[role || ""] || "User Account";
};

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  isMobileSidebarOpen = false,
}) => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Dropdown open/close state aur reference toggling ke liye
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    auth?.logoutUser();
    navigate("/login", { replace: true });
  };

  // Bahar click karne par dropdown ko close karne ka mechanism
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = auth?.user?.name
    ? auth.user.name.charAt(0).toUpperCase()
    : "O";

  const isLoggedIn = Boolean(auth?.token && auth?.user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-[0_2px_12px_rgba(15,23,42,0.05)] backdrop-blur">
      <nav className="flex min-h-17.5 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Menu Icon & Logo */}
        <div className="flex min-w-0 items-center gap-3">
          {isLoggedIn && (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#173C82] transition hover:text-[#173C82]/80 focus:outline-none lg:hidden"
              aria-label="Open navigation menu"
              aria-controls="mobile-sidebar"
              aria-expanded={isMobileSidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex h-10 w-10 shrink-0">
            <img
              src="/logo-omnibiz.png"
              alt="OmniBiz logo"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 leading-none">
            <h1 className="text-[21px] font-bold sm:text-[24px]">
              <span className="text-[#173C82]">Omni</span>
              <span className="text-[#F45A2A]">Biz</span>
            </h1>
          </div>
        </div>

        {/* Right Side: Profile Icon & Click-based Dropdown */}
        {isLoggedIn ? (
          <div className="flex items-center gap-2" ref={dropdownRef}>
            <div className="relative">
              {/* Profile Avatar Button (Har screen size par border/bg remove kar diya hai) */}
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center rounded-full p-1 transition focus:outline-none"
                aria-label="Toggle user account menu"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#173C82] text-xs font-bold text-white shadow-sm sm:h-9 sm:w-9 sm:text-sm">
                  {userInitial}
                </div>
              </button>

              {/* Dropdown Menu (Ab state ke mutabiq condition par render hota hai) */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition-all duration-200">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {auth?.user?.name}
                    </p>
                    <p className="truncate pt-0.5 text-xs text-slate-500">
                      {auth?.user?.email || getRoleLabel(auth?.user?.role)}
                    </p>
                  </div>

                  <div className="px-1 py-1.5">
                    <div className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-slate-500">
                      <UserCircle2 className="h-4 w-4 text-[#173C82]" />
                      <span>{getRoleLabel(auth?.user?.role)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-xs font-bold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            Guest Access
          </div>
        )}
      </nav>
    </header>
  );
};
