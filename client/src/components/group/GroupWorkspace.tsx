import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Copy, Crown, LogOut, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import {
  useInviteTripMember,
  useJoinTrip,
  useLeaveTrip,
  useRemoveTripMember,
  useTripMembers,
} from '../../services/groupService';
import { useOptionalAuth } from '../../store/AuthProvider';
import type { Trip } from '../../types/trip';

export interface GroupWorkspaceProps {
  trip: Trip;
}

export function GroupWorkspace({ trip }: GroupWorkspaceProps) {
  const auth = useOptionalAuth();
  const currentUserId = auth?.user?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const inviteTokenFromUrl = searchParams.get('invite');

  const { data, isLoading, error } = useTripMembers(trip._id);
  const inviteMember = useInviteTripMember(trip._id);
  const joinTrip = useJoinTrip(trip._id);
  const removeMember = useRemoveTripMember(trip._id);
  const leaveTrip = useLeaveTrip(trip._id);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'owner'>('member');
  const [inviteResult, setInviteResult] = useState<{ link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isOwner =
    Boolean(currentUserId) &&
    (data?.tripOwnerId === currentUserId ||
      data?.members.some((m) => m.user?._id === currentUserId && m.role === 'owner'));

  // If user opens link with ?invite=token, automatically offer join
  const handleJoinByToken = async () => {
    if (!inviteTokenFromUrl) return;
    setActionError(null);
    try {
      await joinTrip.mutateAsync(inviteTokenFromUrl);
      searchParams.delete('invite');
      setSearchParams(searchParams);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to join trip. The invitation may be invalid or expired.',
      );
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    if (!inviteEmail.trim()) return;

    try {
      const res = await inviteMember.mutateAsync({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      const link = `${window.location.origin}/trips/${trip._id}/group?invite=${res.inviteToken}`;
      setInviteResult({ link });
      setInviteEmail('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send invitation.');
    }
  };

  const handleCopyLink = async () => {
    if (!inviteResult?.link) return;
    try {
      await navigator.clipboard.writeText(inviteResult.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this traveler from the trip?')) return;
    try {
      await removeMember.mutateAsync(memberId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove member.');
    }
  };

  const handleLeave = async () => {
    if (
      !confirm(
        'Are you sure you want to leave this trip? You will lose access to its itinerary and expenses.',
      )
    )
      return;
    try {
      await leaveTrip.mutateAsync();
      window.location.href = '/trips';
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to leave trip.');
    }
  };

  if (isLoading) {
    return (
      <div className="group-loading-state" role="status">
        <span className="auth-spinner" aria-hidden="true" />
        <p>Loading travelers and companions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="group-error-box" role="alert">
        <p>Unable to load trip group members.</p>
      </div>
    );
  }

  const activeMembers = data?.members.filter((m) => m.status === 'active') ?? [];
  const pendingMembers = data?.members.filter((m) => m.status === 'pending') ?? [];

  return (
    <section className="group-workspace" aria-labelledby="group-heading">
      {/* Invite Token Banner if present in URL */}
      {inviteTokenFromUrl && (
        <aside className="group-invite-alert" aria-label="Trip invitation">
          <div className="invite-alert-content">
            <UserPlus className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <div>
              <strong>You've been invited to join "{trip.name}"!</strong>
              <p>
                Click below to join this trip group and collaborate on itineraries and expenses.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="invite-join-btn"
            onClick={handleJoinByToken}
            disabled={joinTrip.isPending}
          >
            {joinTrip.isPending ? 'Joining…' : 'Accept & Join Trip'}
          </button>
        </aside>
      )}

      {actionError && (
        <div className="group-error-banner" role="alert">
          {actionError}
        </div>
      )}

      {/* Header with Title and Actions */}
      <div className="group-header">
        <div>
          <span className="group-eyebrow">GROUP COMPANIONS</span>
          <h2 id="group-heading">Trip Travelers ({activeMembers.length})</h2>
        </div>
        <div className="group-header-actions">
          {isOwner && (
            <button
              type="button"
              className="group-invite-btn"
              onClick={() => {
                setShowInviteModal(true);
                setInviteResult(null);
                setActionError(null);
              }}
            >
              <UserPlus size={16} /> Invite Traveler
            </button>
          )}
          {!isOwner && (
            <button
              type="button"
              className="group-leave-btn"
              onClick={handleLeave}
              disabled={leaveTrip.isPending}
            >
              <LogOut size={15} /> Leave Trip
            </button>
          )}
        </div>
      </div>

      {/* Active Members Grid */}
      <div className="group-members-grid">
        {activeMembers.map((member) => {
          const isUserOwner = member.role === 'owner';
          const name = member.user?.name ?? member.invitedEmail ?? 'Traveler';
          const email = member.user?.email ?? member.invitedEmail;

          return (
            <article key={member._id} className="group-member-card">
              <div className="member-avatar">{name.slice(0, 2).toUpperCase()}</div>
              <div className="member-details">
                <div className="member-name-row">
                  <h3 className="member-name">{name}</h3>
                  {isUserOwner ? (
                    <span className="member-role-badge badge-owner">
                      <Crown size={12} className="mr-1" /> Trip Owner
                    </span>
                  ) : (
                    <span className="member-role-badge badge-member">
                      <Users size={12} className="mr-1" /> Member
                    </span>
                  )}
                </div>
                {email && <p className="member-email">{email}</p>}
                {member.joinedAt && (
                  <span className="member-joined-date">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {isOwner && !isUserOwner && (
                <button
                  type="button"
                  className="member-remove-btn"
                  title="Remove traveler"
                  aria-label={`Remove ${name}`}
                  onClick={() => handleRemove(member._id)}
                  disabled={removeMember.isPending}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </article>
          );
        })}
      </div>

      {/* Pending Invitations Section */}
      {isOwner && pendingMembers.length > 0 && (
        <div className="group-pending-section">
          <h3 className="group-subheading">Pending Invitations ({pendingMembers.length})</h3>
          <div className="pending-members-list">
            {pendingMembers.map((inv) => (
              <div key={inv._id} className="pending-member-item">
                <div className="pending-info">
                  <Mail size={16} className="text-amber-500" />
                  <span>{inv.invitedEmail}</span>
                  <span className="pending-status-pill">Pending Acceptance</span>
                </div>
                <div className="pending-actions">
                  {inv.inviteToken && (
                    <button
                      type="button"
                      className="pending-copy-btn"
                      onClick={() => {
                        const link = `${window.location.origin}/trips/${trip._id}/group?invite=${inv.inviteToken}`;
                        navigator.clipboard.writeText(link);
                        alert('Invitation link copied to clipboard!');
                      }}
                    >
                      <Copy size={14} /> Copy Link
                    </button>
                  )}
                  <button
                    type="button"
                    className="pending-cancel-btn"
                    onClick={() => handleRemove(inv._id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-modal-title"
        >
          <div className="group-modal-card">
            <h3 id="invite-modal-title" className="group-modal-title">
              Invite Traveler to Trip
            </h3>
            <p className="group-modal-desc">
              Invite friends or companions by email. They will receive a secure token to join and
              collaborate.
            </p>

            {!inviteResult ? (
              <form onSubmit={handleSendInvite} className="group-invite-form">
                <label className="form-label">
                  Traveler's Email Address
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="companion@example.com"
                    className="form-input"
                  />
                </label>

                <label className="form-label">
                  Role
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'member' | 'owner')}
                    className="form-input"
                  >
                    <option value="member">Member (can add itinerary and expenses)</option>
                    <option value="owner">Co-Owner (full trip control)</option>
                  </select>
                </label>

                {actionError && <p className="modal-error-text">{actionError}</p>}

                <div className="modal-btn-row">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={inviteMember.isPending}
                  >
                    {inviteMember.isPending ? 'Generating…' : 'Generate Invitation'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="invite-generated-box">
                <div className="invite-success-header">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <strong>Invitation Link Ready!</strong>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Share this secure link with your traveler:
                </p>
                <div className="invite-link-row">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.link}
                    className="invite-link-input"
                  />
                  <button type="button" onClick={handleCopyLink} className="invite-copy-btn">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  type="button"
                  className="modal-submit-btn mt-4 w-full"
                  onClick={() => setShowInviteModal(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
