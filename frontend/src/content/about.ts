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
  // The owner's photos, oldest first by capture date (TASK-310). Captions come from the owner later.
  photos: [
    { id: 'photo-1', aspect: '2:3', image: 'life/photo-1', alt: 'A glass pavilion glowing at night, reflected in a wet plaza', caption: null },
    { id: 'photo-2', aspect: '4:3', image: 'life/photo-2', alt: 'Cloud-topped mountains behind white buildings with red tile roofs', caption: null },
    { id: 'photo-3', aspect: '3:2', image: 'life/photo-3', alt: 'The sun setting over the ocean as waves break toward shore', caption: null },
    { id: 'photo-4', aspect: '4:3', image: 'life/photo-4', alt: 'A valley of granite cliffs lit pink at dusk above a pine forest, with a waterfall on the right', caption: null },
    { id: 'photo-5', aspect: '2:3', image: 'life/photo-5', alt: 'Slices of medium-rare steak on a white plate', caption: null },
    { id: 'photo-6', aspect: '2:3', image: 'life/photo-6', alt: 'City towers lit up at night above a quiet street', caption: null },
    { id: 'photo-7', aspect: '4:3', image: 'life/photo-7', alt: 'Two people hitting golf balls at a driving range under tall nets', caption: null },
    { id: 'photo-8', aspect: '2:3', image: 'life/photo-8', alt: 'Bibimbap with a fried egg, soup, and small side dishes on a wooden table, seen from above', caption: null },
    { id: 'photo-9', aspect: '2:3', image: 'life/photo-9', alt: 'A young man in a white T-shirt and cross necklace eating from a stone bowl', caption: null },
    { id: 'photo-10', aspect: '9:16', image: 'life/photo-10', alt: 'A young man playing an acoustic guitar in a shop with guitars hanging on the wall', caption: null },
  ],
};
