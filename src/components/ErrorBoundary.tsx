import React from "react";
import { Button } from "@/components/ui/button";
import { translations } from "@/i18n/translations";

type ErrorBoundaryProps = React.PropsWithChildren<{
  /** When this value changes, the boundary resets (e.g. pass location.pathname). */
  resetKey?: string;
}>;

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App render error:", error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const storedLanguage = localStorage.getItem("datavision-lang");
    const language = storedLanguage === "pt-BR" || storedLanguage === "en"
      ? storedLanguage
      : navigator.language.startsWith("pt") ? "pt-BR" : "en";
    const t = translations[language];

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold">{t.errorBoundary.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {t.errorBoundary.description}
          </p>
          <p className="mt-4 rounded-md border bg-muted/40 p-3 text-left text-xs text-muted-foreground break-words">
            {this.state.error.message || String(this.state.error)}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={this.reset}>
              {t.common.retry}
            </Button>
            <Button onClick={() => window.location.assign("/")}>
              {t.common.backHome}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
