export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sp-bg px-4">
      <div className="text-center space-y-2">
        <p className="text-sp-text font-semibold">Authentication failed</p>
        <a href="/login" className="text-sm text-sp-accent underline">
          Try again
        </a>
      </div>
    </main>
  );
}
