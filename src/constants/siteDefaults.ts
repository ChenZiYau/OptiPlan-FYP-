/**
 * Default content for each site_content section.
 * Used by the "Reset to default" feature in the admin content editor.
 */

export const siteDefaults: Record<string, Record<string, unknown>> = {
  hero: {
    badge: '',
    headline: 'Make your days',
    subheadline:
      'Your all-in-one student dashboard for tasks, schedules, finances, and wellness — with an AI chatbot that helps you manage it all. Plan less. Do more.',
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
        title: 'Inefficient Study Sessions',
        description:
          'Students spend hours re-reading slides instead of actively studying. No one has time to manually create flashcards, quizzes, or summaries.',
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
        title: 'Task & Schedule Management',
        description:
          'Organize your week with a visual timetable, manage tasks with Kanban boards, and track events and study sessions — all in one place.',
        checklist: [
          'Weekly timetable with color-coded subjects',
          'Kanban board with drag-and-drop',
          'AI chatbot for quick task creation',
        ],
        backContent:
          'Build your weekly class schedule with multi-day support and 8 color options. Manage tasks, events, and study sessions with a Kanban board or list view. Filter by status, importance, or type — or just tell the AI chatbot what you need and it creates it for you.',
      },
      {
        title: 'AI Study Hub',
        description:
          'Upload your documents and let AI generate study notes, flashcards, quizzes, and interactive mind maps — all from your own material.',
        checklist: [
          'AI-generated notes, flashcards, and quizzes',
          'Interactive mind maps with expandable nodes',
          'Supports PDF, PPTX, DOCX, and more',
        ],
        backContent:
          'Upload your lecture slides, PDFs, or documents and the AI extracts and chunks the content automatically. Then generate structured study notes, flashcards with spaced repetition tracking, multiple-choice quizzes with explanations, and interactive mind maps — all powered by Groq\'s Llama model.',
      },
      {
        title: 'Budget Tracking',
        description:
          'See where your money goes with quick expense logging and category breakdowns.',
        checklist: [
          'Quick-add expenses via modal or AI chatbot',
          'Category breakdown donut charts',
          'Budget limits with progress tracking',
        ],
        backContent:
          'Set monthly budgets per category, log expenses with a quick modal or through the AI chatbot, and see clear breakdowns with donut charts and spending trends. Track daily, weekly, and monthly spending at a glance.',
      },
    ],
  },
  steps: {
    badge: 'How it works',
    title: 'Three steps to a calmer day',
    subtitle:
      'Getting started is simple. Sign up, set up your dashboard, and start getting things done.',
    items: [
      {
        number: '01',
        title: 'Set Up',
        description:
          'Create your account and add your class schedule, tasks, and budget categories. The dashboard is ready in minutes.',
      },
      {
        number: '02',
        title: 'Organize',
        description:
          'Manage your tasks with Kanban boards, track spending by category, and build daily habits — or let the AI chatbot handle it through conversation.',
      },
      {
        number: '03',
        title: 'Grow',
        description:
          'Earn XP for every action, unlock achievements, track your mood and habits, and review your semester progress with Wrapped.',
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
      'OptiPlan started as a side project during finals week. I was drowning in scattered schedules, untracked spending, and hours wasted re-reading slides — and I knew other students felt the same way.',
      'So I built the tool I wish I\'d had freshman year: one place to manage your tasks, generate study material with AI, and track your budget. No bloat, no learning curve — just the essentials done right.',
    ],
    signature: '— The OptiPlan Team',
  },
  about_optiplan: {
    badge: 'About OptiPlan',
    title: 'One app to replace them all',
    subtitle:
      'Tasks, AI study tools, and budget — unified in a single student-first platform.',
    heading: 'Designed around the student day',
    description:
      'OptiPlan brings your tasks, class schedule, AI-powered study tools, and spending into one dashboard so you always know what\'s next — and what\'s left in your wallet.',
    checklist: [
      'Replace 3+ apps with one dashboard',
      'Built specifically for student workflows',
      'AI chatbot that creates tasks, expenses, and schedules through conversation',
    ],
  },
  faqs: {
    badge: 'FAQ',
    title: 'Frequently asked questions',
    subtitle: 'Everything you need to know about OptiPlan.',
    items: [
      {
        question: 'What features does OptiPlan include?',
        answer:
          'OptiPlan includes task management with Kanban boards, a weekly class timetable, finance tracking with category budgets, wellness tools (mood, habits, journaling), a gamification system with 100 achievements, collaboration features, an AI chatbot for quick creation, and a semester-in-review Wrapped feature.',
      },
      {
        question: 'Is my data secure and private?',
        answer:
          'Yes. Your data is stored securely with Supabase and is only accessible to you. We never sell your information, show ads, or share your personal data with third parties. Your privacy is our top priority.',
      },
      {
        question: 'Can I use OptiPlan for team collaboration?',
        answer:
          'Yes! OptiPlan includes collaboration features where you can create groups, share tasks, exchange resources and links, and chat with group members.',
      },
      {
        question: 'What platforms does OptiPlan support?',
        answer:
          'OptiPlan is a web application that works in any modern browser on desktop, tablet, or mobile. Just sign up and access your dashboard from anywhere.',
      },
      {
        question: 'How does the AI chatbot work?',
        answer:
          'The AI chatbot lets you create tasks, log expenses, add schedule entries, and manage collaboration — all through natural conversation. Just type something like "$15 on lunch" or "Calculus class on Monday at 2pm" and it handles the rest.',
      },
      {
        question: 'Is OptiPlan free to use?',
        answer:
          'Yes! OptiPlan is completely free with full access to all features. Sign up and start using it right away — no credit card required.',
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
          'OptiPlan replaced three apps for me. My timetable, tasks, and budget are finally in one place — I actually feel organized for the first time since freshman year.',
        name: 'Sarah Martinez',
        role: 'Junior, Business Administration',
        initials: 'SM',
      },
      {
        quote:
          'The Kanban board and timetable are a game-changer. Dragging tasks between columns and seeing my whole week color-coded keeps me on track effortlessly.',
        name: 'James Chen',
        role: 'Senior, Computer Science',
        initials: 'JC',
      },
      {
        quote:
          'I used to blow through my monthly budget by week two. Setting category budgets and seeing the donut chart breakdown keeps me honest without feeling restrictive.',
        name: 'Emma Park',
        role: 'Sophomore, Pre-Med',
        initials: 'EP',
      },
      {
        quote:
          'The wellness tracker is surprisingly helpful. Daily mood check-ins and habit streaks keep me accountable, and journaling before bed has become my new routine.',
        name: 'Alex Chen',
        role: 'Med Student, Year 2',
        initials: 'AC',
      },
      {
        quote:
          'As a visual person, I love the interface. The Kanban board with color-coded tasks and the weekly timetable make prioritizing so much easier.',
        name: 'Priya Patel',
        role: 'Graphic Design Intern',
        initials: 'PP',
      },
      {
        quote:
          'The AI chatbot is my favorite feature. I just type "$12 on coffee" or "Math class Monday 2pm" and it creates everything for me. So much faster than filling out forms.',
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
    disclaimer: '',
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
