export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
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
];
