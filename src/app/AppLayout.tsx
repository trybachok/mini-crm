import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { LogOutIcon, MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { AppNav } from '@/components/AppNav'
import { useAuth } from '@/app/AuthContext'
import { signOut } from '@/api/auth'
import { roleLabels } from '@/domain/labels'

export function AppLayout() {
  const { profile } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  if (!profile) return null

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          {/* Мобильное меню */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Меню">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <SheetHeader className="p-0">
                <SheetTitle>Мини-CRM</SheetTitle>
              </SheetHeader>
              <AppNav role={profile.role} vertical onNavigate={() => setIsMenuOpen(false)} />
            </SheetContent>
          </Sheet>

          <span className="font-semibold">Мини-CRM</span>

          <div className="hidden md:block">
            <AppNav role={profile.role} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right text-sm sm:block">
              <div className="font-medium">{profile.full_name}</div>
              <div className="text-xs text-muted-foreground">{roleLabels[profile.role]}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Выйти">
              <LogOutIcon />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
