import { useEffect, type ReactNode } from "react";
import { useHandleSignInCallback, useLogto } from "@logto/react";
import { useTranslation } from "react-i18next";
import App from "@/app";
import {
  logtoApiResource,
  registerAuthHandlers,
  signInRedirectUri,
} from "@/auth";

function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh items-center justify-center bg-background">
      {children}
    </div>
  );
}

function LoadingScreen() {
  const { t } = useTranslation("common");
  return (
    <CenteredScreen>
      <span className="text-sm text-muted-foreground">
        {t("auth.loading")}
      </span>
    </CenteredScreen>
  );
}

function SignInRedirect() {
  const { signIn } = useLogto();
  useEffect(() => {
    void signIn(signInRedirectUri());
  }, [signIn]);
  return <LoadingScreen />;
}

function SignInCallback() {
  const { t } = useTranslation("common");
  const { isLoading, isAuthenticated, error } = useHandleSignInCallback(() => {
    window.location.replace("/");
  });
  if (error) {
    return (
      <CenteredScreen>
        <span className="text-sm text-destructive">
          {t("auth.signInFailed")}
        </span>
      </CenteredScreen>
    );
  }
  if (!isLoading && !isAuthenticated) {
    return <SignInRedirect />;
  }
  return <LoadingScreen />;
}

function AuthBridge() {
  const { getAccessToken, signIn } = useLogto();
  useEffect(() => {
    registerAuthHandlers(
      async () => (await getAccessToken(logtoApiResource())) ?? null,
      () => void signIn(signInRedirectUri()),
    );
  }, [getAccessToken, signIn]);
  return null;
}

export function AuthGate() {
  const { isLoading, isAuthenticated } = useLogto();

  if (window.location.pathname === "/callback") {
    return <SignInCallback />;
  }
  if (!isAuthenticated) {
    return isLoading ? <LoadingScreen /> : <SignInRedirect />;
  }
  return (
    <>
      <AuthBridge />
      <App />
    </>
  );
}
