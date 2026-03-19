import type { AccountBase, AccountDetail } from "@/lib/db/queries";

// ─── Date helpers ──────────────────────────────────────────────────────────────
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// ─── Source pools ──────────────────────────────────────────────────────────────
const OWNERS = ["Sarah Chen", "Marcus Webb", "Priya Nair", "Jordan Lee", "Alex Torres", "Diana Osei"];

const COMPANY_NAMES: [string, string][] = [
  // [name, industry summary fragment]
  ["Acme Corp", "enterprise workflow automation software for mid-market B2B companies"],
  ["Globex Industries", "manufacturing conglomerate digitising its supply chain operations"],
  ["Initech Solutions", "IT consulting and managed services for small businesses"],
  ["Umbrella Health", "healthcare network coordinating patient engagement and compliance workflows"],
  ["Massive Dynamics", "financial services firm automating client reporting and portfolio analysis"],
  ["Pied Piper Tech", "fast-growing SaaS startup managing customer success workflows"],
  ["Soylent Foods", "consumer goods company on a basic plan with minimal usage"],
  ["Wonka Creative", "boutique marketing agency using the platform for client campaign reporting"],
  ["Aperture Science", "research and development organisation running experiments at scale"],
  ["Cyberdyne Systems", "industrial automation company deploying robotics integration modules"],
  ["Stark Industries", "advanced engineering firm piloting AI-driven process optimisation"],
  ["Wayne Enterprises", "conglomerate with multiple business units seeking unified reporting"],
  ["Veridian Dynamics", "biotech company managing clinical trial data workflows"],
  ["Oscorp Technologies", "pharmaceutical firm tracking regulatory compliance across departments"],
  ["LexCorp Solutions", "enterprise resource planning consultancy for mid-size manufacturers"],
  ["Weyland Corp", "aerospace and defence contractor managing complex project pipelines"],
  ["Tyrell Corp", "enterprise software vendor expanding its partner ecosystem"],
  ["Dharma Initiative", "research consortium tracking field data across distributed teams"],
  ["Wolfram & Hart", "professional services firm automating contract and matter management"],
  ["Prestige Worldwide", "media conglomerate centralising content analytics and distribution data"],
  ["Dunder Mifflin", "regional paper distributor digitising its order-to-cash workflows"],
  ["Sterling Cooper", "advertising agency managing campaign performance and client dashboards"],
  ["Hooli Technologies", "cloud infrastructure provider scaling developer collaboration tools"],
  ["Entourage Media", "talent management and entertainment agency tracking deal pipelines"],
  ["Virtucon International", "global manufacturing firm optimising logistics and procurement"],
  ["InGen Corporation", "bioengineering company managing specimen lifecycle and lab workflows"],
  ["Tesslayne Analytics", "data analytics consultancy building embedded BI for enterprise clients"],
  ["Bridgeway Capital", "asset management firm automating portfolio reporting and compliance"],
  ["Northstar Insurance", "specialty insurer digitising claims workflows and underwriting reviews"],
  ["Pinnacle Health Group", "multi-site clinic network improving patient communication workflows"],
  ["Atlas Logistics", "third-party logistics provider managing carrier and warehouse operations"],
  ["Meridian Retail", "omnichannel retailer integrating POS data with CRM and support"],
  ["Cobalt Energy", "renewable energy company tracking project delivery and site operations"],
  ["Silverton Bank", "community bank modernising its SMB lending and onboarding workflows"],
  ["Cardinal Learning", "ed-tech platform tracking student engagement and outcomes at scale"],
  ["Zenith Publishing", "media house automating editorial workflows and ad performance reporting"],
  ["Horizon Real Estate", "property management group digitising lease and tenant operations"],
  ["Vector Security", "managed security services provider with SIEM and compliance workflows"],
  ["Summit Healthcare", "hospital network rolling out digital patient intake and records"],
  ["Apex Consulting", "strategy consultancy tracking project margins and resource utilisation"],
  ["Bluewave Software", "ISV building embedded analytics for its SaaS product portfolio"],
  ["Cascade Financial", "wealth management firm generating personalised client reporting"],
  ["Crestline Pharma", "specialty pharma company managing regulatory submissions and quality"],
  ["Delta Force Staffing", "workforce solutions firm automating recruiter workflows and placements"],
  ["Echo Media Group", "digital publisher consolidating audience analytics across properties"],
  ["Falcon Aerospace", "engineering contractor managing multi-programme milestone tracking"],
  ["Granite Construction", "commercial construction firm tracking project cost and schedule"],
  ["Harbor View Capital", "private equity firm managing portfolio company performance data"],
  ["Iron Bridge Tech", "industrial IoT company connecting sensor data to operational dashboards"],
  ["Jasper Creative", "full-service creative agency tracking retainer performance and billing"],
  ["Kingston Biotech", "genomics startup managing research collaboration and IP workflows"],
  ["Lakeshore Retail", "specialty retailer rolling out loyalty and CRM across 80+ stores"],
  ["Maven Analytics", "BI consultancy building custom dashboards for enterprise finance teams"],
  ["Nexus Software", "horizontal SaaS company expanding its enterprise tier with advanced roles"],
  ["Orbit Communications", "telecom provider automating customer onboarding and churn workflows"],
  ["Pacific Ventures", "venture-backed startup portfolio managing operations across six entities"],
  ["Quantum Devices", "electronics manufacturer running lean ops with tight quality controls"],
  ["Raven Technologies", "cybersecurity firm tracking SOC workflows and incident response"],
  ["Sapphire HR", "HR technology provider managing payroll integration and benefits workflows"],
  ["Titan Energy", "power utility modernising its field service and asset management platform"],
  ["Ultratech Manufacturing", "precision manufacturer integrating quality and supply chain data"],
  ["Vertex Capital", "investment platform managing LP reporting and compliance workflows"],
  ["Walden Education", "higher education institution digitising student success workflows"],
  ["Xenon Retail Group", "multi-brand retailer tracking store performance and inventory data"],
  ["Yellowstone Media", "streaming platform managing content licensing and royalty reporting"],
  ["Zephyr Logistics", "freight broker automating load matching and carrier communication"],
  ["Albatross Airlines", "regional carrier digitising ground operations and crew scheduling"],
  ["Borealis Energy", "offshore energy company managing project risk and regulatory filings"],
  ["Callisto Medical", "med-tech company tracking device lifecycle and service workflows"],
  ["Delphi Automotive", "auto-parts distributor connecting inventory to dealership CRM data"],
  ["Endeavour Mining", "mining company managing permit workflows and environmental compliance"],
  ["Fathom Analytics", "product analytics SaaS company expanding its enterprise reporting tier"],
  ["Galileo Finance", "fintech startup managing reconciliation and regulatory reporting"],
  ["Harvest Agriculture", "agri-tech company tracking crop yield data and supply chain inputs"],
  ["Indigo Architecture", "architecture and engineering firm managing project delivery workflows"],
  ["Juniper Networks Group", "networking consultancy deploying infrastructure for enterprise clients"],
  ["Kinetic Sports", "sports media platform managing athlete data and sponsorship reporting"],
  ["Lynx Healthcare", "telehealth startup scaling patient intake and care coordination"],
  ["Monarch Retail", "e-commerce brand managing multi-channel fulfilment and returns"],
  ["Nautilus Research", "oceanographic institute managing field data and publication workflows"],
  ["Obsidian Security", "penetration testing firm tracking client engagement and deliverables"],
  ["Paragon Legal", "law firm automating matter management and billing reconciliation"],
  ["Quasar Technology", "hardware startup integrating device telemetry with cloud dashboards"],
  ["Redwood Financial", "regional bank automating commercial lending and risk workflows"],
  ["Solaris Energy Systems", "solar installer managing project pipeline and installation data"],
  ["Tundra Media", "podcast network managing ad inventory and host payment workflows"],
  ["Ursa Mining", "mineral exploration company managing drill data and resource planning"],
  ["Vanguard Consulting", "digital transformation consultancy tracking delivery and outcomes"],
  ["Westport Insurance", "specialty insurer streamlining claims intake and adjuster workflows"],
  ["Xero Robotics", "warehouse automation company connecting robot data to ERP systems"],
  ["Yonder Travel", "travel management company automating booking data and expense reporting"],
  ["Zenova Healthcare", "home health agency managing caregiver scheduling and compliance"],
  ["Aether Software", "developer-tools company building CI/CD integrations for enterprise teams"],
  ["Brilliance AI", "ML platform startup expanding into enterprise model governance workflows"],
  ["Citadel Financial", "hedge fund tracking risk and performance reporting across strategies"],
  ["Dragonfly Biotech", "cell therapy company managing clinical data and trial documentation"],
  ["Ember Analytics", "marketing attribution SaaS expanding from SMB to mid-market"],
  ["Foundry Media", "content production house managing rights and distribution workflows"],
  ["Glyph Technologies", "font and design software company scaling its enterprise licensing"],
  ["Helios Energy", "EV charging network managing fleet and station performance data"],
  ["Ignite Learning", "corporate training platform tracking learner progress and completion"],
  ["Javelin Logistics", "last-mile delivery company managing driver routing and proof of delivery"],
  ["Kelvin Systems", "HVAC and building systems integrator tracking service and maintenance"],
  ["Lighthouse Media", "OOH advertising company managing campaign delivery and billing"],
  ["Meteor Technology", "real-time data platform scaling its enterprise streaming tier"],
  ["Nimbus Cloud", "MSP managing multi-cloud infrastructure for enterprise clients"],
  ["Opal Jewellery", "luxury retailer digitising client relationship and high-value service data"],
  ["Prism Analytics", "customer data platform expanding with journey analytics modules"],
  ["Quill Publishing", "academic publisher managing peer review and journal workflows"],
  ["Radiant Solar", "community solar provider managing subscriber billing and site data"],
  ["Saber Defence", "defence contractor tracking programme milestones and compliance"],
  ["Terra Agriculture", "precision farming company connecting field sensors to agronomy tools"],
  ["Umbra Space", "satellite imagery company managing data licensing and delivery workflows"],
  ["Vortex Security", "physical security integrator tracking installations and SLAs"],
  ["Wildfire Media", "social media agency managing content calendars and client reporting"],
  ["Xenith Pharma", "specialty pharma firm managing drug lifecycle and quality data"],
  ["Yeti Outdoor", "outdoor gear retailer digitising wholesale and rep management"],
  ["Zinc Software", "DevOps tooling company expanding to enterprise with RBAC and audit logs"],
  ["Alpine Ventures", "early-stage VC managing portfolio metrics and LP communications"],
  ["Bastion Security", "enterprise cybersecurity firm managing vulnerability programme workflows"],
  ["Clarity Health", "digital health startup tracking patient outcomes and clinician workflows"],
  ["Dusk Media", "performance marketing agency managing paid channel data and client ROI"],
  ["Element Materials", "testing and inspection company managing laboratory and certification data"],
  ["Frontier Telecom", "rural broadband provider managing installation and support workflows"],
  ["Genesis Biotech", "bioprocessing company managing batch records and regulatory submissions"],
  ["Helix HR Tech", "workforce analytics platform expanding into enterprise compensation modules"],
  ["Iris Automation", "drone software company managing fleet operations and compliance filings"],
  ["Junction Retail", "grocery chain digitising supplier relationships and promotion planning"],
  ["Kestrel Aerospace", "satellite component manufacturer managing production and test workflows"],
  ["Lagoon Media", "OTT streaming service managing content rights and subscriber analytics"],
  ["Mirage Software", "low-code automation platform scaling with enterprise governance features"],
  ["Neon Analytics", "product-led growth analytics tool expanding to enterprise dashboards"],
  ["Onyx Capital", "family office managing investment monitoring and reporting workflows"],
  ["Paladin Defence", "government contractor managing programme deliverables and compliance"],
  ["Quantum Health", "digital therapeutics company tracking patient adherence and outcomes"],
  ["Reef Marine", "aquaculture company managing stock, feed, and harvest data workflows"],
  ["Spectra Imaging", "medical imaging company managing device fleet and maintenance SLAs"],
  ["Thornfield Legal", "large law firm automating e-discovery and document review workflows"],
  ["Uplift EdTech", "K-12 curriculum platform tracking district adoption and learner data"],
  ["Velox Logistics", "express freight operator managing shipment visibility and SLA compliance"],
  ["Waverly Finance", "credit union modernising its member onboarding and lending workflows"],
  ["Xerus Technology", "embedded software company managing firmware release and QA workflows"],
  ["Yarrow Health", "mental health platform managing practitioner scheduling and billing"],
  ["Zirconia Materials", "advanced ceramics manufacturer tracking quality and supply chain"],
  ["Andromeda Capital", "growth equity firm managing portfolio value creation workflows"],
  ["Breaker Media", "sports analytics company tracking athlete data and broadcast rights"],
  ["Cascade Biotech", "CDMO managing client project workflows and regulatory timelines"],
  ["Drifter Apparel", "DTC fashion brand managing influencer partnerships and fulfilment data"],
  ["Equinox Energy", "energy trading firm managing position data and risk reporting"],
  ["Flare Security", "cloud security startup expanding to enterprise with CSPM features"],
  ["Gravity Software", "accounting software company targeting mid-market with integrations"],
  ["Harbour Health", "occupational health provider managing employer contract and clinic data"],
  ["Infineon Systems", "semiconductor company managing design-to-production workflow data"],
  ["Jolt EV", "electric vehicle fleet management company scaling enterprise deployments"],
  ["Kraken Analytics", "fraud detection platform expanding from fintech to enterprise banking"],
  ["Lattice Materials", "advanced materials startup managing IP and commercialisation workflows"],
  ["Mango Media", "influencer marketing platform managing creator contracts and payments"],
  ["Nimble Retail", "micro-fulfilment startup managing warehouse and last-mile operations"],
  ["Outpost Security", "physical access control company managing installations and maintenance"],
  ["Phoenix Aerospace", "MRO services company managing aircraft maintenance and part sourcing"],
  ["Quorum Legal", "litigation support firm managing case data and e-discovery workflows"],
  ["Rift Analytics", "spatial analytics SaaS company targeting retail and real estate clients"],
  ["Solstice Energy", "utility-scale wind operator managing asset performance and compliance"],
  ["Tungsten Finance", "factoring company managing invoice finance and risk workflows"],
  ["Unum Healthcare", "benefits administration platform managing enrollment and claims data"],
  ["Velvet Media", "luxury brand marketing agency managing creative delivery and reporting"],
  ["Whitewater Tech", "developer platform startup scaling enterprise SSO and audit log features"],
  ["Xylem Analytics", "water utility analytics company managing network and quality data"],
  ["Yellowbird HR", "contingent workforce platform managing contractor onboarding and billing"],
  ["Zeal Commerce", "e-commerce enablement platform managing catalogue and fulfilment data"],
  ["Acacia Partners", "management consulting firm tracking client engagement and delivery"],
  ["Birch Software", "project management SaaS expanding with resource and portfolio planning"],
  ["Cedar Networks", "SD-WAN provider managing enterprise network performance and billing"],
  ["Dune Analytics", "on-chain analytics platform expanding to enterprise compliance tooling"],
  ["Eon Technology", "IoT platform for smart buildings managing device and energy data"],
  ["Fern Education", "professional certification body managing member and exam workflows"],
  ["Gilt Capital", "secondary market investment platform managing trade and settlement data"],
  ["Halo Defence", "unmanned systems company managing programme milestones and compliance"],
  ["Ivory Finance", "insurance analytics platform managing policy and claims data workflows"],
  ["Jade Media", "digital out-of-home company managing display network and ad campaigns"],
  ["Aria Technologies", "conversational AI company managing enterprise deployment and support workflows"],
  ["Basalt Energy", "geothermal energy company managing plant operations and regulatory filings"],
  ["Crux Analytics", "supply chain analytics platform expanding into enterprise demand planning"],
  ["Delphi Health", "care navigation platform managing member engagement and referral workflows"],
  ["Epoch Software", "developer productivity company scaling enterprise SSO and audit features"],
  ["Fossa Legal", "open-source compliance platform managing licence and risk workflows"],
  ["Gust Finance", "SMB lending platform automating credit decisioning and portfolio management"],
  ["Helion Energy", "fusion energy company managing engineering programme and compliance data"],
  ["Ionic Commerce", "headless commerce platform managing catalogue and checkout integration data"],
  ["Jira Systems", "field service management company tracking technician dispatch and SLAs"],
  ["Knox Security", "hardware security company managing device provisioning and fleet data"],
  ["Lumen Photonics", "optical networking company managing deployment and support workflows"],
  ["Morph Analytics", "behavioural analytics platform expanding from product to enterprise BI"],
  ["Nova Biotech", "diagnostics company managing instrument fleet and service contract workflows"],
  ["Onyx Retail Tech", "retail execution platform managing merchandising and compliance audits"],
  ["Pulsar AI", "NLP platform company managing enterprise model deployment and governance"],
  ["Quorum Health", "population health company managing care programme and outcomes workflows"],
  ["Ridgeline Finance", "investment management company managing compliance and reporting workflows"],
  ["Sigma Analytics", "data observability platform expanding to enterprise data quality management"],
  ["Tidal Media", "audio streaming company managing rights, royalties, and creator payout workflows"],
];

const CONTACT_FIRST = ["James", "Maria", "Chen", "Priya", "Marcus", "Laura", "Tom", "Diana", "Alan", "Sophie", "Raj", "Emma", "Kevin", "Fatima", "Ben", "Clara", "David", "Nina", "Chris", "Victor", "Tara", "Angela", "Leon", "Richard", "Monica", "Greg", "Joanna", "Elena", "Nathan", "Amara", "Lisa", "Samuel", "Grace", "Oliver", "Paul", "Rachel", "Carlos", "Mei", "Andre", "Yuki", "Hassan", "Zoe", "Patrick", "Anita", "Derek", "Simone", "Omar", "Leila", "Flynn", "Maya"];
const CONTACT_LAST = ["Martinez", "Chen", "Webb", "Nair", "Lee", "Torres", "Fischer", "Okafor", "Singh", "Park", "Russo", "Adeyemi", "Kim", "Stein", "Green", "Walsh", "Cross", "Zhou", "Osei", "Tran", "Rivera", "Hunt", "Marshall", "Moran", "Davis", "Patel", "Al-Hassan", "Voss", "Hall", "Cooper", "Bucket", "Beauregarde", "Bloom", "Hendricks", "Milton", "Brown", "Wilson", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Garcia", "Rodriguez", "Lewis", "Robinson", "Walker", "Young"];
const TITLES = ["CEO", "CTO", "CFO", "COO", "VP Operations", "VP Technology", "VP Sales", "Head of IT", "IT Director", "Data Officer", "Product Manager", "Enterprise Architect", "Security Lead", "Finance Director", "Operations Lead", "Head of Analytics", "Legal Counsel", "Digital Transformation Lead", "Head of Customer Success", "Engineering Manager", "Chief Digital Officer", "Head of Finance", "Procurement Director", "Compliance Director", "Head of Marketing"];

const MEETING_TITLES = [
  "QBR — Growth Review", "Executive alignment call", "Technical scoping session", "Product roadmap walkthrough",
  "Compliance module review", "Security team deep-dive", "Champion call — VP Operations", "Deal review — Legal + Procurement",
  "Success review — Q2 usage", "Intro to Enterprise features", "Analytics dashboard demo", "Renewal discussion",
  "Onboarding progress check-in", "Stakeholder alignment", "Platform integration review", "Expansion planning session",
  "API capability walkthrough", "Reporting requirements review", "Steering committee — roadmap", "Business value review",
  "Contract negotiation call", "Executive sponsor check-in", "IT + Security review", "User training session",
  "Kickoff meeting — new module", "Pipeline review with champion", "Usage and adoption review", "Discovery call",
];

const DEAL_STAGES = ["Proposal", "Negotiation", "Discovery", "Legal Review", "Verbal Commit", "Procurement", "Technical Validation"];
const DEAL_TYPES = ["Enterprise Expansion", "Seat Upsell", "Add-on Module", "Annual Renewal", "Enterprise Plus Upgrade", "Analytics Pro", "Compliance Module", "Reporting Suite", "Growth Plan Upgrade", "Platform Licence", "Professional Services", "3-Year Renewal"];

const POSITIVE_SUMMARIES = [
  "The team expressed great value from the automation module and called it a significant improvement over their previous process. They want to explore API access for a custom reporting dashboard and mentioned they love the integration with their CRM.",
  "Excellent meeting — the executive sponsor confirmed strong internal support for expansion. The platform has delivered clear success so far and they are excited about the roadmap for the next quarter.",
  "The customer highlighted the value of automated reporting and compliance workflows. They are impressed with the progress and want to roll out to additional teams. They asked about SSO and permission management for new users.",
  "Strong engagement throughout — the champion confirmed the platform has improved their team productivity by a measurable margin. They are keen to upgrade and discussed timeline for moving to the enterprise tier.",
  "The compliance team praised the workflow automation as a major time-saver. They raised questions about API integrations with their ERP and expressed excitement about the upcoming analytics features.",
  "The CDO confirmed executive buy-in for the renewal. Success has been clear and they want to extend to all departments by Q3. The platform is now considered mission-critical for their operations.",
  "Tara walked through their reporting needs and was enthusiastic about the dashboard customisation. The team highlighted the value of automated exports and asked about role-based access for different departments.",
  "Richard confirmed the platform has been a great fit for their customer success team. Monica raised questions about API integrations for internal tooling and is excited about the enterprise roadmap.",
  "The IT team completed their security review successfully. Nathan confirmed the platform meets all their compliance requirements and they want to proceed with the SSO rollout for 300+ users.",
  "Excellent business review — the VP confirmed they love the workflow automation and want to expand usage across two additional business units. Budget has been approved internally.",
];

const NEGATIVE_SUMMARIES = [
  "The customer expressed frustration with slow onboarding and an unresolved bug in the integration with their ticketing system. The platform feels confusing and they mentioned considering alternatives if things don't improve.",
  "Greg raised concerns about performance issues affecting their team's productivity. The integration has been broken for two weeks and the support response has been slow. They are very unhappy with the current situation.",
  "The call surfaced significant issues — the customer said their team is struggling to adopt the platform and the onboarding was confusing. They threatened to cancel if their support ticket isn't resolved within the week.",
  "Joanna escalated a data quality issue that has impacted their monthly reporting cycle. The team is frustrated and said the platform is not meeting expectations. They want a resolution plan within 48 hours.",
  "The customer mentioned they are evaluating competitors due to slow feature delivery. The integration with their legacy system is still broken after three months and there has been no clear resolution timeline provided.",
];

const NEUTRAL_SUMMARIES = [
  "Discussed the current deployment and reviewed feature usage statistics. The customer is in steady-state and has no immediate expansion requests. They asked about the product roadmap for the coming two quarters.",
  "Routine check-in covering platform adoption and upcoming renewal terms. No urgent issues raised. The team is using the platform as expected and mentioned they may need additional training for new hires.",
  "The customer reviewed their current usage and acknowledged the platform is meeting basic needs. They are not actively looking to expand but are open to learning more about advanced features at a future date.",
  "Standard account review — usage is stable and the team is satisfied with day-to-day operations. No immediate expansion interest was flagged but they asked to be kept informed about upcoming integrations.",
  "The IT lead walked through current deployment and noted some minor configuration changes needed. The team is content but not actively engaged with new features. They requested updated documentation.",
];

// ─── Seeded pseudo-random (deterministic per-index) ───────────────────────────
function rng(seed: number, max: number) {
  const x = Math.sin(seed + 1) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

// ─── Profile types determine score tier ───────────────────────────────────────
// 0 = high-expansion, 1 = needs-follow-up, 2 = at-risk, 3 = low-activity
const PROFILES: number[] = [];
for (let i = 0; i < 200; i++) {
  if (i < 40) PROFILES.push(0);       // 40 high-expansion
  else if (i < 95) PROFILES.push(1);  // 55 needs-follow-up
  else if (i < 135) PROFILES.push(2); // 40 at-risk
  else PROFILES.push(3);              // 65 low-activity
}
// Shuffle with seeded algorithm
for (let i = PROFILES.length - 1; i > 0; i--) {
  const j = rng(i * 7, i + 1);
  [PROFILES[i], PROFILES[j]] = [PROFILES[j], PROFILES[i]];
}

function buildContacts(i: number, profile: number) {
  const count = profile === 0 ? 8 + rng(i * 3, 5) : profile === 1 ? 4 + rng(i * 3, 4) : profile === 2 ? 2 + rng(i * 3, 2) : 1 + rng(i * 3, 2);
  const contacts = [];
  for (let c = 0; c < count; c++) {
    const fi = rng(i * 13 + c, CONTACT_FIRST.length);
    const li = rng(i * 17 + c, CONTACT_LAST.length);
    const ti = rng(i * 19 + c, TITLES.length);
    const name = `${CONTACT_FIRST[fi]} ${CONTACT_LAST[li]}`;
    const email = `${CONTACT_FIRST[fi].toLowerCase()}.${CONTACT_LAST[li].toLowerCase()}@demo${i + 1}.com`;
    const isEngaged = profile === 0 ? c < count - 1 : profile === 1 ? c < Math.floor(count / 2) + 1 : c === 0;
    const engagementLabel = profile === 0 ? (c < 3 ? "Active" : "Engaged") : profile === 1 ? (c < 2 ? "Active" : c < 4 ? "Engaged" : "Occasional") : profile === 2 ? (c === 0 ? "Churned" : "Inactive") : "Inactive";
    const lastActivityAt = isEngaged && profile < 2 ? daysAgo(rng(i * 23 + c, 28) + 1) : undefined;
    contacts.push({ id: `c-${String(i + 1).padStart(3, "0")}-${c}`, name, email, title: TITLES[ti], engagement: engagementLabel, lastActivityAt });
  }
  return contacts;
}

function buildMeetings(i: number, profile: number) {
  const recentCount = profile === 0 ? 3 + rng(i * 5, 2) : profile === 1 ? 1 + rng(i * 5, 2) : profile === 2 ? rng(i * 5, 2) : 0;
  const oldCount = profile === 0 ? 1 : profile === 1 ? 1 : 0;
  const meetings = [];
  for (let m = 0; m < recentCount; m++) {
    const ti = rng(i * 11 + m, MEETING_TITLES.length);
    const oi = rng(i * 7 + m, OWNERS.length);
    meetings.push({ id: `mtg-${String(i + 1).padStart(3, "0")}-r${m}`, title: MEETING_TITLES[ti], when: daysAgo(rng(i * 29 + m, 27) + 2), ownerName: OWNERS[oi] });
  }
  for (let m = 0; m < oldCount; m++) {
    const ti = rng(i * 11 + m + 10, MEETING_TITLES.length);
    const oi = rng(i * 7 + m + 10, OWNERS.length);
    meetings.push({ id: `mtg-${String(i + 1).padStart(3, "0")}-o${m}`, title: MEETING_TITLES[ti], when: monthsAgo(2 + rng(i * 31 + m, 3)), ownerName: OWNERS[oi] });
  }
  return meetings;
}

function buildDeals(i: number, profile: number) {
  const count = profile === 0 ? 2 + rng(i * 3, 2) : profile === 1 ? 1 + rng(i * 3, 1) : 0;
  const deals = [];
  for (let d = 0; d < count; d++) {
    const si = rng(i * 13 + d, DEAL_STAGES.length);
    const ti = rng(i * 17 + d, DEAL_TYPES.length);
    const baseAmt = profile === 0 ? 30_000 : 10_000;
    const amount = baseAmt + rng(i * 23 + d, 70_000);
    deals.push({
      id: `deal-${String(i + 1).padStart(3, "0")}-${d}`,
      name: `${COMPANY_NAMES[i][0]} — ${DEAL_TYPES[ti]}`,
      stage: DEAL_STAGES[si],
      amount,
      closeDate: daysFromNow(20 + rng(i * 41 + d, 100)),
    });
  }
  return deals;
}

function buildTranscripts(i: number, profile: number) {
  if (profile === 3) return [];
  const pool = profile === 0 ? POSITIVE_SUMMARIES : profile === 2 ? NEGATIVE_SUMMARIES : NEUTRAL_SUMMARIES;
  const count = profile === 0 ? 2 + rng(i * 3, 2) : 1 + rng(i * 3, 1);
  const transcripts = [];
  for (let t = 0; t < count; t++) {
    const si = rng(i * 37 + t, pool.length);
    const mi = rng(i * 43 + t, MEETING_TITLES.length);
    const positiveSignals = ["Integrations", "API / automation", "Reporting", "Analytics", "SSO", "Permissions", "Roles", "Workflow"];
    const negativeSignals = ["Onboarding", "Integrations", "Billing / plan"];
    const signalPool = profile === 2 ? negativeSignals : positiveSignals;
    const numSignals = 2 + rng(i * 47 + t, 4);
    const signals: string[] = [];
    for (let s = 0; s < numSignals; s++) {
      const sig = signalPool[rng(i * 53 + t + s, signalPool.length)];
      if (!signals.includes(sig)) signals.push(sig);
    }
    transcripts.push({ id: `tr-${String(i + 1).padStart(3, "0")}-${t}`, title: MEETING_TITLES[mi], summary: pool[si], signals });
  }
  return transcripts;
}

// ─── Generate 200 accounts ────────────────────────────────────────────────────
export const DEMO_BASES: AccountBase[] = [];
export const DEMO_DETAILS: Record<string, AccountDetail> = {};

for (let i = 0; i < 200; i++) {
  const [companyName, summaryFragment] = COMPANY_NAMES[i];
  const profile = PROFILES[i];
  const companyId = `demo-${String(i + 1).padStart(3, "0")}`;
  const oi = rng(i * 11, OWNERS.length);
  const ownerName = OWNERS[oi];

  const sizeBase = profile === 0 ? 80 : profile === 1 ? 40 : 10;
  const companySize = sizeBase + rng(i * 7, sizeBase * 3);
  const companyRevenue = companySize * (8_000 + rng(i * 13, 20_000));

  const companySummary = `${companyName} is a ${summaryFragment}. They have been a customer for ${12 + rng(i * 17, 24)} months${profile === 0 ? " and are actively scaling with strong platform adoption" : profile === 1 ? " and are showing positive signals with room to grow" : profile === 2 ? " but engagement has slowed and satisfaction needs attention" : " with minimal recent activity"}.`;

  DEMO_BASES.push({ companyId, companyName, ownerName, companySummary, companyRevenue, companySize });

  const meetings = buildMeetings(i, profile);
  const deals = buildDeals(i, profile);
  const contacts = buildContacts(i, profile);
  const transcriptInsights = buildTranscripts(i, profile);

  DEMO_DETAILS[companyId] = { companySummary, deals, meetings, contacts, transcriptInsights, warnings: [] };
}
