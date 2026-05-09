import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Building2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AuthCard } from '@/features/auth/AuthCard';
import { type RegisterFormValues, registerSchema } from '@/features/auth/validation';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { register as registerAction } from '@/store/slices/authSlice';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((state) => state.auth.status);
  const [selectedType, setSelectedType] = useState<'Student' | 'Recruiter'>('Student');
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      registrationType: 'Student',
    },
  });

  const registrationType = watch('registrationType') ?? selectedType;

  const submitLabel = useMemo(
    () => (registrationType === 'Recruiter' ? 'Submit recruiter request' : 'Create student account'),
    [registrationType],
  );

  const onSubmit = handleSubmit(async (values) => {
    const action = await dispatch(registerAction(values));
    if (registerAction.fulfilled.match(action)) {
      toast.success('Account created successfully.');
      navigate('/student/dashboard');
      return;
    }

    const message = (action.payload as string) || 'Request submitted.';
    toast.error(message);
    if (message.toLowerCase().includes('pending admin approval')) {
      navigate('/login');
    }
  });

  const setType = (value: 'Student' | 'Recruiter') => {
    setSelectedType(value);
    setValue('registrationType', value, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <AuthCard eyebrow="New account" title="Register" description="Choose how you want to join the platform. Students enter immediately; recruiters wait for approval.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setType('Student')}
            className={`rounded-3xl border p-4 text-left transition ${
              registrationType === 'Student'
                ? 'border-sky-500/30 bg-sky-500/10 ring-2 ring-sky-500/20'
                : 'border-black/8 bg-white/55 dark:border-white/10 dark:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-300">
              <GraduationCap size={18} />
              <span className="text-sm font-semibold uppercase tracking-[0.16em]">Student</span>
            </div>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">Immediate access after registration.</p>
          </button>
          <button
            type="button"
            onClick={() => setType('Recruiter')}
            className={`rounded-3xl border p-4 text-left transition ${
              registrationType === 'Recruiter'
                ? 'border-sky-500/30 bg-sky-500/10 ring-2 ring-sky-500/20'
                : 'border-black/8 bg-white/55 dark:border-white/10 dark:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-300">
              <Building2 size={18} />
              <span className="text-sm font-semibold uppercase tracking-[0.16em]">Recruiter</span>
            </div>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">Needs admin approval before login.</p>
          </button>
        </div>

        <input type="hidden" {...register('registrationType')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone number" error={errors.phoneNumber?.message} {...register('phoneNumber')} />
        <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />

        {registrationType === 'Recruiter' ? (
          <div className="space-y-4 rounded-3xl border border-sky-500/15 bg-sky-500/8 p-4">
            <div className="text-sm font-semibold text-sky-700 dark:text-sky-200">Recruiter details</div>
            <Input label="Company name" error={errors.companyName?.message} {...register('companyName')} />
            <Input label="Company website" type="url" error={errors.companyWebsite?.message} {...register('companyWebsite')} />
            <p className="text-xs text-ink-500 dark:text-ink-300">
              Your account will stay pending until admin approves it.
            </p>
          </div>
        ) : null}

        <div className="text-sm text-ink-600 dark:text-ink-300">
          Already have an account?{' '}
          <Link className="text-sky-500" to="/login">
            Sign in
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting...' : submitLabel}
        </Button>
      </form>
    </AuthCard>
  );
}
