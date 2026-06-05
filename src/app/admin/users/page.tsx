import { KeyRound, UserPlus } from "lucide-react";

import {
  EmptyState,
  PageHeader,
  PrimaryButton,
  SectionCard,
  StatusBadge,
  inputClassName,
} from "@/components/ui";
import { getSupabaseAdmin, requireRole } from "@/lib/db/server";
import {
  createUserAction,
  resetPasswordAction,
  toggleActiveAction,
} from "@/app/admin/users/actions";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "admin" | "salesperson";
  is_active?: boolean | null;
  last_login_at?: string | null;
};

export default async function AdminUsersPage() {
  await requireRole("admin");
  const db = getSupabaseAdmin();

  const { data: usersResp, error: usersErr } = await db.auth.admin.listUsers({
    perPage: 200,
    page: 1,
  });
  if (usersErr) throw new Error(usersErr.message);

  const authUsers = usersResp?.users ?? [];
  const ids = authUsers.map((user) => user.id);

  const { data: profiles } = ids.length
    ? await db
        .from("profiles")
        .select("id,full_name,role,is_active,last_login_at")
        .in("id", ids)
    : { data: [] as ProfileRow[] };

  const profileById = new Map<string, ProfileRow>();
  for (const profile of (profiles ?? []) as ProfileRow[]) profileById.set(profile.id, profile);

  const rows = authUsers
    .map((user) => {
      const profile = profileById.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? "salesperson",
        isActive: profile?.is_active ?? true,
        lastLoginAt: profile?.last_login_at ?? null,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));

  const activeCount = rows.filter((row) => row.isActive).length;
  const adminCount = rows.filter((row) => row.role === "admin").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="Create staff accounts and manage access without hunting through tiny controls."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Users" value={`${rows.length}`} />
        <Summary label="Active" value={`${activeCount}`} />
        <Summary label="Admins" value={`${adminCount}`} />
      </div>

      <SectionCard>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-white">
            <UserPlus className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-zinc-950">Create user</h2>
            <p className="text-sm text-zinc-600">New staff can sign in immediately after this account is created.</p>
          </div>
        </div>

        <form action={createUserAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Full name" name="fullName" required />
          <Field label="Email" name="email" type="email" required />
          <Field label="Password" name="password" type="password" required />
          <label className="block">
            <span className="text-sm font-semibold text-zinc-900">Role</span>
            <select id="role" name="role" defaultValue="salesperson" className={inputClassName("mt-2")}>
              <option value="salesperson">Salesperson</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <PrimaryButton type="submit">
              <UserPlus className="h-4 w-4" aria-hidden />
              Create user
            </PrimaryButton>
          </div>
        </form>
      </SectionCard>

      <SectionCard>
        <h2 className="text-base font-semibold text-zinc-950">All users</h2>
        {rows.length ? (
          <>
            <div className="mt-3 grid gap-3 lg:hidden">
              {rows.map((row) => (
                <UserCard key={row.id} row={row} />
              ))}
            </div>

            <div className="mt-3 hidden overflow-x-auto lg:block">
              <table className="min-w-max w-full text-sm">
                <thead className="bg-zinc-50 text-left text-zinc-600">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last login</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-100">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{row.fullName ?? row.email}</div>
                        <div className="text-zinc-600">{row.email}</div>
                      </td>
                      <td className="px-4 py-3">{row.role}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={row.isActive ? "good" : "danger"}>
                          {row.isActive ? "Active" : "Disabled"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3">
                        {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <UserActions row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="mt-3">
            <EmptyState title="No users found" body="Create the first user above." />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: "admin" | "salesperson";
  isActive: boolean;
  lastLoginAt: string | null;
};

function UserCard({ row }: { row: UserRow }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-zinc-950">{row.fullName ?? row.email}</h3>
          <div className="mt-1 truncate text-sm text-zinc-600">{row.email}</div>
        </div>
        <StatusBadge tone={row.isActive ? "good" : "danger"}>
          {row.isActive ? "Active" : "Disabled"}
        </StatusBadge>
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-md bg-zinc-50 p-2">
          <div className="text-zinc-600">Role</div>
          <div className="font-semibold text-zinc-950">{row.role}</div>
        </div>
        <div className="rounded-md bg-zinc-50 p-2">
          <div className="text-zinc-600">Last login</div>
          <div className="font-semibold text-zinc-950">
            {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString() : "Never"}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <UserActions row={row} />
      </div>
    </div>
  );
}

function UserActions({ row }: { row: UserRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={toggleActiveAction}>
        <input type="hidden" name="userId" value={row.id} />
        <input type="hidden" name="isActive" value={String(!row.isActive)} />
        <PrimaryButton type="submit" variant={row.isActive ? "danger" : "secondary"}>
          {row.isActive ? "Disable" : "Enable"}
        </PrimaryButton>
      </form>

      <form action={resetPasswordAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="userId" value={row.id} />
        <input
          name="password"
          type="password"
          placeholder="New password"
          className={inputClassName("w-44")}
          required
        />
        <PrimaryButton type="submit" variant="secondary">
          <KeyRound className="h-4 w-4" aria-hidden />
          Reset
        </PrimaryButton>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className={inputClassName("mt-2")}
      />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="text-sm text-zinc-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-950">{value}</div>
    </div>
  );
}
