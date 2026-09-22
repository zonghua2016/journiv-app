import { X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePwaUpdate } from "../../app/pwa/usePwaUpdate";
import { AppConfirmDialog } from "../../components/journiv/AppConfirmDialog";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import { useShell } from "./shellContext";

/**
 * Persistent chrome, not a toast (DESIGN.md): "a new version is waiting" is
 * standing state, not a one-shot outcome. Never calls applyUpdate() without
 * explicit confirmation, and never auto-reloads.
 */
export function UpdateBar() {
  const { t } = useTranslation();
  const { updateReady, applyUpdate } = usePwaUpdate();
  const { hasUnsavedDraft } = useShell();
  const [dismissed, setDismissed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!updateReady || dismissed) return null;

  function restart() {
    if (hasUnsavedDraft) {
      setConfirmOpen(true);
      return;
    }
    void applyUpdate();
  }

  return (
    <>
      <div className="jv-update-bar" role="status">
        <span className="text-sm text-foreground">
          {t("shell.updateReady")}
        </span>
        <div className="jv-update-bar__actions">
          <Button variant="outline" size="sm" onClick={restart}>
            {t("shell.restartToUpdate")}
          </Button>
          <IconButton
            label={t("shell.dismiss")}
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
          >
            <X aria-hidden="true" size={16} />
          </IconButton>
        </div>
      </div>
      <AppConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("shell.restartTitle")}
        description={t("shell.restartDescription")}
        confirmLabel={t("shell.restartAnyway")}
        onConfirm={() => {
          setConfirmOpen(false);
          void applyUpdate();
        }}
      />
    </>
  );
}
