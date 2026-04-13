// ── Industry & option lists ──
export const industryOptions = [
  'Services', 'Construction', 'Professional Services', 'Manufacturing',
  'Distribution', 'Healthcare', 'Technology', 'Real Estate',
  'Staffing/HR', 'Financial Services', 'Education', 'Other',
];

export const brandVoiceOptions = [
  'Authoritative', 'Friendly', 'Motivational', 'Educational',
  'Casual', 'Formal', 'Technical',
];

export const geographyOptions = [
  'US Nationwide', 'Northeast', 'Southeast', 'Midwest',
  'Southwest', 'West Coast', 'International',
];

export const revenueOptions = ['$5M-$10M', '$10M-$25M', '$25M-$50M', '$50M-$100M'];
export const teamSizeOptions = ['10-25', '25-50', '50-100', '100-200', '200+'];

export const videoPreferenceOptions = [
  'On camera (me personally)', 'AI avatar (HeyGen-style)',
  'Voiceover + visuals', 'Mix of all three', 'No video content',
];

export const leadSourceOptions = [
  'LinkedIn', 'Apollo / cold email', 'Referrals / partnerships',
  'Inbound (website/SEO)', 'Events / conferences', 'Paid ads',
];

export const partnerTypeOptions = [
  'Consultants / advisors', 'Agencies', 'Software platforms',
  'Affiliates / influencers', 'Industry associations', 'None yet',
];

export const schedulingToolOptions = [
  'Cal.com', 'Calendly', 'HubSpot Meetings',
  'Acuity', 'Google Calendar (direct)', 'None',
];

export const platformOptions = [
  'LinkedIn', 'Facebook', 'Instagram', 'TikTok',
  'YouTube', 'Twitter/X', 'Email', 'Blog',
];

export const contentFormatOptions = [
  'Articles', 'Videos', 'Infographics', 'Case Studies',
  'Podcasts', 'Webinars', 'Guides/Whitepapers', 'Social Posts',
];

export const complianceOptions = [
  'GDPR', 'CCPA', 'HIPAA', 'SOC 2',
  'Industry-specific regulations', 'None',
];

// ── 12-Step form definition ──
// Step 0 = Typewriter intro (handled separately)
// Steps 1-10 = Form phases
// Step 11 = Review & Launch
export const formPhases = [
  {
    id: 'identity',
    name: 'Identity Scan',
    subtitle: '// verifying operator credentials',
    fields: [
      { key: 'yourName', label: 'Your Name', type: 'text', placeholder: 'Enter your full name' },
      { key: 'role', label: 'Your Role', type: 'text', placeholder: 'e.g., CEO, VP of Sales, Founder' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'you@company.com' },
      { key: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
      { key: 'websiteUrl', label: 'Website URL', type: 'text', placeholder: 'https://yourcompany.com' },
    ],
  },
  {
    id: 'system-detect',
    name: 'System Detection',
    subtitle: '// scanning company architecture',
    fields: [
      { key: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Your company name' },
      { key: 'industry', label: 'Industry', type: 'select', options: industryOptions },
      { key: 'subIndustry', label: 'Sub-Industry / Niche', type: 'text', placeholder: 'e.g., "commercial HVAC" not just "Construction"' },
      { key: 'revenueRange', label: 'Annual Revenue Range', type: 'select', options: revenueOptions },
      { key: 'teamSize', label: 'Team Size', type: 'select', options: teamSizeOptions },
      { key: 'otherVentures', label: 'Other Businesses / Brands', type: 'textarea', placeholder: 'Do you own other businesses, podcasts, or brands that share an audience?' },
    ],
  },
  {
    id: 'engine-diag',
    name: 'Engine Diagnostics',
    subtitle: '// analyzing sales performance metrics',
    fields: [
      { key: 'annualSalesGoal', label: 'Annual Sales Goal ($)', type: 'currency', placeholder: '0' },
      { key: 'marketingAllocation', label: 'Marketing Budget (% of revenue)', type: 'number', placeholder: '6', min: 1, max: 25 },
      { key: 'averageDealSize', label: 'Average Deal Size ($)', type: 'currency', placeholder: '0' },
      { key: 'closingRatio', label: 'Sales Closing Ratio (%)', type: 'number', placeholder: '25', min: 1, max: 100 },
      { key: 'leadCancellationRate', label: 'Lead Cancellation / No-Show Rate (%)', type: 'number', placeholder: '10', min: 0, max: 100 },
      { key: 'salesTeamSize', label: 'Sales Team Size', type: 'number', placeholder: '0', min: 0 },
      { key: 'salesCycleLength', label: 'Average Sales Cycle (days)', type: 'number', placeholder: '30', min: 1 },
    ],
  },
  {
    id: 'dna-extract',
    name: 'DNA Extraction',
    subtitle: '// extracting brand identity markers',
    fields: [
      { key: 'primaryBrandColor', label: 'Primary Brand Color', type: 'color' },
      { key: 'secondaryBrandColor', label: 'Secondary Brand Color', type: 'color' },
      { key: 'brandVoiceTone', label: 'Brand Voice & Tone', type: 'multiselect', options: brandVoiceOptions },
      { key: 'coreBrandMessaging', label: 'Core Brand Messaging', type: 'textarea', placeholder: 'Your tagline, positioning, or key message (2-3 sentences)' },
      { key: 'brandFrameworks', label: 'Core Methodology / Framework', type: 'textarea', placeholder: 'Do you have a proprietary framework, methodology, or IP that differentiates you?' },
      { key: 'brandOriginStory', label: 'Brand Origin Story', type: 'textarea', placeholder: 'What\'s the origin story or "why" behind your brand? (2-3 sentences)' },
      { key: 'existingBrandAssets', label: 'Existing Brand Assets', type: 'multiselect', options: ['Logo files', 'Professional photography', 'Brand guidelines document', 'Video library', 'Case studies / whitepapers', 'Podcast episodes', 'Published books / courses', 'None of these'] },
      { key: 'existingMediaCount', label: 'Existing Media Inventory', type: 'textarea', placeholder: 'How many videos, podcast episodes, or speeches do you have that can be repurposed?' },
      { key: 'videoProductionPreference', label: 'Video Production Preference', type: 'select', options: videoPreferenceOptions },
      { key: 'assetStorageLocation', label: 'Where Are Your Assets Stored?', type: 'select', options: ['Google Drive', 'Dropbox', 'OneDrive', 'AWS S3 / Cloud storage', 'On our website', "I'll share them via email", 'N/A — no existing assets'] },
    ],
  },
  {
    id: 'signal-lock',
    name: 'Signal Lock',
    subtitle: '// targeting ideal buyer coordinates',
    fields: [
      { key: 'targetBuyerTitles', label: 'Target Buyer Job Titles', type: 'textarea', placeholder: 'e.g., VP of Sales, Director of Marketing, CFO — rank by priority' },
      { key: 'buyerPersonality', label: 'Buyer Emotional Drivers', type: 'textarea', placeholder: 'What emotionally drives your ideal buyer? What are they afraid of or aspiring to?' },
      { key: 'decisionHierarchy', label: 'Buying Committee', type: 'textarea', placeholder: 'Who\'s on the buying committee? Who has final approval? (e.g., CFO decides, VP influences)' },
      { key: 'buyerJourneyStage', label: 'Buyer Awareness Level', type: 'select', options: ['Actively seeking solutions', 'Aware of the problem, not looking yet', 'Unaware — needs education first', 'Mix of all three'] },
      { key: 'budgetCycleTiming', label: 'Budget Cycle Timing', type: 'textarea', placeholder: 'When do your target buyers typically have budget? (Q1, post-acquisition, new fiscal year)' },
      { key: 'targetCompanyRevenueRange', label: 'Target Company Revenue', type: 'select', options: revenueOptions },
      { key: 'targetCompanySize', label: 'Target Company Size (employees)', type: 'select', options: teamSizeOptions },
      { key: 'targetGeography', label: 'Target Geography', type: 'multiselect', options: geographyOptions },
      { key: 'targetIndustries', label: 'Target Industries', type: 'multiselect', options: industryOptions },
      { key: 'monthlyLeadVolumeTarget', label: 'Monthly Lead Volume Target', type: 'number', placeholder: '0', min: 0 },
      { key: 'exclusionCriteria', label: 'Exclusion Criteria', type: 'textarea', placeholder: 'Anyone we should NOT target?' },
    ],
  },
  {
    id: 'arsenal',
    name: 'Arsenal Loaded',
    subtitle: '// cataloging weapons of persuasion',
    fields: [
      { key: 'productsList', label: 'Products / Services', type: 'textarea', placeholder: 'List each product or service, one per line. Include pricing if known.' },
      { key: 'productLadder', label: 'Product Ladder', type: 'textarea', placeholder: 'Map entry → core → premium → elite tiers with price points (e.g., Free guide → $2K workshop → $10K/mo retainer → $50K project)' },
      { key: 'revenueMixByProduct', label: 'Revenue Mix by Product', type: 'textarea', placeholder: 'What % of revenue comes from each product/service? (e.g., 40% consulting, 30% SaaS, 30% training)' },
      { key: 'priceRangePerOffering', label: 'Typical Price Range', type: 'select', options: ['Under $1K', '$1K-$5K', '$5K-$25K', '$25K-$100K', '$100K+', 'Varies widely'] },
      { key: 'leadMagnetOrEntryOffer', label: 'Lead Magnet / Entry Offer', type: 'textarea', placeholder: 'What free or low-cost offer hooks potential customers?' },
      { key: 'objectionHandling', label: 'Top 3 Objections', type: 'textarea', placeholder: 'What are the top 3 objections prospects raise, and how do you handle them?' },
      { key: 'customerTestimonials', label: 'Customer References', type: 'textarea', placeholder: 'Share 2-3 specific customer names, results, and whether we can reference them publicly.' },
      { key: 'socialProofAvailable', label: 'Social Proof Available', type: 'multiselect', options: ['Client testimonials', 'Case studies', 'Awards / certifications', 'Media features / press', 'Speaking engagements', 'Published books / courses', 'None yet'] },
    ],
  },
  {
    id: 'broadcast',
    name: 'Broadcast Config',
    subtitle: '// configuring content distribution network',
    fields: [
      { key: 'contentPillars', label: 'Content Pillars (3-5 topics)', type: 'textarea', placeholder: 'What topics do you want to be known for? One per line.' },
      { key: 'platformPriorities', label: 'Platform Priorities (ranked)', type: 'multiselect', options: platformOptions },
      { key: 'contentFormats', label: 'Content Formats', type: 'multiselect', options: contentFormatOptions },
      { key: 'postingCadence', label: 'Default Posting Cadence', type: 'select', options: ['Daily', '3-5x/week', '1-2x/week', 'Weekly', 'Bi-weekly'] },
      { key: 'platformCadenceOverrides', label: 'Per-Platform Cadence', type: 'textarea', placeholder: 'Different frequency per platform? (e.g., LinkedIn daily, Instagram 3x/week, Blog weekly)' },
      { key: 'contentVolumeComfort', label: 'Weekly Content Comfort Level', type: 'select', options: ['5-10 pieces/week', '10-20 pieces/week', '20-40 pieces/week', '40+ pieces/week', 'As much as the AI can produce'] },
      { key: 'repurposingPriority', label: 'Repurposing Priority', type: 'select', options: ['Prioritize repurposing existing content', 'Mix of repurposed and new', 'Mostly net-new AI-generated content', 'Not sure — recommend for me'] },
      { key: 'imageStylePreference', label: 'Image Style Preference', type: 'select', options: ['Professional / Corporate', 'Cinematic / Documentary', 'Casual / Authentic', 'Minimalist / Clean', 'Bold / Vibrant'] },
    ],
  },
  {
    id: 'outreach-matrix',
    name: 'Outreach Matrix',
    subtitle: '// mapping communication pathways',
    fields: [
      { key: 'crmPlatform', label: 'CRM Platform', type: 'select', options: ['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Monday.com', 'None / Spreadsheets', 'Other'] },
      { key: 'emailPlatform', label: 'Email Platform', type: 'select', options: ['Gmail / Google Workspace', 'Outlook / Microsoft 365', 'Mailchimp', 'HubSpot', 'Klaviyo', 'SendGrid', 'ConvertKit', 'Other'] },
      { key: 'emailWarmupDomains', label: 'Cold Outreach Domains', type: 'textarea', placeholder: 'Do you have multiple email domains for cold outreach, or should we set up dedicated sender domains?' },
      { key: 'emailCadencePreference', label: 'Email Cadence', type: 'select', options: ['Daily', '2-3x/week', 'Weekly', 'Bi-weekly'] },
      { key: 'smsSequencesDesired', label: 'SMS Sequences', type: 'select', options: ['Yes — with proper consent', 'No', 'Maybe — tell me more'] },
      { key: 'voiceAgentPreference', label: 'AI Voice Agents', type: 'select', options: ['Inbound calls only', 'Outbound prospecting only', 'Both inbound + outbound', 'No voice agents', 'Tell me more first'] },
      { key: 'schedulingTool', label: 'Scheduling Tool', type: 'select', options: schedulingToolOptions },
      { key: 'leadSourcePreference', label: 'Lead Sources', type: 'multiselect', options: leadSourceOptions },
      { key: 'partnerTypes', label: 'Partner Types to Target', type: 'multiselect', options: partnerTypeOptions },
      { key: 'leadQualificationCriteria', label: 'Lead Qualification Criteria', type: 'textarea', placeholder: 'What makes a lead "qualified"? Include min deal size, authority level, and timeline.' },
    ],
  },
  {
    id: 'resource-alloc',
    name: 'Resource Allocation',
    subtitle: '// distributing operational budget',
    fields: [
      { key: 'budgetAllocationPriority', label: 'Budget Priorities', type: 'multiselect', options: ['Paid ads (Google/Meta/LinkedIn)', 'Content creation', 'Sales tools (CRM, email, Apollo)', 'SEO / website', 'Events / conferences', 'Freelancers / agencies'] },
      { key: 'adSpendByPlatform', label: 'Ad Spend Split by Platform', type: 'textarea', placeholder: 'How should we split ad spend? (e.g., 50% Google, 30% Meta, 20% LinkedIn)' },
      { key: 'kpiBaselines', label: 'Current Baseline Metrics', type: 'textarea', placeholder: 'What are your current numbers? (leads/month, close rate, revenue/month, website traffic)' },
      { key: 'targetKpis', label: 'Target KPIs (6-month horizon)', type: 'textarea', placeholder: 'e.g., "50 leads/month, 15% close rate, $1M pipeline"' },
      { key: 'targetCostPerLead', label: 'Target Cost Per Lead ($)', type: 'currency', placeholder: '0' },
      { key: 'expectedRoi', label: 'Expected ROI on Marketing Spend', type: 'select', options: ['3:1 (conservative)', '5:1 (moderate)', '10:1 (aggressive)', '20:1+ (very aggressive)', 'Not sure yet'] },
      { key: 'monthlyAdSpendCap', label: 'Monthly Ad Spend Cap ($)', type: 'currency', placeholder: '0' },
    ],
  },
  {
    id: 'final-calibration',
    name: 'Final Calibration',
    subtitle: '// completing system parameters',
    fields: [
      { key: 'complianceRequirements', label: 'Compliance Requirements', type: 'multiselect', options: complianceOptions },
      { key: 'ipSensitivities', label: 'IP / Trademark Sensitivities', type: 'textarea', placeholder: 'Are there thought leaders, methodologies, or trademarked terms you must NOT reference?' },
      { key: 'competitiveSensitivities', label: 'Competitive Sensitivities', type: 'textarea', placeholder: 'Any competitors, topics, or messaging to avoid?' },
      { key: 'governingLaw', label: 'Contract Jurisdiction', type: 'select', options: ['Delaware', 'Texas', 'California', 'New York', 'My state (specify below)', 'Not sure'] },
      { key: 'challenges', label: 'Biggest Challenges Right Now', type: 'multiselect', options: ['Not enough leads', 'Leads but no conversions', 'No marketing strategy', "Can't scale operations", 'Need better systems', 'Founder doing everything', 'Brand awareness', 'Sales cycle too long'] },
      { key: 'triedBefore', label: 'What Have You Tried Before?', type: 'multiselect', options: ['Marketing agency', 'In-house hire', 'Fractional CMO', 'DIY / self-taught', 'Consultants', 'PPC advertising', 'Content marketing', 'Nothing yet'] },
    ],
  },
];

// ── Initial form state ──
export const initialFormData = {
  // Phase 1: Identity
  yourName: '', role: '', email: '', phone: '', websiteUrl: '',
  // Phase 2: System Detection
  companyName: '', industry: '', subIndustry: '', revenueRange: '', teamSize: '',
  otherVentures: '',
  // Phase 3: Engine Diagnostics
  annualSalesGoal: '', marketingAllocation: '', averageDealSize: '',
  closingRatio: '', leadCancellationRate: '', salesTeamSize: '', salesCycleLength: '',
  // Phase 4: DNA Extraction
  primaryBrandColor: '#2E8B8B', secondaryBrandColor: '#1B2A4A',
  brandVoiceTone: [], coreBrandMessaging: '', brandFrameworks: '', brandOriginStory: '',
  existingBrandAssets: [], existingMediaCount: '', videoProductionPreference: '',
  assetStorageLocation: '',
  // Phase 5: Signal Lock
  targetBuyerTitles: '', buyerPersonality: '', decisionHierarchy: '',
  buyerJourneyStage: '', budgetCycleTiming: '',
  targetCompanyRevenueRange: '', targetCompanySize: '',
  targetGeography: [], targetIndustries: [], monthlyLeadVolumeTarget: '', exclusionCriteria: '',
  // Phase 6: Arsenal
  productsList: '', productLadder: '', revenueMixByProduct: '',
  priceRangePerOffering: '', leadMagnetOrEntryOffer: '',
  objectionHandling: '', customerTestimonials: '', socialProofAvailable: [],
  // Phase 7: Broadcast Config
  contentPillars: '', platformPriorities: [], contentFormats: [],
  postingCadence: '', platformCadenceOverrides: '',
  contentVolumeComfort: '', repurposingPriority: '', imageStylePreference: '',
  // Phase 8: Outreach Matrix
  crmPlatform: '', emailPlatform: '', emailWarmupDomains: '', emailCadencePreference: '',
  smsSequencesDesired: '', voiceAgentPreference: '', schedulingTool: '',
  leadSourcePreference: [], partnerTypes: [], leadQualificationCriteria: '',
  // Phase 9: Resource Allocation
  budgetAllocationPriority: [], adSpendByPlatform: '', kpiBaselines: '',
  targetKpis: '', targetCostPerLead: '', expectedRoi: '', monthlyAdSpendCap: '',
  // Phase 10: Final Calibration
  complianceRequirements: [], ipSensitivities: '', competitiveSensitivities: '',
  governingLaw: '', challenges: [], triedBefore: [],
};
