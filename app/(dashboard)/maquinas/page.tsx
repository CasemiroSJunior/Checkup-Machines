import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default async function MaquinasPage() {
  const maquinas = await prisma.maquinas.findMany({
    include: {
      ambiente: true,
      _count: {
        select: {
          Verificacao: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Máquinas</h1>
        <Link href="/maquinas/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Máquina
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Máquinas</CardTitle>
          <CardDescription>Lista de todas as máquinas cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={maquinas} />
        </CardContent>
      </Card>
    </div>
  )
}
