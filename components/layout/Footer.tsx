import { Logo } from "../brand/Logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border-soft)] bg-[var(--color-background)] py-10">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo size="sm" />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            The intelligence layer for AI in Alaska.
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          Data refreshed daily · 64°N
        </p>
      </div>
    </footer>
  );
}
