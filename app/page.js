import { redirect } from 'next/navigation';

// The full costing dashboard is a self-contained HTML document (with its own
// <head>, inline scripts, and CDN dependencies) served statically from
// /public/dashboard.html. Redirect the app root to it so the real dashboard —
// including the no-row-cap shipment list — loads intact.
export default function Home() {
  redirect('/dashboard.html');
}
