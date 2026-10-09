import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell,
  Check,
  Copy,
  Crown,
  Hash,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Navigation,
  Pin,
  Send,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  useInviteTripMember,
  useJoinTrip,
  useLeaveTrip,
  usePinTripMessage,
  useRemoveTripMember,
  useSendTripMessage,
  useTripMembers,
  useTripMessages,
} from '../../services/groupService';
import { useOptionalAuth } from '../../store/AuthProvider';
import { getSocket } from '../../services/socketService';
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

  // Group Workspace tab: 'members' | 'chat' | 'location'
  const [activeTab, setActiveTab] = useState<'members' | 'chat' | 'location'>('members');

  // Trip code copy feedback
  const [codeCopied, setCodeCopied] = useState(false);

  // Chat state
  const { data: messages = [] } = useTripMessages?.(trip._id) ?? { data: [] };
  const sendMessageMutation = useSendTripMessage?.(trip._id);
  const pinMessageMutation = usePinTripMessage?.(trip._id);
  const [chatInput, setChatInput] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  // Live member location sharing
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [memberLocations, setMemberLocations] = useState<
    Array<{ userId: string; userName: string; latitude: number; longitude: number; updatedAt: string }>
  >([]);

  // Socket room connection
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join:trip', { tripId: trip._id });

    socket.on(
      'member:location_update',
      (loc: { userId: string; userName: string; latitude: number; longitude: number; updatedAt: string }) => {
        setMemberLocations((prev) => {
          const filtered = prev.filter((p) => p.userId !== loc.userId);
          return [...filtered, loc];
        });
      },
    );

    return () => {
      socket.emit('leave:trip', { tripId: trip._id });
      socket.off('member:location_update');
    };
  }, [trip._id]);

  // Geolocation watch when sharing is toggled on
  useEffect(() => {
    if (!isSharingLocation || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const socket = getSocket();
        socket.emit('member:location', {
          tripId: trip._id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn('Location broadcast note:', err);
      },
      { enableHighAccuracy: true, timeout: 20000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isSharingLocation, trip._id]);

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

  const handleCopyTripCode = async () => {
    const code = trip.tripCode || 'TRP-82K7';
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !sendMessageMutation) return;

    try {
      await sendMessageMutation.mutateAsync({
        content: chatInput.trim(),
        type: isAnnouncement ? 'announcement' : 'chat',
        pinned: isAnnouncement,
      });
      setChatInput('');
      setIsAnnouncement(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send message.');
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
  const tripCode = trip.tripCode || 'TRP-82K7';

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

      {/* Trip Code Card */}
      <div className="bg-white border border-[var(--line)] rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(23,58,50,0.08)] border border-[rgba(23,58,50,0.15)] flex items-center justify-center text-[var(--forest)] font-mono text-lg font-bold">
            <Hash size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold">Group Trip Code</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[rgba(23,58,50,0.1)] text-[var(--forest)]">Instant Join</span>
            </div>
            <p className="text-base text-[var(--forest)] mt-0.5 font-mono font-bold tracking-wider">
              {tripCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyTripCode}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--paper-light)] hover:bg-[var(--paper)] text-[var(--ink)] text-xs font-bold border border-[var(--line)] transition"
          >
            {codeCopied ? <Check size={14} className="text-[var(--forest)]" /> : <Copy size={14} />}
            {codeCopied ? 'Code Copied!' : 'Copy Trip Code'}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'members'
              ? 'bg-[var(--forest)] text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-white'
          }`}
        >
          <Users size={15} /> Travelers ({activeMembers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'chat'
              ? 'bg-[var(--forest)] text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-white'
          }`}
        >
          <MessageSquare size={15} /> Trip Chat & Updates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('location')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'location'
              ? 'bg-[var(--forest)] text-white shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-white'
          }`}
        >
          <Navigation size={15} /> Live Buddies ({memberLocations.length})
        </button>
      </div>

      {activeTab === 'members' && (
        <>
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
            <div className="group-pending-section mt-8">
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
        </>
      )}

      {activeTab === 'chat' && (
        <div className="bg-white border border-[var(--line)] rounded-2xl p-4 sm:p-6 flex flex-col h-[520px] shadow-sm">
          {/* Announcements Banner */}
          {messages.some((m) => m.pinned) && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1 text-amber-800">
                <Pin size={13} /> Pinned Announcement
              </div>
              {messages
                .filter((m) => m.pinned)
                .map((m) => (
                  <p key={m._id} className="mt-1">
                    <strong>{m.senderName}:</strong> {m.content}
                  </p>
                ))}
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--muted)] text-sm">
                <MessageSquare size={32} className="mb-2 opacity-40 text-[var(--forest)]" />
                <p>No messages yet. Send a note or announcement to your companions!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === currentUserId;
                const isAlert = m.type === 'announcement' || m.type === 'alert';
                return (
                  <div
                    key={m._id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[var(--muted)]">
                      <span className="font-semibold text-[var(--ink)]">{m.senderName}</span>
                      <span>·</span>
                      {m.pinned && <Pin size={11} className="text-amber-600 ml-1 fill-amber-600" />}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => pinMessageMutation?.mutate(m._id)}
                          className="opacity-60 hover:opacity-100 text-[10px] text-[var(--muted)] hover:text-amber-600 cursor-pointer transition"
                          title={m.pinned ? 'Unpin message' : 'Pin message'}
                        >
                          <Pin size={11} className={m.pinned ? 'text-amber-600' : 'text-[var(--muted)]'} />
                        </button>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        isAlert
                          ? 'bg-amber-50 border border-amber-300 text-amber-950 font-medium'
                          : isMe
                            ? 'bg-[var(--forest)] text-white rounded-br-none shadow-sm'
                            : 'bg-[var(--paper-light)] text-[var(--ink)] rounded-bl-none border border-[var(--line)]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-[var(--line)] flex flex-col gap-2">
            {isOwner && (
              <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer self-start select-none font-medium">
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  onChange={(e) => setIsAnnouncement(e.target.checked)}
                  className="rounded border-[var(--line)] text-amber-600 focus:ring-0"
                />
                <Bell size={13} className="text-amber-600" /> Pin as official trip announcement
              </label>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isAnnouncement ? 'Post an official trip announcement…' : 'Type a message to the group…'}
                className="flex-1 bg-[var(--paper-light)] border border-[var(--line)] rounded-xl px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--forest)]"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-5 py-2.5 bg-[var(--forest)] hover:bg-[#235449] disabled:opacity-40 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Send size={15} /> Send
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'location' && (
        <div className="bg-white border border-[var(--line)] rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                <Navigation size={18} className="text-[var(--forest)]" /> Live Buddy Location Broadcast
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1 max-w-xl line-height-relaxed">
                Optionally broadcast your approximate coordinates to authorized companions in "{trip.name}" during outdoor excursions or crowded festivals. Coordinates are transmitted only while toggled on and never saved permanently.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSharingLocation(!isSharingLocation)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                isSharingLocation
                  ? 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                  : 'bg-[var(--forest)] hover:bg-[#235449] text-white shadow-sm'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSharingLocation ? 'bg-rose-500 animate-pulse' : 'bg-emerald-300'}`} />
              {isSharingLocation ? 'Stop Broadcasting Location' : 'Start Sharing with Group'}
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
              Active Companions Sharing ({memberLocations.length})
            </h4>
            {memberLocations.length === 0 ? (
              <div className="p-8 text-center bg-[var(--paper-light)] rounded-xl border border-[var(--line)] text-[var(--muted)] text-sm">
                <MapPin size={28} className="mx-auto mb-2 opacity-40 text-[var(--forest)]" />
                <p className="font-semibold text-[var(--ink)]">No companions currently broadcasting live coordinates.</p>
                <p className="text-xs text-[var(--muted)] mt-1">When buddies turn on sharing, their live position pins will appear here in real time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {memberLocations.map((m) => (
                  <div
                    key={m.userId}
                    className="p-3.5 bg-[var(--paper-light)] rounded-xl border border-[var(--line)] flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[rgba(23,58,50,0.1)] text-[var(--forest)] font-bold flex items-center justify-center text-xs">
                        {m.userName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--ink)]">{m.userName}</div>
                        <div className="text-[11px] text-[var(--muted)] font-mono">
                          {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-[var(--paper)] text-[11px] text-[var(--forest)] font-bold border border-[var(--line)] shadow-2xs"
                    >
                      Locate
                    </a>
                  </div>
                ))}
              </div>
            )}
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
