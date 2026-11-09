import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Users, Monitor, ClipboardCheck, CheckSquare } from "lucide-react"
import { AdminCharts } from "./charts"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  // Contagem de usuários por função
  const usuariosPorFuncao = await prisma.user.groupBy({
    by: ["role"],
    _count: {
      id: true,
    },
  })

  const dadosUsuariosPorFuncao = usuariosPorFuncao.map((item) => ({
    name: item.role === "admin" ? "Administradores" : "Técnicos",
    value: item._count.id,
  }))

  // Contagem de verificações por status
  const verificacoes = await prisma.verificacoes.findMany()
  const verificacoesComProblemas = verificacoes.filter(
    (v) => v.mouse !== "OK" || v.teclado !== "OK" || v.monitor !== "OK" || v.cabos !== "OK",
  ).length
  const verificacoesSemProblemas = verificacoes.length - verificacoesComProblemas

  const dadosVerificacoesPorStatus = [
    { name: "Com Problemas", value: verificacoesComProblemas },
    { name: "Sem Problemas", value: verificacoesSemProblemas },
  ]

  // Contagem de sessões por status
  const sessoesPorStatus = await prisma.sessaoVerificacao.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  })

  const dadosSessoesPorStatus = sessoesPorStatus.map((item) => ({
    name: item.status === "finalizada" ? "Finalizadas" : item.status === "em_andamento" ? "Em Andamento" : "Iniciadas",
    value: item._count.id,
  }))

  // Verificações por ambiente
  const verificacoesPorAmbienteRaw = await prisma.$queryRaw<Array<{ name: string; count: bigint | number }>>`
    SELECT a.name, COUNT(v.id) as count
    FROM Ambientes a
    LEFT JOIN Maquinas m ON a.id = m.ambienteId
    LEFT JOIN Verificacoes v ON m.id = v.maquinaId
    GROUP BY a.id, a.name
    ORDER BY count DESC
    LIMIT 10
  `

  const verificacoesPorAmbiente = verificacoesPorAmbienteRaw.map((item) => ({
    name: item.name,
    count: Number(item.count),
  }))

  // Problemas recentes
  const problemasRecentes = await prisma.verificacoes.findMany({
    where: {
      OR: [{ mouse: { not: "OK" } }, { teclado: { not: "OK" } }, { monitor: { not: "OK" } }, { cabos: { not: "OK" } }],
    },
    include: {
      maquina: {
        include: {
          ambiente: true,
        },
      },
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  })

  // Estatísticas gerais
  const totalUsuarios = await prisma.user.count()
  const totalMaquinas = await prisma.maquinas.count()
  const totalVerificacoes = verificacoes.length
  const totalSessoes = await prisma.sessaoVerificacao.count()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsuarios}</div>
            <p className="text-xs text-muted-foreground">Usuários cadastrados no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Máquinas</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMaquinas}</div>
            <p className="text-xs text-muted-foreground">Máquinas cadastradas no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Verificações</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVerificacoes}</div>
            <p className="text-xs text-muted-foreground">Verificações realizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessoes}</div>
            <p className="text-xs text-muted-foreground">Sessões de verificação</p>
          </CardContent>
        </Card>
      </div>

      <AdminCharts
        dadosUsuariosPorFuncao={dadosUsuariosPorFuncao}
        dadosVerificacoesPorStatus={dadosVerificacoesPorStatus}
        verificacoesPorAmbiente={verificacoesPorAmbiente}
        dadosSessoesPorStatus={dadosSessoesPorStatus}
      />

      <Card>
        <CardHeader>
          <CardTitle>Problemas Recentes</CardTitle>
          <CardDescription>Últimos problemas encontrados nas verificações</CardDescription>
        </CardHeader>
        <CardContent>
          {problemasRecentes.length > 0 ? (
            <div className="space-y-4">
              {problemasRecentes.map((problema) => {
                const problemas = []
                if (problema.mouse !== "OK") problemas.push(`Mouse: ${problema.mouse}`)
                if (problema.teclado !== "OK") problemas.push(`Teclado: ${problema.teclado}`)
                if (problema.monitor !== "OK") problemas.push(`Monitor: ${problema.monitor}`)
                if (problema.cabos !== "OK") problemas.push(`Cabos: ${problema.cabos}`)

                return (
                  <Alert key={problema.id} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      Problema na máquina {problema.maquina.name} ({problema.maquina.ambiente.name})
                    </AlertTitle>
                    <AlertDescription>
                      <p>
                        <strong>Problemas:</strong> {problemas.join(", ")}
                      </p>
                      <p>
                        <strong>Verificado por:</strong> {problema.user.name} em{" "}
                        {new Date(problema.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      {problema.observacao && (
                        <p>
                          <strong>Observação:</strong> {problema.observacao}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">Nenhum problema encontrado recentemente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
