import React from "react";

import { Button } from "./ui/index.js";

/**
 * Catches render errors so one broken screen shows a recovery card instead of
 * blanking the whole app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("Render error:", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-ink-50 px-6">
        <div className="surface max-w-md px-6 py-10 text-center">
          <h1 className="text-xl font-semibold text-ink-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-500">
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 overflow-x-auto rounded-lg bg-ink-100 p-3 text-left text-xs text-red-700">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>Reload page</Button>
            <Button variant="outline" to="/" onClick={() => this.setState({ error: null })}>
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
