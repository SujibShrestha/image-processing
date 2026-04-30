import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Page not found</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        The page you requested does not exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Return home</Link>
      </Button>
    </section>
  )
}
