import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DropzoneProps = {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  title?: string
  description?: string
  className?: string
}

export function Dropzone({
  onFiles,
  accept = 'image/*',
  multiple = false,
  title = 'Drop files here',
  description = 'or click to browse from your device',
  className,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    onFiles(Array.from(files))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        handleFiles(event.dataTransfer.files)
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background p-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5',
        isDragging && 'border-primary bg-primary/10',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UploadCloud className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button type="button" variant="secondary" className="mt-4">
        Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  )
}
