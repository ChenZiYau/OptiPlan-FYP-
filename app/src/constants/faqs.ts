export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: 'How does OptiPlan integrate with my existing tools?',
    answer:
      "OptiPlan connects seamlessly with Google Calendar, Outlook, Apple Calendar, Notion, Asana, and Trello. Simply authorize the connection and we'll sync your events and tasks automatically. Changes are reflected in real-time across all platforms.",
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
];
