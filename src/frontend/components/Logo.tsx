export function Logo({
  width = 16,
  height = 16,
  invert = false,
  margin = 'mb-4',
}) {
  return (
    <img
      src="/phi.svg"
      alt="Philosophizer"
      className={`logo-image ${width ? `w-${width}` : 'w-16'} ${height ? `h-${height}` : 'h-16'} mx-auto ${margin} ${invert ? 'invert' : ''}`}
    />
  );
}

export function LoadingLogo() {
  return (
    <div className="animate-pulse">
      <Logo />
    </div>
  );
}
