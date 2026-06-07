import { loginAction } from "@/app/login/actions";
import { AuthSubmitButton } from "@/components/AuthSubmitButton";
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
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
              className="min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10 sm:text-sm"
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
              className="min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 pr-14 text-base text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-900/10 sm:text-sm"
            />
          </div>
          <AuthSubmitButton label="Sign in" pendingLabel="Signing in..." />
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
