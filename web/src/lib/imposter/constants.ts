export const IMPOSTER_TOPICS: Record<string, string[]> = {
  Athletes: [
    'LeBron James',
    'Serena Williams',
    'Lionel Messi',
    'Simone Biles',
    'Patrick Mahomes',
    'ShaCarri Richardson',
    'Giannis Antetokounmpo',
    'Megan Rapinoe',
  ],
  Foods: [
    'Sushi',
    'Tacos',
    'Pizza',
    'Ramen',
    'Falafel',
    'Pancakes',
    'Pad Thai',
    'Gelato',
  ],
  Animals: [
    'Red Panda',
    'Elephant',
    'Dolphin',
    'Cheetah',
    'Hedgehog',
    'Octopus',
    'Penguin',
    'Giraffe',
  ],
  Countries: [
    'Japan',
    'Brazil',
    'France',
    'Nigeria',
    'New Zealand',
    'Canada',
    'India',
    'Iceland',
  ],
  Careers: [
    'Software Engineer',
    'Chef',
    'Teacher',
    'Nurse',
    'Architect',
    'Pilot',
    'Photographer',
    'Lawyer',
  ],
  Movies: [
    'Inception',
    'Mean Girls',
    'The Godfather',
    'Spirited Away',
    'Mad Max: Fury Road',
    'Parasite',
    'The Matrix',
    'Finding Nemo',
  ],
  Celebrities: [
    'Beyonce',
    'Zendaya',
    'Dwayne Johnson',
    'Rihanna',
    'Harry Styles',
    'Taylor Swift',
    'Pedro Pascal',
    'Keanu Reeves',
  ],
  'Apps/Social media': [
    'Instagram',
    'TikTok',
    'Snapchat',
    'Twitter',
    'Reddit',
    'LinkedIn',
    'YouTube',
    'BeReal',
  ],
};

export const DEFAULT_TOPIC = 'Athletes';

export function getRandomWord(topic: string): string {
  const list = IMPOSTER_TOPICS[topic];
  if (!list || list.length === 0) {
    throw new Error('Invalid topic');
  }
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

export function getImposterCount(playerCount: number): number {
  if (playerCount >= 8) return 2;
  return 1;
}
