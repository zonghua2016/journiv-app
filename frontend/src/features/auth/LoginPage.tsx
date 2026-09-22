import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { sessionStore, userIdFromAuthResponse } from "../../api/auth/session";
import { api } from "../../api/client/api";
import { instanceConfigQuery } from "../../api/query/options";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Field, FieldGroup, FieldLabel } from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Spinner } from "../../components/ui/spinner";
import { AuthCard } from "./AuthCard";
import { OidcAction } from "./oidc";
import "./auth.css";

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { returnTo } = useSearch({ from: "/login" });
  const instanceConfig = useQuery({
    ...instanceConfigQuery(),
    staleTime: 0,
    refetchOnMount: "always",
  });

  async function submit(form: FormData) {
    if (submitting.current) return;

    submitting.current = true;
    setError("");
    setPending(true);
    try {
      const tokens = await api.login(
        String(form.get("email")),
        String(form.get("password")),
      );
      queryClient.clear();
      sessionStore.adopt({
        accessToken: tokens.access_token,
        userId: userIdFromAuthResponse(tokens.user),
      });
      await navigate({ href: returnTo });
    } catch {
      setError(t("auth.signInFailed"));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (instanceConfig.isLoading) {
    return (
      <AuthCard
        heading={t("auth.checkingOptions")}
        busy
        lede={
          <p className="jv-auth__lede jv-auth__status" role="status">
            <Spinner aria-hidden />
            {t("auth.checkingOptionsDetail")}
          </p>
        }
      />
    );
  }

  if (!instanceConfig.data) {
    return (
      <AuthCard
        heading={t("auth.unavailable")}
        lede={t("auth.unavailableDetail")}
      >
        <Button variant="default" onClick={() => void instanceConfig.refetch()}>
          {t("common.retry")}
        </Button>
      </AuthCard>
    );
  }

  const { disable_signup, oidc_enabled, oidc_only } = instanceConfig.data;

  if (oidc_only) {
    return (
      <AuthCard heading={t("auth.welcomeBack")} lede={t("auth.ssoLede")}>
        <OidcAction returnTo={returnTo} primary />
      </AuthCard>
    );
  }

  return (
    <AuthCard heading={t("auth.welcomeBack")} lede={t("auth.signInLede")}>
      <form className="jv-auth__form" action={submit}>
        <FieldGroup className="jv-auth__fields">
          <Field>
            <FieldLabel htmlFor="email">{t("auth.email")}</FieldLabel>
            <Input
              id="email"
              required
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">{t("auth.password")}</FieldLabel>
            <Input
              id="password"
              required
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
        </FieldGroup>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" variant="default" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" aria-hidden />}
          {pending ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
      </form>

      {oidc_enabled && (
        <>
          <div className="jv-auth__divider">
            <Separator aria-hidden="true" />
            <span className="jv-caption">{t("common.or")}</span>
            <Separator aria-hidden="true" />
          </div>
          <OidcAction returnTo={returnTo} />
        </>
      )}

      {!disable_signup && (
        <p className="jv-auth__alternate jv-caption">
          {t("auth.newToJourniv")}{" "}
          <Link to="/signup" search={{ returnTo }}>
            {t("auth.createAccount")}
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
