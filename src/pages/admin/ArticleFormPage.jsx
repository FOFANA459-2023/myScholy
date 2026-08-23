import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Page, PageHeader } from "../../components/layout/SiteLayout.jsx";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  PageLoader,
  SelectField,
  TextAreaField,
  TextField,
} from "../../components/ui/index.js";
import ArticleBody from "../../features/insights/ArticleBody.jsx";
import AuthorAvatar from "../../features/insights/AuthorAvatar.jsx";
import ImageUploadField from "../../features/insights/ImageUploadField.jsx";
import { TOPICS, topicOf } from "../../features/insights/topics.js";
import cn from "../../lib/cn.js";
import { articles as articlesApi } from "../../lib/api/endpoints.js";
import { useApi, useMutation } from "../../lib/hooks.js";
import * as v from "../../lib/validation.js";

const EMPTY = {
  title: "",
  topic: "applications",
  excerpt: "",
  body: "",
  cover_image: "",
  cover: null,
  author_name: "",
  author_role: "",
  author_bio: "",
  author_photo: null,
  is_published: false,
  is_featured: false,
};

const LABELS = {
  title: "Title",
  topic: "Topic",
  excerpt: "Summary",
  body: "The article",
  cover_image: "Cover image URL",
  author_name: "Writer's name",
  author_role: "Writer's role",
  author_bio: "About the writer",
};

const REQUIRED = ["title", "excerpt", "body", "author_name"];

/** The formatting cheatsheet shown beside the body field. */
const SYNTAX = [
  ["## Heading", "A section heading"],
  ["> A line worth pulling out", "Pull quote"],
  ["- point", "Bulleted list"],
  ["1. step", "Numbered list"],
  ["**bold**  *italic*", "Emphasis"],
  ["[myScholy](/scholarships)", "A link"],
  ["---", "Divider"],
];

/**
 * Write or edit one Insights piece.
 *
 * The body accepts a small markdown subset, so the form carries a live preview
 * rendered by the very same component the public page uses - an admin should
 * never have to publish something to find out what it looks like.
 */
export default function ArticleFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const existing = useApi(
    ({ signal }) => articlesApi.adminDetail(id, { signal }),
    [id],
    { enabled: isEdit },
  );

  const save = useMutation((payload) =>
    isEdit ? articlesApi.update(id, payload) : articlesApi.create(payload),
  );

  useEffect(() => {
    if (isEdit && existing.data) setValues({ ...EMPTY, ...existing.data });
  }, [isEdit, existing.data]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  // Mirrors the DRF serializer so the writer gets the same answer instantly.
  const validateField = (field) => {
    const value = String(values[field] ?? "").trim();
    if (REQUIRED.includes(field) && !value) return `${LABELS[field]} is required.`;

    switch (field) {
      case "title":
        return v.minLength(
          value,
          6,
          "Give the piece a fuller title (at least 6 characters).",
        );
      case "excerpt":
        return (
          v.minLength(
            value,
            20,
            "Write a one- or two-sentence summary (at least 20 characters).",
          ) ||
          v.maxLength(value, 300, "Keep the summary under 300 characters.")
        );
      case "body":
        return v.minLength(
          value,
          200,
          "This piece is very short (at least 200 characters). Add a little more so it is genuinely useful to a student.",
        );
      case "author_name":
        return v.minLength(
          value,
          2,
          "Enter the name of the mentor or writer this advice comes from.",
        );
      case "cover_image":
        return value ? v.url(value, { label: LABELS.cover_image }) : undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (event) => {
    const message = validateField(event.target.name);
    if (message) {
      setErrors((current) => ({ ...current, [event.target.name]: message }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const next = v.collect(
      Object.fromEntries(
        Object.keys(LABELS).map((field) => [field, validateField(field)]),
      ),
    );
    setErrors(next);
    if (Object.keys(next).length > 0) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const result = await save.mutate({
      ...values,
      title: values.title.trim(),
      excerpt: values.excerpt.trim(),
      author_name: values.author_name.trim(),
      author_role: values.author_role.trim(),
      cover_image: values.cover_image.trim(),
    });

    if (result.ok) {
      navigate("/admin/articles", {
        replace: true,
        state: {
          flash: isEdit
            ? "Article updated."
            : values.is_published
              ? "Article published."
              : "Draft saved.",
        },
      });
    } else if (result.error?.fieldErrors) {
      setErrors(result.error.fieldErrors);
    }
  };

  if (isEdit && existing.isLoading) return <PageLoader label="Loading article" />;

  if (isEdit && existing.error) {
    return (
      <Page width="narrow">
        <Alert tone="error" title="Couldn't load that article">
          {existing.error.message}
        </Alert>
        <Button className="mt-5" variant="outline" to="/admin/articles">
          Back to the list
        </Button>
      </Page>
    );
  }

  const topic = topicOf(values.topic);
  const wordCount = values.body.trim() ? values.body.trim().split(/\s+/).length : 0;

  return (
    <Page width="wide">
      <PageHeader
        back={{ to: "/admin/articles", label: "Insights articles" }}
        title={isEdit ? "Edit article" : "Write an article"}
        description="Advice, tips or experience from a mentor or contributing writer. Save it as a draft while you work, then publish when it is ready."
      />

      <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {save.error && !save.error.fieldErrors && (
            <Alert tone="error">{save.error.message}</Alert>
          )}

          <Card>
            <CardBody className="space-y-5">
              <TextField
                label={LABELS.title}
                name="title"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.title}
                placeholder="e.g. How to open a personal statement"
                required
              />

              <SelectField
                label={LABELS.topic}
                name="topic"
                value={values.topic}
                onChange={handleChange}
                error={errors.topic}
                hint="Sets the colour, icon and filter chip the piece appears under."
                required
              >
                {TOPICS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>

              <TextAreaField
                label={LABELS.excerpt}
                name="excerpt"
                rows={3}
                value={values.excerpt}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.excerpt}
                hint={`Shown on the card and under the title. ${values.excerpt.length}/300 characters.`}
                placeholder="One or two sentences that make a student want to read on."
                required
              />

              <ImageUploadField
                label="Cover image"
                variant="cover"
                shape="wide"
                value={values.cover}
                onChange={(id) => setValues((c) => ({ ...c, cover: id }))}
                hint="Optional. Sits behind the card and at the top of the piece. JPEG, PNG or WebP, up to 6MB - we resize it and strip its metadata."
              />

              <TextField
                label="Cover image URL"
                name="cover_image"
                type="url"
                inputMode="url"
                value={values.cover_image}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.cover_image}
                placeholder="https://... (optional)"
                hint="Only if the image is hosted elsewhere. An upload above takes precedence."
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink-900">
                    {LABELS.body}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {wordCount} words &middot; about{" "}
                    {Math.max(1, Math.round(wordCount / 200))} min read
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-ink-300 p-0.5">
                  {[
                    { label: "Write", value: false },
                    { label: "Preview", value: true },
                  ].map((tab) => (
                    <button
                      key={tab.label}
                      type="button"
                      onClick={() => setShowPreview(tab.value)}
                      className={cn(
                        "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                        showPreview === tab.value
                          ? "bg-brand-900 text-white"
                          : "text-ink-600 hover:bg-ink-100",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {showPreview ? (
                <div className="min-h-[24rem] rounded-lg border border-ink-200 bg-white p-5 sm:p-6">
                  {values.body.trim() ? (
                    <ArticleBody text={values.body} />
                  ) : (
                    <p className="text-sm text-ink-400">
                      Nothing to preview yet - switch to Write and start the piece.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <TextAreaField
                    label="Article body"
                    name="body"
                    rows={20}
                    value={values.body}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={errors.body}
                    className="font-mono text-[0.9rem] leading-relaxed"
                    placeholder={
                      "Start with the story only you can tell.\n\n## What the panel is really asking\n\n- One point per line\n\n> A line worth pulling out."
                    }
                    required
                  />
                  <div className="rounded-lg bg-ink-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      Formatting
                    </p>
                    <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      {SYNTAX.map(([syntax, meaning]) => (
                        <div key={syntax} className="flex items-baseline gap-2 text-xs">
                          <dt className="rounded bg-white px-1.5 py-0.5 font-mono text-ink-700 ring-1 ring-inset ring-ink-200">
                            {syntax}
                          </dt>
                          <dd className="text-ink-500">{meaning}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar: who wrote it, and whether students can see it. */}
        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-5">
              <div className="flex items-center gap-3">
                <AuthorAvatar
                  name={values.author_name}
                  topic={values.topic}
                  photo={values.author_photo}
                />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-ink-900">
                    The writer
                  </h2>
                  <p className="truncate text-xs text-ink-500">
                    Appears on the byline, not the admin account
                  </p>
                </div>
              </div>

              <ImageUploadField
                label="Writer's photo"
                variant="avatar"
                shape="circle"
                value={values.author_photo}
                onChange={(id) => setValues((c) => ({ ...c, author_photo: id }))}
                hint="Optional - without one, their initials are shown on the topic colour. Any location data in the photo is removed before it is stored."
              />

              <TextField
                label={LABELS.author_name}
                name="author_name"
                value={values.author_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.author_name}
                placeholder="e.g. Amina Kollie"
                required
              />

              <TextField
                label={LABELS.author_role}
                name="author_role"
                value={values.author_role}
                onChange={handleChange}
                error={errors.author_role}
                placeholder="e.g. Chevening Scholar, LSE"
                hint="Their credential - this is what makes the advice land."
              />

              <TextAreaField
                label={LABELS.author_bio}
                name="author_bio"
                rows={4}
                value={values.author_bio}
                onChange={handleChange}
                error={errors.author_bio}
                hint="Optional. Shown in a card at the end of the piece."
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-base font-semibold text-ink-900">Visibility</h2>

              <label className="flex items-start gap-2.5 rounded-lg border border-ink-300 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={values.is_published}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
                />
                <span className="text-ink-700">
                  Publish to Insights
                  <span className="mt-0.5 block text-xs text-ink-400">
                    Unchecked, it stays a draft only admins can open.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 rounded-lg border border-ink-300 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={values.is_featured}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500"
                />
                <span className="text-ink-700">
                  Feature at the top of the feed
                  <span className="mt-0.5 block text-xs text-ink-400">
                    Only one piece can be featured - this replaces the current one.
                  </span>
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2 border-t border-ink-200/70 pt-4">
                <Badge tone={topic.chip}>{topic.label}</Badge>
                {values.is_published ? (
                  <Badge tone="success">Published</Badge>
                ) : (
                  <Badge tone="neutral">Draft</Badge>
                )}
                {values.is_featured && <Badge tone="gold">Featured</Badge>}
              </div>
            </CardBody>
          </Card>

          <div className="flex flex-col gap-3">
            <Button type="submit" size="lg" fullWidth loading={save.isPending}>
              {save.isPending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : values.is_published
                    ? "Publish article"
                    : "Save draft"}
            </Button>
            <Button type="button" size="lg" variant="subtle" to="/admin/articles">
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </Page>
  );
}
