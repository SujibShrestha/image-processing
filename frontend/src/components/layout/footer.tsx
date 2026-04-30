import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-background/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>Image Studio is connected to your local API at localhost:3000.</p>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link to="/transform" className="hover:text-foreground">
            Transform
          </Link>
        </div>
      </div>
    </footer>
  )
}
