// Owner: agent/backend (values). Shape: ./types.ts (manager). Copy approved 2026-10-16.
import { email, github, linkedin } from './contact';
import type { Site } from './types';

export const site: Site = {
  name: 'Emanuel Ling',
  tagline: 'CS + Math @ Pomona College',
  origin: 'https://emanuel-ling.vercel.app',
  title: 'Emanuel Ling · CS + Math @ Pomona College',
  description:
    'Emanuel Ling studies computer science and math at Pomona College and builds software for his classmates, Los Angeles pedestrians, and his church.',
  updated: '2026-10-23',
  nav: [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ],
  heroImage: 'backgrounds/alpine-valley',
  sectionsImage: 'backgrounds/evergreen-forest',
  heroLinks: [linkedin, email, github],
};
