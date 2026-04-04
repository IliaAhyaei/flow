export interface Resource {
  id: string;
  name: string;
  category:
    | "housing"
    | "education"
    | "family-children"
    | "tax-savings"
    | "transportation"
    | "retirement"
    | "employment"
    | "newcomer";
  description: string;
  eligibility_summary: string;
  eligibility_keywords: string[]; // for matching
  required_documents: string[];
  next_steps: string[];
  official_url: string;
  province: "federal" | "QC" | "ON" | "BC" | "AB" | "ALL";
  benefit_value?: string;
  min_income?: number;
  max_income?: number;
  relevant_goals?: string[]; // goalType keys
}

export const RESOURCES: Resource[] = [
  // ─── TAX-SAVINGS ─────────────────────────────────────────────────────────

  {
    id: "tfsa",
    name: "Tax-Free Savings Account (TFSA)",
    category: "tax-savings",
    description:
      "A registered account where your investments grow tax-free and withdrawals are never taxed. Contribution room accumulates every year starting at age 18. Annual limit: $7,000/year.",
    eligibility_summary:
      "Canadian resident, age 18+, valid SIN. Available from first year of residency.",
    eligibility_keywords: ["savings", "investment", "tax", "income", "tfsa", "resident"],
    required_documents: ["Social Insurance Number (SIN)", "Government-issued ID"],
    next_steps: [
      "Open a TFSA at any Canadian bank or investment platform (e.g. Wealthsimple, RBC, TD).",
      "Set up automatic monthly contributions.",
      "Invest in ETFs, GICs, or mutual funds within the account.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account.html",
    province: "federal",
    benefit_value: "Up to $7,000/year tax-free growth",
    relevant_goals: ["money-working-harder", "retire-enough", "keep-ahead-inflation"],
  },
  {
    id: "rrsp",
    name: "Registered Retirement Savings Plan (RRSP)",
    category: "tax-savings",
    description:
      "A retirement savings account that reduces your taxable income now. Contributions are deducted from your income, and investments grow tax-sheltered until withdrawal in retirement.",
    eligibility_summary:
      "Canadian resident with earned income and a filed tax return. Contribution limit: 18% of prior year income, max $32,490 (2025).",
    eligibility_keywords: ["retirement", "tax reduction", "income", "savings", "rrsp"],
    required_documents: ["SIN", "Notice of Assessment from CRA", "T4 slips"],
    next_steps: [
      "Check your RRSP contribution room on your CRA MyAccount.",
      "Open an RRSP at your bank or through a discount broker.",
      "Contribute before the RRSP deadline (60 days after year-end).",
      "Use tax refund to pay down debt or top up TFSA.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/registered-retirement-savings-plan-rrsp.html",
    province: "federal",
    benefit_value: "Tax deduction + tax-deferred growth",
    relevant_goals: ["pay-less-tax", "retire-enough", "retire-early"],
  },
  {
    id: "fhsa",
    name: "First Home Savings Account (FHSA)",
    category: "housing",
    description:
      "The most tax-efficient account in Canada for first-time home buyers. Get a tax deduction on contributions AND withdraw tax-free for a qualifying home purchase. $8,000/year, $40,000 lifetime.",
    eligibility_summary:
      "Canadian resident, 18+, first-time home buyer (haven't owned a principal residence in the past 4 calendar years). Must open before December 31 of the year you turn 71.",
    eligibility_keywords: ["home", "first-time buyer", "house", "purchase", "fhsa", "savings"],
    required_documents: ["SIN", "Proof of first-time buyer status"],
    next_steps: [
      "Confirm you haven't owned a home in the past 4 years.",
      "Open an FHSA at any Canadian financial institution.",
      "Contribute up to $8,000 this year.",
      "Invest inside the FHSA (ETFs, GICs, etc.).",
      "Withdraw tax-free when purchasing your first home.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html",
    province: "federal",
    benefit_value: "Tax deduction + tax-free growth + tax-free withdrawal",
    relevant_goals: ["buy-home"],
  },
  {
    id: "hbp",
    name: "Home Buyers' Plan (HBP) — RRSP Withdrawal",
    category: "housing",
    description:
      "Withdraw up to $35,000 from your RRSP tax-free to buy or build your first home. Must be repaid over 15 years. Can be combined with the FHSA.",
    eligibility_summary:
      "First-time home buyer, have a written agreement to buy/build a home, must be a Canadian resident.",
    eligibility_keywords: ["home", "rrsp", "first-time buyer", "purchase", "down payment"],
    required_documents: [
      "Signed purchase agreement or construction contract",
      "SIN",
      "RRSP account",
    ],
    next_steps: [
      "Confirm you qualify as a first-time buyer.",
      "Ensure your RRSP funds have been in the account for at least 90 days.",
      "Complete CRA Form T1036.",
      "Withdraw up to $35,000 and apply toward your down payment.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/what-home-buyers-plan.html",
    province: "federal",
    benefit_value: "Up to $35,000 tax-free RRSP withdrawal",
    relevant_goals: ["buy-home"],
  },
  {
    id: "resp",
    name: "Registered Education Savings Plan (RESP)",
    category: "education",
    description:
      "A savings plan for your child's post-secondary education. The federal government adds 20% on the first $2,500 you contribute per child per year (CESG = $500/child/year). Tax-sheltered growth.",
    eligibility_summary:
      "Child must be under 18, have a SIN, be a Canadian resident. Parents/grandparents/other individuals can open.",
    eligibility_keywords: ["education", "children", "resp", "savings", "cesg", "child"],
    required_documents: ["Child's SIN", "Subscriber (parent) SIN", "Proof of relationship"],
    next_steps: [
      "Apply for your child's SIN at a Service Canada office.",
      "Open an RESP at a bank, credit union, or broker.",
      "Contribute $2,500/year per child to maximize the $500 CESG grant.",
      "Consider provincial grants (Quebec adds 10% on top — see IQEÉ).",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-education-savings-plans-resps.html",
    province: "federal",
    benefit_value: "$500 free government grant per child per year (max)",
    relevant_goals: ["save-education"],
  },
  {
    id: "gst-hst-credit",
    name: "GST/HST Credit",
    category: "tax-savings",
    description:
      "A tax-free quarterly payment from the CRA to help low-to-moderate income individuals and families offset the cost of GST/HST paid on goods and services.",
    eligibility_summary:
      "Canadian resident, 19+ (or meet other conditions). Based on prior year net income. Single individual: up to ~$533/year (2025).",
    eligibility_keywords: ["gst", "income", "benefit", "tax credit", "low income"],
    required_documents: ["Filed tax return"],
    next_steps: [
      "File your annual tax return — you are automatically assessed.",
      "Ensure your banking information is updated with CRA for direct deposit.",
      "Check CRA My Account to see your entitlement.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/gsthstc-isrc.html",
    province: "federal",
    benefit_value: "Up to $533/year (single, 2025)",
  },
  {
    id: "cwb",
    name: "Canada Workers Benefit (CWB)",
    category: "employment",
    description:
      "A refundable tax credit for low-income workers to supplement earnings and encourage workforce participation. Includes a disability supplement.",
    eligibility_summary:
      "Working Canadian resident, 19+, income between approximately $3,000 and $33,015 (single, 2025).",
    eligibility_keywords: ["low income", "worker", "employment", "tax credit", "working"],
    required_documents: ["Filed tax return", "T4 slips"],
    next_steps: [
      "File your annual tax return — claim is automatic.",
      "You may receive advance payments if you applied in the prior year.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-workers-benefit.html",
    province: "federal",
    benefit_value: "Up to $1,518/year (single, 2025)",
  },

  // ─── HOUSING ─────────────────────────────────────────────────────────────

  {
    id: "first-time-home-buyer-credit",
    name: "First-Time Home Buyers' Tax Credit",
    category: "housing",
    description:
      "A $10,000 non-refundable tax credit for first-time home buyers who purchase a qualifying home. Provides up to $1,500 in federal tax savings.",
    eligibility_summary:
      "First-time home buyer (or not owned in the past 4 years) who purchased a qualifying home in Canada during the tax year.",
    eligibility_keywords: ["home", "house", "first-time buyer", "purchase", "credit"],
    required_documents: ["Proof of home purchase", "Filed tax return"],
    next_steps: [
      "Purchase your first home.",
      "Claim the First-Time Home Buyers' Amount on your T1 return (line 31270).",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/federal-government-budgets/budget-2022-plan-grow-economy-make-life-more-affordable/first-time-homebuyers-tax-credit.html",
    province: "federal",
    benefit_value: "Up to $1,500 tax savings",
    relevant_goals: ["buy-home"],
  },
  {
    id: "canada-greener-homes",
    name: "Canada Greener Homes Grant",
    category: "housing",
    description:
      "Up to $5,600 in grants to help homeowners make energy-efficient retrofits — insulation, windows, heat pumps, solar panels. Requires a pre/post EnerGuide home evaluation.",
    eligibility_summary:
      "Homeowner of a primary residence in Canada. Must complete an EnerGuide evaluation before starting work.",
    eligibility_keywords: ["home", "renovation", "energy", "green", "retrofit", "heat pump"],
    required_documents: [
      "Proof of home ownership",
      "EnerGuide evaluation reports",
      "Receipts for eligible upgrades",
    ],
    next_steps: [
      "Register on the Canada Greener Homes portal.",
      "Book a pre-retrofit EnerGuide evaluation.",
      "Complete eligible upgrades.",
      "Submit receipts and book your post-retrofit evaluation.",
    ],
    official_url: "https://www.canada.ca/en/natural-resources-canada/news/2021/05/canada-greener-homes-grant.html",
    province: "federal",
    benefit_value: "Up to $5,600 in grants",
  },

  // ─── FAMILY & CHILDREN ────────────────────────────────────────────────────

  {
    id: "ccb",
    name: "Canada Child Benefit (CCB)",
    category: "family-children",
    description:
      "A tax-free monthly payment to eligible families with children under 18. The amount is based on family income and number of children. Average benefit: $500–$600/month per child for lower-income families.",
    eligibility_summary:
      "Canadian resident who is the primary caregiver of a child under 18. Must file annual taxes. Income-tested.",
    eligibility_keywords: ["children", "child", "family", "benefits", "ccb"],
    required_documents: [
      "Proof of birth or adoption",
      "SIN for you and your spouse",
      "Proof of residency status",
      "Filed tax return",
    ],
    next_steps: [
      "Apply online through CRA My Account or mail Form RC66.",
      "File taxes every year to ensure continued eligibility.",
      "Update your marital/family status with CRA when changes occur.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-child-benefit-overview.html",
    province: "federal",
    benefit_value: "Up to $7,787/year per child under 6 (2025)",
    relevant_goals: ["save-education", "protect-family"],
  },
  {
    id: "canada-learning-bond",
    name: "Canada Learning Bond (CLB)",
    category: "education",
    description:
      "Free money for RESP — the government deposits $500 the first year and $100/year after, up to $2,000 total, for children from modest-income families. No personal contribution required.",
    eligibility_summary:
      "Family receiving the National Child Benefit Supplement (CCB for families earning under ~$50,000). Child born after 2003. No parental contribution needed to receive the CLB.",
    eligibility_keywords: ["education", "child", "low income", "resp", "learning bond"],
    required_documents: ["Child's SIN", "RESP account", "CCB confirmation"],
    next_steps: [
      "Open an RESP for your child (free to open).",
      "Apply for the CLB — no contribution needed.",
      "Funds are automatically deposited by the government.",
    ],
    official_url: "https://www.canada.ca/en/employment-social-development/services/learning-bond.html",
    province: "federal",
    benefit_value: "Up to $2,000 free (no contribution required)",
    relevant_goals: ["save-education"],
  },

  // ─── RETIREMENT ───────────────────────────────────────────────────────────

  {
    id: "cpp",
    name: "Canada Pension Plan (CPP)",
    category: "retirement",
    description:
      "A monthly taxable retirement benefit based on contributions made during your working years. Start as early as 60 (reduced) or delay to 70 (increased by 42%). CPP2 enhancements increase future benefits for current workers.",
    eligibility_summary:
      "Made at least one CPP contribution. Contributions begin after 1 year of working in Canada (outside Quebec). Age 60+ to start collecting.",
    eligibility_keywords: ["retirement", "pension", "cpp", "contributions"],
    required_documents: ["SIN", "Employment history"],
    next_steps: [
      "View your CPP Statement of Contributions via Service Canada.",
      "Decide optimal age to start (60 to 70).",
      "Apply for CPP retirement pension online through My Service Canada Account.",
    ],
    official_url: "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html",
    province: "federal",
    benefit_value: "Up to $1,433/month at 65 (2025 maximum)",
    relevant_goals: ["retire-enough", "retire-early"],
  },
  {
    id: "qpp",
    name: "Quebec Pension Plan (QPP)",
    category: "retirement",
    description:
      "Quebec's equivalent of CPP for workers in Quebec. Very similar structure: contributions from your paycheck fund a retirement benefit. QPP also includes disability and survivor benefits.",
    eligibility_summary:
      "Quebec resident who has contributed to QPP through employment in Quebec. Available from age 60.",
    eligibility_keywords: ["retirement", "pension", "qpp", "quebec", "contributions"],
    required_documents: ["SIN", "Quebec employment history"],
    next_steps: [
      "Check your QPP statement on the Retraite Québec portal.",
      "Decide optimal age to start collecting.",
      "Apply online via Retraite Québec.",
    ],
    official_url: "https://www.rrq.gouv.qc.ca/en/retraite/rrq/Pages/rente-retraite.aspx",
    province: "QC",
    benefit_value: "Up to ~$1,364/month (similar to CPP)",
    relevant_goals: ["retire-enough", "retire-early"],
  },
  {
    id: "oas",
    name: "Old Age Security (OAS)",
    category: "retirement",
    description:
      "A monthly government pension starting at age 65 for most Canadians. No contributions required — based on years of residency in Canada (minimum 10 years to receive some; 40 years for maximum). Indexed to inflation quarterly.",
    eligibility_summary:
      "Age 65+, Canadian citizen or legal resident, at least 10 years of Canadian residency after age 18.",
    eligibility_keywords: ["retirement", "oas", "pension", "65", "old age"],
    required_documents: ["SIN", "Proof of residency history"],
    next_steps: [
      "Service Canada automatically enrolls most Canadians. Check your enrollment status.",
      "If not auto-enrolled, apply through My Service Canada Account.",
      "Consider deferring OAS to 70 for a 36% increase if still working at 65.",
    ],
    official_url: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html",
    province: "federal",
    benefit_value: "~$727/month (2025, full amount)",
    relevant_goals: ["retire-enough"],
  },
  {
    id: "gis",
    name: "Guaranteed Income Supplement (GIS)",
    category: "retirement",
    description:
      "Additional tax-free monthly payment added to OAS for low-income seniors. Provides significant additional support on top of OAS for Canadians with little other retirement income.",
    eligibility_summary:
      "Receiving OAS, income below ~$21,456 (single) or combined income thresholds. Must reapply annually by filing taxes.",
    eligibility_keywords: ["retirement", "low income", "senior", "gis", "supplement"],
    required_documents: ["OAS recipient", "Filed annual taxes"],
    next_steps: [
      "File taxes every year — GIS is calculated from your return.",
      "Apply through My Service Canada Account if not receiving it automatically.",
    ],
    official_url: "https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html",
    province: "federal",
    benefit_value: "Up to $1,086/month additional (single, 2025)",
    relevant_goals: ["retire-enough"],
  },

  // ─── TRANSPORTATION ───────────────────────────────────────────────────────

  {
    id: "izev",
    name: "Federal iZEV Program — EV Incentive",
    category: "transportation",
    description:
      "Point-of-sale rebate of up to $5,000 on the purchase or lease of a new battery-electric, plug-in hybrid, or hydrogen fuel cell vehicle. Applied directly at the dealership.",
    eligibility_summary:
      "Available to all Canadian residents. Vehicle must be from the eligible vehicle list (battery range and price limits apply). Max MSRP $55,000 for most vehicles.",
    eligibility_keywords: ["ev", "electric vehicle", "car", "transportation", "rebate"],
    required_documents: [
      "Vehicle purchase/lease agreement",
      "Government-issued ID",
    ],
    next_steps: [
      "Check the iZEV eligible vehicle list at tc.gc.ca.",
      "Purchase or lease the vehicle — dealer applies the rebate at point of sale.",
      "No separate application needed for the federal rebate.",
    ],
    official_url: "https://tc.canada.ca/en/road-transportation/innovative-technologies/zero-emission-vehicles",
    province: "federal",
    benefit_value: "Up to $5,000 federal rebate",
  },
  {
    id: "qc-ev-incentive",
    name: "Quebec Drive Electric — VÉhicule Électrique Québec",
    category: "transportation",
    description:
      "Quebec's provincial EV incentive provides up to $7,000 on a new electric vehicle, in addition to the federal iZEV rebate. Combined federal+provincial: up to $12,000 off.",
    eligibility_summary:
      "Quebec resident purchasing or leasing a new eligible zero-emission vehicle. Income test applies (family income under $150,000). Stackable with federal iZEV incentive.",
    eligibility_keywords: ["ev", "electric vehicle", "quebec", "car", "transportation", "rebate"],
    required_documents: [
      "Quebec residency",
      "Vehicle purchase/lease agreement",
      "Tax return for income verification",
    ],
    next_steps: [
      "Check eligible vehicles at vehiculeselectriques.gouv.qc.ca.",
      "Apply through the Roulez vert program portal.",
      "Application made after purchase — rebate sent by cheque or direct deposit.",
    ],
    official_url: "https://vehiculeselectriques.gouv.qc.ca/english/rabais/vn/programme-rabais-voiture-neuve.asp",
    province: "QC",
    benefit_value: "Up to $7,000 provincial (total up to $12,000 combined)",
  },

  // ─── EMPLOYMENT / SUPPORT ─────────────────────────────────────────────────

  {
    id: "ei",
    name: "Employment Insurance (EI)",
    category: "employment",
    description:
      "Temporary income support if you lose your job through no fault of your own (layoff, shortage of work). Also covers parental, maternity, sickness, and caregiving leaves.",
    eligibility_summary:
      "Have worked insurable hours (usually 420–700 hours depending on region and unemployment rate). Must have paid EI premiums. Must be actively seeking work.",
    eligibility_keywords: ["job loss", "employment", "ei", "income support", "unemployment"],
    required_documents: [
      "Record of Employment (ROE) from employer",
      "SIN",
      "Bank account for direct deposit",
    ],
    next_steps: [
      "Apply online within 4 weeks of your last day of work.",
      "Have your ROE from your employer.",
      "Report bi-weekly through My Service Canada Account while receiving benefits.",
    ],
    official_url: "https://www.canada.ca/en/services/benefits/ei.html",
    province: "federal",
    benefit_value: "55% of insurable earnings, up to $695/week (2025)",
    relevant_goals: ["protect-family", "earn-additional-income"],
  },
  {
    id: "climate-action-incentive",
    name: "Canada Carbon Rebate (Climate Action Incentive)",
    category: "tax-savings",
    description:
      "Quarterly tax-free payments to help Canadians offset the cost of the federal carbon tax. Most families receive more than they pay in carbon pricing. Must file taxes to receive.",
    eligibility_summary:
      "Canadian resident in a province where the federal carbon price applies. Most provinces except QC and BC which have their own systems. File taxes annually.",
    eligibility_keywords: ["carbon tax", "rebate", "climate", "environment", "tax credit"],
    required_documents: ["Filed annual tax return"],
    next_steps: [
      "File your taxes — rebate is automatic.",
      "Sign up for direct deposit through CRA My Account.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-carbon-rebate.html",
    province: "federal",
    benefit_value: "Varies by province, ~$1,500+/year for family of 4",
  },

  // ─── NEWCOMER-SPECIFIC ────────────────────────────────────────────────────

  {
    id: "ircc-settlement",
    name: "IRCC Settlement Services",
    category: "newcomer",
    description:
      "Free government-funded services to help newcomers integrate into Canadian society. Includes language training, employment assistance, community connections, and help accessing benefits and services.",
    eligibility_summary:
      "Newcomers to Canada including permanent residents, protected persons, and some temporary residents.",
    eligibility_keywords: ["newcomer", "immigration", "settlement", "canada", "new", "ircc"],
    required_documents: ["Immigration status document (PR card, permit, etc.)", "SIN"],
    next_steps: [
      "Find a settlement agency in your area through the IRCC Settlement Services finder.",
      "Register for Language Instruction for Newcomers (LINC) if needed.",
      "Access employment, financial, and integration supports.",
    ],
    official_url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada.html",
    province: "federal",
    benefit_value: "Free settlement services",
    relevant_goals: ["earn-additional-income", "start-grow-business"],
  },
  {
    id: "sin-application",
    name: "Social Insurance Number (SIN)",
    category: "newcomer",
    description:
      "A 9-digit number required to work in Canada, access government benefits, and open registered accounts (TFSA, RRSP, FHSA, RESP). Every newcomer working or receiving benefits must have one.",
    eligibility_summary:
      "All individuals who are eligible to work in Canada or who need to access federal benefits.",
    eligibility_keywords: ["sin", "social insurance", "number", "newcomer", "work", "identity"],
    required_documents: [
      "Primary document: Permanent Resident card, work permit, or Canadian birth certificate",
      "Secondary identity document (optional)",
    ],
    next_steps: [
      "Apply in person at a Service Canada office (same-day processing).",
      "Or apply by mail with certified copies of documents.",
      "Use your SIN to open a bank account and register for benefits.",
    ],
    official_url: "https://www.canada.ca/en/employment-social-development/services/sin.html",
    province: "federal",
    benefit_value: "Required to access all benefits and open accounts",
    relevant_goals: ["earn-additional-income"],
  },
  {
    id: "cra-my-account",
    name: "CRA My Account — Tax Filing & Benefits",
    category: "newcomer",
    description:
      "The Canada Revenue Agency's online portal where you file taxes, view benefit entitlements, update personal information, and track refunds. Filing taxes as a newcomer is essential — many benefits require a filed return.",
    eligibility_summary:
      "All Canadian residents. Newcomers can file their first return regardless of how long they've been in Canada.",
    eligibility_keywords: ["cra", "tax", "newcomer", "filing", "benefits", "return"],
    required_documents: ["SIN", "T4 slips or income info", "Date of entry to Canada"],
    next_steps: [
      "Register for CRA My Account online.",
      "File your tax return for every year you're a Canadian resident.",
      "First filing unlocks GST credit, CCB, and other automatic benefits.",
    ],
    official_url: "https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-individuals/account-individuals.html",
    province: "federal",
    benefit_value: "Access to all CRA benefits upon filing",
    relevant_goals: ["pay-less-tax"],
  },
  {
    id: "language-training-linc",
    name: "Language Instruction for Newcomers to Canada (LINC)",
    category: "newcomer",
    description:
      "Free federally-funded English or French language training for adult permanent residents and protected persons. Classes available at all levels — beginners to advanced.",
    eligibility_summary:
      "Adult permanent residents or protected persons who are not Canadian citizens.",
    eligibility_keywords: ["language", "english", "french", "newcomer", "training", "linc"],
    required_documents: ["PR card or proof of protected person status", "Language assessment"],
    next_steps: [
      "Find a LINC/CLIC provider in your area through the IRCC directory.",
      "Take a language assessment to determine your level.",
      "Register for free classes — childcare may be available at some locations.",
    ],
    official_url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/settle-canada/language-skills/government-funded-training.html",
    province: "federal",
    benefit_value: "Free language training",
    relevant_goals: ["earn-additional-income", "start-grow-business"],
  },

  // ─── QUEBEC SPECIFIC ─────────────────────────────────────────────────────

  {
    id: "qc-family-allowance",
    name: "Québec Family Allowance (Allocations familiales)",
    category: "family-children",
    description:
      "Monthly financial assistance from Retraite Québec for families with children under 18. Not income-tested — all eligible Quebec families receive it. Amount increases with number of children.",
    eligibility_summary:
      "Quebec resident with a child under 18 in their care. Child must be a Canadian citizen or permanent resident.",
    eligibility_keywords: ["children", "family", "quebec", "benefit", "allowance"],
    required_documents: ["Quebec residency", "Child's birth certificate", "SIN"],
    next_steps: [
      "Apply through Retraite Québec online portal.",
      "Payments start automatically once application is processed.",
    ],
    official_url: "https://www.rrq.gouv.qc.ca/en/programmes/famille/allocation/Pages/programme.aspx",
    province: "QC",
    benefit_value: "Up to $2,782/year per child",
    relevant_goals: ["save-education", "protect-family"],
  },
  {
    id: "qc-affordable-childcare",
    name: "Quebec Subsidized Childcare ($10/day)",
    category: "family-children",
    description:
      "Quebec's low-cost CPE (Centre de la petite enfance) network provides regulated, subsidized childcare at approximately $10–$15/day per child. Significant savings vs. private unregulated care.",
    eligibility_summary:
      "Quebec resident with a child up to age 5. Must secure a spot at a subsidized CPE or approved garderie.",
    eligibility_keywords: ["childcare", "daycare", "children", "quebec", "cpe"],
    required_documents: ["Quebec residency", "Child's birth certificate", "La Place 0-5 registration"],
    next_steps: [
      "Register on the La Place 0-5 provincial waitlist immediately after birth (waitlists are long).",
      "Apply at multiple locations to increase chances.",
      "Inquire about home-based subsidized childcare (garderie en milieu familial) as an alternative.",
    ],
    official_url: "https://www.quebec.ca/en/family-and-support-for-individuals/childcare/subsidized-childcare-services-cpe",
    province: "QC",
    benefit_value: "Save up to $25,000+/year vs private childcare",
    relevant_goals: ["save-education", "protect-family"],
  },
  {
    id: "qc-student-loan",
    name: "Quebec Student Financial Assistance (AFE)",
    category: "education",
    description:
      "Quebec's provincial student loans and bursaries program — administered by Aide financière aux études (AFE). Includes repayment assistance for graduates in financial difficulty.",
    eligibility_summary:
      "Quebec resident enrolled in eligible post-secondary studies. Income-tested based on student and family resources.",
    eligibility_keywords: ["student loan", "education", "debt", "repayment", "quebec"],
    required_documents: [
      "Quebec residency",
      "Enrollment confirmation",
      "Income and asset information",
    ],
    next_steps: [
      "Apply for repayment assistance at the AFE portal if struggling with loan payments.",
      "Consider the Repayment Assistance Plan (RAP) for federal loans through NSLSC.",
    ],
    official_url: "https://www.afe.gouv.qc.ca/en/",
    province: "QC",
    benefit_value: "Reduced monthly payments; potential forgiveness after 10 years",
    relevant_goals: ["pay-off-debts"],
  },
  {
    id: "qc-iqee",
    name: "Quebec Education Savings Incentive (IQEÉ)",
    category: "education",
    description:
      "Quebec's provincial RESP top-up: 10% on the first $2,500 contributed per child per year = $250/child/year. Stacks on top of the federal CESG ($500). Combined: $750 free per child per year.",
    eligibility_summary:
      "Quebec resident with a child under 18 who has an RESP. Same conditions as CESG.",
    eligibility_keywords: ["education", "resp", "quebec", "savings", "children", "iqee"],
    required_documents: ["RESP account", "Quebec residency", "Child's SIN"],
    next_steps: [
      "Open an RESP — the IQEÉ is applied automatically through your financial institution.",
      "Contribute $2,500/year per child to maximize both CESG ($500) and IQEÉ ($250).",
    ],
    official_url: "https://www.revenuquebec.ca/en/citizens/your-situation/studies/resp-and-iqee/",
    province: "QC",
    benefit_value: "$250/year per child (on top of $500 federal CESG)",
    relevant_goals: ["save-education"],
  },
  {
    id: "qc-reno",
    name: "Rénovert / LogiRénov — Quebec Home Renovation Credits",
    category: "housing",
    description:
      "Quebec provincial tax credits for eligible home renovation work including energy efficiency improvements. Check the current year's Revenu Québec website for active programs.",
    eligibility_summary:
      "Quebec homeowner making eligible renovations to their principal residence.",
    eligibility_keywords: ["renovation", "home", "quebec", "credit", "energy"],
    required_documents: ["Receipts for renovation work", "Contractor information", "Property tax account"],
    next_steps: [
      "Check Revenu Québec for currently active renovation programs.",
      "Keep all receipts for eligible work.",
      "Claim on your Quebec provincial tax return.",
    ],
    official_url: "https://www.revenuquebec.ca/en/citizens/tax-credits/",
    province: "QC",
    benefit_value: "Varies by program (typically 20% of eligible costs)",
  },

  // ─── DEBT RELIEF ─────────────────────────────────────────────────────────

  {
    id: "federal-rap",
    name: "Repayment Assistance Plan (RAP) — Student Loans",
    category: "education",
    description:
      "If you have federal student loans (NSLSC) and are struggling to make payments, the RAP reduces or eliminates your monthly payment based on your income. After 10 years in RAP, remaining balances may be forgiven.",
    eligibility_summary:
      "Canadian with federal student loans (NSLSC). Monthly payment exceeds 20% of gross income, or income falls below threshold.",
    eligibility_keywords: ["student loan", "debt", "repayment", "rap", "forgiveness"],
    required_documents: ["SIN", "NSLSC account", "Proof of income"],
    next_steps: [
      "Apply online through the National Student Loans Service Centre (NSLSC).",
      "Reapply every 6 months.",
    ],
    official_url: "https://www.canada.ca/en/employment-social-development/services/education/repayment-assistance.html",
    province: "federal",
    benefit_value: "Reduced payments; possible loan forgiveness after 10 years",
    relevant_goals: ["pay-off-debts"],
  },
];

// ─── Matching logic ───────────────────────────────────────────────────────

export function matchResourcesForUser(
  province: string,
  goals: string[],
  hasChildren: boolean,
  ageGroup: "young" | "mid" | "senior",
  lowIncome: boolean,
  searchQuery?: string,
  category?: string
): Resource[] {
  let pool = RESOURCES.filter(
    (r) =>
      (r.province === "federal" || r.province === province || r.province === "ALL") &&
      (!category || category === "all" || r.category === category)
  );

  const goalsSet = new Set(goals);

  // Score each resource by relevance
  const scored = pool.map((r) => {
    let score = 0;

    // Goal matching
    if (r.relevant_goals) {
      let overlap = 0;
      for (const g of r.relevant_goals) {
        if (goalsSet.has(g)) overlap++;
      }
      score += overlap * 10;
    }

    // Contextual rules
    if (hasChildren && (r.category === "family-children" || r.category === "education")) score += 5;
    if (ageGroup === "senior" && r.category === "retirement") score += 8;
    if (ageGroup === "young" && r.category === "newcomer") score += 4;
    if (lowIncome && r.min_income === undefined) score += 2;

    // Province match bonus
    if (r.province === province) score += 6;
    if (r.province === "federal") score += 3;

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const haystack = `${r.name} ${r.description} ${r.category} ${r.eligibility_keywords.join(" ")}`.toLowerCase();
      if (haystack.includes(q)) score += 15;
    }

    return { resource: r, score };
  });

  return scored
    .filter((s) => s.score > 0 || !searchQuery)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.resource);
}
