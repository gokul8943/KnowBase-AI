import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '../../../context/OrganizationContext';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Alert,
  AlertDescription,
  FormField,
} from '../../../components/ui';

const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type CreateOrganizationForm = z.infer<typeof createOrganizationSchema>;

export function OrganizationOnboarding() {
  const navigate = useNavigate();
  const { createOrganization, isLoading: orgsLoading } = useOrganization();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateOrganizationForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createOrganization(data);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create organization';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-semibold">Create Your Organization</CardTitle>
            <CardDescription>
              Set up your organization to start building your knowledge base
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="Organization Name"
              error={errors.name?.message}
              required
            >
              <Input
                id="name"
                placeholder="Acme Technologies"
                {...register('name')}
                disabled={isSubmitting}
                autoComplete="organization"
              />
            </FormField>

            <FormField
              label="Description (optional)"
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                placeholder="Internal knowledge management for our team"
                {...register('description')}
                disabled={isSubmitting}
                rows={3}
              />
            </FormField>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" form="create-org-form" variant="glass" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}