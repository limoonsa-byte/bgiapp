import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { ChatDockBar } from "@/components/chat/ChatDockBar";
import { RestartBanner } from "@/components/shared/RestartBanner";
import { ToastContainer } from "@/components/shared/ToastContainer";
import { useOfficeStore } from "@/store/office-store";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children?: ReactNode;
  isMobile?: boolean;
}

export function AppShell({ children, isMobile = false }: AppShellProps) {
  const { t } = useTranslation("layout");
  const sidebarCollapsed = useOfficeStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useOfficeStore((s) => s.setSidebarCollapsed);
  const currentPage = useOfficeStore((s) => s.currentPage);

  const initEventHistory = useOfficeStore((s) => s.initEventHistory);
  const hideSidebar = currentPage === "chat";

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, setSidebarCollapsed]);

  useEffect(() => {
    initEventHistory();
  }, [initEventHistory]);

  const content = children ?? <Outlet />;

  return (
    <div className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <RestartBanner />
      <TopBar isMobile={isMobile} />
      <ToastContainer />
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">{content}</div>
          <ChatDialog />
          {!hideSidebar && <ChatDockBar />}
        </main>
        {!hideSidebar &&
          (isMobile ? (
            <>
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="fixed bottom-0 left-1/2 z-20 flex h-9 w-36 -translate-x-1/2 items-center justify-center rounded-t-xl border border-b-0 border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95"
                aria-label={sidebarCollapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
              >
                <div className="h-1 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
              </button>
              {!sidebarCollapsed && (
                <>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSidebarCollapsed(true)}
                    onKeyDown={(e) => e.key === "Escape" && setSidebarCollapsed(true)}
                    className="fixed inset-0 z-30 bg-black/45"
                    aria-label={t("sidebar.closeSidebar")}
                  />
                  <aside className="fixed inset-x-0 bottom-0 top-[74px] z-40 overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl dark:border-gray-700 dark:bg-gray-900">
                    <Sidebar />
                  </aside>
                </>
              )}
            </>
          ) : (
            <Sidebar />
          ))}
      </div>
    </div>
  );
}
