import { requireRole } from "@/lib/db/server";
import { getSupabaseAdmin } from "@/lib/db/server";
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
  const ids = authUsers.map((u) => u.id);

  const { data: profiles } = ids.length
    ? await db
        .from("profiles")
        .select("id,full_name,role,is_active,last_login_at")
        .in("id", ids)
    : { data: [] as ProfileRow[] };

  const profileById = new Map<string, ProfileRow>();
  for (const p of (profiles ?? []) as ProfileRow[]) profileById.set(p.id, p);

  const rows = authUsers
    .map((u) => {
      const p = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at,
        lastSignInAt: (u as unknown as { last_sign_in_at?: string | null }).last_sign_in_at,
        fullName: p?.full_name ?? null,
        role: p?.role ?? "salesperson",
        isActive: p?.is_active ?? true,
        lastLoginAt: p?.last_login_at ?? null,
      };
    })
    .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create salespersons, reset passwords, and enable/disable accounts.
        </p>
      </div>

      <form
        action={createUserAction}
        className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70 md:grid-cols-2"
      >
        <div className="md:col-span-2 text-sm font-semibold">Create User</div>
        <Field label="Full name" name="fullName" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required />
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            name="role"
            defaultValue="salesperson"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          >
            <option value="salesperson">Salesperson</option>
            <option value="admin">Admin</option>
          </select>
          <div className="text-xs text-zinc-500">
            Tip: create as salesperson first, then promote if needed.
          </div>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            Create
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200/70 px-4 py-3">
          <div className="text-sm font-semibold">All Users</div>
          <div className="text-xs text-zinc-500">
            Disable/enable requires running `supabase/upgrade.sql`.
          </div>
        </div>
        <table className="min-w-max w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-600 whitespace-nowrap">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Last login</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="whitespace-nowrap">
            {rows.map((r) => (
              <tr key={r.id} className={!r.isActive ? "bg-red-50" : undefined}>
                <td className="px-4 py-2 font-medium">{r.email}</td>
                <td className="px-4 py-2">{r.fullName ?? "—"}</td>
                <td className="px-4 py-2">{r.role}</td>
                <td className="px-4 py-2">{r.isActive ? "Yes" : "No"}</td>
                <td className="px-4 py-2">
                  {r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={toggleActiveAction} className="inline-flex">
                      <input type="hidden" name="userId" value={r.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={String(!r.isActive)}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                      >
                        {r.isActive ? "Disable" : "Enable"}
                      </button>
                    </form>

                    <ResetPasswordInline userId={r.id} />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length ? null : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-zinc-600">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-700" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
      />
    </div>
  );
}

function ResetPasswordInline({ userId }: { userId: string }) {
  return (
    <form action={resetPasswordAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="password"
        type="password"
        placeholder="New password"
        className="w-36 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-zinc-900/10"
        required
      />
      <button
        type="submit"
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Reset
      </button>
    </form>
  );
}
