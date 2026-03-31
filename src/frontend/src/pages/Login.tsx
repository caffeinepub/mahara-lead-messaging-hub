import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, MessageCircle } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex">
      {/* Left panel - dark navy */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: "oklch(0.18 0.04 255)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-2xl">Mahara</span>
        </div>
        <div>
          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Manage leads &amp; send messages with confidence
          </h2>
          <p style={{ color: "oklch(0.72 0.03 255)" }} className="text-lg">
            Import your contacts, compose rich messages with attachments, and
            track every conversation — all in one place.
          </p>
        </div>
        <div className="flex gap-8">
          {[
            { label: "Active Leads", value: "2,400+" },
            { label: "Messages Sent", value: "18,000+" },
            { label: "Response Rate", value: "74%" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
              <p style={{ color: "oklch(0.65 0.03 255)" }} className="text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">Mahara</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to access your Lead Messaging Hub.
          </p>

          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full"
            data-ocid="login.primary_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" /> Sign In
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Secured by Internet Identity — no passwords required.
          </p>
        </div>
      </div>
    </div>
  );
}
