import React, { useState } from "react";

import { Page, PageHeader } from "../../components/layout/SiteLayout.jsx";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ErrorState,
  Skeleton,
  Stat,
  TextField,
} from "../../components/ui/index.js";
import { admin as adminApi } from "../../lib/api/endpoints.js";
import { useApi, useMutation } from "../../lib/hooks.js";
import { useSession } from "../../lib/auth.js";
import { formatNumber } from "../../lib/format.js";
import * as v from "../../lib/validation.js";

const statIcon = (path) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const EMPTY_USER = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
};

/**
 * User management, open to every admin - with role-aware controls.
 *
 * Any admin can add another (regular) administrator. Everything about the
 * existing team is super-admin territory: the roster of administrators, the
 * remove action, the super-admin promotion and the users CSV export. The API
 * enforces all of it, so for a regular admin those pieces are simply never
 * fetched or rendered.
 */
export default function AdminUsersPage() {
  const { user: currentUser, isSuperAdmin } = useSession();
  // Keep the roster mirroring the database: poll while the page is open and
  // refresh on return to the tab. keepPreviousData holds the rendered list
  // steady during each refresh instead of flashing skeletons.
  const LIVE = { keepPreviousData: true, refetchInterval: 30_000, refetchOnFocus: true };
  // The roster endpoint is super-admin-only; a regular admin never calls it.
  const users = useApi(({ signal }) => adminApi.users({ signal }), [], {
    ...LIVE,
    enabled: isSuperAdmin,
  });
  const stats = useApi(({ signal }) => adminApi.statistics({ signal }), [], LIVE);

  const [form, setForm] = useState(EMPTY_USER);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);

  const create = useMutation(adminApi.createUser);
  const remove = useMutation(adminApi.deleteUser);
  const exportUsers = useMutation(adminApi.exportUsersCsv);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validateField = (field) => {
    switch (field) {
      case "first_name":
        return v.name(form.first_name, "first name");
      case "last_name":
        // Optional on this form, so only checked once something is typed.
        return form.last_name.trim() ? v.name(form.last_name, "last name") : undefined;
      case "email":
        return v.email(form.email);
      case "password":
        return v.password(form.password);
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
      first_name: validateField("first_name"),
      last_name: validateField("last_name"),
      email: validateField("email"),
      password: validateField("password"),
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!validate()) {
      document.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const result = await create.mutate({
      user: {
        username: form.email.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        password: form.password,
      },
    });

    if (result.ok) {
      setForm(EMPTY_USER);
      setNotice({ tone: "success", text: `${result.data.email} can now sign in as an admin.` });
      users.refetch();
      stats.refetch();
    } else if (result.error.fieldErrors) {
      // Admin creation posts a nested `user` object, same as registration.
      setErrors(v.flattenFieldErrors(result.error.fieldErrors));
    } else {
      setNotice({ tone: "error", text: result.error.message });
    }
  };

  const handleRemove = async (row) => {
    const result = await remove.mutate(row.user_id);
    if (result.ok) {
      setNotice({ tone: "success", text: `${row.username} was removed.` });
      users.refetch();
      stats.refetch();
    } else {
      setNotice({ tone: "error", text: result.error.message });
    }
  };

  return (
    <Page width="wide">
      <PageHeader
        back={{ to: "/admin", label: "Dashboard" }}
        title="User management"
        description={
          isSuperAdmin
            ? "Add or remove administrators and review who has access."
            : "Add another administrator to the team. Viewing or removing the admin roster takes a super admin."
        }
        actions={
          isSuperAdmin ? (
            <Button
              variant="outline"
              onClick={exportUsers.mutate}
              loading={exportUsers.isPending}
            >
              Export users CSV
            </Button>
          ) : undefined
        }
      />

      {notice && (
        <Alert tone={notice.tone} className="mb-6" onDismiss={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {stats.data && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat
            label="Total users"
            value={formatNumber(stats.data.total_users)}
            tone="brand"
            icon={statIcon("M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1")}
          />
          <Stat
            label="Students"
            value={formatNumber(stats.data.total_students)}
            tone="emerald"
            icon={statIcon("m12 3 9 5-9 5-9-5 9-5Zm-5 8v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4")}
          />
          <Stat
            label="Administrators"
            value={formatNumber(stats.data.total_admins)}
            tone="gold"
            icon={statIcon("M12 3 4 6v5c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-3Z")}
          />
          <Stat
            label="New this month"
            value={formatNumber(stats.data.monthly_signups)}
            hint={`${formatNumber(stats.data.total_countries)} countries represented`}
            tone="ink"
            icon={statIcon("M3 17 9 11l4 4 8-8m0 0h-5m5 0v5")}
          />
        </div>
      )}

      <div className={isSuperAdmin ? "grid gap-6 lg:grid-cols-5" : "mx-auto max-w-xl"}>
        <Card className={isSuperAdmin ? "lg:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle>Add an administrator</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreate} noValidate className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="First name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.first_name}
                  required
                />
                <TextField
                  label="Last name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.last_name}
                />
              </div>

              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email || errors.username}
                hint="Doubles as their sign-in username"
                required
              />

              <TextField
                label="Temporary password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                hint="At least 8 characters. Ask them to change it after signing in."
                required
              />

              {/* Super-admin status is never granted from the app; it is only
                  enabled manually in the database. */}
              <Button type="submit" fullWidth loading={create.isPending}>
                {create.isPending ? "Adding..." : "Add administrator"}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Who currently has access - super admins only. A regular admin can
            grow the team but must not be able to enumerate it. */}
        {isSuperAdmin && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Administrators</CardTitle>
          </CardHeader>

          {users.isLoading ? (
            <CardBody className="space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-12"
                  style={{ "--skeleton-delay": `${index * 140}ms` }}
                />
              ))}
            </CardBody>
          ) : users.error ? (
            <CardBody>
              <ErrorState error={users.error} onRetry={users.refetch} />
            </CardBody>
          ) : (
            <ul className="divide-y divide-ink-200/70">
              {users.data.map((row) => {
                const isSelf = row.user_id === currentUser?.id;
                return (
                  <li
                    key={row.user_id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {`${row.first_name} ${row.last_name}`.trim() || row.username}
                        {isSelf && <span className="ml-1.5 text-xs text-ink-400">(you)</span>}
                      </p>
                      <p className="truncate text-sm text-ink-500">{row.email || row.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={row.is_super_admin ? "gold" : "brand"}>
                        {row.is_super_admin ? "Super admin" : "Admin"}
                      </Badge>
                      {isSuperAdmin && !row.is_super_admin && !isSelf && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemove(row)}
                          disabled={remove.isPending}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        )}
      </div>
    </Page>
  );
}
