import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, LogOut, Plus, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { authService } from '../services/authService';
import { useAuth } from '../store/AuthProvider';
import type { EmergencyContact } from '../types/user';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(80),
  profilePhoto: z
    .string()
    .trim()
    .max(2048)
    .refine(
      (value) => !value || (URL.canParse(value) && new URL(value).protocol === 'https:'),
      'Use a secure image URL or leave this blank.',
    ),
  language: z
    .string()
    .regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,2}$/, 'Use a language code such as en or en-US.'),
  travelStyle: z.enum(['adventure', 'culture', 'relaxation', 'nature', 'food', 'mixed']),
  budgetPreference: z.enum(['budget', 'moderate', 'premium', 'flexible']),
  favoriteActivities: z.string(),
  dietaryPreferences: z.string(),
});
type ProfileFields = z.infer<typeof profileSchema>;

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, 'Use an international number such as +14155552671.'),
  relationship: z.enum(['family', 'friend', 'partner', 'colleague', 'other']),
  isPrimary: z.boolean(),
});
type ContactFields = z.infer<typeof contactSchema>;

function ContactForm({
  initial,
  idPrefix,
  submitLabel,
  onSave,
  onCancel,
}: {
  initial?: ContactFields;
  idPrefix?: string;
  submitLabel: string;
  onSave(values: ContactFields): Promise<void>;
  onCancel?: () => void;
}) {
  const fieldPrefix = idPrefix ?? 'new-contact';
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactFields>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    defaultValues: initial ?? { name: '', phone: '', relationship: 'family', isPrimary: false },
  });
  const submit = handleSubmit(async (values) => {
    setServerError('');
    try {
      await onSave(values);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to save this contact.');
    }
  });

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <div className="contact-form-grid">
        <div className="form-field">
          <label htmlFor={`${fieldPrefix}-name`}>Name</label>
          <input
            {...register('name')}
            id={`${fieldPrefix}-name`}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${fieldPrefix}-name-error` : undefined}
          />
          {errors.name && (
            <span className="form-field__error" id={`${fieldPrefix}-name-error`}>
              {errors.name.message}
            </span>
          )}
        </div>
        <div className="form-field">
          <label htmlFor={`${fieldPrefix}-phone`}>Phone number</label>
          <input
            {...register('phone')}
            id={`${fieldPrefix}-phone`}
            type="tel"
            autoComplete="tel"
            placeholder="+14155552671"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${fieldPrefix}-phone-error` : undefined}
          />
          {errors.phone && (
            <span className="form-field__error" id={`${fieldPrefix}-phone-error`}>
              {errors.phone.message}
            </span>
          )}
          <span className="profile-field-note">Include the country calling code.</span>
        </div>
        <div className="form-field">
          <label htmlFor={`${fieldPrefix}-relationship`}>Relationship</label>
          <select {...register('relationship')} id={`${fieldPrefix}-relationship`}>
            <option value="family">Family</option>
            <option value="friend">Friend</option>
            <option value="partner">Partner</option>
            <option value="colleague">Colleague</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <label className="checkbox-field">
        <input type="checkbox" {...register('isPrimary')} />
        <span>Set as primary emergency contact</span>
      </label>
      {serverError && (
        <p className="form-server-error" role="alert">
          {serverError}
        </p>
      )}
      <div className="profile-form-actions">
        <button type="submit" className="product-submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="quiet-action" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function ContactCard({
  contact,
  onPrimary,
  onDelete,
  onUpdate,
}: {
  contact: EmergencyContact;
  onPrimary(): Promise<void>;
  onDelete(): Promise<void>;
  onUpdate(values: ContactFields): Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update this contact.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="contact-card">
      <div className="contact-card-heading">
        <span className="contact-avatar">
          <UserRound size={18} />
        </span>
        <div>
          <h3>{contact.name}</h3>
          <p>
            {contact.relationship} · {contact.phone}
          </p>
        </div>
        {contact.isPrimary && (
          <span className="primary-contact-badge">
            <Check size={13} /> Primary
          </span>
        )}
      </div>
      {editing ? (
        <ContactForm
          idPrefix={`edit-contact-${contact._id}`}
          initial={{
            name: contact.name,
            phone: contact.phone,
            relationship: contact.relationship,
            isPrimary: contact.isPrimary,
          }}
          submitLabel="Save contact"
          onCancel={() => setEditing(false)}
          onSave={(values) =>
            run(async () => {
              await onUpdate(values);
              setEditing(false);
            })
          }
        />
      ) : (
        <div className="contact-card-actions">
          {!contact.isPrimary && (
            <button type="button" disabled={busy} onClick={() => void run(onPrimary)}>
              Make primary
            </button>
          )}
          <button type="button" disabled={busy} onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            type="button"
            className="contact-remove"
            disabled={busy}
            onClick={() => void run(onDelete)}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}
      {error && (
        <p className="form-server-error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const prefs = user?.travelPreferences;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      name: user?.name ?? '',
      profilePhoto: user?.profilePhoto ?? '',
      language: user?.language ?? 'en',
      travelStyle: prefs?.travelStyle ?? 'mixed',
      budgetPreference: prefs?.budgetPreference ?? 'moderate',
      favoriteActivities: prefs?.favoriteActivities.join(', ') ?? '',
      dietaryPreferences: prefs?.dietaryPreferences.join(', ') ?? '',
    },
  });

  useEffect(() => {
    let active = true;
    void authService
      .getEmergencyContacts()
      .then((result) => {
        if (active) setContacts(result);
      })
      .catch((error: unknown) => {
        if (active)
          setContactsError(
            error instanceof Error ? error.message : 'Unable to load emergency contacts.',
          );
      })
      .finally(() => {
        if (active) setContactsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const submitProfile = handleSubmit(async (values) => {
    setProfileError('');
    setProfileMessage('');
    try {
      const updated = await authService.updateProfile({
        name: values.name,
        profilePhoto: values.profilePhoto || null,
        language: values.language,
        travelPreferences: {
          travelStyle: values.travelStyle,
          budgetPreference: values.budgetPreference,
          favoriteActivities: values.favoriteActivities
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, 8),
          dietaryPreferences: values.dietaryPreferences
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, 8),
        },
      });
      updateUser(updated);
      reset({ ...values, name: updated.name });
      setProfileMessage('Your profile is up to date.');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Unable to update your profile.');
    }
  });

  const createContact = async (values: ContactFields) => {
    const created = await authService.createEmergencyContact(values);
    setContacts((current) => [
      ...current.map((item) => (created.isPrimary ? { ...item, isPrimary: false } : item)),
      created,
    ]);
  };
  const changePrimary = async (contact: EmergencyContact) => {
    const updated = await authService.updateEmergencyContact(contact._id, { isPrimary: true });
    setContacts((current) =>
      current.map((item) => (item._id === updated._id ? updated : { ...item, isPrimary: false })),
    );
  };
  const updateContact = async (contact: EmergencyContact, values: ContactFields) => {
    const updated = await authService.updateEmergencyContact(contact._id, values);
    setContacts((current) =>
      current.map((item) =>
        item._id === updated._id
          ? updated
          : { ...item, isPrimary: updated.isPrimary ? false : item.isPrimary },
      ),
    );
  };
  const deleteContact = async (contact: EmergencyContact) => {
    await authService.deleteEmergencyContact(contact._id);
    setContacts((current) => current.filter((item) => item._id !== contact._id));
  };

  return (
    <main className="product-page profile-page">
      <div className="product-shell profile-shell">
        <header className="product-page-heading">
          <span className="eyebrow">
            <UserRound size={14} /> YOUR TRAVEL PROFILE
          </span>
          <h1>Make TripSOS feel like yours.</h1>
          <p>Keep your details and trusted contacts current. You control what you share.</p>
        </header>

        <section className="profile-section" aria-labelledby="profile-details-title">
          <div className="profile-section-heading">
            <span className="profile-section-icon">
              <UserRound size={18} />
            </span>
            <div>
              <h2 id="profile-details-title">Profile</h2>
              <p>Personalize your TripSOS account.</p>
            </div>
          </div>
          <form className="profile-form" onSubmit={submitProfile} noValidate>
            <div className="profile-form-grid">
              <div className="form-field">
                <label htmlFor="profile-name">Name</label>
                <input
                  id="profile-name"
                  {...register('name')}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'profile-name-error' : undefined}
                />
                {errors.name && (
                  <span className="form-field__error" id="profile-name-error">
                    {errors.name.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="profile-email">Email address</label>
                <input id="profile-email" value={user?.email ?? ''} disabled readOnly />
                <span className="profile-field-note">
                  Email changes require a verified email flow.
                </span>
              </div>
              <div className="form-field">
                <label htmlFor="profile-photo">
                  Profile photo URL <span>(optional)</span>
                </label>
                <input
                  id="profile-photo"
                  type="url"
                  {...register('profilePhoto')}
                  placeholder="https://…"
                  aria-invalid={Boolean(errors.profilePhoto)}
                  aria-describedby={errors.profilePhoto ? 'profile-photo-error' : undefined}
                />
                {errors.profilePhoto && (
                  <span className="form-field__error" id="profile-photo-error">
                    {errors.profilePhoto.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="profile-language">Preferred language</label>
                <input
                  id="profile-language"
                  {...register('language')}
                  placeholder="en"
                  aria-invalid={Boolean(errors.language)}
                  aria-describedby={errors.language ? 'profile-language-error' : undefined}
                />
                {errors.language && (
                  <span className="form-field__error" id="profile-language-error">
                    {errors.language.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="profile-style">Travel style</label>
                <select id="profile-style" {...register('travelStyle')}>
                  <option value="mixed">A little of everything</option>
                  <option value="adventure">Adventure</option>
                  <option value="culture">Culture</option>
                  <option value="relaxation">Relaxation</option>
                  <option value="nature">Nature</option>
                  <option value="food">Food</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="profile-budget">Budget preference</label>
                <select id="profile-budget" {...register('budgetPreference')}>
                  <option value="moderate">Moderate</option>
                  <option value="budget">Budget conscious</option>
                  <option value="premium">Premium</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="profile-activities">
                  Favorite activities <span>(comma separated)</span>
                </label>
                <input
                  id="profile-activities"
                  {...register('favoriteActivities')}
                  placeholder="Hiking, museums, food"
                />
              </div>
              <div className="form-field">
                <label htmlFor="profile-dietary">
                  Dietary preferences <span>(comma separated)</span>
                </label>
                <input
                  id="profile-dietary"
                  {...register('dietaryPreferences')}
                  placeholder="Vegetarian, gluten free"
                />
              </div>
            </div>
            {profileError && (
              <p className="form-server-error" role="alert">
                {profileError}
              </p>
            )}
            {profileMessage && (
              <p className="form-success" role="status">
                <Check size={15} /> {profileMessage}
              </p>
            )}
            <button className="product-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving profile…' : 'Save profile'}
            </button>
          </form>
        </section>

        <section className="profile-section" aria-labelledby="emergency-contacts-title">
          <div className="profile-section-heading">
            <span className="profile-section-icon profile-section-icon--safety">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2 id="emergency-contacts-title">Emergency contacts</h2>
              <p>Only you can view and manage these trusted people.</p>
            </div>
          </div>
          <div className="contact-privacy-note">
            <ShieldCheck size={16} />
            <span>
              Contact details stay private to your account and are never shown on your public
              profile.
            </span>
          </div>
          {contactsLoading && (
            <p className="profile-loading" role="status">
              Loading your contacts…
            </p>
          )}
          {contactsError && (
            <p className="form-server-error" role="alert">
              {contactsError}
            </p>
          )}
          {!contactsLoading && !contactsError && contacts.length === 0 && (
            <div className="contacts-empty">
              <p>No trusted contacts added yet.</p>
              <span>Add someone you would want to reach in an unexpected moment.</span>
            </div>
          )}
          <div className="contact-list">
            {contacts.map((contact) => (
              <ContactCard
                key={contact._id}
                contact={contact}
                onPrimary={() => changePrimary(contact)}
                onDelete={() => deleteContact(contact)}
                onUpdate={(values) => updateContact(contact, values)}
              />
            ))}
          </div>
          {!contactsLoading && (
            <details className="add-contact-details">
              <summary>
                <Plus size={16} /> Add emergency contact
              </summary>
              <ContactForm submitLabel="Add contact" onSave={createContact} />
            </details>
          )}
        </section>

        <section className="profile-section account-section" aria-labelledby="account-title">
          <div className="profile-section-heading">
            <span className="profile-section-icon">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h2 id="account-title">Account</h2>
              <p>Signed in as {user?.email}</p>
            </div>
          </div>
          <button className="account-signout" type="button" onClick={() => void logout()}>
            <LogOut size={16} /> Sign out <ArrowRight size={15} />
          </button>
        </section>
      </div>
    </main>
  );
}
