/**
 * Default content for each site_content section.
 * Used by the "Reset to default" feature in the admin content editor.
 */

export const siteDefaults: Record<string, Record<string, unknown>> = {
  hero: {
    badge: 'AI-Powered Planning',
    headline: 'Make your days',
    subheadline:
      'AI-powered daily planning that turns your calendar into a clear, actionable timeline. Plan less. Do more.',
    ctaPrimary: 'Get OptiPlan',
    ctaSecondary: 'See how it works',
    rotatingWords: ['productive', 'focused', 'organized', 'balanced', 'effortless'],
  },
  problems: {
    badge: 'The Problem',
    title: 'Why students struggle daily',
    subtitle:
      'Most students face the same three challenges — and no single app solves them all.',
    items: [
      {
        number: '01',
        title: 'Scattered Schedules',
        description:
          'Students juggle classes, assignments, and social life across multiple apps — nothing talks to each other.',
      },
      {
        number: '02',
        title: 'Lost Study Notes',
        description:
          'Important notes end up buried in random folders, group chats, or forgotten notebooks when exams arrive.',
      },
      {
        number: '03',
        title: 'Budget Blind Spots',
        description:
          'Between tuition, rent, and daily spending, most students have no clear picture of where their money goes.',
      },
    ],
  },
  features: {
    badge: 'Features',
    title: 'Everything you need to stay productive',
    subtitle:
      'A complete productivity suite designed to help students plan less and accomplish more.',
    items: [
      {
        title: 'Smart Scheduling',
        description:
          'AI builds your optimal daily timeline around classes, deadlines, and personal commitments.',
        checklist: [
          'Auto-sync with university calendar',
          'Deadline & exam countdown alerts',
          'Focus-block suggestions between classes',
        ],
        backContent:
          'OptiPlan analyzes your class timetable, assignment due dates, and energy patterns to generate a personalized daily schedule. It learns which study slots work best for you and automatically blocks focus time before exams.',
      },
      {
        title: 'Study Notes',
        description:
          'Capture, organize, and search your notes in one place — linked to your schedule.',
        checklist: [
          'Rich-text & markdown editor',
          'Auto-tag by course and topic',
          'Full-text search across all notes',
        ],
        backContent:
          'Every note is automatically linked to the class or study session where you created it. Tag by course, search by keyword, and review everything in one timeline — no more digging through folders the night before an exam.',
      },
      {
        title: 'Budget Tracking',
        description:
          'See where your money goes with zero-effort expense logging and weekly spending reports.',
        checklist: [
          'Quick-add expenses in two taps',
          'Category breakdown charts',
          'Weekly & monthly spending alerts',
        ],
        backContent:
          'Set a weekly budget, snap receipts or quick-add expenses, and get a clear breakdown by category. OptiPlan sends gentle alerts before you overshoot, so you can make it to the end of the month without surprises.',
      },
    ],
  },
  steps: {
    badge: 'How it works',
    title: 'Three steps to a calmer day',
    subtitle:
      'Getting started is simple. Connect your tools, start focusing, and end each day with clarity.',
    items: [
      {
        number: '01',
        title: 'Connect',
        description:
          'Link your calendars and task apps in seconds. OptiPlan integrates seamlessly with Google Calendar, Outlook, Notion, and more.',
      },
      {
        number: '02',
        title: 'Focus',
        description:
          'Start a focus session with one tap. We silence notifications, block distractions, and track your progress automatically.',
      },
      {
        number: '03',
        title: 'Reflect',
        description:
          'Close the day with a personalized summary. See what you accomplished, what\'s next, and jot down a quick reflection.',
      },
    ],
  },
  tutorial: {
    badge: 'How It Works',
    title: 'See OptiPlan in action',
    subtitle: 'A quick walkthrough of how OptiPlan keeps your day on track.',
  },
  about_creator: {
    badge: 'Meet the Creator',
    title: 'Built by a student, for students',
    paragraphs: [
      'OptiPlan started as a side project during finals week. I was drowning in scattered schedules, lost notes, and mystery bank charges — and I knew other students felt the same way.',
      'So I built the tool I wish I\'d had freshman year: one place to plan your day, organize your notes, and actually see where your money goes. No bloat, no learning curve — just the essentials done right.',
    ],
    signature: '— The OptiPlan Team',
  },
  about_optiplan: {
    badge: 'About OptiPlan',
    title: 'One app to replace them all',
    subtitle:
      'Schedule, notes, and budget — unified in a single student-first platform.',
    heading: 'Designed around the student day',
    description:
      'OptiPlan connects your class schedule, study notes, and spending in one dashboard so you always know what\'s next — and what\'s left in your wallet.',
    checklist: [
      'Replace 3+ apps with one dashboard',
      'Built specifically for student workflows',
      'Free tier — no credit card required',
      'Works offline for library study sessions',
    ],
  },
  faqs: {
    badge: 'FAQ',
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know about OptiPlan.',
    items: [
      {
        question: 'How does OptiPlan integrate with my existing tools?',
        answer:
          'OptiPlan connects seamlessly with Google Calendar, Outlook, Apple Calendar, Notion, Asana, and Trello. Simply authorize the connection and we\'ll sync your events and tasks automatically. Changes are reflected in real-time across all platforms.',
      },
      {
        question: 'Is my data secure and private?',
        answer:
          'Absolutely. We use end-to-end encryption for all your data. We never sell your information, show ads, or train AI models on your personal data. Your privacy is our top priority.',
      },
      {
        question: 'Can I use OptiPlan for team collaboration?',
        answer:
          'Yes! OptiPlan Teams allows you to share schedules, coordinate meetings, and manage projects together. Each team member maintains their privacy while enabling seamless collaboration.',
      },
      {
        question: 'What platforms does OptiPlan support?',
        answer:
          'OptiPlan is available on iOS, Android, macOS, Windows, and as a web app. Your data syncs instantly across all your devices, so you can plan on your phone and focus on your desktop.',
      },
      {
        question: 'How does the AI scheduling work?',
        answer:
          'Our AI analyzes your calendar patterns, task priorities, and energy levels to suggest optimal schedules. It learns from your preferences over time and gets smarter with every adjustment you make.',
      },
      {
        question: 'Is there a free trial available?',
        answer:
          'Yes! We offer a 30-day free trial with full access to all features. No credit card required. After the trial, you can choose a plan that fits your needs or continue with our free tier.',
      },
    ],
  },
  testimonials: {
    badge: 'Testimonials',
    title: 'What students are saying',
    subtitle: 'Real feedback from students who use OptiPlan every day.',
    items: [
      {
        quote:
          'OptiPlan replaced three apps for me. My schedule, notes, and budget are finally in one place — I actually feel organized for the first time since freshman year.',
        name: 'Sarah Martinez',
        role: 'Junior, Business Administration',
        initials: 'SM',
      },
      {
        quote:
          'The smart scheduling alone is worth it. It figured out my best study windows and I pulled my GPA up a full point last semester.',
        name: 'James Chen',
        role: 'Senior, Computer Science',
        initials: 'JC',
      },
      {
        quote:
          'I used to blow through my monthly budget by week two. The spending alerts keep me honest without feeling restrictive.',
        name: 'Emma Park',
        role: 'Sophomore, Pre-Med',
        initials: 'EP',
      },
      {
        quote:
          'The burnout protection is real. OptiPlan flags when my study blocks are too intense and forces me to schedule breaks. It\'s genuinely saving my sanity this rotation.',
        name: 'Alex Chen',
        role: 'Med Student, Year 2',
        initials: 'AC',
      },
      {
        quote:
          'As a visual person, I love the interface. Seeing my freelance deadlines alongside my internship tasks in one colorful timeline makes prioritizing so much easier.',
        name: 'Priya Patel',
        role: 'Graphic Design Intern',
        initials: 'PP',
      },
      {
        quote:
          'I connected my Google Calendar and my budgeting app. The sync is flawless. Finally having a single source of truth for my entire life is a game-changer.',
        name: 'Marcus Johnson',
        role: 'Engineering, Year 3',
        initials: 'MJ',
      },
    ],
  },
  cta: {
    headline: 'Start your day, your way.',
    subheadline:
      'OptiPlan is completely free, why not transform how you plan your day today!',
    buttonText: 'Get early access',
    disclaimer: 'No credit card required.',
  },
};

/**
 * Colorable text fields per section.
 * Keys = section_key, values = array of { key, label } for each colorable field.
 * Empty string = use default CSS color (no override).
 */
export const sectionColorFields: Record<string, { key: string; label: string }[]> = {
  hero: [
    { key: 'headline', label: 'Headline' },
    { key: 'subheadline', label: 'Subheadline' },
    { key: 'badge', label: 'Badge' },
  ],
  problems: [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'itemTitle', label: 'Item Title' },
    { key: 'itemDescription', label: 'Item Description' },
  ],
  features: [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'itemTitle', label: 'Item Title' },
    { key: 'itemDescription', label: 'Item Description' },
  ],
  steps: [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'itemTitle', label: 'Item Title' },
    { key: 'itemDescription', label: 'Item Description' },
  ],
  tutorial: [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
  ],
  about_creator: [
    { key: 'title', label: 'Title' },
    { key: 'paragraphs', label: 'Paragraphs' },
    { key: 'signature', label: 'Signature' },
  ],
  about_optiplan: [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'heading', label: 'Heading' },
    { key: 'description', label: 'Description' },
  ],
  faqs: [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'question', label: 'Question' },
    { key: 'answer', label: 'Answer' },
  ],
  testimonials: [
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'quote', label: 'Quote' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
  ],
  cta: [
    { key: 'headline', label: 'Headline' },
    { key: 'subheadline', label: 'Subheadline' },
    { key: 'disclaimer', label: 'Disclaimer' },
  ],
};
