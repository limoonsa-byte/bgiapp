import { useEffect, useState } from "react";

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => getState());

  useEffect(() => {
    const phoneWidthQuery = matchMedia("(max-width: 899px)");
    const touchQuery = matchMedia("(hover: none) and (pointer: coarse)");
    const tabletQuery = matchMedia("(min-width: 900px) and (max-width: 1199px)");

    function update() {
      setState(getState());
    }

    phoneWidthQuery.addEventListener("change", update);
    touchQuery.addEventListener("change", update);
    tabletQuery.addEventListener("change", update);
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);

    return () => {
      phoneWidthQuery.removeEventListener("change", update);
      touchQuery.removeEventListener("change", update);
      tabletQuery.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return state;
}

function getState(): ResponsiveState {
  if (typeof window === "undefined") {
    return { isMobile: false, isTablet: false, isDesktop: true };
  }

  const width = Math.min(window.innerWidth, window.screen?.width || window.innerWidth);
  const coarseTouch =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;

  // Some Android in-app browsers/webviews report a desktop-like CSS width.
  // Treat touch-first screens below 1200px as mobile so the office never
  // renders the desktop sidebar/header layout on a phone.
  const isMobile = width < 900 || (coarseTouch && width < 1200);
  const isTablet = !isMobile && width < 1200;

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
  };
}
