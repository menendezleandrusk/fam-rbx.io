export type TabType = 'public' | 'private' | 'security' | 'embed' | 'moderation' | 'simulator' | 'code';

export interface UserSession {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  isInstructor: boolean;
  instructorRank?: string;
  guildMember: boolean;
  detectedRoles?: string[];
}

export interface EmbedField {
  id: string;
  name: string;
  value: string;
  inline: boolean;
}

export interface DiscordEmbedData {
  title: string;
  description: string;
  color: string;
  authorName: string;
  authorIcon: string;
  thumbnail: string;
  image: string;
  footerText: string;
  footerIcon: string;
  timestamp: boolean;
  fields: EmbedField[];
}

export interface DiplomaRecord {
  id: string; // Hash code (e.g. FAM-CERT-2026-X9A2)
  cadetRoblox: string;
  cadetDiscordId: string;
  cadetDiscordTag: string;
  rank: string;
  course: string;
  notes?: string;
  issueDate: string;
  instructorName: string;
  instructorRank: string;
  instructorDiscordTag: string;
  baseLocation: string;
  status: 'VALID' | 'REVOKED';
  qrData: string;
  createdAt?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: 'BAN' | 'KICK' | 'WARN' | 'MUTE' | 'ROLE_CHANGE' | 'DIPLOMA_ISSUED' | 'VOICE_MOVE';
  target: string;
  executor: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AutoModRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  action: 'warn' | 'mute' | 'delete' | 'kick';
  threshold: string;
}

export interface ReactionRoleConfig {
  id: string;
  emoji: string;
  roleName: string;
  roleColor: string;
  description: string;
  count: number;
}

export interface BotCommandHelp {
  command: string;
  module: 'Anuncios' | 'Diplomas' | 'Moderación' | 'Verificación' | 'Utilidad';
  rankRequired: string;
  description: string;
  usage: string;
}
