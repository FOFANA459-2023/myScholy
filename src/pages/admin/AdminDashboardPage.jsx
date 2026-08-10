import React from "react";
import { Link } from "react-router";

import { Page } from "../../components/layout/SiteLayout.jsx";
import { Badge, Stat } from "../../components/ui/index.js";
import cn from "../../lib/cn.js";
import { admin as adminApi } from "../../lib/api/endpoints.js";
import { useApi } from "../../lib/hooks.js";
import { displayName, useSession } from "../../lib/auth.js";
import { formatNumber } from "../../lib/format.js";

const CARD_TONES = {
  brand: "bg-brand-50 text-brand-700",
  gold: "bg-gold-50 text-gold-700",
  emerald: "bg-emerald-50 text-emerald-700",
  ink: "bg-ink-100 text-ink-600",
};

/** One dashboard section: a card that is entirely clickable. */
function SectionCard({ to, title, description, icon, badge, tone = "brand" }) {
  return (
    <Link
      to={to}
      className="surface group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          CARD_TONES[tone] ?? CARD_TONES.brand,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-ink-900 group-hover:text-brand-800">
            {title}
          </span>
          {badge}
        </span>
        <span className="mt-1 block text-sm text-ink-500">{description}</span>
      </span>
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="ml-auto h-5 w-5 shrink-0 self-center text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.17 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
}

const icon = (path) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

function SectionHeading({ children }) {
  return (
    <h2 className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
      {children}
      <span className="h-px flex-1 bg-ink-200/70" aria-hidden="true" />
    </h2>
  );
}

/**
 * The admin home: one place that fans out to every admin surface. Sections
 * appear according to role - the user directory is super-admin territory.
 */
export default function AdminDashboardPage() {
  const { user, isSuperAdmin } = useSession();
  const stats = useApi(({ signal }) => adminApi.statistics({ signal }), [], {
    keepPreviousData: true,
    refetchOnFocus: true,
  });

  return (
    <Page width="wide">
      {/* Branded hero header, in place of the plain PageHeader. */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-brand-diagonal p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="on-brand text-sm font-medium uppercase tracking-wider opacity-90">
            {isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"}
          </p>
          <Badge tone={isSuperAdmin ? "gold" : "brand"}>
            {isSuperAdmin ? "Super admin" : "Admin"}
          </Badge>
        </div>
        <h1 className="on-brand mt-2 text-2xl font-bold sm:text-3xl">
          Welcome back, {displayName(user)}
        </h1>
        <p className="on-brand mt-1.5 max-w-xl text-sm opacity-90">
          Everything you manage, in one place - scholarships, the archive and your team.
        </p>
      </div>

      {stats.data && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat
            label="Live scholarships"
            value={formatNumber(stats.data.open_scholarships)}
            tone="brand"
            icon={icon("m12 3 9 5-9 5-9-5 9-5Zm-5 8v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4")}
          />
          <Stat
            label="Total scholarships"
            value={formatNumber(stats.data.total_scholarships)}
            tone="ink"
            icon={icon("M4 6h16M4 10h16M4 14h10M4 18h7")}
          />
          <Stat
            label="Students"
            value={formatNumber(stats.data.total_students)}
            tone="emerald"
            icon={icon("M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1")}
          />
          <Stat
            label="New users this month"
            value={formatNumber(stats.data.monthly_signups)}
            hint={`${formatNumber(stats.data.total_countries)} countries represented`}
            tone="gold"
            icon={icon("M3 17 9 11l4 4 8-8m0 0h-5m5 0v5")}
          />
        </div>
      )}

      <SectionHeading>Scholarships</SectionHeading>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <SectionCard
          to="/admin/scholarships"
          title="Manage scholarships"
          description="The live board - edit, hide or delete what students currently see."
          tone="brand"
          icon={icon("M4 6h16M4 10h16M4 14h10M4 18h7")}
        />
        <SectionCard
          to="/admin/scholarships/new"
          title="Post a scholarship"
          description="Publish a new opportunity to the board."
          tone="emerald"
          icon={icon("M12 5v14m-7-7h14")}
        />
        <SectionCard
          to="/admin/scholarships/archive"
          title="Archive"
          description="Closed and hidden scholarships - repost or extend deadlines."
          tone="ink"
          icon={icon("M4 7h16M6 7v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2")}
        />
        <SectionCard
          to="/admin/scholarships"
          title="Export scholarships CSV"
          description="Download the live board as a spreadsheet from the manage page."
          tone="gold"
          icon={icon("M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2")}
        />
      </div>

      <SectionHeading>People</SectionHeading>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          to="/admin/users"
          title="User management"
          description={
            isSuperAdmin
              ? "Add or remove administrators and review who has access."
              : "Add another administrator to the team."
          }
          tone="brand"
          icon={icon("M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1")}
        />
        {isSuperAdmin && (
          <SectionCard
            to="/admin/directory"
            title="User directory"
            description="Every registered account with its profile details, searchable."
            tone="gold"
            icon={icon("M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01")}
            badge={<Badge tone="gold">Super admin</Badge>}
          />
        )}
        {isSuperAdmin && (
          <SectionCard
            to="/admin/messages"
            title="Messages"
            description="Read contact-form messages and reply or compose email from the myScholy address."
            tone="brand"
            icon={icon("M3 8l9 6 9-6M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z")}
            badge={<Badge tone="gold">Super admin</Badge>}
          />
        )}
      </div>
    </Page>
  );
}
