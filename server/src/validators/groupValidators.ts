import { z } from 'zod';

export const inviteMemberSchema = z.object({
  email: z.string().email('Please provide a valid email address.').toLowerCase().trim(),
  role: z.enum(['owner', 'member']).default('member'),
});

export const joinTripSchema = z.object({
  inviteToken: z.string().trim().min(10, 'Invalid invitation token.'),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type JoinTripInput = z.infer<typeof joinTripSchema>;
