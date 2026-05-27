export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute -inset-1/4"
        style={{
          background: `
            radial-gradient(ellipse at 20% 10%, hsl(258 90% 66% / 0.18), transparent 55%),
            radial-gradient(ellipse at 80% 90%, hsl(189 94% 43% / 0.14), transparent 55%),
            radial-gradient(ellipse at 70% 30%, hsl(330 81% 60% / 0.10), transparent 60%)
          `,
          filter: "blur(60px)",
          animation: "aurora-shift 24s ease-in-out infinite",
        }}
      />
      <div className="absolute inset-0 topo-pattern opacity-30" />
    </div>
  );
}
