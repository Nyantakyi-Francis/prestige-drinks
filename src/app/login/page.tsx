import { loginAction } from "@/app/login/actions";
import { PasswordField } from "@/components/PasswordField";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const spPromise = searchParams;

  return <LoginPageInner searchParams={spPromise} />;
}

async function LoginPageInner({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 p-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Prestige Drinks
        </h1>
        <p className="mt-1 text-sm text-zinc-600">Sign in to continue.</p>

        {sp?.error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {sp.error === "disabled"
              ? "This account is disabled. Contact an admin."
              : sp.error === "confirm"
              ? "Check your email to confirm your account, then try again."
              : "Invalid email or password."}
          </div>
        ) : null}

        <form className="mt-4 space-y-4" action={loginAction}>
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
            <label
              className="text-sm font-medium text-zinc-800"
              htmlFor="password"
            >
              Password
            </label>
            <PasswordField
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-14 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
          <button
            className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
            type="submit"
          >
            Sign in
          </button>
        </form>

        <div className="mt-4 text-sm text-zinc-600">
          New salesperson?{" "}
          <a href="/signup" className="font-medium text-zinc-900">
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
