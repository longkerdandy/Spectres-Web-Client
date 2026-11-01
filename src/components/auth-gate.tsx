import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useHandleSignInCallback, useLogto } from "@logto/react";
import { useTranslation } from "react-i18next";
import App from "@/app";
import AdminPage from "@/pages/admin-page";
import {
  accessToken,
  decodeAccessToken,
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

function AuthBridge({ onToken }: { onToken: (token: string) => void }) {
  const { getAccessToken, signIn } = useLogto();
  useEffect(() => {
    registerAuthHandlers(
      async () => {
        const token = (await getAccessToken(logtoApiResource())) ?? null;
        if (token) onToken(token);
        return token;
      },
      () => void signIn(signInRedirectUri()),
    );
    void accessToken();
  }, [getAccessToken, onToken, signIn]);
  return null;
}

type RoleState =
  | { role: "loading"; currentUserId: null }
  | { role: "user" | "admin"; currentUserId: string | null };

function AuthenticatedSurface() {
  const [roleState, setRoleState] = useState<RoleState>({
    role: "loading",
    currentUserId: null,
  });
  const handleToken = useCallback((token: string) => {
    const claims = decodeAccessToken(token);
    setRoleState({
      role:
        claims.sub && claims.scopes.includes("agent_os:admin") ? "admin" : "user",
      currentUserId: claims.sub,
    });
  }, []);

  let surface: ReactNode = <LoadingScreen />;
  if (roleState.role === "admin") {
    surface = <AdminPage currentUserId={roleState.currentUserId} />;
  } else if (roleState.role === "user") {
    surface = <App />;
  }

  return (
    <>
      <AuthBridge onToken={handleToken} />
      {surface}
    </>
  );
}

export function AuthGate() {
  const { isLoading, isAuthenticated } = useLogto();

  if (window.location.pathname === "/callback") {
    return <SignInCallback />;
  }
  if (!isAuthenticated) {
    return isLoading ? <LoadingScreen /> : <SignInRedirect />;
  }
  return <AuthenticatedSurface />;
}
