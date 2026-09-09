import { useTranslation } from "react-i18next";

type AppLanguage = "ko" | "en" | "zh";

function resolveLanguage(language?: string): AppLanguage {
  if (language?.startsWith("ko")) return "ko";
  if (language?.startsWith("zh")) return "zh";
  return "en";
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("layout");
  const current = resolveLanguage(i18n.resolvedLanguage ?? i18n.language);
  const next: AppLanguage = current === "ko" ? "en" : current === "en" ? "zh" : "ko";
  const label = current === "ko" ? "한" : current === "en" ? "EN" : "中";
  const ariaLabel =
    next === "ko"
      ? "한국어로 전환"
      : next === "en"
        ? t("topbar.language.switchToEn")
        : t("topbar.language.switchToZh");

  const handleSwitch = () => {
    void i18n.changeLanguage(next);
  };

  return (
    <button
      onClick={handleSwitch}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="ml-1 flex h-7 min-w-8 items-center justify-center rounded-md px-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
    >
      {label}
    </button>
  );
}
