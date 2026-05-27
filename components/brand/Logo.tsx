import Link from "next/link";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-4xl",
  };
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-display">
      <span className={`${sizes[size]} font-medium tracking-tight`}>
        Alaska<span className="aurora-gradient-text">.AI</span>
      </span>
    </Link>
  );
}
