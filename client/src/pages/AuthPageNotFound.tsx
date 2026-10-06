import { Link } from 'react-router-dom';

export function AuthPageNotFound() {
  return (
    <main className="product-page not-found-page">
      <div className="product-shell">
        <span className="eyebrow">A SMALL DETOUR</span>
        <h1>We could not find that page.</h1>
        <p>The address may have changed. Your journey can continue from here.</p>
        <Link className="product-submit product-submit--link" to="/">
          Return to TripSOS
        </Link>
      </div>
    </main>
  );
}
