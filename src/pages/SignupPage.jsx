import React, { useState } from "react";
import { Link, useNavigate } from "react-router";

import Logo from "../assets/Logo.jpg";
import { Alert, Button, SelectField, TextField } from "../components/ui/index.js";
import { auth as authApi } from "../lib/api/endpoints.js";
import { setSession } from "../lib/auth.js";
import { useMutation } from "../lib/hooks.js";
import { EDUCATION_LEVELS, EDUCATION_LEVEL_VALUES } from "../lib/options.js";
import * as v from "../lib/validation.js";

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  country_of_citizenship: "",
  country_of_residence: "",
  education_level: "",
  password: "",
  confirmPassword: "",
};

/**
 * Registration goes through the Django API, the same store login reads from.
 *
 * Fields are validated on blur and again on submit, so a mistake is pointed
 * out as soon as the user leaves the field rather than only after they press
 * the button. Errors clear as soon as they start correcting one.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const { mutate, isPending, error } = useMutation(authApi.registerStudent);

  const validateField = (field, current = values) => {
    switch (field) {
      case "first_name":
        return v.name(current.first_name, "first name");
      case "last_name":
        return v.name(current.last_name, "last name");
      case "email":
        return v.email(current.email);
      case "phone":
        return v.phone(current.phone);
      case "country_of_citizenship":
        return v.required(current.country_of_citizenship, "country of citizenship");
      case "country_of_residence":
        return v.required(current.country_of_residence, "country of residence");
      case "education_level":
        return v.choice(
          current.education_level,
          EDUCATION_LEVEL_VALUES,
          "Select your current education level.",
        );
      case "password":
        return v.password(current.password);
      case "confirmPassword":
        return v.passwordConfirmation(current.confirmPassword, current.password);
      default:
        return undefined;
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    const message = validateField(name);
    if (message) setErrors((current) => ({ ...current, [name]: message }));
  };

  const validate = () => {
    const next = v.collect(
      Object.fromEntries(
        Object.keys(EMPTY).map((field) => [field, validateField(field)]),
      ),
    );
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      // Move focus to the first problem so keyboard and screen reader users
      // are not left guessing why nothing happened.
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const result = await mutate({
      user: {
        // The backend keys accounts on username; the email doubles as one so
        // students never have to invent a second identifier.
        username: values.email.trim().toLowerCase(),
        email: values.email.trim().toLowerCase(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        password: values.password,
      },
      phone: values.phone.trim(),
      country_of_citizenship: values.country_of_citizenship.trim(),
      country_of_residence: values.country_of_residence.trim(),
      education_level: values.education_level,
    });

    if (!result.ok) {
      // Registration posts a nested `user` object, so serializer errors arrive
      // as {"user": {"email": [...]}} and need lifting onto the flat form.
      const fieldErrors = v.flattenFieldErrors(result.error?.fieldErrors);
      setErrors((current) => ({ ...current, ...fieldErrors }));
      return;
    }

    if (result.data?.tokens) {
      setSession(result.data);
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  // A nested-field error is rendered on its own control, so the banner would
  // otherwise repeat it above the form.
  const bannerError = error && !error.fieldErrors ? error.message : null;

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col justify-center bg-ink-50 px-5 py-14">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 text-center">
          <img
            src={Logo}
            alt=""
            width={56}
            height={56}
            className="mx-auto h-14 w-14 rounded-2xl object-cover"
          />
          <h1 className="mt-5 text-2xl font-bold text-ink-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Free, and it takes less than a minute.
          </p>
        </div>

        <div className="surface p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {bannerError && <Alert tone="error">{bannerError}</Alert>}

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="First name"
                name="first_name"
                autoComplete="given-name"
                value={values.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.first_name}
                required
              />
              <TextField
                label="Last name"
                name="last_name"
                autoComplete="family-name"
                value={values.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.last_name}
                required
              />
            </div>

            <TextField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.email || errors.username}
              hint="You'll sign in with this address."
              required
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label="Country of citizenship"
                name="country_of_citizenship"
                autoComplete="country-name"
                value={values.country_of_citizenship}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.country_of_citizenship}
                placeholder="e.g. Liberia"
                hint="Many scholarships are limited by citizenship."
                required
              />
              <TextField
                label="Country of residence"
                name="country_of_residence"
                autoComplete="country-name"
                value={values.country_of_residence}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.country_of_residence}
                placeholder="e.g. Ghana"
                hint="Where you live now, if different."
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Education level"
                name="education_level"
                value={values.education_level}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.education_level}
                hint="What you're studying now, or just finished."
                required
              >
                <option value="">Select your level</option>
                {EDUCATION_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.phone}
                placeholder="+231 770 123 456"
                hint="Optional"
              />
            </div>

            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              hint="At least 8 characters, and not only numbers."
              required
            />

            <TextField
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
              required
            />

            <Button type="submit" fullWidth size="lg" loading={isPending}>
              {isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-6 border-t border-ink-200/70 pt-5 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="rounded font-medium text-brand-800 hover:text-brand-600"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
