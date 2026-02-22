export interface AgendaItem {
  title: string;
  time: string;
  type: 'meeting' | 'focus';
}

export const agendaItems: AgendaItem[] = [
  { title: 'Design review', time: '09:00', type: 'meeting' },
  { title: 'Deep work block', time: '10:30', type: 'focus' },
  { title: 'Team sync', time: '14:00', type: 'meeting' },
];
