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
      <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-lg font-bold">
            <Hash size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Group Trip Code</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">Instant Join</span>
            </div>
            <p className="text-sm text-slate-300 mt-0.5 font-mono font-bold tracking-wider text-emerald-400 text-base">
              {tripCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyTripCode}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            {codeCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {codeCopied ? 'Code Copied!' : 'Copy Trip Code'}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'members'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={16} /> Travelers ({activeMembers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'chat'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare size={16} /> Trip Chat & Updates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('location')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            activeTab === 'location'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation size={16} /> Live Buddies ({memberLocations.length})
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
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col h-[500px]">
          {/* Announcements Banner */}
          {messages.some((m) => m.pinned) && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider mb-1 text-amber-300">
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
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <MessageSquare size={32} className="mb-2 opacity-50" />
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
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">{m.senderName}</span>
                      <span>·</span>
                      {m.pinned && <Pin size={11} className="text-amber-400 ml-1 fill-amber-400" />}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => pinMessageMutation?.mutate(m._id)}
                          className="opacity-50 hover:opacity-100 text-[10px] text-slate-400 hover:text-amber-400 cursor-pointer transition"
                          title={m.pinned ? 'Unpin message' : 'Pin message'}
                        >
                          <Pin size={11} className={m.pinned ? 'text-amber-400' : 'text-slate-400'} />
                        </button>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        isAlert
                          ? 'bg-amber-950/40 border border-amber-600/40 text-amber-100'
                          : isMe
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
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
          <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
            {isOwner && (
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer self-start select-none">
                <input
                  type="checkbox"
                  checked={isAnnouncement}
                  onChange={(e) => setIsAnnouncement(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <Bell size={13} className="text-amber-400" /> Pin as official trip announcement
              </label>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isAnnouncement ? 'Post an official trip announcement…' : 'Type a message to the group…'}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition"
              >
                <Send size={15} /> Send
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'location' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Navigation size={18} className="text-emerald-400" /> Live Buddy Location Broadcast
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Optionally broadcast your approximate coordinates to authorized companions in "{trip.name}" during outdoor excursions or crowded festivals. Location is transmitted only when toggled on and never saved permanently.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSharingLocation(!isSharingLocation)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                isSharingLocation
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSharingLocation ? 'bg-rose-400 animate-pulse' : 'bg-slate-950'}`} />
              {isSharingLocation ? 'Stop Broadcasting Location' : 'Start Sharing with Group'}
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Active Companions Sharing ({memberLocations.length})
            </h4>
            {memberLocations.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 text-slate-500 text-sm">
                <MapPin size={28} className="mx-auto mb-2 opacity-50" />
                <p>No companions currently broadcasting live coordinates.</p>
                <p className="text-xs text-slate-600 mt-1">When buddies turn on sharing, their live position pins will appear here in real time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {memberLocations.map((m) => (
                  <div
                    key={m.userId}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                        {m.userName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{m.userName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-400 font-medium"
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
