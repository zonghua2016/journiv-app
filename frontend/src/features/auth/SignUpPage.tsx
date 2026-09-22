import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { sessionStore, userIdFromAuthResponse } from "../../api/auth/session";
import { api } from "../../api/client/api";
import { ApiError } from "../../api/client/errors";
import { instanceConfigQuery } from "../../api/query/options";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button, buttonVariants } from "../../components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { Separator } from "../../components/ui/separator";
import { Spinner } from "../../components/ui/spinner";
import { AuthCard } from "./AuthCard";
import { OidcAction } from "./oidc";
import "./auth.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function signUpErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "We couldn’t create your account. Try again.";
  if (error.status === 400)
    return "We couldn’t create that account. Check your details or sign in if you already have one.";
  if (error.status === 403)
    return "Account creation isn’t available on this Journiv instance.";
  if (error.status === 422) return "Check your account details and try again.";
  if (error.status === 429)
    return "Too many account creation attempts. Wait a moment and try again.";
  return "We couldn’t create your account. Try again.";
}

export function SignUpPage() {
  const { t } = useTranslation();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const submittingRef = useRef(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { returnTo } = useSearch({ from: "/signup" });
  const instanceConfig = useQuery({
    ...instanceConfigQuery(),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const nameError = trimmedName ? "" : t("auth.enterName");
  const emailError = EMAIL_PATTERN.test(trimmedEmail)
    ? ""
    : t("auth.enterValidEmail");
  const passwordError = password ? "" : t("auth.enterPassword");
  const confirmError = !confirm
    ? t("auth.confirmPasswordError")
    : confirm !== password
      ? t("auth.passwordsMismatch")
      : "";
  const invalid = Boolean(
    nameError || emailError || passwordError || confirmError,
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setError("");
    // `pending` alone can be stale for a second submit dispatched before React
    // commits it; the ref closes that window so a fast double Enter/click can
    // never fire `api.register` twice.
    if (invalid || pending || submittingRef.current) return;

    submittingRef.current = true;
    setPending(true);
    let registered = false;
    try {
      await api.register({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      registered = true;
      const tokens = await api.login(trimmedEmail, password);
      queryClient.clear();
      sessionStore.adopt({
        accessToken: tokens.access_token,
        userId: userIdFromAuthResponse(tokens.user),
      });
      await navigate({ href: returnTo });
    } catch (caught) {
      if (registered) {
        setPassword("");
        setConfirm("");
        setAccountCreated(true);
      } else {
        setError(signUpErrorMessage(caught));
      }
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  // Only the very first load blocks the screen; a background refetch (window
  // focus, reconnect) keeps whatever is already rendered so an in-progress
  // form is never torn down under the user.
  if (instanceConfig.isLoading) {
    return (
      <AuthCard
        heading={t("auth.checkingSignUp")}
        busy
        lede={
          <p className="jv-auth__lede jv-auth__status" role="status">
            <Spinner aria-hidden />
            {t("auth.checkingSignUpDetail")}
          </p>
        }
      />
    );
  }

  if (!instanceConfig.data) {
    return (
      <AuthCard
        heading={t("auth.signUpUnavailable")}
        lede={t("auth.signUpUnavailableDetail")}
      >
        <Button variant="default" onClick={() => void instanceConfig.refetch()}>
          {t("common.retry")}
        </Button>
        <p className="jv-auth__alternate jv-caption">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link to="/login" search={{ returnTo }}>
            {t("auth.signIn")}
          </Link>
        </p>
      </AuthCard>
    );
  }

  if (instanceConfig.data.oidc_only) {
    return (
      <AuthCard
        heading={t("auth.createOrAccess")}
        lede={t("auth.createOrAccessDetail")}
      >
        <OidcAction returnTo={returnTo} primary />
      </AuthCard>
    );
  }

  if (instanceConfig.data.disable_signup) {
    if (instanceConfig.data.oidc_enabled) {
      return (
        <AuthCard
          heading={t("auth.passwordSignUpDisabled")}
          lede={t("auth.passwordSignUpDisabledDetail")}
        >
          <OidcAction returnTo={returnTo} primary />
          <p className="jv-auth__alternate jv-caption">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/login" search={{ returnTo }}>
              {t("auth.returnToSignIn")}
            </Link>
          </p>
        </AuthCard>
      );
    }
    return (
      <AuthCard
        heading={t("auth.signUpDisabled")}
        lede={t("auth.signUpDisabledDetail")}
      >
        <Link
          className={buttonVariants({ variant: "default" })}
          to="/login"
          search={{ returnTo }}
        >
          {t("auth.returnToSignIn")}
        </Link>
      </AuthCard>
    );
  }

  if (accountCreated) {
    return (
      <AuthCard
        heading={t("auth.accountCreated")}
        lede={t("auth.accountCreatedDetail")}
      >
        <Link
          className={buttonVariants({ variant: "default" })}
          to="/login"
          search={{ returnTo }}
        >
          {t("auth.signIn")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      heading={t("auth.createYourAccount")}
      lede={t("auth.createYourAccountDetail")}
    >
      <form className="jv-auth__form" noValidate onSubmit={submit}>
        <FieldGroup className="jv-auth__fields">
          <Field data-invalid={touched && Boolean(nameError)}>
            <FieldLabel htmlFor={nameId}>{t("auth.name")}</FieldLabel>
            <Input
              id={nameId}
              name="name"
              value={name}
              autoComplete="name"
              autoFocus
              aria-invalid={touched && Boolean(nameError)}
              aria-describedby={
                touched && nameError ? `${nameId}-error` : undefined
              }
              onChange={(event) => setName(event.target.value)}
            />
            {touched && nameError && (
              <FieldError id={`${nameId}-error`}>{nameError}</FieldError>
            )}
          </Field>

          <Field data-invalid={touched && Boolean(emailError)}>
            <FieldLabel htmlFor={emailId}>{t("auth.email")}</FieldLabel>
            <Input
              id={emailId}
              name="email"
              type="email"
              value={email}
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
              spellCheck={false}
              aria-invalid={touched && Boolean(emailError)}
              aria-describedby={
                touched && emailError ? `${emailId}-error` : undefined
              }
              onChange={(event) => setEmail(event.target.value)}
            />
            {touched && emailError && (
              <FieldError id={`${emailId}-error`}>{emailError}</FieldError>
            )}
          </Field>

          <Field data-invalid={touched && Boolean(passwordError)}>
            <FieldLabel htmlFor={passwordId}>{t("auth.password")}</FieldLabel>
            <Input
              id={passwordId}
              name="password"
              type="password"
              value={password}
              autoComplete="new-password"
              aria-invalid={touched && Boolean(passwordError)}
              aria-describedby={
                touched && passwordError
                  ? `${passwordId}-description ${passwordId}-error`
                  : `${passwordId}-description`
              }
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldDescription id={`${passwordId}-description`}>
              {t("auth.uniquePassword")}
            </FieldDescription>
            {touched && passwordError && (
              <FieldError id={`${passwordId}-error`}>
                {passwordError}
              </FieldError>
            )}
          </Field>

          <Field data-invalid={touched && Boolean(confirmError)}>
            <FieldLabel htmlFor={confirmId}>
              {t("auth.confirmPassword")}
            </FieldLabel>
            <Input
              id={confirmId}
              name="confirm-password"
              type="password"
              value={confirm}
              autoComplete="new-password"
              aria-invalid={touched && Boolean(confirmError)}
              aria-describedby={
                touched && confirmError ? `${confirmId}-error` : undefined
              }
              onChange={(event) => setConfirm(event.target.value)}
            />
            {touched && confirmError && (
              <FieldError id={`${confirmId}-error`}>{confirmError}</FieldError>
            )}
          </Field>
        </FieldGroup>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" variant="default" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" aria-hidden />}
          {pending ? t("auth.creatingAccount") : t("auth.createAccountButton")}
        </Button>
      </form>

      {instanceConfig.data.oidc_enabled && (
        <>
          <div className="jv-auth__divider">
            <Separator aria-hidden="true" />
            <span className="jv-caption">{t("common.or")}</span>
            <Separator aria-hidden="true" />
          </div>
          <OidcAction returnTo={returnTo} />
        </>
      )}

      <p className="jv-auth__alternate jv-caption">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link to="/login" search={{ returnTo }}>
          {t("auth.signIn")}
        </Link>
      </p>
    </AuthCard>
  );
}
