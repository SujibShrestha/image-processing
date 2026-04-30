import { Link } from 'react-router-dom'
import { ArrowRight, ImageIcon, LockKeyhole, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

const features = [
  {
    icon: ImageIcon,
    title: 'Manage your image library',
    description: 'Upload, browse, and organize every image from a single dashboard.',
  },
  {
    icon: UploadCloud,
    title: 'Drag and drop uploads',
    description: 'Send assets directly to your backend with a fast drag-and-drop flow.',
  },
  {
    icon: LockKeyhole,
    title: 'Secure JWT auth',
    description: 'Token-based sessions are stored locally and attached automatically to each request.',
  },
]

export function Home() {
  const { isAuthenticated, user } = useAuth()

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            Image Studio
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              A clean workspace for managing and transforming images.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Upload images, apply quick edits, and keep your favorite visuals organized in one simple place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/register">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">Login</Link>
                </Button>
              </>
            )}
          </div>
          {isAuthenticated && user ? (
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.name || user.email}</span>.
            </p>
          ) : null}
        </div>

        <Card className="overflow-hidden border-border/80 bg-card/90 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>About the website</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">Fast uploads</p>
                <p className="mt-1 text-sm text-muted-foreground">Add new images quickly with a simple drag-and-drop flow.</p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">Quick edits</p>
                <p className="mt-1 text-sm text-muted-foreground">Rotate, resize, crop, and preview changes before saving.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              Everything is designed to feel lightweight, focused, and easy to use.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="border-border/80 bg-card/90 shadow-sm">
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-6 text-sm text-muted-foreground">{feature.description}</CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
  