export default function Footer() {
  return (
    <footer id="landing-footer" className="relative mt-24">
      {/* Gradient divider */}
      <div className="gradient-line mx-auto max-w-4xl" aria-hidden="true" />

      <div className="text-center py-10 space-y-2">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Slideia &mdash; From idea to slide
          deck in seconds.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Powered by AI. Built for humans.
        </p>
      </div>
    </footer>
  );
}
