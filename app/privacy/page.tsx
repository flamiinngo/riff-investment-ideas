import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = { title: 'Privacy — Riff' };

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy notice"
      introduction="This notice describes the information used to operate the Riff hackathon preview."
    >
      <section>
        <h2>Information Riff uses</h2>
        <ul>
          <li>Your public wallet address and signed authentication proof.</li>
          <li>Profile details, ideas, remixes and follows you choose to publish.</li>
          <li>Session, security and basic service-performance information.</li>
        </ul>
      </section>
      <section>
        <h2>How it is used</h2>
        <p>
          This information supports authentication, creator attribution,
          discovery, remix lineage, abuse prevention and reliable operation. Riff
          does not ask for private keys or seed phrases.
        </p>
      </section>
      <section>
        <h2>Public blockchain activity</h2>
        <p>
          Transactions approved through your wallet are public and may be
          permanently visible on Base. Riff cannot delete or alter blockchain
          records.
        </p>
      </section>
      <section>
        <h2>Service providers</h2>
        <p>
          Hosting, database, wallet and blockchain providers may process the
          limited technical information required to deliver their services under
          their own terms and privacy notices.
        </p>
      </section>
      <section>
        <h2>Questions</h2>
        <p>
          Privacy or security questions can be raised through the project’s
          public GitHub repository.
        </p>
      </section>
    </LegalPage>
  );
}
