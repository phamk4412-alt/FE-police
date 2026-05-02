import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <section className="w-full max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Authentication
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
          {userId ? "You are signed in." : "Sign in to continue."}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          {userId
            ? "Your session is active. Use the profile icon in the navigation to manage your account."
            : "Use the navigation buttons to create the first test user or sign in with an existing account."}
        </p>
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm font-medium text-zinc-500">Session status</p>
          <p className="mt-2 text-lg font-semibold text-zinc-950">
            {userId ? "Signed in" : "Signed out"}
          </p>
        </div>
      </section>
    </main>
  );
}
