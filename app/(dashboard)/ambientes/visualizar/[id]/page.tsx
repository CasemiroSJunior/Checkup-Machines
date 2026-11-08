import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function VisualizarAmbientePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const ambienteId = Number.parseInt(params.id)

  // Buscar o ambiente
  const ambiente = await prisma.ambientes.findUnique({
    where: { id: ambienteId },
  })

  if (!ambiente) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Ambiente não encontrado</h1>
        <Link href="/ambientes">
          <Button>Voltar para Ambientes</Button>
        </Link>
      </div>
    )
  }

  // Buscar as máquinas do ambiente
  const maquinas = await prisma.maquinas.findMany({
    where: { ambienteId },
    include: {
      Verificacao: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/ambientes">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{ambiente.name}</h1>
        </div>
        <Link href={`/verificacoes/ambiente/${ambienteId}`}>
          <Button>Verificar Ambiente</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Máquinas</CardTitle>
          <CardDescription>Lista de máquinas neste ambiente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maquinas.map((maquina) => {
              const ultimaVerificacao = maquina.Verificacao[0]
              const temProblema =
                ultimaVerificacao &&
                (ultimaVerificacao.mouse !== "OK" ||
                  ultimaVerificacao.teclado !== "OK" ||
                  ultimaVerificacao.monitor !== "OK" ||
                  ultimaVerificacao.cabos !== "OK")

              return (
                <Card key={maquina.id} className="overflow-hidden">
                  <div
                    className={`h-2 ${temProblema ? "bg-destructive" : ultimaVerificacao ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{maquina.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {maquina.patrimonio ? `Patrimônio: ${maquina.patrimonio}` : ""}
                          {maquina.ip ? (maquina.patrimonio ? ` • ` : "") + `IP: ${maquina.ip}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {ultimaVerificacao ? (
                          temProblema ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>Problema</span>
                            </Badge>
                          ) : (
                            <Badge variant="success" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>OK</span>
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline">Não verificada</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between">
                      <Link href={`/maquinas/editar/${maquina.id}`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Link href={`/verificacoes/maquina/${maquina.id}`}>
                        <Button size="sm">Verificar</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {maquinas.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma máquina cadastrada neste ambiente.</p>
              <Link href="/maquinas/nova" className="mt-4 inline-block">
                <Button>Adicionar Máquina</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
