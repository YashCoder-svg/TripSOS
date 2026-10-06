import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { m, useReducedMotion } from 'framer-motion';
import { z } from 'zod';
import { fadeUp } from '../animations/variants';
import { TravelPhoto } from '../components/landing/TravelPhoto';
import { travelPhotos } from '../services/imageService';
import { useAuth } from '../store/AuthProvider';

const emailRule = z.string().trim().email('Enter a valid email address.').max(254);
const passwordRule = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128, 'Use 128 characters or fewer.')
  .regex(/[a-z]/, 'Add a lowercase letter.')
  .regex(/[A-Z]/, 'Add an uppercase letter.')
  .regex(/[0-9]/, 'Add a number.');

const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'Enter your password.'),
});
const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.').max(80, 'Use 80 characters or fewer.'),
    email: emailRule,
    password: passwordRule,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;

function FieldMessage({ id, message }: { id: string; message?: string }) {
  return message ? (
    <span className="form-field__error" id={id}>
      {message}
    </span>
  ) : null;
}

function PasswordField({
  label,
  id,
  error,
  registration,
  autoComplete,
}: {
  label: string;
  id: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm>['register']>;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          {...registration}
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      <FieldMessage id={errorId} message={error} />
    </div>
  );
}

function AuthScenicPanel({ register }: { register: boolean }) {
  return (
    <aside className="auth-scenic-panel">
      <TravelPhoto photo={travelPhotos.hero} eager className="auth-photo" />
      <div className="auth-scenic-shade" />
      <div className="auth-scenic-copy">
        <span className="auth-scenic-eyebrow">
          <ShieldCheck size={15} /> TRAVEL PREPARED
        </span>
        <p>
          {register
            ? 'A calmer way to travel starts with a plan.'
            : 'Your next journey is still yours to discover.'}
        </p>
        <span>Keep the planned parts and the unexpected ones close.</span>
      </div>
    </aside>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });
  const requestedDestination = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;
  const destination =
    requestedDestination?.startsWith('/') && !requestedDestination.startsWith('//')
      ? requestedDestination
      : '/dashboard';

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    try {
      await login(values);
      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Unable to sign in. Please try again.',
      );
    }
  });

  return (
    <main className="auth-page">
      <AuthScenicPanel register={false} />
      <m.section
        className="auth-form-panel"
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={fadeUp}
        aria-labelledby="auth-title"
      >
        <div className="auth-form-inner">
          <span className="eyebrow auth-eyebrow">YOUR TRIPS, ALL IN ONE PLACE</span>
          <h1 id="auth-title">Welcome back.</h1>
          <p className="auth-intro">Sign in to pick up where your journey left off.</p>
          {Boolean((location.state as { sessionMessage?: string } | null)?.sessionMessage) && (
            <p className="form-notice" role="status">
              {(location.state as { sessionMessage: string }).sessionMessage}
            </p>
          )}
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="login-email">Email address</label>
              <input
                {...register('email')}
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
              />
              <FieldMessage id="login-email-error" message={errors.email?.message} />
            </div>
            <PasswordField
              label="Password"
              id="login-password"
              registration={register('password')}
              autoComplete="current-password"
              error={errors.password?.message}
            />
            {serverError && (
              <p className="form-server-error" role="alert">
                {serverError}
              </p>
            )}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="auth-switch">
            New to TripSOS? <Link to="/register">Create an account</Link>
          </p>
          <p className="auth-privacy-note">
            Your account information stays private and is only used to support your TripSOS
            experience.
          </p>
        </div>
      </m.section>
    </main>
  );
}

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError('');
    try {
      await createAccount(values);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : 'Unable to create your account. Please try again.',
      );
    }
  });

  return (
    <main className="auth-page auth-page--register">
      <AuthScenicPanel register />
      <m.section
        className="auth-form-panel"
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={fadeUp}
        aria-labelledby="auth-title"
      >
        <div className="auth-form-inner">
          <span className="eyebrow auth-eyebrow">MAKE ROOM FOR THE JOURNEY</span>
          <h1 id="auth-title">Start with the essentials.</h1>
          <p className="auth-intro">Create an account. You can add travel preferences any time.</p>
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="register-name">Name</label>
              <input
                {...register('name')}
                id="register-name"
                type="text"
                autoComplete="name"
                maxLength={80}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'register-name-error' : undefined}
              />
              <FieldMessage id="register-name-error" message={errors.name?.message} />
            </div>
            <div className="form-field">
              <label htmlFor="register-email">Email address</label>
              <input
                {...register('email')}
                id="register-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'register-email-error' : undefined}
              />
              <FieldMessage id="register-email-error" message={errors.email?.message} />
            </div>
            <PasswordField
              label="Password"
              id="register-password"
              registration={register('password')}
              autoComplete="new-password"
              error={errors.password?.message}
            />
            <PasswordField
              label="Confirm password"
              id="register-confirm-password"
              registration={register('confirmPassword')}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
            />
            <p className="password-hint">
              At least 12 characters, including an uppercase letter, lowercase letter, and number.
            </p>
            {serverError && (
              <p className="form-server-error" role="alert">
                {serverError}
              </p>
            )}
            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating your account…' : 'Create account'}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </m.section>
    </main>
  );
}
