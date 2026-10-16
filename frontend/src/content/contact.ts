// Owner: agent/backend (values). Shape: ./types.ts (manager).
import type { Contact, Link } from './types';

export const linkedin: Link = {
  kind: 'linkedin',
  label: 'LinkedIn',
  href: 'https://www.linkedin.com/in/emanuel-ling-915a73244',
};
export const email: Link = { kind: 'email', label: 'Email', href: 'mailto:emanuelling27@gmail.com' };
export const github: Link = { kind: 'github', label: 'GitHub', href: 'https://github.com/EmanuelPomona' };

export const contact: Contact = { links: [linkedin, email, github] };
