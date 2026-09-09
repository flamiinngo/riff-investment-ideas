import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/legal-page';

export const metadata: Metadata = { title: 'Terms — Riff' };

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of use"
      introduction="These terms explain the conditions for using the Riff hackathon preview."
    >
      <section>
        <h2>Preview software</h2>
        <p>
          Riff is experimental software provided for demonstration and testing.
          Features may change, become unavailable or contain errors.
        </p>
      </section>
      <section>
        <h2>No investment advice</h2>
        <p>
          Riff presents user-created investment ideas and labelled sample data.
          Nothing in the product is financial, legal or tax advice, a
          recommendation, or a promise of performance.
        </p>
      </section>
      <section>
        <h2>Eligibility and risk</h2>
        <p>
          You are responsible for confirming that tokenized stocks are available
          to your account and lawful in your jurisdiction. Digital assets,
          tokenized securities, smart contracts and market prices involve risk,
          including loss of funds.
        </p>
      </section>
      <section>
        <h2>Your wallet and transactions</h2>
        <p>
          Riff is non-custodial and never asks for a seed phrase or private key.
          You remain responsible for reviewing wallet prompts, transaction data,
          fees and confirmations before approving an action.
        </p>
      </section>
      <section>
        <h2>User content</h2>
        <p>
          Only publish content you have the right to share. Do not use Riff for
          unlawful, deceptive, abusive or manipulative activity.
        </p>
      </section>
    </LegalPage>
  );
}
