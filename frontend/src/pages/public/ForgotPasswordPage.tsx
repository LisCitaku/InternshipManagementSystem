import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { AuthCard } from '@/features/auth/AuthCard';
import { type ForgotPasswordFormValues, forgotPasswordSchema } from '@/features/auth/validation';

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  return (
    <AuthCard eyebrow="Recovery" title="Forgot password" description="The backend reset endpoint is not implemented yet, so this screen is wired as a ready UI flow.">
      <form
        className="space-y-4"
        onSubmit={handleSubmit(() => {
          toast.info('Recovery request UI is ready. Connect it when the backend endpoint is added.');
        })}
      >
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}

