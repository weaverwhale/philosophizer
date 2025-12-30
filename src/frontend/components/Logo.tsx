import phiLogo from '../phi.svg';

export function Logo() {
  return (
    <img src={phiLogo} alt="Philosophizer" className="w-16 h-16 mx-auto mb-4" />
  );
}

export function LoadingLogo() {
  return (
    <div className="animate-pulse">
      <Logo />
    </div>
  );
}
