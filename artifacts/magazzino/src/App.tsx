import { useEffect, useRef } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "@/lib/theme";
import { CartPanel } from "@/components/layout/CartPanel";

// Pages
import Home from "@/pages/Home";
import Store from "@/pages/Store";
import ProductDetail from "@/pages/ProductDetail";
import Proponi from "@/pages/Proponi";
import Chat from "@/pages/Chat";
import MieChat from "@/pages/MieChat";
import AdminLayout from "@/pages/AdminLayout";

const queryClient = new QueryClient();

// ─── Clerk setup ─────────────────────────────────────────────────────────────
// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so
// the same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim. Empty in dev (Clerk hits dev FAPI directly),
// auto-set in prod. Do NOT gate on import.meta.env.PROD.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Clerk passes full paths to routerPush/routerReplace but wouter's setLocation
// prepends the base — strip it to avoid doubling.
function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

// ─── Appearance ──────────────────────────────────────────────────────────────
const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#171717",
    colorForeground: "#171717",
    colorMutedForeground: "#737373",
    colorDanger: "#dc2626",
    colorBackground: "#faf9f7",
    colorInput: "#e0e0e0",
    colorInputForeground: "#171717",
    colorNeutral: "#e0e0e0",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif tracking-tight",
    headerSubtitle: "text-[#737373]",
    socialButtonsBlockButtonText: "font-medium text-[#171717]",
    formFieldLabel:
      "text-xs font-bold uppercase tracking-widest text-[#737373]",
    footerActionLink: "text-[#171717] font-semibold hover:underline",
    footerActionText: "text-[#737373]",
    dividerText: "text-[#737373] text-xs uppercase tracking-widest",
    identityPreviewEditButton: "text-[#171717]",
    formFieldSuccessText: "text-green-700",
    alertText: "text-[#171717]",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton:
      "border border-[#e0e0e0] hover:bg-[#f5f5f5] transition-colors",
    formButtonPrimary:
      "bg-[#171717] hover:bg-[#333] uppercase tracking-widest text-sm font-bold rounded-xl !text-white",
    formFieldInput: "rounded-xl border-[#e0e0e0] bg-white text-[#171717]",
    footerAction: "border-t border-[#e0e0e0]",
    dividerLine: "bg-[#e0e0e0]",
    alert: "border border-[#e0e0e0] rounded-xl",
    otpCodeFieldInput: "border-[#e0e0e0] rounded-lg text-[#171717] font-mono",
    formFieldRow: "gap-3",
    main: "gap-5",
  },
};

// ─── Query client cache invalidation on sign-in/out ──────────────────────────
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const uid = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== uid
      ) {
        qc.clear();
      }
      prevUserIdRef.current = uid;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

// ─── Auth page shell — editorial split layout ────────────────────────────────
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left editorial panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-primary text-primary-foreground p-12 relative overflow-hidden">
        {/* Decorative texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,currentColor 0,currentColor 1px,transparent 0,transparent 50%)",
            backgroundSize: "12px 12px",
          }}
        />
        <div className="relative z-10">
          <a
            href="/"
            className="font-serif text-lg tracking-tight opacity-90 hover:opacity-100 transition-opacity"
          >
            IL MAGAZZINO DEL MAN
          </a>
        </div>
        <div className="relative z-10 space-y-6">
          <p className="font-serif text-4xl leading-snug">
            I prodotti migliori,
            <br />
            ai prezzi più competitivi.
          </p>
          <p className="text-sm opacity-60 leading-relaxed max-w-xs">
            Articoli selezionati di menswear di lusso. Acquista, proponi, vendi
            — tutto in un unico posto.
          </p>
          <div className="flex gap-4 text-xs opacity-50 uppercase tracking-widest">
            <span>Qualità verificata</span>
            <span>·</span>
            <span>Prezzi onesti</span>
          </div>
        </div>
        <div className="relative z-10 text-xs opacity-40">
          © Il Magazzino del Man 2026
        </div>
      </div>
      {/* Right: Clerk form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm mb-8 lg:hidden">
          <a
            href="/"
            className="font-serif text-xl tracking-tight text-foreground"
          >
            IL MAGAZZINO DEL MAN
          </a>
        </div>
        {children}
        <a
          href="/"
          className="mt-8 text-xs text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase"
        >
          ← Torna allo store
        </a>
      </div>
    </div>
  );
}

// ─── Clerk sign-in / sign-up pages ───────────────────────────────────────────
function SignInPage() {
  return (
    <AuthShell>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </AuthShell>
  );
}

function SignUpPage() {
  return (
    <AuthShell>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </AuthShell>
  );
}

// ─── Router ──────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/store" component={Store} />
      <Route path="/store/:id" component={ProductDetail} />
      <Route path="/login" component={SignInPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/proponi" component={Proponi} />
      <Route path="/chat/:proposalId" component={Chat} />
      <Route path="/le-mie-chat" component={MieChat} />
      <Route path="/admin" nest component={AdminLayout} />
      <Route>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <h1 className="text-2xl font-serif">404 - Pagina non trovata</h1>
        </div>
      </Route>
    </Switch>
  );
}

// ─── App shell ───────────────────────────────────────────────────────────────
function AppInner() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Bentornato",
            subtitle: "Accedi al tuo account",
          },
        },
        signUp: {
          start: {
            title: "Crea account",
            subtitle: "Registrati per accedere allo store e proporre articoli",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <Router />
              <CartPanel />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppInner />
    </WouterRouter>
  );
}

export default App;
