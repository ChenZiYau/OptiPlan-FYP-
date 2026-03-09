export interface Problem {
  number: string;
  title: string;
  description: string;
}

export const problems: Problem[] = [
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
];
