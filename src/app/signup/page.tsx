import Link from "next/link";

import { signupSalespersonAction } from "@/app/signup/actions";
import { PasswordField } from "@/components/PasswordField";

export default function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const spPromise = searchParams;
  return <SignupPageInner searchParams={spPromise} />;
}

async function SignupPageInner({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 p-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Create Salesperson Account
        </h1>


        {sp?.error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Signup failed. Check your details and try again.
          </div>
        ) : null}

        <form className="mt-4 space-y-4" action={signupSalespersonAction}>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800" htmlFor="fullName">
              Full name
            </label>
            <input
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10"
              id="fullName"
              name="fullName"
              type="text"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-800" htmlFor="password">
              Password
            </label>
            <PasswordField
              id="password"
              name="password"
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-14 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <div className="text-xs text-zinc-500">Minimum 6 characters.</div>
          </div>
          <button
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
            type="submit"
          >
            Create account
          </button>
        </form>

        <div className="mt-4 text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
