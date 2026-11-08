import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, FolderOpen, Monitor, ClipboardCheck } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Contagem de ambientes
  const ambientesCount = await prisma.ambientes.count()

  // Contagem de máquinas
  const maquinasCount = await prisma.maquinas.count()

  // Contagem de verificações
  const verificacoesCount = await prisma.verificacoes.count()

  // Verificações recentes do usuário
  const verificacoesRecentes = await prisma.verificacoes.findMany({
    where: {
      userId: Number.parseInt(session?.user?.id as string),
    },
    include: {
      maquina: {
        include: {
          ambiente: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/verificacoes/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Verificação
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ambientes</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ambientesCount}</div>
            <p className="text-xs text-muted-foreground">Total de ambientes cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Máquinas</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maquinasCount}</div>
            <p className="text-xs text-muted-foreground">Total de máquinas cadastradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificações</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verificacoesCount}</div>
            <p className="text-xs text-muted-foreground">Total de verificações realizadas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificações Recentes</CardTitle>
          <CardDescription>Suas últimas verificações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {verificacoesRecentes.length > 0 ? (
            <div className="space-y-4">
              {verificacoesRecentes.map((verificacao) => (
                <div key={verificacao.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">{verificacao.maquina.name}</p>
                    <p className="text-sm text-muted-foreground">Ambiente: {verificacao.maquina.ambiente.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{new Date(verificacao.createdAt).toLocaleDateString("pt-BR")}</p>
                    <Link href={`/verificacoes/${verificacao.id}`}>
                      <Button variant="link" size="sm" className="px-0">
                        Ver detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhuma verificação realizada recentemente</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
