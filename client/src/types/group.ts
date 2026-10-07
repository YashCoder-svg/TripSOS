export type TripMemberRole = 'owner' | 'member';
export type TripMemberStatus = 'pending' | 'active' | 'declined';

export interface TripMemberUser {
  _id: string;
  name: string;
  email?: string;
  profilePhoto?: string;
}

export interface TripMember {
  _id: string;
  trip: string;
  user?: TripMemberUser | null;
  invitedEmail?: string | null;
  role: TripMemberRole;
  status: TripMemberStatus;
  inviteToken?: string | null;
  inviteExpiresAt?: string | null;
  joinedAt?: string | null;
  createdAt: string;
}

export interface InviteMemberRequest {
  email: string;
  role?: TripMemberRole;
}

export interface InviteMemberResponse {
  member: TripMember;
  inviteToken: string;
  inviteLink: string;
}
