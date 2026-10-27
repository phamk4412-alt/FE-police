import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "../../utils/constants";

function LegalPage({ children, title }: { children: ReactNode; title: string }) {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link className="legal-back" to="/">
          ← {APP_NAME}
        </Link>
        <h1>{title}</h1>
        {children}
      </article>
    </main>
  );
}

export default LegalPage;
