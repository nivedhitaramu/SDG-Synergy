export type Badge = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  category: 'community' | 'connections' | 'projects' | 'sdg';
};

export type EarnedBadge = Badge & {
  earned: boolean;
  earnedAt?: string;
};

export const ALL_BADGES: Badge[] = [
  // Community
  {
    id: 'verified',
    name: 'Verified Member',
    description: 'Verified your email address',
    emoji: '✅',
    color: '#22c55e',
    category: 'community',
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined as one of the first 25 members',
    emoji: '🚀',
    color: '#8b5cf6',
    category: 'community',
  },
  {
    id: 'profile_complete',
    name: 'Profile Pro',
    description: 'Completed your full profile with expertise & address',
    emoji: '🌟',
    color: '#f59e0b',
    category: 'community',
  },

  // Connections
  {
    id: 'first_connection',
    name: 'First Connection',
    description: 'Made your first active connection',
    emoji: '🤝',
    color: '#3b82f6',
    category: 'connections',
  },
  {
    id: 'networker',
    name: 'Networker',
    description: 'Made 3 or more active connections',
    emoji: '🌐',
    color: '#06b6d4',
    category: 'connections',
  },
  {
    id: 'super_connector',
    name: 'Super Connector',
    description: 'Made 5 or more active connections',
    emoji: '⚡',
    color: '#f97316',
    category: 'connections',
  },

  // Projects
  {
    id: 'project_creator',
    name: 'Project Creator',
    description: 'Launched your first project',
    emoji: '💡',
    color: '#ec4899',
    category: 'projects',
  },
  {
    id: 'collaborator',
    name: 'Collaborator',
    description: 'Joined a project as a team member',
    emoji: '🧩',
    color: '#14b8a6',
    category: 'projects',
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Contributing to 3 or more projects',
    emoji: '🏆',
    color: '#eab308',
    category: 'projects',
  },

  // SDG Focus
  {
    id: 'sdg_champion',
    name: 'SDG Champion',
    description: 'Selected your 3 focus SDG goals',
    emoji: '🎯',
    color: '#10b981',
    category: 'sdg',
  },
  {
    id: 'climate_action',
    name: 'Climate Guardian',
    description: 'Focused on SDG 13: Climate Action',
    emoji: '🌍',
    color: '#3f7e44',
    category: 'sdg',
  },
  {
    id: 'no_poverty',
    name: 'Poverty Fighter',
    description: 'Focused on SDG 1: No Poverty',
    emoji: '🏘️',
    color: '#e5243b',
    category: 'sdg',
  },
  {
    id: 'good_health',
    name: 'Health Hero',
    description: 'Focused on SDG 3: Good Health & Well-being',
    emoji: '❤️',
    color: '#4c9f38',
    category: 'sdg',
  },
  {
    id: 'quality_education',
    name: 'Education Advocate',
    description: 'Focused on SDG 4: Quality Education',
    emoji: '📚',
    color: '#c5192d',
    category: 'sdg',
  },
  {
    id: 'gender_equality',
    name: 'Equality Champion',
    description: 'Focused on SDG 5: Gender Equality',
    emoji: '⚖️',
    color: '#ff3a21',
    category: 'sdg',
  },
  {
    id: 'clean_energy',
    name: 'Energy Pioneer',
    description: 'Focused on SDG 7: Affordable & Clean Energy',
    emoji: '☀️',
    color: '#fcc30b',
    category: 'sdg',
  },
  {
    id: 'life_on_land',
    name: 'Nature Protector',
    description: 'Focused on SDG 15: Life on Land',
    emoji: '🌿',
    color: '#56c02b',
    category: 'sdg',
  },
];

export type BadgeComputeInput = {
  userId: number;
  emailVerified: boolean;
  expertise: string;
  address: string;
  sdgs: number[];
  activeMatchCount: number;
  ownedProjectCount: number;
  joinedProjectCount: number;
};

export function computeBadges(input: BadgeComputeInput): EarnedBadge[] {
  const totalProjects = input.ownedProjectCount + input.joinedProjectCount;

  const earned = new Set<string>();

  if (input.emailVerified) earned.add('verified');
  if (input.userId <= 25) earned.add('early_adopter');
  if (input.expertise?.trim().length > 3 && input.address?.trim().length > 3) earned.add('profile_complete');
  if (input.activeMatchCount >= 1) earned.add('first_connection');
  if (input.activeMatchCount >= 3) earned.add('networker');
  if (input.activeMatchCount >= 5) earned.add('super_connector');
  if (input.ownedProjectCount >= 1) earned.add('project_creator');
  if (input.joinedProjectCount >= 1) earned.add('collaborator');
  if (totalProjects >= 3) earned.add('team_player');
  if (input.sdgs.length >= 3) earned.add('sdg_champion');
  if (input.sdgs.includes(13)) earned.add('climate_action');
  if (input.sdgs.includes(1)) earned.add('no_poverty');
  if (input.sdgs.includes(3)) earned.add('good_health');
  if (input.sdgs.includes(4)) earned.add('quality_education');
  if (input.sdgs.includes(5)) earned.add('gender_equality');
  if (input.sdgs.includes(7)) earned.add('clean_energy');
  if (input.sdgs.includes(15)) earned.add('life_on_land');

  return ALL_BADGES.map(badge => ({
    ...badge,
    earned: earned.has(badge.id),
  }));
}
