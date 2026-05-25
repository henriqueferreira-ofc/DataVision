import React from "react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App render error:", error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold">Algo deu errado</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A página encontrou um erro ao carregar. Tente voltar para o início e entrar novamente.
          </p>
          <p className="mt-4 rounded-md border bg-muted/40 p-3 text-left text-xs text-muted-foreground">
            {this.state.error.message}
          </p>
          <Button className="mt-6" onClick={() => window.location.assign("/")}>
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }
}
