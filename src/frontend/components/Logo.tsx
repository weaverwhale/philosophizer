import phiLogo from '../phi.svg';

export function Logo({ width = 16, height = 16, className = '' }) {
  return (
    <img
      src={phiLogo}
      alt="Philosophizer"
      className={`logo-image w-${width} h-${height} mx-auto mb-4 ${className}`}
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
