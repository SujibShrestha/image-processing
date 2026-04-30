import { useEffect, useMemo, useState } from 'react'
import { Download, ImagePlus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dropzone } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { LoadingSpinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toaster'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { getErrorMessage } from '@/lib/errors'
import { deleteImage, listImages, previewImage, saveTransformedImage, uploadImage } from '@/services/images'
import { transformSchema } from '@/validation/image'
import type { TransformParams } from '@/types/models'

type TransformFormState = {
  rotate: string
  width: string
  height: string
  cropX: string
  cropY: string
  cropWidth: string
  cropHeight: string
  watermarkText: string
  format: 'png' | 'webp' | 'jpeg' | 'jpg'
}

const initialForm: TransformFormState = {
  rotate: '',
  width: '',
  height: '',
  cropX: '',
  cropY: '',
  cropWidth: '',
  cropHeight: '',
  watermarkText: '',
  format: 'png',
}

export function ImageTransform() {
  const { user } = useAuth()
  const { data: imagesData, error, loading, refetch, setData } = useFetch(() => listImages(), [user?.id ?? 0])
  const images = imagesData ?? []
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null)
  const [form, setForm] = useState<TransformFormState>(initialForm)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const selectedImage = useMemo(
    () => images.find((image) => image.id === selectedImageId) ?? null,
    [images, selectedImageId],
  )

  useEffect(() => {
    if (!selectedImageId && images.length > 0) {
      setSelectedImageId(images[0]?.id ?? null)
    }
  }, [images, selectedImageId])

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc)
      }
    }
  }, [previewSrc])

  const buildParams = (): TransformParams | null => {
    const result = transformSchema.safeParse({
      rotate: form.rotate ? Number(form.rotate) : undefined,
      width: form.width ? Number(form.width) : undefined,
      height: form.height ? Number(form.height) : undefined,
      cropX: form.cropX ? Number(form.cropX) : undefined,
      cropY: form.cropY ? Number(form.cropY) : undefined,
      cropWidth: form.cropWidth ? Number(form.cropWidth) : undefined,
      cropHeight: form.cropHeight ? Number(form.cropHeight) : undefined,
      watermarkText: form.watermarkText,
      format: form.format,
    })

    if (!result.success) {
      setLocalError(result.error.issues[0]?.message ?? 'Invalid transform settings.')
      return null
    }

    const values = result.data

    const crop =
      values.cropX !== undefined &&
      values.cropY !== undefined &&
      values.cropWidth !== undefined &&
      values.cropHeight !== undefined
        ? `${values.cropX},${values.cropY},${values.cropWidth},${values.cropHeight}`
        : undefined

    return {
      rotate: values.rotate,
      width: values.width,
      height: values.height,
      crop,
      watermarkText: values.watermarkText,
      format: values.format,
    }
  }

  const handleFile = async (files: File[]) => {
    const file = files[0]

    if (!file) {
      return
    }

    setIsUploading(true)
    setLocalError(null)

    try {
      const created = await uploadImage(file)
      toast.success('Image uploaded.')
      setData((current) => [created, ...(current ?? [])])
      setSelectedImageId(created.id)
    } catch (caughtError) {
      setLocalError(getErrorMessage(caughtError, 'Unable to upload the image.'))
      toast.error('Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handlePreview = async () => {
    if (!selectedImageId) {
      setLocalError('Select an image first.')
      return
    }

    const params = buildParams()

    if (!params) {
      return
    }

    setIsPreviewing(true)
    setLocalError(null)

    try {
      const blob = await previewImage(selectedImageId, params)
      const nextPreview = URL.createObjectURL(blob)
      setPreviewSrc((current) => {
        if (current) {
          URL.revokeObjectURL(current)
        }
        return nextPreview
      })
      toast.success('Preview updated.')
    } catch (caughtError) {
      setLocalError(getErrorMessage(caughtError, 'Unable to preview the image.'))
      toast.error('Preview failed.')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSave = async () => {
    if (!selectedImageId) {
      setLocalError('Select an image first.')
      return
    }

    const params = buildParams()

    if (!params) {
      return
    }

    setIsSaving(true)
    setLocalError(null)

    try {
      const saved = await saveTransformedImage(selectedImageId, params)
      setData((current) => [saved, ...(current ?? [])])
      await refetch()
      toast.success('Transformed image saved.')
    } catch (caughtError) {
      setLocalError(getErrorMessage(caughtError, 'Unable to save the transformed image.'))
      toast.error('Save failed.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteImage(id)
      setData((current) => (current ? current.filter((image) => image.id !== id) : current))
      if (selectedImageId === id) {
        setSelectedImageId(null)
      }
      toast.success('Image removed.')
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError, 'Unable to delete the image.'))
    }
  }

  const handleDownload = async () => {
    if (!previewSrc && !selectedImage) {
      setLocalError('No image to download.')
      return
    }

    setIsDownloading(true)
    setLocalError(null)

    try {
      const imageUrl = previewSrc || selectedImage?.url
      if (!imageUrl) {
        throw new Error('No image URL available')
      }

      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `image-${Date.now()}.${form.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Image downloaded.')
    } catch (caughtError) {
      setLocalError(getErrorMessage(caughtError, 'Unable to download the image.'))
      toast.error('Download failed.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Image transformation</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Upload, preview, and save edited images.</h1>
        <p className="max-w-2xl text-muted-foreground">
          Drag and drop a file, pick an existing image, then send transformation params directly to the backend.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="border-border/80 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Upload image</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <Dropzone onFiles={handleFile} title="Drop an image here" description="PNG, JPEG, or WEBP supported" />
              {isUploading ? <LoadingSpinner label="Uploading" className="mt-4 flex items-center justify-center" /> : null}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle>Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              {loading ? (
                <div className="flex min-h-40 items-center justify-center">
                  <LoadingSpinner label="Loading library" />
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
              ) : images.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                  No images uploaded yet.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedImageId(image.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedImageId(image.id)
                        }
                      }}
                      className={[
                        'group rounded-2xl border bg-background p-3 text-left transition-shadow hover:shadow-md',
                        selectedImageId === image.id ? 'border-primary ring-2 ring-primary/20' : 'border-border',
                      ].join(' ')}
                    >
                      <img src={image.url} alt={`Image ${image.id}`} className="h-40 w-full rounded-xl object-cover" />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Image #{image.id}</p>
                          <p className="text-xs text-muted-foreground">{image.metadata?.format || 'original'}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => {
                            event.stopPropagation()
                            void handleDelete(image.id)
                          }}
                          aria-label="Delete image"
                        >
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

        <Card className="border-border/80 bg-card/90 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Transform settings</CardTitle>
              {selectedImage ? <p className="text-sm text-muted-foreground">Editing image #{selectedImage.id}</p> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Rotate" value={form.rotate} onChange={(event) => setForm((current) => ({ ...current, rotate: event.target.value }))} placeholder="90" />
              <Input label="Format" value={form.format} onChange={(event) => setForm((current) => ({ ...current, format: event.target.value as TransformFormState['format'] }))} placeholder="png" />
              <Input label="Width" value={form.width} onChange={(event) => setForm((current) => ({ ...current, width: event.target.value }))} placeholder="1200" />
              <Input label="Height" value={form.height} onChange={(event) => setForm((current) => ({ ...current, height: event.target.value }))} placeholder="800" />
              <Input label="Crop X" value={form.cropX} onChange={(event) => setForm((current) => ({ ...current, cropX: event.target.value }))} placeholder="0" />
              <Input label="Crop Y" value={form.cropY} onChange={(event) => setForm((current) => ({ ...current, cropY: event.target.value }))} placeholder="0" />
              <Input label="Crop width" value={form.cropWidth} onChange={(event) => setForm((current) => ({ ...current, cropWidth: event.target.value }))} placeholder="600" />
              <Input label="Crop height" value={form.cropHeight} onChange={(event) => setForm((current) => ({ ...current, cropHeight: event.target.value }))} placeholder="400" />
            </div>
            <Input
              label="Watermark text"
              value={form.watermarkText}
              onChange={(event) => setForm((current) => ({ ...current, watermarkText: event.target.value }))}
              placeholder="Confidential"
            />

            {localError ? <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{localError}</div> : null}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handlePreview} disabled={!selectedImageId || isPreviewing}>
                <ImagePlus className="h-4 w-4" />
                {isPreviewing ? 'Previewing' : 'Preview'}
              </Button>
              <Button onClick={handleSave} disabled={!selectedImageId || isSaving}>
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving' : 'Save as new image'}
              </Button>
              <Button onClick={handleDownload} disabled={!selectedImage || isDownloading}>
                <Download className="h-4 w-4" />
                {isDownloading ? 'Downloading' : 'Download'}
              </Button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-muted/20">
              {previewSrc ? (
                <img src={previewSrc} alt="Preview" className="h-[26rem] w-full object-contain bg-black/5" />
              ) : selectedImage ? (
                <img src={selectedImage.url} alt="Selected image" className="h-[26rem] w-full object-contain bg-black/5" />
              ) : (
                <div className="flex h-[26rem] items-center justify-center text-sm text-muted-foreground">
                  Select an image to start editing.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
