import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AuthCard } from '@/features/auth/AuthCard';
import { type LoginFormValues, loginSchema } from '@/features/auth/validation';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { login } from '@/store/slices/authSlice';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((state) => state.auth.status);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const action = await dispatch(login(values));

    if (login.fulfilled.match(action) && action.payload) {
      const role = action.payload.user.roles[0];
      toast.success('Welcome back.');
      navigate(role === 'Admin' ? '/admin/dashboard' : role === 'Recruiter' ? '/recruiter/dashboard' : '/student/dashboard');
      return;
    }

    toast.error((action.payload as string) || 'Login failed. Please try again.');
  });

  return (
    <AuthCard eyebrow="Secure access" title="Login" description="Use your account to enter the workspace.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input label="Email" type="email" placeholder="student1@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="Password123!" error={errors.password?.message} {...register('password')} />
        <div className="flex items-center justify-between text-sm">
          <Link className="text-sky-500" to="/forgot-password">
            Forgot password
          </Link>
          <Link className="text-sky-500" to="/register">
            Create account
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}
