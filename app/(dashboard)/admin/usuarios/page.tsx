import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function UsuariosPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  const usuarios = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
        <Link href="/admin/usuarios/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Lista de todos os usuários cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={usuarios} />
        </CardContent>
      </Card>
    </div>
  )
}
