import type { Idea } from '@/types';

const allocations = {
  energy: [
    { symbol: 'NVDA', company: 'NVIDIA', weight: 35, available: true },
    { symbol: 'VST', company: 'Vistra', weight: 30, available: false },
    { symbol: 'CEG', company: 'Constellation Energy', weight: 20, available: false },
    { symbol: 'GEV', company: 'GE Vernova', weight: 15, available: false },
  ],
  ai: [
    { symbol: 'NVDA', company: 'NVIDIA', weight: 30, available: true },
    { symbol: 'MSFT', company: 'Microsoft', weight: 25, available: true },
    { symbol: 'META', company: 'Meta', weight: 25, available: true },
    { symbol: 'AMZN', company: 'Amazon', weight: 20, available: true },
  ],
  rebuild: [
    { symbol: 'CAT', company: 'Caterpillar', weight: 30, available: false },
    { symbol: 'VMC', company: 'Vulcan Materials', weight: 25, available: false },
    { symbol: 'GEV', company: 'GE Vernova', weight: 25, available: false },
    { symbol: 'ETN', company: 'Eaton', weight: 20, available: false },
  ],
  space: [
    { symbol: 'SPCX', company: 'SpaceX', weight: 35, available: true },
    { symbol: 'LMT', company: 'Lockheed Martin', weight: 25, available: false },
    { symbol: 'ASTS', company: 'AST SpaceMobile', weight: 20, available: false },
    { symbol: 'IRDM', company: 'Iridium', weight: 20, available: false },
  ],
};

const seeds = [
  ['ai-eats-energy', 'AI EATS ENERGY', 'AI infrastructure could make electricity the next bottleneck.', 'The compute buildout is becoming a power story. This idea pairs the companies creating AI demand with the utilities and grid equipment businesses positioned to supply it.', '@emeka', 'Emeka Okafor', 17.8, 82400, 1240, 38, 'AI × Energy', allocations.energy],
  ['the-ai-stack', 'THE AI STACK', 'Own the full chain behind every model run.', 'The visible applications change quickly. The semiconductor, cloud and networking layer underneath them compounds with every new workload.', '@mina', 'Mina Park', 12.4, 141200, 2118, 22, 'Technology', allocations.ai],
  ['american-rebuild', 'AMERICAN REBUILD', 'The physical economy is being asked to do more.', 'Grid upgrades, reshoring and public infrastructure spending converge on a group of industrial businesses with scarce capacity.', '@noahbuilds', 'Noah Williams', 9.6, 67850, 892, 17, 'Infrastructure', allocations.rebuild],
  ['space-infrastructure', 'SPACE INFRASTRUCTURE', 'The picks and shovels of a busier orbit.', 'Launch gets attention, but communications, components and mission infrastructure may capture steadier value as access to orbit expands.', '@maya', 'Maya Chen', 22.1, 46300, 701, 31, 'Frontier', allocations.space],
  ['boring-four', 'THE BORING FOUR', 'Quiet businesses with loud cash flows.', 'A deliberately unglamorous mix of payments, waste, insurance and rail built for durable compounding rather than headlines.', '@claire', 'Claire Bell', 6.3, 96400, 1604, 12, 'Quality', allocations.rebuild],
  ['ai-power', 'AI + POWER', 'Compute growth meets a constrained grid.', 'A higher-conviction split between accelerators and power producers for investors who see electricity availability as the binding constraint.', '@sarah', 'Sarah Nwosu', 19.2, 75900, 1098, 44, 'AI × Energy', allocations.energy],
  ['defense-change', 'DEFENSE IN A CHANGING WORLD', 'Modern deterrence is becoming software-defined.', 'An allocation to established platforms and newer sensing, autonomy and space infrastructure providers.', '@leon', 'Leon Fischer', 11.7, 58800, 843, 19, 'Defense', allocations.space],
  ['everything-but-tesla', 'EVERYTHING BUT TESLA', 'Electrification without betting on one carmaker.', 'Grid hardware, power semiconductors, batteries and industrial automation capture the broader electrification buildout.', '@rhea', 'Rhea Kapoor', 8.8, 38600, 622, 28, 'Electrification', allocations.rebuild],
  ['nuclear-renaissance', 'NUCLEAR RENAISSANCE', 'Reliable power is strategic infrastructure again.', 'A focused expression of rising baseload demand through generation, fuel services and grid equipment.', '@sarah', 'Sarah Nwosu', 24.6, 123900, 1830, 51, 'Energy', allocations.energy],
  ['cloud-toll-roads', 'CLOUD TOLL ROADS', 'Every digital workload pays these operators.', 'A concentrated basket of cloud and connectivity infrastructure that benefits regardless of which application wins.', '@jonb', 'Jon Bell', 14.1, 112700, 1495, 14, 'Technology', allocations.ai],
  ['robots-at-work', 'ROBOTS AT WORK', 'Labor scarcity accelerates industrial automation.', 'The thesis connects automation hardware, electrification and the compute required to make machines more capable.', '@hana', 'Hana Lee', 7.9, 29400, 488, 23, 'Automation', allocations.rebuild],
  ['sovereign-compute', 'SOVEREIGN COMPUTE', 'Nations are treating compute like strategic capacity.', 'Domestic chips, cloud infrastructure and secure networking benefit as governments build independent AI capacity.', '@omar', 'Omar Haddad', 13.3, 53400, 730, 26, 'Technology', allocations.ai],
  ['new-grid', 'THE NEW GRID', 'Electrification requires a more intelligent network.', 'Generation alone is not enough. This idea focuses on the equipment and operators needed to move and manage more power.', '@david', 'David Adeyemi', 10.2, 41750, 677, 34, 'Infrastructure', allocations.rebuild],
  ['orbital-connectivity', 'ORBITAL CONNECTIVITY', 'Coverage is becoming an orbital problem.', 'Satellite communications and launch infrastructure can extend broadband where terrestrial networks remain uneconomic.', '@maya', 'Maya Chen', 16.5, 33200, 515, 21, 'Frontier', allocations.space],
  ['industrial-intelligence', 'INDUSTRIAL INTELLIGENCE', 'AI leaves the screen and enters the factory.', 'Compute, controls and electrification come together as industrial systems become more adaptive.', '@ari', 'Ari Morgan', 5.8, 21800, 374, 16, 'Automation', allocations.ai],
  ['energy-security', 'ENERGY SECURITY', 'Reliable domestic power is becoming national policy.', 'A balanced mix of generation and equipment for an era where energy abundance is economic and strategic advantage.', '@noahbuilds', 'Noah Williams', 8.1, 44600, 693, 29, 'Energy', allocations.energy],
] as const;

export const ideas: Idea[] = seeds.map((seed, index) => ({
  id: seed[0], name: seed[1], description: seed[2], thesis: seed[3], creator: seed[4], creatorName: seed[5],
  createdAt: `${index + 3} days ago`, performance: seed[6], capital: seed[7], holders: seed[8], remixes: seed[9], category: seed[10],
  allocation: seed[11].map((item) => ({ ...item })),
  sparkline: [42, 44, 43, 47, 49, 48, 53, 55, 54, 58, 61, 64].map((value, i) => value + ((index + i) % 4) - 1),
  lineage: index === 0 ? [{ id: 'ai-eats-energy', name: 'AI EATS ENERGY', creator: '@emeka' }] : index === 5 ? [{ id: 'ai-eats-energy', name: 'AI EATS ENERGY', creator: '@emeka' }, { id: 'ai-power', name: 'AI + POWER', creator: '@sarah' }] : [{ id: seed[0], name: seed[1], creator: seed[4] }],
  version: index === 5 ? 2 : 1,
  parentIdeaId: index === 5 ? 'ai-eats-energy' : undefined,
}));

export const featuredIdea = ideas[0];
