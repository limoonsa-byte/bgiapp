import { Home, Bot, Radio, Puzzle, Clock, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { RestartBanner } from "@/components/shared/RestartBanner";
import { useResponsive } from "@/hooks/useResponsive";
import { TopBar } from "./TopBar";

export function ConsoleLayout() {
  const { t } = useTranslation("layout");
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const isChatRoute = location.pathname === "/chat";
  const isWorkbenchRoute = location.pathname.startsWith("/skill-workbench");
  const isFullWidthRoute = isChatRoute || isWorkbenchRoute;

  const sidebarNavItems = [
    { path: "/dashboard", labelKey: "consoleNav.dashboard", icon: Home },
    { path: "/agents", labelKey: "consoleNav.agents", icon: Bot },
    { path: "/channels", labelKey: "consoleNav.channels", icon: Radio },
    { path: "/skills", labelKey: "consoleNav.skills", icon: Puzzle },
    { path: "/cron", labelKey: "consoleNav.cron", icon: Clock },
    { path: "/settings", labelKey: "consoleNav.settings", icon: Settings },
  ] as const;

  return (
    <div className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <RestartBanner />
      <TopBar isMobile={isMobile} />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {!isFullWidthRoute && !isMobile && (
          <nav className="flex w-52 shrink-0 flex-col border-r border-gray-200 bg-white py-3 dark:border-gray-700 dark:bg-gray-900">
            {sidebarNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`mx-2 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </nav>
        )}
        <main className="min-w-0 flex-1 overflow-auto">
          <div
            className={
              isFullWidthRoute
                ? "h-full min-w-0"
                : isMobile
                  ? "mx-auto w-full max-w-6xl p-3 pb-24"
                  : "mx-auto max-w-6xl p-6"
            }
          >
            <Outlet />
          </div>
        </main>
      </div>

      {!isFullWidthRoute && isMobile && (
        <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
          {sidebarNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={`mobile-${item.path}`}
                onClick={() => navigate(item.path)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="max-w-full truncate">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
