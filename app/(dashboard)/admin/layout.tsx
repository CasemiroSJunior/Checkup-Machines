import type React from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "../../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart, Users, FileText } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b pb-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/admin/usuarios">
          <Button variant="ghost" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </Button>
        </Link>
        <Link href="/admin/relatorios">
          <Button variant="ghost" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </Button>
        </Link>
      </div>
      {children}
    </div>
  )
}
