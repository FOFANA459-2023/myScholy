import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import Logo from "../assets/Logo.jpg";
import { Alert, Button, TextField } from "../components/ui/index.js";
import { auth as authApi } from "../lib/api/endpoints.js";
import { homeRouteFor, setSession } from "../lib/auth.js";
import { useMutation } from "../lib/hooks.js";
import * as v from "../lib/validation.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const { mutate, isPending, error } = useMutation(({ identifier, password }) =>
    authApi.login(identifier, password),
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  // Sign-in deliberately checks only for presence: the credentials either work
  // or they don't, and telling someone their existing password is "too short"
  // at the login screen is noise.
  const validate = () => {
    const next = v.collect({
      identifier: values.identifier.trim()
        ? undefined
        : "Enter the email or username you signed up with.",
      password: values.password ? undefined : "Enter your password to sign in.",
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    if (!String(value).trim()) {
      setErrors((current) => ({
        ...current,
        [name]:
          name === "identifier"
            ? "Enter the email or username you signed up with."
            : "Enter your password to sign in.",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const result = await mutate(values);
    if (!result.ok) return;

    const session = setSession(result.data);
    // Send the user back where they were headed, otherwise to their home screen.
    const target = location.state?.from?.pathname || homeRouteFor(session.role);
    navigate(target, { replace: true });
  };

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
          <h1 className="mt-5 text-2xl font-bold text-ink-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Sign in to track scholarships and manage your applications.
          </p>
        </div>

        <div className="surface p-6 sm:p-8">
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
                {error.status === 401 && (
                  <>
                    {" "}
                    <Link
                      to="/forgot-password"
                      className="rounded font-medium underline hover:text-red-600"
                    >
                      Reset password
                    </Link>
                  </>
                )}
              </Alert>
            )}

            <TextField
              label="Email or username"
              name="identifier"
              type="text"
              autoComplete="username"
              value={values.identifier}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.identifier}
              required
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              required
            />

            <p className="-mt-2 text-right text-sm">
              <Link
                to="/forgot-password"
                className="rounded font-medium text-brand-800 hover:text-brand-600"
              >
                Forgot password?
              </Link>
            </p>

            <Button type="submit" fullWidth size="lg" loading={isPending}>
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 border-t border-ink-200/70 pt-5 text-center text-sm text-ink-500">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="rounded font-medium text-brand-800 hover:text-brand-600"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
