import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default async function VerificacoesPage() {
  const verificacoes = await prisma.verificacoes.findMany({
    include: {
      maquina: {
        include: {
          ambiente: true,
        },
      },
      user: true,
      _count: {
        select: {
          VerificacaoFoto: true,
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
        <h1 className="text-3xl font-bold tracking-tight">Verificações</h1>
        <Link href="/verificacoes/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Verificação
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Verificações</CardTitle>
          <CardDescription>Lista de todas as verificações realizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={verificacoes} />
        </CardContent>
      </Card>
    </div>
  )
}
