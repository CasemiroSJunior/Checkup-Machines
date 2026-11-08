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

export default async function SessoesVerificacaoPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const sessoes = await prisma.sessaoVerificacao.findMany({
    include: {
      ambiente: true,
      user: true,
      _count: {
        select: {
          verificacoes: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Sessões de Verificação</h1>
        <Link href="/sessoes-verificacao/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Sessão
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Sessões</CardTitle>
          <CardDescription>Lista de todas as sessões de verificação</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={sessoes} />
        </CardContent>
      </Card>
    </div>
  )
}
