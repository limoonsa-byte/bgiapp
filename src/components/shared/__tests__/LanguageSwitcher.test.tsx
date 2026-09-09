import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import i18n from "@/i18n/test-setup";
import { LanguageSwitcher } from "../LanguageSwitcher";

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("ko");
    });
  });

  it("shows 한 when current language is ko", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText("한")).toBeInTheDocument();
  });

  it("shows EN when current language is en", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(<LanguageSwitcher />);
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("shows 中 when current language is zh", async () => {
    await act(async () => {
      await i18n.changeLanguage("zh");
    });
    render(<LanguageSwitcher />);
    expect(screen.getByText("中")).toBeInTheDocument();
  });

  it("cycles ko to en", async () => {
    render(<LanguageSwitcher />);
    await act(async () => {
      fireEvent.click(screen.getByText("한"));
    });
    expect(i18n.language).toBe("en");
  });

  it("cycles en to zh", async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
    render(<LanguageSwitcher />);
    await act(async () => {
      fireEvent.click(screen.getByText("EN"));
    });
    expect(i18n.language).toBe("zh");
  });

  it("cycles zh to ko", async () => {
    await act(async () => {
      await i18n.changeLanguage("zh");
    });
    render(<LanguageSwitcher />);
    await act(async () => {
      fireEvent.click(screen.getByText("中"));
    });
    expect(i18n.language).toBe("ko");
  });
});
