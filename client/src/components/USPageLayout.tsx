import type { ReactNode } from "react";
import { Link } from "wouter";
import { ECHELON_LOGO_URL } from "./SiteNav";
import "./USPageLayout.css";
export default function USPageLayout({ children }: { children: ReactNode }) {
  return <div className="us-page">
    <nav className="us-nav" aria-label="US course navigation">
      <Link href="/us" className="us-brand"><img src={ECHELON_LOGO_URL} alt="Echelon Institute" width={28} height={28} /><span>Echelon US</span></Link>
      <div><Link href="/us/states">Find your state</Link><Link href="/us/courses">Shared WPI courses</Link><Link href="/account">Sign in</Link></div>
    </nav>
    {children}
    <footer className="us-main us-disclaimer">Independent exam preparation. Not affiliated with or endorsed by WPI, ABC or a state certification authority. State rules, exam versions and local grade names can differ. Confirm your exam before choosing a course.</footer>
  </div>;
}
export function USHero({ title, children }: { title: string; children: ReactNode }) {
  return <section className="us-hero"><div className="us-main"><h1>{title}</h1>{children}</div></section>;
}
