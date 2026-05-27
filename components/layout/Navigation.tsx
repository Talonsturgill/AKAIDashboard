import Link from "next/link";
import { Logo } from "../brand/Logo";
import { UniversalSearch } from "../search/UniversalSearch";

const links = [
  { href: "/archive", label: "Archive" },
  { href: "/contracts", label: "Contracts" },
  { href: "/companies", label: "Companies" },
  { href: "/policy", label: "Policy" },
  { href: "/infrastructure", label: "Infrastructure" },
];

export function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-background)]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-6 px-6">
        <Logo />
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto w-full max-w-xs">
          <UniversalSearch />
        </div>
      </div>
    </header>
  );
}
