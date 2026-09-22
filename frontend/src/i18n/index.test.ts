import { afterEach, describe, expect, it } from "vitest";
import i18n, { LANGUAGE_STORAGE_KEY, getAppLanguage, setAppLanguage } from ".";

describe("application language", () => {
  afterEach(async () => setAppLanguage("en-US"));

  it("switches language, persists it, and synchronises the document", async () => {
    await setAppLanguage("zh-CN");

    expect(getAppLanguage()).toBe("zh-CN");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-CN");
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(i18n.t("nav.newEntry")).toBe("新建日记");
  });

  it("falls back to Chinese for missing English translations", async () => {
    await setAppLanguage("en-US");
    expect(i18n.t("nav.timeline")).toBe("Timeline");
  });
});
