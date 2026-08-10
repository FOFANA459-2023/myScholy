import React, { useState } from "react";
import { FaEnvelope, FaWhatsapp } from "react-icons/fa";

import { Page, PageHeader } from "../components/layout/SiteLayout.jsx";
import {
  Alert,
  Button,
  Card,
  CardBody,
  TextAreaField,
  TextField,
} from "../components/ui/index.js";
import { contact as contactApi } from "../lib/api/endpoints.js";
import { useMutation } from "../lib/hooks.js";
import * as v from "../lib/validation.js";

const EMPTY = { name: "", email: "", subject: "", message: "" };
const MESSAGE_MAX = 5000;

const CHANNELS = [
  {
    Icon: FaEnvelope,
    label: "Email",
    value: "myscholy@gmail.com",
    href: "mailto:myscholy@gmail.com",
  },
  { Icon: FaWhatsapp, label: "WhatsApp", value: "Join the community", href: "/whatsapp" },
];

export default function ContactPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const { mutate, isPending, error } = useMutation(contactApi.send);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validateField = (field, current = values) => {
    switch (field) {
      case "name":
        return v.name(current.name, "name");
      case "email":
        return v.email(current.email);
      case "subject":
        return v.minLength(
          current.subject,
          3,
          "Give your message a short subject (at least 3 characters).",
        );
      case "message":
        return (
          v.minLength(
            current.message,
            10,
            "Give us a little more detail so we can help (at least 10 characters).",
          ) ||
          v.maxLength(
            current.message,
            MESSAGE_MAX,
            `That message is too long (${MESSAGE_MAX} characters maximum).`,
          )
        );
      default:
        return undefined;
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    const message = validateField(name);
    if (message) setErrors((current) => ({ ...current, [name]: message }));
  };

  const validate = () => {
    const next = v.collect({
      name: validateField("name"),
      email: validateField("email"),
      subject: validateField("subject"),
      message: validateField("message"),
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }
    const result = await mutate(values);
    if (result.ok) {
      setSent(true);
      setValues(EMPTY);
    } else if (result.error?.fieldErrors) {
      setErrors(v.flattenFieldErrors(result.error.fieldErrors));
    }
  };

  const remaining = MESSAGE_MAX - values.message.length;

  return (
    <Page width="narrow">
      <PageHeader
        title="Contact us"
        description="Questions about an application, a scholarship, or our programs? We read every message."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-3 md:col-span-1">
          {CHANNELS.map(({ Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              className="surface flex items-center gap-3 px-4 py-3.5 transition-shadow hover:shadow-card-hover"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs uppercase tracking-wide text-ink-400">
                  {label}
                </span>
                <span className="block truncate text-sm font-medium text-ink-800">
                  {value}
                </span>
              </span>
            </a>
          ))}
        </div>

        <Card className="md:col-span-2">
          <CardBody>
            {sent ? (
              <div className="py-6 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m5 13 4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-ink-900">Message sent</h2>
                <p className="mt-1.5 text-sm text-ink-500">
                  Thanks for reaching out. Someone from the team will get back to you shortly.
                </p>
                <Button className="mt-6" variant="outline" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {error && !error.fieldErrors && <Alert tone="error">{error.message}</Alert>}

                <TextField
                  label="Name"
                  name="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.name}
                  placeholder="Your name"
                  required
                />

                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.email}
                  placeholder="you@example.com"
                  hint="We'll reply to this address."
                  required
                />

                <TextField
                  label="Subject"
                  name="subject"
                  maxLength={200}
                  value={values.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.subject}
                  placeholder="What is your message about?"
                  hint="Our reply will use this subject, so you can find it easily."
                  required
                />

                <TextAreaField
                  label="Message"
                  name="message"
                  rows={6}
                  maxLength={MESSAGE_MAX}
                  value={values.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.message}
                  placeholder="How can we help?"
                  hint={
                    remaining < 500
                      ? `${remaining} characters left`
                      : "The more detail you give, the better we can help."
                  }
                  required
                />

                <Button type="submit" size="lg" loading={isPending}>
                  {isPending ? "Sending..." : "Send message"}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </Page>
  );
}
