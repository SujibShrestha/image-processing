import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Edit3, ImageIcon, Mail, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/spinner'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { getErrorMessage } from '@/lib/errors'
import { deleteImage, listImages } from '@/services/images'

type ProfileForm = {
  name: string
  avatar: string
}

export function Dashboard() {
  const { user, updateCurrentUser } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: user?.name ?? '',
    avatar: user?.avatar ?? '',
  })
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const { data: imagesData, error, loading, refetch, setData } = useFetch(() => listImages(), [user?.id ?? 0])
  const images = imagesData ?? []

  const stats = useMemo(
    () => [
      { label: 'Images', value: images.length },
      { label: 'Username', value: user?.name ? 'Set' : 'Not set' },
      { label: 'Avatar', value: user?.avatar ? 'Set' : 'Not set' },
    ],
    [images.length, user?.avatar, user?.name],
  )

  const openProfileModal = () => {
    setProfileForm({
      name: user?.name ?? '',
      avatar: user?.avatar ?? '',
    })
    setProfileError(null)
    setIsProfileOpen(true)
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setProfileError(null)
    setIsSavingProfile(true)

    try {
      await updateCurrentUser({
        name: profileForm.name.trim() || undefined,
        avatar: profileForm.avatar.trim() || undefined,
      })
      toast.success('Profile updated.')
      setIsProfileOpen(false)
    } catch (caughtError) {
      setProfileError(getErrorMessage(caughtError, 'Unable to update your profile.'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteImage(id)
      setData((current) => (current ? current.filter((item) => item.id !== id) : current))
      toast.success('Image deleted.')
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError, 'Unable to delete the image.'))
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {user?.name ? `Welcome, ${user.name}` : 'Welcome to your studio'}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Manage your profile, inspect your image library, and jump straight into transformations.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={openProfileModal}>
            <Edit3 className="h-4 w-4" />
            Edit profile
          </Button>
          <Button asChild>
            <Link to="/transform">
              <ImageIcon className="h-4 w-4" />
              Transform images
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/80 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-6 text-2xl font-semibold text-foreground">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                {user?.email}
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-sm font-medium text-foreground">Avatar</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{user?.avatar || 'No avatar configured.'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Recent uploads</CardTitle>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            {loading ? (
              <div className="flex min-h-40 items-center justify-center">
                <LoadingSpinner label="Loading uploads" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : images.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                No images yet. Upload one on the transform page to get started.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {images.slice(0, 4).map((image) => (
                  <div key={image.id} className="group rounded-2xl border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md">
                    <img
                      src={image.url}
                      alt={`Uploaded ${image.id}`}
                      className="h-44 w-full rounded-xl object-cover"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Image #{image.id}</p>
                        <p className="text-xs text-muted-foreground">{image.metadata?.format || 'image'}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(image.id)} aria-label="Delete image">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        title="Edit profile"
        description="Update the profile data stored in your backend."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="profile-form" disabled={isSavingProfile}>
              {isSavingProfile ? <LoadingSpinner label="Saving" /> : 'Save changes'}
            </Button>
          </>
        }
      >
        <form id="profile-form" className="space-y-4" onSubmit={handleProfileSubmit}>
          <Input
            label="Name"
            value={profileForm.name}
            onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Your display name"
          />
          <Input
            label="Avatar URL"
            value={profileForm.avatar}
            onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))}
            placeholder="https://example.com/avatar.png"
          />
          {profileError ? <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{profileError}</p> : null}
        </form>
      </Modal>
    </section>
  )
}
