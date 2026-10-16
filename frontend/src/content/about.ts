// Owner: agent/backend (values). Shape: ./types.ts (manager).
// The description is the manager's facts-only DRAFT (approved design §5.13); the owner will edit it.
import type { About } from './types';

export const about: About = {
  description:
    "I study computer science and math at Pomona College. Most of what I build is for someone specific: my classmates, people navigating Los Angeles sidewalks, and the youth ministry at the church where I'm music director.",
  descriptionIsDraft: true,
  classes: {
    label: 'This semester',
    items: ['Linear Algebra', 'Data Structures and Algorithms'],
  },
  // Five slots matching wireframe p3, in reading order. Images and captions come from the owner later.
  photos: [
    { id: 'photo-1', aspect: '4:3', image: null, alt: null, caption: null },
    { id: 'photo-2', aspect: '2:3', image: null, alt: null, caption: null },
    { id: 'photo-3', aspect: '4:3', image: null, alt: null, caption: null },
    { id: 'photo-4', aspect: '9:16', image: null, alt: null, caption: null },
    { id: 'photo-5', aspect: '4:3', image: null, alt: null, caption: null },
  ],
};
