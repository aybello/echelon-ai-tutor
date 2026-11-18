import { useState } from "react";
import { customers, supporter } from "@/lib/trustedOrganizations";
import "./TrustedOrganizations.css";

function OrganizationMark({ organization }: { organization: (typeof customers)[number] }) {
  return (
    <figure className={`trusted-organizations-mark trusted-organizations-mark--${organization.slug}`}>
      <div className="trusted-organizations-logo">
        {organization.logoDisplayAllowed === true && (
          <img
            src={organization.runtimeUrl}
            alt={`${organization.name} logo`}
            width={organization.width}
            height={organization.height}
            loading="eager"
            decoding="async"
          />
        )}
      </div>
      <figcaption>{organization.name}</figcaption>
    </figure>
  );
}

export default function TrustedOrganizations() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="trusted-organizations" aria-label="Customer organizations and founder support">
      <div className="trusted-organizations-inner">
        <div className="trusted-organizations-customers" role="group" aria-labelledby="trusted-organizations-title" data-paused={paused}>
          <div className="trusted-organizations-intro">
            <h2 id="trusted-organizations-title" className="trusted-organizations-heading">Trusted by</h2>
            <p>Used by operators and teams at</p>
            <button
              type="button"
              className="trusted-organizations-pause"
              aria-pressed={paused}
              onClick={() => setPaused(value => !value)}
            >
              {paused ? "Resume logo animation" : "Pause logo animation"}
            </button>
          </div>
          <div className="trusted-organizations-viewport">
            <div className="trusted-organizations-track">
              {[false, true].map(duplicate => (
                <ul
                  key={String(duplicate)}
                  className="trusted-organizations-list"
                  aria-hidden={duplicate ? true : undefined}
                  role={duplicate ? "presentation" : undefined}
                >
                  {customers.map(organization => (
                    <li key={organization.slug}><OrganizationMark organization={organization} /></li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
        <div className="trusted-organizations-supporter" role="group" aria-labelledby="supported-organizations-title">
          <h2 id="supported-organizations-title" className="trusted-organizations-heading">Supported by</h2>
          <OrganizationMark organization={supporter} />
        </div>
      </div>
    </section>
  );
}
