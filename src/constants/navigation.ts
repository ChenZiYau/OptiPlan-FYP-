import {
  AlertTriangle,
  Layers,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Dropdown item with rich metadata ──────────────────────────────────────────

export interface DropdownItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

// ── Top-level nav: dropdowns + direct links ───────────────────────────────────

export interface NavGroup {
  label: string;
  items: DropdownItem[];
}

export interface NavDirectLink {
  label: string;
  href: string;
}

export type NavEntry =
  | { kind: 'dropdown'; group: NavGroup }
  | { kind: 'link'; link: NavDirectLink };

export const navEntries: NavEntry[] = [
  {
    kind: 'dropdown',
    group: {
      label: 'Product',
      items: [
        {
          label: 'The Problem',
          href: 'problem',
          description: 'Why students need a better tool',
          icon: AlertTriangle,
        },
        {
          label: 'Features',
          href: 'features',
          description: 'Smart scheduling, notes & budget',
          icon: Layers,
        },
      ],
    },
  },
  {
    kind: 'link',
    link: { label: 'About', href: 'about-creator' },
  },
  {
    kind: 'dropdown',
    group: {
      label: 'Resource',
      items: [
        {
          label: 'FAQ',
          href: 'faq',
          description: 'Common questions answered',
          icon: HelpCircle,
        },
        {
          label: 'Feedback',
          href: 'feedback',
          description: 'Help us improve OptiPlan',
          icon: MessageSquare,
        },
      ],
    },
  },
];

