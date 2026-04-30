import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errors'
import { registerSchema, type RegisterValues } from '@/validation/auth'

const initialValues: RegisterValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  avatar: '',
}

export function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState<RegisterValues>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterValues, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleChange = (key: keyof RegisterValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const result = registerSchema.safeParse(values)

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterValues, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterValues | undefined
        if (field) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await register(result.data)
      toast.success('Your account has been created.')
      navigate('/dashboard', { replace: true })
    } catch (caughtError) {
      setFormError(getErrorMessage(caughtError, 'Unable to create your account.'))
      toast.error('Registration failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-9rem)] w-full max-w-7xl items-center px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="hidden max-w-xl space-y-6 pr-10 lg:block">
        <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          Create your workspace
        </span>
        <h1 className="text-5xl font-semibold tracking-tight text-foreground">Register and start transforming images.</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          A clean, modern interface with validation, drag-and-drop uploads, and JWT-based authentication.
        </p>
      </div>

      <Card className="mx-auto w-full max-w-xl border-border/80 bg-card/95 shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pb-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Name"
              value={values.name ?? ''}
              onChange={handleChange('name')}
              error={errors.name}
              helperText="Optional, but recommended for your profile."
              placeholder="Your name"
            />
            <Input
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange('email')}
              error={errors.email}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={values.password}
              onChange={handleChange('password')}
              error={errors.password}
              placeholder="••••••••"
            />
            <Input
              label="Confirm password"
              type="password"
              value={values.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
              placeholder="••••••••"
            />
            <Input
              label="Avatar URL"
              type="url"
              value={values.avatar ?? ''}
              onChange={handleChange('avatar')}
              error={errors.avatar}
              helperText="Optional image URL for your profile avatar."
              placeholder="https://example.com/avatar.png"
            />

            {formError ? <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{formError}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner label="Creating account" /> : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
