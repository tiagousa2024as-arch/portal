import Script from "next/script";

// O portal é um app em JavaScript puro (public/portal.js) que desenha tudo dentro destes elementos.
export default function Home() {
  return (
    <>
      <nav className="nav" aria-label="Seções">
        <div className="nav-in" id="nav" />
      </nav>
      <main className="wrap" id="root" />
      <div className="status" id="status" role="status" aria-live="polite" />
      <Script src="/portal.js?v=5" strategy="afterInteractive" />
    </>
  );
}
