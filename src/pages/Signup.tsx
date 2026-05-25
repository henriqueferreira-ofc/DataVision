import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Check your email to confirm your account." });
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-svh">
      <div className="auth-left-panel-bg hidden w-1/2 items-center justify-center lg:flex">
        <div className="max-w-md px-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <BarChart3 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold">DataVision</h2>
          <p className="mt-3 text-muted-foreground">{t.hero.subtitle}</p>
        </div>
      </div>

      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex justify-end p-4">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
          <div className="w-full max-w-sm sm:max-w-md">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">{t.auth.signupTitle}</h1>
              <p className="mt-1 text-muted-foreground">{t.auth.signupSubtitle}</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.auth.name}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full active:scale-[0.97]" disabled={loading}>
                {loading ? (t.auth.signupButton === "Criar conta" ? "Criando conta..." : "Creating account...") : t.auth.signupButton}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t.auth.hasAccount}{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">{t.nav.login}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
