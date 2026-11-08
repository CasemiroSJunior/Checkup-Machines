"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, User, LogOut, Home, Monitor, FolderOpen, ClipboardCheck, CheckSquare, BarChart } from "lucide-react"
import { Notificacoes } from "@/components/notificacoes"

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  const isAdmin = session?.user?.role === "admin"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">Sistema de Verificação</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                <span>Início</span>
              </div>
            </Link>
            <Link
              href="/ambientes"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/ambientes") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1">
                <FolderOpen className="h-4 w-4" />
                <span>Ambientes</span>
              </div>
            </Link>
            <Link
              href="/maquinas"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/maquinas") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1">
                <Monitor className="h-4 w-4" />
                <span>Máquinas</span>
              </div>
            </Link>
            <Link
              href="/verificacoes"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/verificacoes") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1">
                <ClipboardCheck className="h-4 w-4" />
                <span>Verificações</span>
              </div>
            </Link>
            <Link
              href="/sessoes-verificacao"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/sessoes-verificacao") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                <span>Sessões</span>
              </div>
            </Link>
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1">
                  <BarChart className="h-4 w-4" />
                  <span>Admin</span>
                </div>
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Notificacoes />
            <ModeToggle />
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>{session.user.name}</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/usuarios">
                        <BarChart className="mr-2 h-4 w-4" />
                        <span>Administração</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Início</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ambientes">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <span>Ambientes</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/maquinas">
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>Máquinas</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/verificacoes">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    <span>Verificações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/sessoes-verificacao">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    <span>Sessões</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard">
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}
