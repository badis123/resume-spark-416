import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, LayoutDashboard, Wand2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState(user?.email ?? "");

  useEffect(() => setEmail(user?.email ?? ""), [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-hairline bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/_authenticated/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="h-5 w-5 text-gold" />
            Lumen CV
          </Link>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/_authenticated/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/_authenticated/optimize"><Wand2 className="mr-2 h-4 w-4" /> Optimize</Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="ml-2 hidden text-xs text-muted-foreground sm:block">{email}</div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
