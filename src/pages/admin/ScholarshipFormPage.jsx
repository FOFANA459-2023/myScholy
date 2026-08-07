import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import ScholarshipExtract from "../../components/assistant/ScholarshipExtract.jsx";
import { Page, PageHeader } from "../../components/layout/SiteLayout.jsx";
import {
  Alert,
  Button,
  Card,
  CardBody,
  PageLoader,
  TextAreaField,
  TextField,
} from "../../components/ui/index.js";
import {
  assistant as assistantApi,
  scholarships as scholarshipsApi,
} from "../../lib/api/endpoints.js";
import { useApi, useMutation } from "../../lib/hooks.js";
import { toDateInputValue, todayInputValue } from "../../lib/format.js";
import * as v from "../../lib/validation.js";

const EMPTY = {
  name: "",
  description: "",
  deadline: "",
  host_country: "",
  benefits: "",
  eligibility: "",
  degree_level: "",
  link: "",
  author: "",
  is_active: true,
};

const REQUIRED = [
  "name",
  "description",
  "deadline",
  "host_country",
  "benefits",
  "eligibility",
  "degree_level",
  "link",
  "author",
];

const LABELS = {
  name: "Scholarship name",
  description: "Description",
  deadline: "Deadline",
  host_country: "Host country",
  benefits: "Benefits",
  eligibility: "Eligibility",
  degree_level: "Degree level",
  link: "Application link",
  author: "Posted by",
};

/**
 * One form for both create and edit.
 *
 * The old create page wrote to a `scholarships` table that does not exist (the
 * real one is `scholarships_scholarship`), wrapped its submit button inside a
 * <Link> so the form never submitted, and redirected to a route that was never
 * registered. All three are fixed by going through the API.
 */
export default function ScholarshipFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [aiEnabled, setAiEnabled] = useState(false);

  // The paste-and-auto-fill panel appears only on create, and only when the
  // backend has an AI key configured (same gate as the public widget).
  useEffect(() => {
    if (isEdit) return undefined;
    let cancelled = false;
    assistantApi
      .status()
      .then((data) => {
        if (!cancelled && data?.enabled) setAiEnabled(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isEdit]);

  const applyExtracted = (fields) => {
    setValues((current) => ({ ...current, ...fields }));
    setErrors((current) => {
      const next = { ...current };
      Object.keys(fields).forEach((field) => delete next[field]);
      return next;
    });
  };

  const existing = useApi(
    ({ signal }) => scholarshipsApi.adminDetail(id, { signal }),
    [id],
    { enabled: isEdit },
  );

  const save = useMutation((payload) =>
    isEdit ? scholarshipsApi.update(id, payload) : scholarshipsApi.create(payload),
  );

  // Seed the form once the record arrives, or prefill the author on create.
  useEffect(() => {
    if (isEdit && existing.data) {
      setValues({
        ...EMPTY,
        ...existing.data,
        deadline: toDateInputValue(existing.data.deadline),
      });
    } else if (!isEdit) {
      // Listings are published under the site's name, not the admin's.
      setValues((current) => ({ ...current, author: current.author || "myScholy" }));
    }
  }, [isEdit, existing.data]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validateField = (field) => {
    const value = String(values[field] ?? "").trim();
    if (REQUIRED.includes(field) && !value) return `${LABELS[field]} is required.`;

    switch (field) {
      case "name":
        return v.minLength(
          value,
          3,
          "Enter the full scholarship name (at least 3 characters).",
        );
      case "description":
        return v.minLength(
          value,
          20,
          "Describe the scholarship in a little more detail (at least 20 characters).",
        );
      case "link":
        return v.url(value, { label: LABELS.link });
      case "deadline":
        // Only new listings must be in the future; an edit may legitimately
        // keep a past deadline while the record is being tidied up.
        return !isEdit && value && value < todayInputValue()
          ? "That date has already passed. Choose a future deadline."
          : undefined;
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
    const next = v.collect(
      Object.fromEntries(
        Object.keys(LABELS).map((field) => [field, validateField(field)]),
      ),
    );
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const result = await save.mutate({
      ...values,
      name: values.name.trim(),
      host_country: values.host_country.trim(),
      degree_level: values.degree_level.trim(),
      link: values.link.trim(),
      author: values.author.trim(),
    });

    if (result.ok) {
      navigate("/admin/scholarships", {
        replace: true,
        state: { flash: isEdit ? "Scholarship updated." : "Scholarship posted." },
      });
    } else if (result.error?.fieldErrors) {
      setErrors(result.error.fieldErrors);
    }
  };

  if (isEdit && existing.isLoading) return <PageLoader label="Loading scholarship" />;

  if (isEdit && existing.error) {
    return (
      <Page width="narrow">
        <Alert tone="error" title="Couldn't load that scholarship">
          {existing.error.message}
        </Alert>
        <Button className="mt-5" variant="outline" to="/admin/scholarships">
          Back to the list
        </Button>
      </Page>
    );
  }

  return (
    <Page width="narrow">
      <PageHeader
        title={isEdit ? "Edit scholarship" : "Post a scholarship"}
        description={
          isEdit
            ? "Update the details students see on the board."
            : "Add a new opportunity to the board. Put each benefit or requirement on its own line."
        }
      />

      {!isEdit && aiEnabled && (
        <div className="mb-6">
          <ScholarshipExtract onExtract={applyExtracted} />
        </div>
      )}

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {save.error && !save.error.fieldErrors && (
              <Alert tone="error">{save.error.message}</Alert>
            )}

            <TextField
              label={LABELS.name}
              name="name"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.name}
              placeholder="e.g. Chevening Scholarship 2026"
              required
            />

            <TextAreaField
              label={LABELS.description}
              name="description"
              rows={5}
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.description}
              placeholder="What the scholarship is and who it's for."
              required
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                label={LABELS.deadline}
                name="deadline"
                type="date"
                min={isEdit ? undefined : todayInputValue()}
                value={values.deadline}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.deadline}
                required
              />
              <TextField
                label={LABELS.host_country}
                name="host_country"
                value={values.host_country}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.host_country}
                placeholder="e.g. United Kingdom"
                required
              />
            </div>

            <TextField
              label={LABELS.degree_level}
              name="degree_level"
              value={values.degree_level}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.degree_level}
              placeholder="e.g. Masters"
              hint="Keep wording consistent - this powers the degree level filter."
              required
            />

            <TextAreaField
              label={LABELS.eligibility}
              name="eligibility"
              rows={5}
              value={values.eligibility}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.eligibility}
              hint="One requirement per line - each becomes a bullet point."
              required
            />

            <TextAreaField
              label={LABELS.benefits}
              name="benefits"
              rows={5}
              value={values.benefits}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.benefits}
              hint="One benefit per line."
              required
            />

            <TextField
              label={LABELS.link}
              name="link"
              type="url"
              inputMode="url"
              value={values.link}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.link}
              placeholder="https://..."
              required
            />

            <TextField
              label={LABELS.author}
              name="author"
              value={values.author}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.author}
              required
            />

            <label className="flex items-center gap-2.5 rounded-lg border border-ink-300 px-4 py-3 text-sm">
              <input
                type="checkbox"
                name="is_active"
                checked={values.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
              />
              <span className="text-ink-700">
                Visible on the public board
                <span className="ml-1 text-ink-400">
                  (uncheck to save it as a draft)
                </span>
              </span>
            </label>

            <div className="flex gap-3 border-t border-ink-200/70 pt-5">
              <Button type="submit" size="lg" loading={save.isPending}>
                {save.isPending
                  ? "Saving..."
                  : isEdit
                    ? "Save changes"
                    : "Post scholarship"}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="subtle"
                to="/admin/scholarships"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </Page>
  );
}
