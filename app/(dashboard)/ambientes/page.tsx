import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus } from "lucide-react"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default async function AmbientesPage() {
  const ambientes = await prisma.ambientes.findMany({
    include: {
      _count: {
        select: {
          Maquinas: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Ambientes</h1>
        <Link href="/ambientes/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ambiente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Ambientes</CardTitle>
          <CardDescription>Lista de todos os ambientes cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={ambientes} />
        </CardContent>
      </Card>
    </div>
  )
}
