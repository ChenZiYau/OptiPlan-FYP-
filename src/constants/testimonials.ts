export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export const testimonials: Testimonial[] = [
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
      'I connected my Google Calendar and my budgeting app. The sync is flawless. Finally having a "single source of truth" for my entire life is a game-changer.',
    name: 'Marcus Johnson',
    role: 'Engineering, Year 3',
    initials: 'MJ',
  },
];
