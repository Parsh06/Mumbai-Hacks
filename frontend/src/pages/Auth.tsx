import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Mail, Lock, User } from "lucide-react";
import Logo from "@/components/Logo";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const action = isLogin ? "logged in" : "signed up";
      localStorage.setItem(
        "finsightai_user",
        JSON.stringify({
          email,
          fullName: fullName || undefined,
          createdAt: new Date().toISOString(),
        })
      );
      toast({
        title: isLogin ? "Welcome back!" : "Account created!",
        description: `You've successfully ${action}.`,
      });
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      toast({
        title: "Google sign-in (demo)",
        description: "In this demo, Google sign-in is simulated. Redirecting to dashboard.",
      });
      localStorage.setItem(
        "finsightai_user",
        JSON.stringify({
          email: "demo@finsightai.com",
          fullName: "FinSightAi User",
          provider: "google-demo",
          createdAt: new Date().toISOString(),
        })
      );
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Google sign-in failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const authBackground = isLogin
    ? "linear-gradient(120deg, rgba(3,7,18,0.92), rgba(7,89,133,0.85)), url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2000&q=80')"
    : "linear-gradient(120deg, rgba(3,7,18,0.92), rgba(139,92,246,0.78)), url('https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=2000&q=80')";

  const heroTitle = isLogin
    ? "Private banker-grade onboarding with instant intelligence."
    : "Launch an AI-native research desk for your entire team.";
  const heroDescription = isLogin
    ? "Trusted device posture, adaptive MFA, and AI anomaly detection keep your workspace secure."
    : "Invite collaborators, orchestrate custom agents, and sync portfolios across every desk in minutes.";
  const heroFeatures = isLogin
    ? ["Google SSO & passwordless links", "Session handoff to dashboards & automations", "Environment hardened with Supabase auth"]
    : ["Team-based access controls & playbooks", "Agent templates for research & diligence", "Real-time co-pilot share links"];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: authBackground,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:flex flex-col space-y-6 text-left">
          <Logo size="lg" stacked />
          <h2 className="text-4xl font-display leading-tight">{heroTitle}</h2>
          <p className="text-muted-foreground font-medium">{heroDescription}</p>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-success">FEATURES</p>
            <ul className="space-y-2 text-sm font-medium text-muted-foreground">
              {heroFeatures.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary border-4 border-border rounded-lg flex items-center justify-center shadow-[var(--shadow-brutal-lg)] mx-auto">
              <TrendingUp className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-display-md font-display">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-muted-foreground font-medium">
              {isLogin
                ? "Sign in to access your investment insights"
                : "Join FinSightAi for AI-powered financial analysis"}
            </p>
          </div>

        {/* Auth Form */}
        <div className="brutal-card-lg p-8 space-y-6 bg-card/90 backdrop-blur">
          <div className="grid gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="brutal-button w-full bg-background"
            >
              <GoogleIcon />
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </Button>
            <div className="relative text-center text-xs font-semibold text-muted-foreground">
              <span className="bg-card px-2 relative z-10">or use email</span>
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-border" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-semibold">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="brutal-input pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="brutal-input pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="brutal-input pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full brutal-button bg-primary text-primary-foreground hover:bg-primary/90 text-lg py-6"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground font-medium">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLogin(!isLogin)}
              className="brutal-button w-full"
            >
              {isLogin ? "Create Account" : "Sign In"}
            </Button>
          </div>
        </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 533.5 544.3">
    <path
      fill="#4285f4"
      d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272v105h147.3c-6.3 33.9-25.7 62.8-54.8 82.1v68h88.4c51.8-47.7 80.6-118.1 80.6-199.8z"
    />
    <path
      fill="#34a853"
      d="M272 544.3c74 0 136.2-24.5 181.6-66.5l-88.4-68c-24.6 16.5-56.2 26-93.2 26-71.6 0-132.3-48.2-154.1-113.1H23.9v70.9c45 89.1 137.7 150.7 248.1 150.7z"
    />
    <path
      fill="#fbbc04"
      d="M117.9 322.7c-10.5-31.3-10.5-65.1 0-96.4V155.4H23.9c-41.4 82.9-41.4 180.6 0 263.5l94-96.2z"
    />
    <path
      fill="#ea4335"
      d="M272 107.7c38.9-.6 76.3 14 104.7 40.8l78-78C404.3 24 342.1-.5 272 0 161.6 0 68.9 61.6 23.9 150.7l94 70.9C139.7 155.9 200.4 107.7 272 107.7z"
    />
  </svg>
);
