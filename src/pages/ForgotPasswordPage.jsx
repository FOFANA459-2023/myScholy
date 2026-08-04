import React, { useState } from "react";
import { Link } from "react-router-dom";

import Logo from "../assets/Logo.jpg";
import { Alert, Button, TextField } from "../components/ui/index.js";
import { auth as authApi } from "../lib/api/endpoints.js";
import { useMutation } from "../lib/hooks.js";
import * as v from "../lib/validation.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState(undefined);
  const [successMessage, setSuccessMessage] = useState(null);
  const { mutate, isPending, error } = useMutation(authApi.requestPasswordReset);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = email.trim();
    // A typo here means the link silently goes nowhere, so the address is
    // checked for shape before we ask the server to look it up.
    const message = v.email(value, { label: "email address" });
    if (message) {
      setFieldError(message);
      return;
    }

    const result = await mutate(value);
    if (result.ok) {
      setSuccessMessage(
        result.data?.message ||
          `We've emailed a reset link to ${value}. Check your inbox - and your spam folder, just in case. The link expires in 1 hour.`,
      );
    }
  };

  const submitted = Boolean(successMessage);

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col justify-center bg-ink-50 px-5 py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src={Logo}
            alt=""
            width={56}
            height={56}
            className="mx-auto h-14 w-14 rounded-2xl object-cover"
          />
          <h1 className="mt-5 text-2xl font-bold text-ink-900">Reset your password</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Enter your email and we&apos;ll send you a link to choose a new password.
          </p>
        </div>

        <div className="surface p-6 sm:p-8">
          {submitted ? (
            <div className="space-y-5">
              <Alert tone="success">{successMessage}</Alert>
              <p className="text-center text-sm text-ink-500">
                <Link
                  to="/login"
                  className="rounded font-medium text-brand-800 hover:text-brand-600"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <Alert tone="error">
                  {error.message}
                  {error.status === 404 && (
                    <>
                      {" "}
                      <Link
                        to="/signup"
                        className="rounded font-medium underline hover:text-red-600"
                      >
                        Create an account
                      </Link>
                    </>
                  )}
                </Alert>
              )}

              <TextField
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldError(undefined);
                }}
                onBlur={(event) =>
                  setFieldError(v.email(event.target.value, { label: "email address" }))
                }
                error={fieldError}
                required
              />

              <Button type="submit" fullWidth size="lg" loading={isPending}>
                {isPending ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}

          {!submitted && (
            <p className="mt-6 border-t border-ink-200/70 pt-5 text-center text-sm text-ink-500">
              Remembered it?{" "}
              <Link
                to="/login"
                className="rounded font-medium text-brand-800 hover:text-brand-600"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
