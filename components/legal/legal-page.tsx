import type { ReactNode } from 'react';
import Link from 'next/link';
import { RiffLogo } from '@/components/brand/riff-logo';

export function LegalPage({
  eyebrow,
  title,
  introduction,
  children,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b hairline">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 md:px-8">
          <Link
            href="/"
            aria-label="Return to Riff"
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <RiffLogo />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            Open Riff
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
        <p className="eyebrow text-primary">{eyebrow}</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-.06em] md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          {introduction}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated September 9, 2026
        </p>
        <div className="mt-12 space-y-10 border-t hairline pt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:leading-7 [&_p]:text-muted-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:leading-7 [&_ul]:text-muted-foreground">
          {children}
        </div>
      </article>
    </main>
  );
}
