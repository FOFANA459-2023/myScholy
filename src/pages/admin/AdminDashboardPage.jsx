import React from "react";
import { Link } from "react-router";

import { Page, PageHeader } from "../../components/layout/SiteLayout.jsx";
import { Badge, Stat } from "../../components/ui/index.js";
import { admin as adminApi } from "../../lib/api/endpoints.js";
import { useApi } from "../../lib/hooks.js";
import { useSession } from "../../lib/auth.js";
import { formatNumber } from "../../lib/format.js";

/** One dashboard section: a card that is entirely clickable. */
function SectionCard({ to, title, description, icon, badge }) {
  return (
    <Link
      to={to}
      className="surface group flex items-start gap-4 p-5 transition-shadow hover:shadow-card-hover"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
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

/**
 * The admin home: one place that fans out to every admin surface. Sections
 * appear according to role - the user directory is super-admin territory.
 */
export default function AdminDashboardPage() {
  const { isSuperAdmin } = useSession();
  const stats = useApi(({ signal }) => adminApi.statistics({ signal }), [], {
    keepPreviousData: true,
    refetchOnFocus: true,
  });

  return (
    <Page width="wide">
      <PageHeader
        title={isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"}
        description="Everything you manage, in one place."
      />

      {stats.data && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat label="Live scholarships" value={formatNumber(stats.data.open_scholarships)} />
          <Stat label="Total scholarships" value={formatNumber(stats.data.total_scholarships)} />
          <Stat label="Students" value={formatNumber(stats.data.total_students)} />
          <Stat
            label="New users this month"
            value={formatNumber(stats.data.monthly_signups)}
            hint={`${formatNumber(stats.data.total_countries)} countries represented`}
          />
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Scholarships
      </h2>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <SectionCard
          to="/admin/scholarships"
          title="Manage scholarships"
          description="The live board - edit, hide or delete what students currently see."
          icon={icon("M4 6h16M4 10h16M4 14h10M4 18h7")}
        />
        <SectionCard
          to="/admin/scholarships/new"
          title="Post a scholarship"
          description="Publish a new opportunity to the board."
          icon={icon("M12 5v14m-7-7h14")}
        />
        <SectionCard
          to="/admin/scholarships/archive"
          title="Archive"
          description="Closed and hidden scholarships - repost or extend deadlines."
          icon={icon("M4 7h16M6 7v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2")}
        />
        <SectionCard
          to="/admin/scholarships"
          title="Export scholarships CSV"
          description="Download the live board as a spreadsheet from the manage page."
          icon={icon("M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2")}
        />
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
        People
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          to="/admin/users"
          title="User management"
          description={
            isSuperAdmin
              ? "Add or remove administrators and review who has access."
              : "Add administrators and review who has access."
          }
          icon={icon("M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM5 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1")}
        />
        {isSuperAdmin && (
          <SectionCard
            to="/admin/directory"
            title="User directory"
            description="Every registered account with its profile details, searchable."
            icon={icon("M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01")}
            badge={<Badge tone="gold">Super admin</Badge>}
          />
        )}
      </div>
    </Page>
  );
}
