import { LegalDoc } from '../models/LegalDoc.js';

export const INITIAL_LEGAL_DOCS = [
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    summary: 'Data collection, device telemetry, Google AdMob ad privacy, and security protocols for E² Stories OTT.',
    version: '1.0.0',
    isActive: true,
    effectiveDate: new Date('2026-09-01'),
    lastUpdated: new Date('2026-09-15'),
    updatedBy: 'System Admin',
    metadata: {
      category: 'User Privacy & Data Protection',
      contactEmail: 'privacy@e2stories.in',
      dpoOfficer: 'Data Protection Officer, E² Stories Ltd'
    },
    content: `PRIVACY POLICY — E² STORIES (ENTERTAINMENT SQUARED)
Last Updated: September 2026

1. INTRODUCTION & SCOPE
Welcome to E² Stories ("Platform", "we", "our", or "us"), a mobile vertical OTT streaming application operated by E² Stories Entertainment Ltd. This Privacy Policy details how we collect, store, process, and safeguard your personal information when you access our mobile application, website, and digital streaming services.

2. INFORMATION WE COLLECT
a. Account Information:
When you register on E² Stories, we collect and verify your mobile phone number via 6-digit SMS One-Time Password (OTP). Optional profile details include your First Name, Last Name, Email Address, and Avatar image.

b. Device & Network Telemetry:
To ensure seamless vertical video playback and security, we collect device identifiers (Unique Device ID, Android/iOS version, Device Model), IP addresses, network connection types (Wi-Fi/Cellular 4G/5G), and app release versions.

c. Playback & Engagement Data:
We automatically track playback events such as episode watch time, pause/resume timestamps, completed episodes, drama watchlists, and your selected genres/language preferences (Hindi, English, Tamil, Telugu, Kannada, Malayalam).

3. ADVERTISING & GOOGLE ADMOB INTEGRATION
For free-tier viewers, E² Stories displays rewarded video advertisements and interstitial banners delivered through Google AdMob. 
- Google AdMob uses non-sensitive advertising identifiers (Google Advertising ID / Apple IDFA) to serve personalized or contextual advertisements.
- E² Stories does NOT sell, lease, or distribute your personal contact information (phone number or email) to third-party advertisers.

4. PAYMENT & SUBSCRIPTION SECURITY
All subscription purchases (1 Month Pass, 6 Months Pass, 12 Months All-Access, and ₹2 Free Trial token mandates) are processed directly by our PCI-DSS certified payment gateway partner (Razorpay). E² Stories does not store sensitive credit/debit card numbers, CVVs, or UPI PINs on its application servers.

5. DATA RETENTION & SECURITY CONTROLS
All data exchanged between the E² Stories mobile app and backend APIs is encrypted using Transport Layer Security (TLS 1.3). Video metadata and user records are protected at rest using industry-standard AES-256 bit encryption.

6. USER RIGHTS & ACCOUNT DELETION
Under applicable data protection laws, you retain the right to:
- Access and update your profile information directly from the mobile app Profile screen.
- Request complete deletion of your account and associated playback history via the "Delete Account" button in your Profile screen or by emailing privacy@e2stories.in.
- Withdraw marketing and promotional notification consents via Notification Settings.

7. CONTACT & INQUIRIES
For privacy inquiries or data requests, contact our Data Protection Team at:
Email: privacy@e2stories.in
Address: E² Stories Entertainment Ltd, Bandra Kurla Complex, Mumbai 400051, Maharashtra, India.`
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    summary: 'Terms of service, subscription billing, licensing, and acceptable use guidelines for E² Stories OTT platform.',
    version: '1.0.0',
    isActive: true,
    effectiveDate: new Date('2026-09-01'),
    lastUpdated: new Date('2026-09-15'),
    updatedBy: 'System Admin',
    metadata: {
      category: 'Legal Terms & User Licensing',
      supportEmail: 'support@e2stories.in',
      legalJurisdiction: 'Mumbai, Maharashtra, India'
    },
    content: `TERMS OF SERVICE — E² STORIES VERTICAL OTT PLATFORM
Last Updated: September 2026

1. ACCEPTANCE OF TERMS
By downloading, creating an account, or accessing the E² Stories mobile application or website, you agree to comply with and be legally bound by these Terms of Service. If you do not accept these terms, please uninstall the app and discontinue access immediately.

2. USER ACCOUNTS & PHONE OTP AUTHENTICATION
- Users authenticate via verified mobile telephone numbers (+91 OTP verification).
- You are solely responsible for all activities conducted under your registered account.
- You agree not to share OTP codes or attempt unauthorized access to other user profiles.

3. SUBSCRIPTIONS & MEMBERSHIP BILLING
E² Stories offers premium ad-free vertical drama streaming under the following tier structures:
- 1 Month Pass (₹99): Billed on an auto-renewing 30-day billing cycle.
- 6 Months Pass (₹499): Billed on an auto-renewing 180-day cycle with multi-device sync.
- 12 Months All-Access (₹899): Billed annually, unlocking all Premium original micro-dramas.
- 7-Day Free Trial (₹2): A nominal non-refundable ₹2 token charge for mandate authentication. The trial automatically converts into a paid 1-Month Pass unless cancelled before the 7-day trial period concludes.
- Payments and recurring AutoPay mandates are processed securely via Razorpay.

4. INTELLECTUAL PROPERTY & LIMITED LICENSE
All vertical micro-dramas, video reels, trailers, screenplays, character portrayals, audio tracks, dialogues, subtitles, and user interfaces are exclusive proprietary assets of E² Stories Ltd. Users are granted a limited, personal, non-exclusive, non-transferable, and revocable license for personal, non-commercial streaming. Unauthorized recording, downloading, ripping, scraping, or redistribution is strictly prohibited and subject to legal prosecution.

5. USER CONDUCT & PROHIBITED ACTIVITIES
You agree not to:
- Decompile, reverse engineer, or extract source code from the mobile application.
- Circumvent digital rights management (DRM) or playback security restrictions.
- Use automated bots, scrapers, or exploits against the E² Stories APIs.
- Upload abusive, obscene, or fraudulent content through user feedback or report mechanisms.

6. TERMINATION & SUSPENSION
E² Stories reserves the right to suspend or terminate any user account without prior notice if fraudulent activity, policy abuse, or unauthorized commercial exploitation is detected.

7. GOVERNING LAW & JURISDICTION
These Terms are governed by and construed in accordance with the laws of India. Any disputes arising out of these terms shall be subject to the exclusive jurisdiction of the competent courts in Mumbai, Maharashtra.`
  },
  {
    slug: 'refund-policy',
    title: 'Cancellation & Refund Policy',
    summary: 'Auto-pay mandate cancellation terms and digital streaming refund eligibility guidelines.',
    version: '1.0.0',
    isActive: true,
    effectiveDate: new Date('2026-09-01'),
    lastUpdated: new Date('2026-09-15'),
    updatedBy: 'System Admin',
    metadata: {
      category: 'Billing & Subscriptions',
      billingEmail: 'billing@e2stories.in'
    },
    content: `CANCELLATION & REFUND POLICY — E² STORIES
Last Updated: September 2026

1. SUBSCRIPTION CANCELLATION
Subscribers may cancel their recurring monthly or annual AutoPay mandate at any time directly through the mobile application under Profile > Subscription > Cancel Subscription, or via their bank/UPI mandate management portal.
- Upon cancellation, your Premium streaming access will remain active until the end of the current paid billing cycle.
- No further automated charges will be deducted once the mandate is successfully canceled.

2. REFUND ELIGIBILITY
Because E² Stories delivers instant digital streaming entertainment, all subscription purchases and trial fees are non-refundable once content streaming has commenced. Exceptions are reviewed on a case-by-case basis under the following conditions:
a. Duplicate Payment: In the event of an accidental double deduction for the same billing period, the excess charge will be refunded within 5-7 business days to the original payment source.
b. Technical Playback Failure: If an active subscriber experiences verified, persistent platform playback downtime exceeding 48 consecutive hours that cannot be resolved by technical support, a pro-rated refund or extension credit will be provided.

3. REFUND REQUEST PROCESS
To submit a billing inquiry or duplicate charge dispute:
- Email billing@e2stories.in with your registered phone number, Razorpay payment ID, and transaction screenshot.
- Our billing support team will investigate and respond within 48 business hours.`
  },
  {
    slug: 'grievance-compliance',
    title: 'OTT Ethics & Statutory Grievance Redressal',
    summary: 'Compliance with Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.',
    version: '1.0.0',
    isActive: true,
    effectiveDate: new Date('2026-09-01'),
    lastUpdated: new Date('2026-09-15'),
    updatedBy: 'Compliance Dept',
    metadata: {
      officerName: 'Rajesh Mehta',
      designation: 'Grievance Redressal Officer (Rule 11, Digital Media Ethics Code)',
      email: 'grievance@e2stories.in',
      address: 'E² Stories Entertainment Ltd, Bandra Kurla Complex, Mumbai 400051',
      sla: '15 Days Maximum Resolution SLA',
      certifiedMaturityTags: [
        'U (Universal)',
        'U/A 7+',
        'U/A 13+',
        'U/A 16+',
        'A 18+ (Adults)'
      ]
    },
    content: `STATUTORY GRIEVANCE REDRESSAL & DIGITAL MEDIA ETHICS CODE COMPLIANCE
In accordance with Rule 11 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.

1. STATUTORY GRIEVANCE REDRESSAL OFFICER
For complaints regarding content classification, age ratings, ethics code compliance, or copyright concerns:
- Name: Rajesh Mehta
- Designation: Grievance Redressal Officer (Rule 11, Digital Media Ethics Code)
- Email: grievance@e2stories.in
- Office Address: E² Stories Entertainment Ltd, Bandra Kurla Complex, Mumbai 400051, Maharashtra, India
- Resolution SLA: Grievance acknowledgment within 24 hours; complete investigation and resolution within 15 days.

2. CONTENT SELF-CLASSIFICATION & AGE GATING
All content curated on E² Stories is classified according to the General Principles of the Digital Media Ethics Code into the following categories:
- U (Universal): Suitable for all age groups.
- U/A 7+: Suitable for persons aged 7 years and above; parental guidance recommended.
- U/A 13+: Suitable for persons aged 13 years and above; parental guidance advised.
- U/A 16+: Suitable for persons aged 16 years and above.
- A 18+: Restricted to adults (18+). Contains mature themes, language, or dramatic intensity.

3. COMPLAINT PROCEDURE
Complainants must furnish the drama title, episode number, approximate timestamp, specific legal or ethical grounds of grievance, and contact details. Formal responses will be dispatched to the complainant's email address within the statutory timeframe.`
  }
];

export const seedDefaultLegalDocs = async () => {
  try {
    for (const doc of INITIAL_LEGAL_DOCS) {
      await LegalDoc.findOneAndUpdate(
        { slug: doc.slug },
        { $setOnInsert: doc },
        { upsert: true, new: true }
      );
    }
    console.log('[Database] Default legal documents ensured.');
  } catch (error) {
    console.warn('[Database] Could not seed legal documents:', error.message);
  }
};
