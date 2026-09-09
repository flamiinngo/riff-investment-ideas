'use client';
/* eslint-disable react/react-compiler */

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CircleUserRound,
  Compass,
  Copy,
  GitFork,
  Layers3,
  LineChart,
  Link2,
  LockKeyhole,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
  LogOut,
  UserRoundCheck,
  UserPlus,
} from 'lucide-react';
import { RiffLogo } from '@/components/brand/riff-logo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ideas as seedIdeas } from '@/lib/ideas/mock-data';
import {
  allocatePurchase,
  allocationTotal,
  isValidAllocation,
  rebalanceAllocation,
} from '@/lib/ideas/allocation';
import {
  connectBaseWallet,
  requestBasketQuote,
  sendAtomicBasket,
} from '@/lib/blockchain/basket-execution';
import { getTokenizedStock } from '@/lib/stocks/tokenized-stocks';
import {
  loadRiffSession,
  saveRiffProfile,
  setRiffFollow,
  signInWithBase,
  signOutBaseAccount,
  type RiffAccount,
} from '@/lib/blockchain/base-account';
import type { Allocation, Idea, TransactionState } from '@/types';

type View = 'discover' | 'create' | 'activity' | 'profile';
type Sort = 'Trending' | 'New' | 'Growing' | 'Remixed' | 'Following';
const money = (value: number) =>
  value >= 1000000
    ? `$${(value / 1000000).toFixed(2)}M`
    : `$${(value / 1000).toFixed(value < 100000 ? 1 : 0)}K`;

function AllocationStrip({
  allocation,
  dark = false,
}: {
  allocation: Allocation[];
  dark?: boolean;
}) {
  return (
    <div
      className={`flex h-2.5 w-full overflow-hidden rounded-full ${dark ? 'bg-white/10' : 'bg-muted'}`}
      aria-label={`Allocation totals ${allocationTotal(allocation)} percent`}
    >
      {allocation.map((item, index) => (
        <span
          key={item.symbol}
          style={{ width: `${item.weight}%`, opacity: 1 - index * 0.17 }}
          className={`allocation-segment ${dark ? 'bg-white' : 'bg-primary'}`}
        />
      ))}
    </div>
  );
}

function Sparkline({
  points,
  className = '',
}: {
  points: number[];
  className?: string;
}) {
  const d = points
    .map(
      (point, index) => `${index ? 'L' : 'M'} ${index * 12} ${48 - point / 2}`,
    )
    .join(' ');
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 132 32"
      className={`h-9 w-32 overflow-visible ${className}`}
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function AppHeader({
  view,
  navigate,
  account,
  openAccount,
}: {
  view: View;
  navigate: (view: View) => void;
  account: RiffAccount | null;
  openAccount: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b hairline bg-background/92 backdrop-blur-xl">
      <div className="mx-auto flex h-[60px] max-w-[1440px] items-center px-4 md:h-16 md:px-8">
        <button
          onClick={() => navigate('discover')}
          className="mr-4 flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary md:mr-10"
        >
          <RiffLogo />
        </button>
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {(['discover', 'create', 'activity', 'profile'] as View[]).map(
            (item) => (
              <button
                key={item}
                onClick={() => navigate(item)}
                className={`text-sm capitalize transition-colors ${view === item ? 'font-semibold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {item}
              </button>
            ),
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden h-9 items-center gap-2 border border-border bg-white px-3 text-xs font-semibold sm:flex">
            <span className="size-2 rounded-full bg-emerald-600" />
            Base mainnet
          </span>
          <button
            onClick={openAccount}
            className={`flex h-9 items-center gap-2 px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${account ? 'border border-border bg-white' : 'bg-foreground text-background hover:bg-foreground/80'}`}
          >
            <CircleUserRound className="size-4" />
            <span>{account ? `@${account.handle}` : 'Sign in'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileNav({
  view,
  navigate,
}: {
  view: View;
  navigate: (view: View) => void;
}) {
  const items = [
    ['discover', Compass],
    ['create', Plus],
    ['activity', Layers3],
    ['profile', CircleUserRound],
  ] as const;
  return (
    <nav
      aria-label="Mobile navigation"
      className="mobile-dock fixed inset-x-3 z-40 grid min-w-0 grid-cols-4 border border-black/10 bg-background/94 p-1.5 shadow-[0_18px_60px_rgba(18,20,17,.16)] backdrop-blur-xl md:hidden"
    >
      {items.map(([item, Icon]) => (
        <button
          key={item}
          onClick={() => navigate(item)}
          className={`relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium capitalize tracking-[-.01em] transition-colors ${view === item ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        >
          <Icon
            className="size-[18px]"
            strokeWidth={view === item ? 2.4 : 1.8}
          />
          {item}
        </button>
      ))}
    </nav>
  );
}

function IdeaCard({
  idea,
  onOpen,
  onBuy,
}: {
  idea: Idea;
  onOpen: () => void;
  onBuy: () => void;
}) {
  return (
    <article className="group flex min-h-[326px] flex-col border-t hairline py-6 transition-colors md:px-5 md:hover:bg-white/70">
      <div className="mb-5 flex items-center justify-between">
        <span className="eyebrow text-muted-foreground">{idea.category}</span>
        <span
          className={`numeric text-sm font-semibold ${idea.performance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
        >
          {idea.performance >= 0 ? '+' : ''}
          {idea.performance}%
        </span>
      </div>
      <button
        onClick={onOpen}
        className="text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        <h2 className="text-2xl font-semibold leading-[1.05] tracking-[-.045em]">
          {idea.name}
        </h2>
        <p className="mt-2 max-w-md text-base leading-6 text-muted-foreground">
          {idea.description}
        </p>
      </button>
      <div className="mt-7">
        <AllocationStrip allocation={idea.allocation} />
        <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[11px] font-semibold text-muted-foreground sm:flex sm:justify-between sm:text-xs">
          {idea.allocation.map((item) => (
            <span key={item.symbol}>
              {item.symbol} {item.weight}%
            </span>
          ))}
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between pt-7">
        <div>
          <div className="text-sm font-medium">by {idea.creator}</div>
          <div className="numeric mt-1 text-xs text-muted-foreground">
            {money(idea.capital)} following · {idea.holders.toLocaleString()}{' '}
            holders
          </div>
        </div>
        <Sparkline points={idea.sparkline} className="text-primary" />
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
        <Button
          onClick={onOpen}
          className="h-11 rounded-md bg-foreground px-5 text-background hover:bg-foreground/80"
        >
          View idea <ArrowRight />
        </Button>
        <Button
          variant="outline"
          onClick={onBuy}
          aria-label={`Buy ${idea.name}`}
          className="h-11 px-4"
        >
          Buy
        </Button>
      </div>
    </article>
  );
}

function Discover({
  ideas,
  onOpen,
  onBuy,
  onCreate,
  followedIdeas,
  followedCreators,
}: {
  ideas: Idea[];
  onOpen: (idea: Idea) => void;
  onBuy: (idea: Idea) => void;
  onCreate: () => void;
  followedIdeas: Set<string>;
  followedCreators: Set<string>;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('Trending');
  const filtered = useMemo(() => {
    const matches = ideas.filter((idea) =>
      `${idea.name} ${idea.description} ${idea.creator} ${idea.allocation.map((a) => a.symbol).join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    if (sort === 'New') return matches;
    if (sort === 'Growing')
      return [...matches].sort((a, b) => b.performance - a.performance);
    if (sort === 'Remixed')
      return [...matches].sort((a, b) => b.remixes - a.remixes);
    if (sort === 'Following')
      return matches.filter(
        (idea) =>
          followedIdeas.has(idea.id) || followedCreators.has(idea.creator),
      );
    return [...matches].sort(
      (a, b) => b.holders + b.remixes * 20 - (a.holders + a.remixes * 20),
    );
  }, [ideas, query, sort, followedIdeas, followedCreators]);
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-4 pb-16 pt-9 sm:px-5 md:px-8 md:pt-16">
        <div className="grid min-w-0 gap-8 border-b hairline pb-10 lg:grid-cols-[1fr_440px] lg:items-end">
          <div className="min-w-0">
            <div className="eyebrow mb-4 flex items-center gap-2 text-primary">
              <Sparkles className="size-3.5" /> Discover
              <span className="ml-1 border border-primary/20 bg-primary/5 px-2 py-1 text-[9px] tracking-[.1em]">
                Demo discovery data
              </span>
            </div>
            <h1 className="max-w-3xl font-semibold leading-[.88] tracking-[-.065em]">
              <span className="hidden text-[clamp(2.75rem,6vw,5.8rem)] sm:inline">
                INVESTMENT IDEAS
                <br />
                <span className="text-muted-foreground">PEOPLE BUY.</span>
              </span>
              <span className="text-[2.35rem] sm:hidden">
                <span className="block">INVESTMENT</span>
                <span className="block">IDEAS PEOPLE</span>
                <span className="block text-muted-foreground">
                  ACTUALLY BUY.
                </span>
              </span>
            </h1>
          </div>
          <div className="min-w-0">
            <p className="mb-5 max-w-sm text-lg leading-7 text-muted-foreground">
              Find a thesis you understand. Buy the allocation behind it. Remix
              what you would change.
            </p>
            <label className="relative block min-w-0 max-w-full">
              <span className="sr-only">Search ideas, stocks or creators</span>
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ideas, stocks or creators..."
                className="h-12 w-full max-w-full rounded-md bg-white pl-11 text-base shadow-none"
              />
            </label>
          </div>
        </div>
        <div className="flex gap-7 overflow-x-auto border-b hairline py-4 text-sm font-medium">
          {(
            ['Trending', 'New', 'Growing', 'Remixed', 'Following'] as Sort[]
          ).map((item) => (
            <button
              key={item}
              onClick={() => setSort(item)}
              className={
                sort === item
                  ? 'text-foreground underline decoration-2 underline-offset-[18px]'
                  : 'text-muted-foreground'
              }
            >
              {item}
            </button>
          ))}
          <span className="numeric ml-auto hidden text-muted-foreground md:block">
            $1.82M following ideas · Demo data
          </span>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onOpen={() => onOpen(idea)}
              onBuy={() => onBuy(idea)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-xl font-semibold">
              {sort === 'Following'
                ? 'Your following feed is ready for a point of view.'
                : 'No ideas found.'}
            </p>
            <p className="mt-2 text-muted-foreground">
              {sort === 'Following'
                ? 'Open an idea and follow its thesis or creator. New branches will appear here.'
                : 'Try a company, ticker, thesis or creator.'}
            </p>
          </div>
        )}
      </section>
      <section className="bg-foreground px-5 py-20 text-background md:px-8">
        <div className="mx-auto max-w-[1380px]">
          <p className="eyebrow text-white/45">The whole product</p>
          <div className="mt-8 grid gap-10 lg:grid-cols-3">
            {[
              ['01', 'FIND AN IDEA.', 'See the belief before the basket.'],
              [
                '02',
                'BUY IT.',
                'Choose an amount; the allocation does the rest.',
              ],
              [
                '03',
                'REMIX IT.',
                'Change the view, preserve where it came from.',
              ],
            ].map((item) => (
              <div key={item[0]} className="border-t border-white/20 pt-6">
                <span className="numeric text-sm text-white/35">{item[0]}</span>
                <h2 className="mt-12 text-[clamp(2rem,4vw,4.5rem)] font-semibold leading-[.9] tracking-[-.055em]">
                  {item[1]}
                </h2>
                <p className="mt-5 text-lg text-white/55">{item[2]}</p>
              </div>
            ))}
          </div>
          <div className="mt-20 flex flex-col justify-between gap-6 border-t border-white/20 pt-7 md:flex-row md:items-center">
            <div>
              <p className="text-2xl font-semibold tracking-[-.035em]">
                A social layer for programmable equities.
              </p>
              <p className="mt-2 text-white/50">
                Built on Base · Tokenized-stock eligibility enforced per account
              </p>
            </div>
            <Button
              onClick={onCreate}
              className="h-12 bg-white px-6 text-foreground hover:bg-white/85"
            >
              Create an idea <ArrowRight />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function PerformanceChart({ idea }: { idea: Idea }) {
  const [period, setPeriod] = useState('1M');
  const periods = ['1D', '1W', '1M', '3M', '6M', 'ALL'];
  const points = idea.sparkline
    .map(
      (point, i) =>
        `${(i / (idea.sparkline.length - 1)) * 100},${55 - (point - 40) * 1.5}`,
    )
    .join(' ');
  return (
    <div className="border-t hairline pt-6">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="eyebrow text-muted-foreground">Performance</span>
          <div
            className={`numeric mt-2 text-4xl font-semibold tracking-[-.05em] ${idea.performance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}
          >
            {idea.performance >= 0 ? '+' : ''}
            {idea.performance}%
          </div>
        </div>
        <div className="flex gap-1">
          {periods.map((item) => (
            <button
              key={item}
              onClick={() => setPeriod(item)}
              className={`min-h-9 px-2.5 text-xs font-semibold ${period === item ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        aria-label={`${idea.name} historical performance chart for ${period}`}
        className="mt-8 h-52 w-full overflow-visible"
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1747d1" stopOpacity=".16" />
            <stop offset="1" stopColor="#1747d1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M ${points} L 100,60 L 0,60 Z`} fill="url(#chart-fill)" />
        <polyline
          points={points}
          fill="none"
          stroke="#1747d1"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="0"
          x2="100"
          y1="58"
          y2="58"
          stroke="currentColor"
          opacity=".12"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="mt-3 text-xs text-muted-foreground">
        Historical demo performance · Not a guarantee of future results.
      </p>
    </div>
  );
}

function IdeaDetail({
  idea,
  onBack,
  onBuy,
  onRemix,
  onShare,
  ideaFollowed,
  creatorFollowed,
  onFollowIdea,
  onFollowCreator,
}: {
  idea: Idea;
  onBack: () => void;
  onBuy: () => void;
  onRemix: () => void;
  onShare: () => void;
  ideaFollowed: boolean;
  creatorFollowed: boolean;
  onFollowIdea: () => void;
  onFollowCreator: () => void;
}) {
  const lineage =
    idea.id === 'ai-eats-energy'
      ? [
          { name: 'AI EATS ENERGY', creator: '@emeka', current: true },
          {
            name: 'AI EATS ENERGY — NUCLEAR',
            creator: '@sarah',
            current: false,
          },
          {
            name: 'AI EATS ENERGY — NUCLEAR + GRID',
            creator: '@david',
            current: false,
          },
        ]
      : idea.lineage.map((node) => ({
          name: node.name,
          creator: node.creator,
          current: node.id === idea.id,
        }));
  return (
    <div className="mx-auto max-w-[1380px] px-5 py-8 md:px-8 md:py-12">
      <button
        onClick={onBack}
        className="mb-10 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Discover
      </button>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,.82fr)]">
        <article>
          <div className="eyebrow text-primary">
            {idea.category} · Version {idea.version} · Demo market data
          </div>
          <h1 className="mt-5 max-w-4xl text-[clamp(3rem,7.4vw,7.5rem)] font-semibold leading-[.84] tracking-[-.07em]">
            {idea.name}
          </h1>
          <p className="mt-7 max-w-2xl text-xl leading-8 text-muted-foreground md:text-2xl md:leading-9">
            {idea.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="font-semibold">Created by {idea.creator}</span>
            <span className="text-muted-foreground">{idea.createdAt}</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="size-4 text-primary" />
              Canonical lineage
            </span>
            <button
              onClick={onFollowCreator}
              className={`flex min-h-10 items-center gap-1.5 font-semibold underline decoration-1 underline-offset-4 ${creatorFollowed ? 'text-primary' : 'text-foreground'}`}
            >
              <UserPlus className="size-4" />
              {creatorFollowed
                ? `Following ${idea.creator}`
                : `Follow ${idea.creator}`}
            </button>
            <button
              onClick={onFollowIdea}
              className={`flex min-h-10 items-center gap-1.5 font-semibold underline decoration-1 underline-offset-4 ${ideaFollowed ? 'text-primary' : 'text-foreground'}`}
            >
              <Bookmark
                className={`size-4 ${ideaFollowed ? 'fill-current' : ''}`}
              />
              {ideaFollowed ? 'Following idea' : 'Follow idea'}
            </button>
          </div>
          <div className="mt-10 grid grid-cols-3 border-y hairline py-6">
            <div>
              <span className="eyebrow text-muted-foreground">Following</span>
              <strong className="numeric mt-2 block text-2xl">
                {money(idea.capital)}
              </strong>
            </div>
            <div>
              <span className="eyebrow text-muted-foreground">Holders</span>
              <strong className="numeric mt-2 block text-2xl">
                {idea.holders.toLocaleString()}
              </strong>
            </div>
            <div>
              <span className="eyebrow text-muted-foreground">Remixes</span>
              <strong className="numeric mt-2 block text-2xl">
                {idea.remixes}
              </strong>
            </div>
          </div>
          <div className="idea-action-dock sticky z-20 mt-7 grid grid-cols-[1fr_1fr_auto] gap-2 border border-black/10 bg-background/94 p-2 shadow-[0_16px_44px_rgba(18,20,17,.14)] backdrop-blur md:static md:flex md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <Button
              onClick={onBuy}
              className="h-12 bg-foreground px-8 text-background"
            >
              Buy
            </Button>
            <Button onClick={onRemix} variant="outline" className="h-12 px-8">
              <GitFork />
              Remix
            </Button>
            <Button onClick={onShare} variant="ghost" className="h-12 px-4">
              <Share2 />
              <span className="sr-only sm:not-sr-only">Share</span>
            </Button>
          </div>
          <section className="mt-10 border-y hairline py-6">
            <p className="eyebrow text-primary">Why buy the idea here?</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <strong className="text-sm">One confirmation</strong>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  The eligible allocation executes as one atomic Base batch.
                </p>
              </div>
              <div>
                <strong className="text-sm">One clear view</strong>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Every leg stays grouped and understood as this thesis.
                </p>
              </div>
              <div>
                <strong className="text-sm">A living idea</strong>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Keep its creator, updates and remix lineage attached.
                </p>
              </div>
            </div>
          </section>
          <div className="mt-16">
            <PerformanceChart idea={idea} />
          </div>
          <section className="mt-16 border-t hairline pt-8">
            <p className="eyebrow text-muted-foreground">Why this exists</p>
            <p className="mt-6 max-w-3xl text-2xl leading-[1.45] tracking-[-.025em] md:text-3xl">
              {idea.thesis}
            </p>
          </section>
        </article>
        <aside className="space-y-12 lg:pt-24">
          <section className="border-t hairline pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Allocation</h2>
              <span className="numeric text-sm font-semibold">100%</span>
            </div>
            <div className="mt-6">
              <AllocationStrip allocation={idea.allocation} />
            </div>
            <div className="mt-7 space-y-1">
              {idea.allocation.map((item) => (
                <div
                  key={item.symbol}
                  className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b hairline py-4"
                >
                  <span className="font-semibold">{item.symbol}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {item.company}
                    {!item.available && (
                      <span className="ml-2 text-amber-700">Unavailable</span>
                    )}
                  </span>
                  <span className="numeric text-xl font-semibold">
                    {item.weight}%
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="border-t hairline pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">How this idea evolved</h2>
              <GitFork className="size-5 text-primary" />
            </div>
            <div className="mt-7">
              {lineage.map((node, index) => (
                <div
                  key={node.name}
                  className="relative flex gap-4 pb-8 last:pb-0"
                >
                  {index < lineage.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-[calc(100%-8px)] w-px bg-border" />
                  )}
                  <span
                    className={`relative mt-1.5 size-[15px] shrink-0 rounded-full border-2 ${node.current ? 'border-primary bg-primary' : 'border-foreground bg-background'}`}
                  />
                  <div>
                    <div className="font-semibold leading-5">{node.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {index === 0 ? 'Original' : 'Remix'} by {node.creator}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="border border-border bg-white p-5">
            <div className="flex items-center gap-3">
              <LockKeyhole className="size-5 text-primary" />
              <h2 className="font-semibold">Execution guardrails</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Availability is checked per asset and account before any order is
              sent. A partial basket never silently becomes a completed
              purchase.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AllocationEditor({
  allocation,
  onChange,
}: {
  allocation: Allocation[];
  onChange: (allocation: Allocation[]) => void;
}) {
  return (
    <div>
      <AllocationStrip allocation={allocation} />
      <div className="mt-6 space-y-6">
        {allocation.map((item) => (
          <div key={item.symbol}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="font-semibold">{item.symbol}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  {item.company}
                </span>
              </div>
              <span className="numeric text-lg font-semibold">
                {item.weight}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={item.weight}
              onValueChange={(value) =>
                onChange(
                  rebalanceAllocation(
                    allocation,
                    item.symbol,
                    Array.isArray(value) ? value[0] : value,
                  ),
                )
              }
              aria-label={`${item.symbol} allocation`}
            />
          </div>
        ))}
      </div>
      <div
        className={`mt-7 flex items-center justify-between border-t pt-4 ${isValidAllocation(allocation) ? 'text-emerald-700' : 'text-destructive'}`}
      >
        <span className="text-sm font-semibold">Allocation total</span>
        <span className="numeric text-lg font-semibold">
          {allocationTotal(allocation)}%
        </span>
      </div>
    </div>
  );
}

function AccountDialog({
  open,
  close,
  account,
  onAccount,
}: {
  open: boolean;
  close: () => void;
  account: RiffAccount | null;
  onAccount: (account: RiffAccount | null) => void;
}) {
  const [address, setAddress] = useState<RiffAccount['address'] | null>(
    account?.address ?? null,
  );
  const [handle, setHandle] = useState(account?.handle ?? '');
  const [displayName, setDisplayName] = useState(account?.displayName ?? '');
  const [bio, setBio] = useState(account?.bio ?? '');
  const [status, setStatus] = useState<
    'idle' | 'connecting' | 'profile' | 'saving' | 'error'
  >(account ? 'profile' : 'idle');
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setAddress(account?.address ?? null);
      setHandle(account?.handle ?? '');
      setDisplayName(account?.displayName ?? '');
      setBio(account?.bio ?? '');
      setStatus(account ? 'profile' : 'idle');
      setError('');
    }
  }, [open, account]);
  const connect = async () => {
    setStatus('connecting');
    setError('');
    try {
      const session = await signInWithBase();
      if (!session.account)
        throw new Error('Riff could not restore your session.');
      setAddress(session.account.address);
      setHandle(session.account.handle);
      setDisplayName(session.account.displayName);
      setBio(session.account.bio);
      onAccount(session.account);
      setStatus('profile');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'We could not complete sign-in.',
      );
      setStatus('error');
    }
  };
  const save = async () => {
    if (!address) return;
    setStatus('saving');
    setError('');
    const cleanHandle = handle
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);
    const next = {
      address,
      handle: cleanHandle,
      displayName: displayName.trim().slice(0, 40),
      bio: bio.trim().slice(0, 140),
    };
    try {
      const result = await saveRiffProfile(next);
      onAccount(result.account);
      close();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'We could not save your profile.',
      );
      setStatus('profile');
    }
  };
  const signOut = async () => {
    await signOutBaseAccount();
    onAccount(null);
    close();
  };
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="mobile-sheet max-h-[92dvh] overflow-y-auto p-6 sm:max-w-[500px] sm:p-8">
        <DialogHeader>
          <div className="eyebrow text-primary">Your Riff identity</div>
          <DialogTitle className="text-3xl font-semibold leading-none tracking-[-.055em]">
            {account ? 'Account & profile' : 'Ideas need a person.'}
          </DialogTitle>
          <DialogDescription>
            {account
              ? 'Manage the public identity attached to your ideas.'
              : 'Browse without an account. Sign in when you want to buy, create, follow or remix.'}
          </DialogDescription>
        </DialogHeader>
        {(status === 'idle' ||
          status === 'connecting' ||
          status === 'error') && (
          <div className="mt-4">
            <button
              onClick={connect}
              disabled={status === 'connecting'}
              className="flex min-h-14 w-full items-center justify-center gap-3 bg-[#0000ff] px-5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <span className="grid size-6 place-items-center rounded-full bg-white text-[#0000ff]">
                <span className="size-2.5 rounded-full bg-current" />
              </span>
              {status === 'connecting'
                ? 'Opening Base Account…'
                : 'Sign in with Base'}
            </button>
            <div className="mt-6 grid grid-cols-[24px_1fr] gap-x-3 gap-y-4 border-t hairline pt-6 text-sm leading-5">
              <ShieldCheck className="size-5 text-primary" />
              <p>
                <strong>No password to remember.</strong>
                <br />
                <span className="text-muted-foreground">
                  Your wallet proves the account belongs to you.
                </span>
              </p>
              <LockKeyhole className="size-5 text-primary" />
              <p>
                <strong>Signing in never moves money.</strong>
                <br />
                <span className="text-muted-foreground">
                  Every purchase still needs its own clear confirmation.
                </span>
              </p>
            </div>
            {error && (
              <p
                role="alert"
                className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </p>
            )}
          </div>
        )}
        {(status === 'profile' || status === 'saving') && address && (
          <div className="mt-4 space-y-5">
            <div className="flex items-center gap-3 border-y hairline py-4">
              <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <UserRoundCheck className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Base Account connected</p>
                <p className="numeric truncate text-xs text-muted-foreground">
                  {address.slice(0, 8)}…{address.slice(-6)}
                </p>
              </div>
            </div>
            <label className="block">
              <span className="eyebrow text-muted-foreground">Handle</span>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  value={handle}
                  onChange={(event) => setHandle(event.target.value)}
                  placeholder="yourname"
                  className="h-12 pl-8 text-base"
                />
              </div>
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground">
                Display name
              </span>
              <Input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How people know you"
                className="mt-2 h-12 text-base"
              />
            </label>
            <label className="block">
              <span className="eyebrow text-muted-foreground">
                What do you invest around?
              </span>
              <Textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Technology, energy and infrastructure."
                className="mt-2 min-h-24 text-base leading-6"
              />
            </label>
            <Button
              onClick={save}
              disabled={
                status === 'saving' || !handle.trim() || !displayName.trim()
              }
              className="h-12 w-full bg-foreground text-background"
            >
              {status === 'saving'
                ? 'Saving profile…'
                : account
                  ? 'Save profile'
                  : 'Create profile'}{' '}
              {status !== 'saving' && <ArrowRight />}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            {account && (
              <button
                onClick={signOut}
                className="mx-auto flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BuyDialog({
  idea,
  open,
  close,
}: {
  idea: Idea | null;
  open: boolean;
  close: () => void;
}) {
  const [amount, setAmount] = useState(100);
  const [state, setState] = useState<TransactionState>('review');
  const [eligible, setEligible] = useState(false);
  const [error, setError] = useState('');
  const [hashes, setHashes] = useState<string[]>([]);
  useEffect(() => {
    if (open) {
      setState('review');
      setAmount(100);
      setEligible(false);
      setError('');
      setHashes([]);
    }
  }, [open]);
  if (!idea) return null;
  const unsupported = idea.allocation.filter(
    (item) => !getTokenizedStock(item.symbol),
  );
  const estimated = allocatePurchase(amount, idea.allocation);
  const execute = async () => {
    try {
      setError('');
      setState('quoting');
      const account = await connectBaseWallet();
      const quote = await requestBasketQuote(idea, amount, account);
      setState('confirming');
      const receipts = await sendAtomicBasket(quote, account);
      setHashes(receipts);
      setState('confirmed');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The wallet could not complete the basket.',
      );
      setState('failed');
    }
  };
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-[560px]">
        <DialogHeader>
          <div className="eyebrow text-primary">Base mainnet · USDC</div>
          <DialogTitle className="text-3xl tracking-[-.05em]">
            Buy {idea.name}
          </DialogTitle>
          <DialogDescription>
            Riff requests one atomic smart-wallet batch. Every leg succeeds, or
            the basket reverts.
          </DialogDescription>
        </DialogHeader>
        {state === 'review' && (
          <>
            <div className="mt-4">
              <span className="eyebrow text-muted-foreground">How much?</span>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className={`numeric h-11 border text-sm font-semibold ${amount === value ? 'border-foreground bg-foreground text-background' : 'border-border bg-background'}`}
                  >
                    ${value}
                  </button>
                ))}
              </div>
              <Input
                aria-label="Custom purchase amount in US dollars"
                type="number"
                min="10"
                max="100000"
                value={amount}
                onChange={(event) =>
                  setAmount(Math.max(0, Number(event.target.value)))
                }
                className="mt-3 h-12 text-lg"
              />
            </div>
            <div className="mt-5 border-t hairline pt-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">Estimated USDC split</span>
                <span className="numeric text-sm text-muted-foreground">
                  ${amount.toFixed(2)}
                </span>
              </div>
              {estimated.map((item, index) => (
                <div
                  key={item.symbol}
                  className="flex justify-between py-2 text-sm"
                >
                  <span>
                    {getTokenizedStock(item.symbol)?.symbol ?? item.symbol}{' '}
                    <span className="text-muted-foreground">
                      {idea.allocation[index].weight}%
                    </span>
                  </span>
                  <span className="numeric font-semibold">
                    ${item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            {unsupported.length > 0 && (
              <div
                role="alert"
                className="mt-4 border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
              >
                <strong>This idea isn’t fully executable yet.</strong>
                <br />
                {unsupported.map((item) => item.symbol).join(', ')}{' '}
                {unsupported.length === 1 ? 'is' : 'are'} not in Coinbase’s
                canonical tokenized-stock directory. Riff will not silently
                substitute or omit assets.
              </div>
            )}
            <label className="mt-5 flex cursor-pointer items-start gap-3 border-t hairline pt-5 text-sm leading-6">
              <input
                type="checkbox"
                checked={eligible}
                onChange={(event) => setEligible(event.target.checked)}
                className="mt-1 size-4 accent-primary"
              />
              <span>
                I confirm I am outside the United States and eligible to access
                Coinbase Tokenized Stocks in my jurisdiction. Onchain transfer
                policy remains authoritative.
              </span>
            </label>
            <Button
              onClick={execute}
              disabled={amount < 10 || unsupported.length > 0 || !eligible}
              className="mt-6 h-12 w-full bg-foreground text-background"
            >
              Connect wallet & get live quote <ArrowRight />
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Requires a Base smart wallet with atomic batch support. Prices are
              requested live at confirmation.
            </p>
          </>
        )}
        {state === 'quoting' && (
          <div className="py-14 text-center">
            <div className="mx-auto grid size-14 animate-pulse place-items-center rounded-full bg-primary/10 text-primary">
              <LineChart />
            </div>
            <h3 className="mt-6 text-2xl font-semibold">
              Building a live basket
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              Checking liquidity, price impact, balances and the exact
              Coinbase-issued contracts.
            </p>
          </div>
        )}
        {state === 'confirming' && (
          <div className="py-14 text-center">
            <div className="mx-auto grid size-14 animate-pulse place-items-center rounded-full bg-primary/10 text-primary">
              <WalletCards />
            </div>
            <h3 className="mt-6 text-2xl font-semibold">
              Waiting for Base confirmation
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              The wallet is executing the allocation atomically. Riff will not
              show success until every receipt is confirmed.
            </p>
          </div>
        )}
        {state === 'confirmed' && (
          <div className="py-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Check />
            </div>
            <h3 className="mt-6 text-3xl font-semibold tracking-[-.04em]">
              You’re in.
            </h3>
            <p className="mt-2 text-muted-foreground">
              Every allocation leg confirmed on Base.
            </p>
            <div className="mt-5 space-y-2">
              {hashes.map((hash, index) => (
                <a
                  key={hash}
                  href={`https://basescan.org/tx/${hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-medium text-primary underline underline-offset-4"
                >
                  View receipt {index + 1} on BaseScan
                </a>
              ))}
            </div>
            <Button onClick={close} className="mt-7 h-11 px-6">
              Done
            </Button>
          </div>
        )}
        {state === 'failed' && (
          <div className="py-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-red-100 text-red-700">
              <X />
            </div>
            <h3 className="mt-6 text-2xl font-semibold">
              We couldn’t complete that purchase.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {error || 'Your wallet was not able to confirm the transaction.'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Riff did not record this as a completed purchase.
            </p>
            <Button
              onClick={() => setState('review')}
              className="mt-7 h-11 px-6"
            >
              Try again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RemixDialog({
  idea,
  open,
  close,
  publish,
}: {
  idea: Idea | null;
  open: boolean;
  close: () => void;
  publish: (idea: Idea) => void;
}) {
  const [allocation, setAllocation] = useState<Allocation[]>([]);
  const [name, setName] = useState('');
  const [thesis, setThesis] = useState('');
  const [step, setStep] = useState<'edit' | 'preview' | 'published'>('edit');
  useEffect(() => {
    if (open && idea) {
      setAllocation(idea.allocation.map((item) => ({ ...item })));
      setName(`${idea.name} — NUCLEAR`);
      setThesis(
        'I agree with the power thesis, but want more direct exposure to generation and grid capacity.',
      );
      setStep('edit');
    }
  }, [open, idea]);
  if (!idea) return null;
  const commit = () => {
    const child: Idea = {
      ...idea,
      id: `${idea.id}-remix-${Date.now()}`,
      name,
      thesis,
      description: thesis,
      creator: '@you',
      creatorName: 'You',
      createdAt: 'Just now',
      allocation,
      performance: 0,
      capital: 0,
      holders: 0,
      remixes: 0,
      lineage: [...idea.lineage, { id: 'new', name, creator: '@you' }],
      version: idea.version + 1,
      parentIdeaId: idea.id,
    };
    publish(child);
    setStep('published');
  };
  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-6 sm:max-w-[680px]">
        <DialogHeader>
          <div className="eyebrow text-primary">
            Remix ·{' '}
            {step === 'edit'
              ? 'Allocation'
              : step === 'preview'
                ? 'Preview'
                : 'Published'}
          </div>
          <DialogTitle className="text-3xl tracking-[-.05em]">
            Make the idea yours.
          </DialogTitle>
          <DialogDescription>
            The original remains unchanged. Your version keeps a permanent link
            back to it.
          </DialogDescription>
        </DialogHeader>
        {step === 'edit' && (
          <>
            <div className="mt-4 grid gap-6 border-b hairline pb-6 sm:grid-cols-2">
              <div>
                <span className="eyebrow text-muted-foreground">Original</span>
                <p className="mt-2 font-semibold">{idea.name}</p>
              </div>
              <div>
                <span className="eyebrow text-primary">Your version</span>
                <p className="mt-2 font-semibold">Live allocation</p>
              </div>
            </div>
            <div className="mt-6">
              <AllocationEditor
                allocation={allocation}
                onChange={setAllocation}
              />
            </div>
            <Button
              onClick={() => setStep('preview')}
              disabled={!isValidAllocation(allocation)}
              className="mt-7 h-12 w-full bg-foreground text-background"
            >
              Continue <ArrowRight />
            </Button>
          </>
        )}
        {step === 'preview' && (
          <>
            <div className="mt-4 space-y-5">
              <label className="block">
                <span className="eyebrow text-muted-foreground">Idea name</span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 h-12 text-base"
                />
              </label>
              <label className="block">
                <span className="eyebrow text-muted-foreground">
                  Why do you believe this?
                </span>
                <Textarea
                  value={thesis}
                  onChange={(event) => setThesis(event.target.value)}
                  className="mt-2 min-h-28 text-base leading-6"
                />
              </label>
              <div className="border border-border bg-muted/40 p-5">
                <span className="eyebrow text-primary">Preview</span>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-.04em]">
                  {name || 'Untitled remix'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {thesis}
                </p>
                <div className="mt-5">
                  <AllocationStrip allocation={allocation} />
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-[auto_1fr] gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep('edit')}
                className="h-12"
              >
                Back
              </Button>
              <Button
                onClick={commit}
                disabled={!name.trim() || !thesis.trim()}
                className="h-12 bg-foreground text-background"
              >
                Publish remix
              </Button>
            </div>
          </>
        )}
        {step === 'published' && (
          <div className="py-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <GitFork />
            </div>
            <h3 className="mt-6 text-3xl font-semibold tracking-[-.04em]">
              Your idea has a new branch.
            </h3>
            <p className="mt-2 text-muted-foreground">
              The original allocation and your changes are preserved in the
              lineage.
            </p>
            <Button onClick={close} className="mt-7 h-11 px-6">
              View remix
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const defaultCreateAllocation: Allocation[] = [
  { symbol: 'NVDA', company: 'NVIDIA', weight: 35, available: true },
  { symbol: 'MSFT', company: 'Microsoft', weight: 30, available: true },
  { symbol: 'META', company: 'Meta', weight: 20, available: true },
  { symbol: 'AMZN', company: 'Amazon', weight: 15, available: true },
];

function CreateView({
  publish,
  account,
  openAccount,
}: {
  publish: (idea: Idea) => void;
  account: RiffAccount | null;
  openAccount: () => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('AI EATS ENERGY');
  const [thesis, setThesis] = useState(
    'AI infrastructure could make electricity the next bottleneck.',
  );
  const [allocation, setAllocation] = useState(defaultCreateAllocation);
  const [published, setPublished] = useState(false);
  const labels = ['Idea', 'Allocation', 'Thesis', 'Preview'];
  if (!account) {
    return (
      <section className="mx-auto grid min-h-[calc(100dvh-160px)] max-w-2xl place-items-center px-5 py-16 text-center">
        <div>
          <p className="eyebrow text-primary">Create an idea</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,5rem)] font-semibold leading-[.9] tracking-[-.065em]">
            PUT YOUR NAME
            <br />
            BEHIND THE VIEW.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg leading-7 text-muted-foreground">
            Sign in first so authorship, future remixes and the idea’s track
            record stay attached to you.
          </p>
          <Button
            onClick={openAccount}
            className="mt-8 h-12 bg-foreground px-7 text-background"
          >
            Sign in with Base <ArrowRight />
          </Button>
        </div>
      </section>
    );
  }
  const commit = () => {
    const newIdea: Idea = {
      ...seedIdeas[0],
      id: `created-${Date.now()}`,
      name,
      description: thesis,
      thesis,
      allocation,
      creator: '@you',
      creatorName: 'You',
      createdAt: 'Just now',
      performance: 0,
      capital: 0,
      holders: 0,
      remixes: 0,
      lineage: [{ id: 'new', name, creator: '@you' }],
      version: 1,
    };
    publish(newIdea);
    setPublished(true);
  };
  if (published)
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-full bg-primary text-white">
          <Check />
        </div>
        <p className="eyebrow mt-8 text-primary">Idea published</p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,6rem)] font-semibold leading-[.9] tracking-[-.065em]">
          {name}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-xl leading-8 text-muted-foreground">
          Your thesis is now an executable social object, ready to be discovered
          and remixed.
        </p>
        <Button
          onClick={() => setPublished(false)}
          variant="outline"
          className="mt-8 h-12 px-6"
        >
          Create another
        </Button>
      </section>
    );
  return (
    <section className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-20">
      <p className="eyebrow text-primary">Create an idea</p>
      <div className="mt-4 grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside>
          <h1 className="text-5xl font-semibold leading-[.9] tracking-[-.06em]">
            BUILD IT LIKE A PLAYLIST.
          </h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            Name the belief. Choose the parts. Explain why it matters.
          </p>
          <ol className="mt-10 space-y-3">
            {labels.map((label, index) => (
              <li
                key={label}
                className={`flex items-center gap-3 text-sm ${step === index + 1 ? 'font-semibold text-foreground' : index + 1 < step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <span
                  className={`grid size-7 place-items-center rounded-full border ${index + 1 < step ? 'border-primary bg-primary text-white' : 'border-border'}`}
                >
                  {index + 1 < step ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </aside>
        <div className="border-t hairline pt-7">
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-semibold tracking-[-.045em]">
                What’s your idea?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Make the name memorable enough to share.
              </p>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value.toUpperCase())}
                maxLength={54}
                className="mt-8 h-16 text-xl font-semibold"
              />
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="mt-6 h-12 px-6"
              >
                Build the allocation <ArrowRight />
              </Button>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-semibold tracking-[-.045em]">
                Build the allocation
              </h2>
              <p className="mt-2 text-muted-foreground">
                Every edit redistributes the remainder. The total always stays
                at 100%.
              </p>
              <div className="mt-8">
                <AllocationEditor
                  allocation={allocation}
                  onChange={setAllocation}
                />
              </div>
              <div className="mt-7 flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="h-12"
                >
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="h-12 px-6">
                  Explain the thesis <ArrowRight />
                </Button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-semibold tracking-[-.045em]">
                Why do you believe this?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Write for someone deciding whether they agree—not for an
                algorithm.
              </p>
              <Textarea
                value={thesis}
                onChange={(event) => setThesis(event.target.value)}
                className="mt-8 min-h-44 text-lg leading-8"
              />
              <div className="mt-7 flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep(2)}
                  className="h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!thesis.trim()}
                  className="h-12 px-6"
                >
                  Preview <ArrowRight />
                </Button>
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-semibold tracking-[-.045em]">
                Ready to publish?
              </h2>
              <div className="mt-7 bg-foreground p-7 text-background">
                <p className="eyebrow text-white/45">New idea</p>
                <h3 className="mt-4 text-4xl font-semibold leading-[.95] tracking-[-.055em]">
                  {name}
                </h3>
                <p className="mt-4 max-w-xl text-lg leading-7 text-white/60">
                  {thesis}
                </p>
                <div className="mt-8">
                  <AllocationStrip allocation={allocation} dark />
                </div>
                <div className="mt-5 flex justify-between text-sm font-semibold text-white/70">
                  {allocation.map((item) => (
                    <span key={item.symbol}>
                      {item.symbol} {item.weight}%
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                Publishing records the canonical allocation and creates the root
                of a permanent lineage.
              </p>
              <div className="mt-7 flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep(3)}
                  className="h-12"
                >
                  Back
                </Button>
                <Button
                  onClick={commit}
                  className="h-12 bg-foreground px-7 text-background"
                >
                  Publish idea
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ActivityView({
  followedIdeas,
  followedCreators,
}: {
  followedIdeas: Idea[];
  followedCreators: string[];
}) {
  const baseEvents = [
    [
      'Sarah remixed AI EATS ENERGY.',
      'Created AI EATS ENERGY — NUCLEAR',
      '4m',
      GitFork,
    ],
    ['$4,200 entered your idea.', 'Across 63 new purchases', '2h', WalletCards],
    [
      'Your idea gained 17 new holders.',
      'AMERICAN REBUILD is accelerating',
      '5h',
      Users,
    ],
    [
      'Your remix is outperforming the original.',
      '+2.3% over the last month',
      '1d',
      LineChart,
    ],
    [
      'A new idea was created from your remix.',
      'The lineage now has three generations',
      '2d',
      Link2,
    ],
  ] as const;
  const followEvents: Array<[string, string, string, typeof Bookmark]> = [
    ...followedIdeas.map(
      (idea) =>
        [
          `You followed ${idea.name}.`,
          `New remixes and meaningful changes will appear here`,
          'now',
          Bookmark,
        ] as [string, string, string, typeof Bookmark],
    ),
    ...followedCreators.map(
      (creator) =>
        [
          `You followed ${creator}.`,
          `Their next investment idea will appear in Following`,
          'now',
          UserPlus,
        ] as [string, string, string, typeof Bookmark],
    ),
  ];
  const events = [...followEvents, ...baseEvents];
  return (
    <section className="mx-auto max-w-4xl px-5 py-14 md:px-8 md:py-20">
      <p className="eyebrow text-primary">Activity</p>
      <h1 className="mt-4 text-[clamp(3rem,7vw,6rem)] font-semibold leading-[.9] tracking-[-.065em]">
        WHAT CHANGED?
      </h1>
      <p className="mt-5 text-lg text-muted-foreground">
        Only events with meaning for your ideas and the people building on them.
      </p>
      <div className="mt-12 border-t hairline">
        {events.map(([title, detail, time, Icon]) => (
          <article
            key={title}
            className="grid grid-cols-[42px_1fr_auto] gap-4 border-b hairline py-6"
          >
            <span className="grid size-10 place-items-center rounded-full bg-white text-primary">
              <Icon className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
            </div>
            <time className="numeric text-sm text-muted-foreground">
              {time}
            </time>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileView({
  ideas,
  openIdea,
  account,
  openAccount,
  followingCount,
}: {
  ideas: Idea[];
  openIdea: (idea: Idea) => void;
  account: RiffAccount | null;
  openAccount: () => void;
  followingCount: number;
}) {
  if (!account) {
    return (
      <section className="mx-auto grid min-h-[calc(100dvh-160px)] max-w-2xl place-items-center px-5 py-16 text-center">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
            <CircleUserRound className="size-7" />
          </span>
          <p className="eyebrow mt-7 text-primary">Your creator identity</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,5rem)] font-semibold leading-[.9] tracking-[-.065em]">
            MAKE IDEAS.
            <br />
            BUILD A RECORD.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg leading-7 text-muted-foreground">
            Sign in to keep the ideas you own, publish and remix connected to
            one public profile.
          </p>
          <Button
            onClick={openAccount}
            className="mt-8 h-12 bg-foreground px-7 text-background"
          >
            Sign in with Base <ArrowRight />
          </Button>
        </div>
      </section>
    );
  }
  const created = ideas.filter((idea) => idea.creator === `@${account.handle}`);
  const initials = account.displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-14 md:px-8 md:py-20">
      <div className="grid gap-8 border-b hairline pb-12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <span className="grid size-16 place-items-center bg-foreground text-2xl font-semibold text-background">
            {initials || 'RI'}
          </span>
          <h1 className="mt-6 text-5xl font-semibold tracking-[-.06em]">
            @{account.handle}
          </h1>
          <p className="mt-3 max-w-lg text-lg leading-7 text-muted-foreground">
            {account.bio || `${account.displayName}'s investment ideas.`}
          </p>
        </div>
        <Button onClick={openAccount} variant="outline" className="h-11 px-5">
          Edit profile
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-y-6 border-b hairline py-7 md:grid-cols-4">
        {[
          ['Ideas', String(created.length)],
          ['Following', String(followingCount)],
          ['Remixes', '0'],
          ['Holders', '0'],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="eyebrow text-muted-foreground">{label}</span>
            <strong className="numeric mt-2 block text-2xl">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mt-12 flex gap-8 overflow-x-auto border-b hairline pb-4 text-sm font-semibold">
        <button>Created</button>
        <button className="text-muted-foreground">Owned</button>
        <button className="text-muted-foreground">Remixed</button>
        <button className="text-muted-foreground">Performance</button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3">
        {created.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onOpen={() => openIdea(idea)}
            onBuy={() => openIdea(idea)}
          />
        ))}
      </div>
      {created.length === 0 && (
        <div className="border-b hairline py-16 text-center">
          <p className="text-xl font-semibold">Your first idea starts here.</p>
          <p className="mt-2 text-muted-foreground">
            Turn a market belief into a basket people can understand and remix.
          </p>
        </div>
      )}
    </section>
  );
}

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
          execute: (input: unknown) => unknown;
        },
        options?: { signal?: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

export default function IdeaApp() {
  const [view, setView] = useState<View>('discover');
  const [ideas, setIdeas] = useState<Idea[]>(seedIdeas);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [buyIdea, setBuyIdea] = useState<Idea | null>(null);
  const [remixIdea, setRemixIdea] = useState<Idea | null>(null);
  const [toast, setToast] = useState('');
  const [account, setAccount] = useState<RiffAccount | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [followedIdeas, setFollowedIdeas] = useState<Set<string>>(new Set());
  const [followedCreators, setFollowedCreators] = useState<Set<string>>(
    new Set(),
  );
  const updateAccount = (next: RiffAccount | null) => {
    setAccount(next);
    if (!next) {
      setFollowedIdeas(new Set());
      setFollowedCreators(new Set());
      return;
    }
    void loadRiffSession()
      .then((session) => {
        setAccount(session.account);
        setFollowedIdeas(new Set(session.followedIdeas));
        setFollowedCreators(new Set(session.followedCreators));
      })
      .catch(() => undefined);
  };
  const openIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    history.replaceState(null, '', `#idea/${idea.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const navigate = (next: View) => {
    setView(next);
    setSelectedIdea(null);
    history.replaceState(
      null,
      '',
      next === 'discover' ? location.pathname : `#${next}`,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const publish = (idea: Idea) => {
    const attributed = account
      ? {
          ...idea,
          creator: `@${account.handle}`,
          creatorName: account.displayName,
          lineage: idea.lineage.map((node, index) =>
            index === idea.lineage.length - 1 && node.creator === '@you'
              ? { ...node, creator: `@${account.handle}` }
              : node,
          ),
        }
      : idea;
    setIdeas((current) => [attributed, ...current]);
    setSelectedIdea(attributed);
    setView('discover');
  };
  const share = async (idea: Idea) => {
    const url = `${location.origin}${location.pathname}#idea/${idea.id}`;
    const hasNativeShare = 'share' in navigator;
    try {
      if (hasNativeShare)
        await navigator.share({
          title: idea.name,
          text: idea.description,
          url,
        });
      else await navigator.clipboard.writeText(url);
      setToast(hasNativeShare ? 'Share sheet opened.' : 'Idea link copied.');
    } catch {
      setToast('Sharing cancelled.');
    }
    window.setTimeout(() => setToast(''), 2400);
  };
  const toggleIdeaFollow = async (idea: Idea) => {
    if (!account) {
      setAccountOpen(true);
      return;
    }
    const willFollow = !followedIdeas.has(idea.id);
    setFollowedIdeas((current) => {
      const next = new Set(current);
      if (willFollow) next.add(idea.id);
      else next.delete(idea.id);
      return next;
    });
    setToast(
      willFollow ? `Following ${idea.name}.` : `Unfollowed ${idea.name}.`,
    );
    window.setTimeout(() => setToast(''), 2400);
    try {
      await setRiffFollow('idea', idea.id, willFollow);
    } catch (reason) {
      setFollowedIdeas((current) => {
        const next = new Set(current);
        if (willFollow) next.delete(idea.id);
        else next.add(idea.id);
        return next;
      });
      setToast(
        reason instanceof Error
          ? reason.message
          : 'We could not update following.',
      );
      window.setTimeout(() => setToast(''), 3200);
    }
  };
  const toggleCreatorFollow = async (creator: string) => {
    if (!account) {
      setAccountOpen(true);
      return;
    }
    const willFollow = !followedCreators.has(creator);
    setFollowedCreators((current) => {
      const next = new Set(current);
      if (willFollow) next.add(creator);
      else next.delete(creator);
      return next;
    });
    setToast(willFollow ? `Following ${creator}.` : `Unfollowed ${creator}.`);
    window.setTimeout(() => setToast(''), 2400);
    try {
      await setRiffFollow('creator', creator, willFollow);
    } catch (reason) {
      setFollowedCreators((current) => {
        const next = new Set(current);
        if (willFollow) next.delete(creator);
        else next.add(creator);
        return next;
      });
      setToast(
        reason instanceof Error
          ? reason.message
          : 'We could not update following.',
      );
      window.setTimeout(() => setToast(''), 3200);
    }
  };
  useEffect(() => {
    let active = true;
    void loadRiffSession()
      .then((session) => {
        if (!active) return;
        setAccount(session.account);
        setFollowedIdeas(new Set(session.followedIdeas));
        setFollowedCreators(new Set(session.followedCreators));
      })
      .catch(() => undefined);
    const id = location.hash.match(/^#idea\/(.+)$/)?.[1];
    if (id) {
      const idea = seedIdeas.find((item) => item.id === id);
      if (idea) setSelectedIdea(idea);
    }
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'open_investment_idea',
          title: 'Open investment idea',
          description:
            'Open an investment idea by its stable idea ID in the visible Riff interface.',
          inputSchema: {
            type: 'object',
            properties: { ideaId: { type: 'string' } },
            required: ['ideaId'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute: (input) => {
            const ideaId =
              typeof input === 'object' && input && 'ideaId' in input
                ? String((input as { ideaId: unknown }).ideaId)
                : '';
            const idea = ideas.find((item) => item.id === ideaId);
            if (!idea) throw new Error('Idea not found');
            openIdea(idea);
            return { id: idea.id, name: idea.name, status: 'opened' };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [ideas]);
  return (
    <main className="min-h-screen pb-28 md:pb-0">
      <AppHeader
        view={view}
        navigate={navigate}
        account={account}
        openAccount={() => setAccountOpen(true)}
      />
      {selectedIdea ? (
        <IdeaDetail
          idea={selectedIdea}
          onBack={() => {
            setSelectedIdea(null);
            history.replaceState(null, '', location.pathname);
          }}
          onBuy={() => setBuyIdea(selectedIdea)}
          onRemix={() =>
            account ? setRemixIdea(selectedIdea) : setAccountOpen(true)
          }
          onShare={() => share(selectedIdea)}
          ideaFollowed={followedIdeas.has(selectedIdea.id)}
          creatorFollowed={followedCreators.has(selectedIdea.creator)}
          onFollowIdea={() => toggleIdeaFollow(selectedIdea)}
          onFollowCreator={() => toggleCreatorFollow(selectedIdea.creator)}
        />
      ) : view === 'discover' ? (
        <Discover
          ideas={ideas}
          onOpen={openIdea}
          onBuy={setBuyIdea}
          onCreate={() => navigate('create')}
          followedIdeas={followedIdeas}
          followedCreators={followedCreators}
        />
      ) : view === 'create' ? (
        <CreateView
          publish={publish}
          account={account}
          openAccount={() => setAccountOpen(true)}
        />
      ) : view === 'activity' ? (
        <ActivityView
          followedIdeas={ideas.filter((idea) => followedIdeas.has(idea.id))}
          followedCreators={[...followedCreators]}
        />
      ) : (
        <ProfileView
          ideas={ideas}
          openIdea={openIdea}
          account={account}
          openAccount={() => setAccountOpen(true)}
          followingCount={followedIdeas.size + followedCreators.size}
        />
      )}
      <MobileNav view={view} navigate={navigate} />
      <AccountDialog
        open={accountOpen}
        close={() => setAccountOpen(false)}
        account={account}
        onAccount={updateAccount}
      />
      <BuyDialog
        idea={buyIdea}
        open={!!buyIdea}
        close={() => setBuyIdea(null)}
      />
      <RemixDialog
        idea={remixIdea}
        open={!!remixIdea}
        close={() => setRemixIdea(null)}
        publish={publish}
      />
      <output
        aria-live="polite"
        className={`fixed bottom-28 left-1/2 z-50 -translate-x-1/2 bg-foreground px-4 py-3 text-sm text-background shadow-xl transition md:bottom-6 ${toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
      >
        <span className="flex items-center gap-2">
          <Copy className="size-4" />
          {toast}
        </span>
      </output>
    </main>
  );
}
