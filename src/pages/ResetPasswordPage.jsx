import React, { useState } from "react";
import { Link, useSearchParams } from "react-router";

import Logo from "../assets/Logo.jpg";
import { Alert, Button, TextField } from "../components/ui/index.js";
import { auth as authApi } from "../lib/api/endpoints.js";
import { useMutation } from "../lib/hooks.js";
import * as v from "../lib/validation.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const { mutate, isPending, error } = useMutation(authApi.confirmPasswordReset);

  const linkIsValid = Boolean(uid && token);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = () => {
    const next = v.collect({
      password: v.password(values.password),
      confirm: v.passwordConfirmation(values.confirm, values.password),
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    const message =
      name === "password"
        ? v.password(values.password)
        : v.passwordConfirmation(values.confirm, values.password);
    if (message) setErrors((current) => ({ ...current, [name]: message }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const result = await mutate({ uid, token, newPassword: values.password });
    if (result.ok) setDone(true);
  };

  // The backend reports password-policy failures under new_password.
  const serverPasswordError = error?.fieldErrors?.new_password;

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
          <h1 className="mt-5 text-2xl font-bold text-ink-900">Choose a new password</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Pick something strong that you haven&apos;t used elsewhere.
          </p>
        </div>

        <div className="surface p-6 sm:p-8">
          {!linkIsValid ? (
            <div className="space-y-5">
              <Alert tone="error">
                This reset link is incomplete. Please use the link from your email, or
                request a new one.
              </Alert>
              <p className="text-center text-sm text-ink-500">
                <Link
                  to="/forgot-password"
                  className="rounded font-medium text-brand-800 hover:text-brand-600"
                >
                  Request a new link
                </Link>
              </p>
            </div>
          ) : done ? (
            <div className="space-y-5">
              <Alert tone="success">
                Your password has been reset. You can now sign in with the new one.
              </Alert>
              <p className="text-center text-sm text-ink-500">
                <Link
                  to="/login"
                  className="rounded font-medium text-brand-800 hover:text-brand-600"
                >
                  Go to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && !serverPasswordError && (
                <Alert tone="error">{error.message}</Alert>
              )}

              <TextField
                label="New password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password || serverPasswordError}
                hint="At least 8 characters, and not only numbers."
                required
              />

              <TextField
                label="Confirm new password"
                name="confirm"
                type="password"
                autoComplete="new-password"
                value={values.confirm}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.confirm}
                required
              />

              <Button type="submit" fullWidth size="lg" loading={isPending}>
                {isPending ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
