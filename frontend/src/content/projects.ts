// Owner: agent/backend (values). Shape: ./types.ts (manager).
// Order and sentences approved by the owner on 2026-10-16 (approved design §7).
import type { Project } from './types';

export const projects: readonly Project[] = [
  {
    id: 'sageplan',
    title: 'SagePlan',
    sentence:
      'Shows a Pomona student which graduation requirements they have met and which courses offered next term would cover the rest.',
    meta: ['React', 'TypeScript'],
    primary: { kind: 'live', label: 'Live site', href: 'https://sageplan.vercel.app' },
    secondary: [{ kind: 'code', label: 'Code', href: 'https://github.com/EmanuelPomona/SagePlan' }],
    addressBar: 'sageplan.vercel.app',
    screen: {
      image: 'projects/sageplan',
      alt: 'SagePlan planner page with a pasted course history and the Breadth, Overlays, and Foundations requirement circles',
    },
  },
  {
    id: 'streetsafe-la',
    title: 'StreetSafe: LA',
    sentence:
      'A community-reported map of broken sidewalks and blocked paths in Los Angeles for wheelchair users, stroller users, and blind or low-vision pedestrians.',
    meta: ['3rd of 17 teams, CGU Hacks', 'Built with Jay Li'],
    primary: { kind: 'code', label: 'Code', href: 'https://github.com/EmanuelPomona/Street-Safe-LA' },
    secondary: [{ kind: 'devpost', label: 'Devpost', href: 'https://devpost.com/software/street-safe-la' }],
    addressBar: 'github.com/EmanuelPomona/Street-Safe-LA',
    screen: {
      image: 'projects/streetsafe-la',
      alt: 'Street-Safe: LA map of Los Angeles with orange hazard markers beside a list of 25 recent reports',
    },
  },
  {
    id: 'revelation-youth',
    title: 'Revelation Youth',
    sentence:
      'The website for the youth ministry at International Miracle Makers Church, giving its music, events, devotions, and merch one home.',
    meta: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    primary: { kind: 'live', label: 'Live site', href: 'https://revelation-youth.vercel.app' },
    secondary: [{ kind: 'code', label: 'Code', href: 'https://github.com/EmanuelPomona/Revelation-Youth' }],
    addressBar: 'revelation-youth.vercel.app',
    screen: {
      image: 'projects/revelation-youth',
      alt: 'Revelation Youth home page: the name in large serif over a blurred green background, with the tagline Just a Moment With God',
    },
  },
  {
    id: 'snake-ai',
    title: 'Snake AI',
    sentence:
      "A neural-network agent that teaches itself Snake by trial and error; its best game scored 35 against a random player's 0.13 average.",
    meta: ['Python', 'PyTorch'],
    primary: { kind: 'code', label: 'Code', href: 'https://github.com/EmanuelPomona/Snake-AI' },
    secondary: [],
    addressBar: 'github.com/EmanuelPomona/Snake-AI',
    screen: {
      image: 'projects/snake-ai',
      alt: 'The trained agent playing Snake: a green snake chasing a red square on a black field',
      video: { src: '/media/video/snake-ai.mp4', width: 1270, height: 954, posterTime: 11.989 },
    },
  },
];
