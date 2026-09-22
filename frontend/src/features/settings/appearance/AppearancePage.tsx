import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/skeleton";
import { StatusView } from "../../../components/journiv/StatusView";
import { useSettingsForm } from "../SettingsModal";
import { SettingsRow, SettingsSection } from "../SettingsSection";
import { PersonalizeSection } from "./PersonalizeSection";
import { useAppearanceForm } from "./useAppearanceForm";
import { NativeSelect } from "../../../components/ui/native-select";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { useTranslation } from "react-i18next";
import {
  getAppLanguage,
  setAppLanguage,
  type AppLanguage,
} from "../../../i18n";

export function AppearancePage() {
  const { t } = useTranslation();
  const form = useAppearanceForm();
  useSettingsForm({
    dirty: form.dirty,
    pending: form.mutation.isPending,
    canSave: form.dirty && !form.mutation.isPending,
    onSave: () => form.mutation.mutate(),
  });
  if (form.query.isLoading)
    return <Skeleton className="jv-settings__skeleton" />;
  if (form.query.isError)
    return (
      <StatusView
        title={t("settings.appearanceLoadError")}
        description={t("timeline.checkConnection")}
        action={
          <Button variant="secondary" onClick={() => form.query.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  return (
    <div className="jv-settings__body">
      <SettingsSection
        title={t("settings.appearance")}
        intro={t("settings.appearanceIntro")}
      >
        <SettingsRow
          label={t("language.label")}
          description={t("language.description")}
          htmlFor="interface-language"
        >
          <NativeSelect
            id="interface-language"
            value={getAppLanguage()}
            onChange={(event) =>
              void setAppLanguage(event.target.value as AppLanguage)
            }
          >
            <option value="zh-CN">{t("language.zhCN")}</option>
            <option value="en-US">{t("language.enUS")}</option>
          </NativeSelect>
        </SettingsRow>
        <SettingsRow label={t("settings.accountTheme")} htmlFor="account-theme">
          <NativeSelect
            id="account-theme"
            value={form.theme}
            onChange={(event) => form.setTheme(event.target.value)}
          >
            <option value="system">{t("settings.system")}</option>
            <option value="light">{t("settings.light")}</option>
            <option value="dark">{t("settings.dark")}</option>
          </NativeSelect>
        </SettingsRow>
        <SettingsRow label={t("settings.timeFormat")} htmlFor="time-format">
          <NativeSelect
            id="time-format"
            value={form.timeFormat}
            onChange={(event) => form.setTimeFormat(event.target.value)}
          >
            <option value="system">{t("settings.system")}</option>
            <option value="twelve_hour">{t("settings.twelveHour")}</option>
            <option value="twenty_four_hour">
              {t("settings.twentyFourHour")}
            </option>
          </NativeSelect>
        </SettingsRow>
        <SettingsRow label={t("settings.weekStartsOn")} htmlFor="week-start">
          <NativeSelect
            id="week-start"
            value={form.weekStart}
            onChange={(event) => form.setWeekStart(Number(event.target.value))}
          >
            <option value={0}>{t("settings.monday")}</option>
            <option value={1}>{t("settings.tuesday")}</option>
            <option value={2}>{t("settings.wednesday")}</option>
            <option value={3}>{t("settings.thursday")}</option>
            <option value={4}>{t("settings.friday")}</option>
            <option value={5}>{t("settings.saturday")}</option>
            <option value={6}>{t("settings.sunday")}</option>
          </NativeSelect>
        </SettingsRow>
      </SettingsSection>
      {form.mutation.isError && (
        <p className="jv-settings__alert" role="alert">
          {t("settings.appearanceSaveError")}
        </p>
      )}
      {form.mutation.isSuccess && !form.dirty && (
        <Alert role="status">
          <AlertDescription>{t("settings.appearanceSaved")}</AlertDescription>
        </Alert>
      )}
      <PersonalizeSection />
      {/* UiExperimentSection is intentionally unmounted — the UI-feel A/B
          framework (src/features/theme/uiExperiment.ts) is kept wired at boot
          for future use but hidden from Settings. Re-add <UiExperimentSection />
          here to run another round. */}
    </div>
  );
}
