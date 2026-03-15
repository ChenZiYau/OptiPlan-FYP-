export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
}

export const testimonials: Testimonial[] = [
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
];
