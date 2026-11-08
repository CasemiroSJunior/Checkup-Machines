import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Users, Monitor, ClipboardCheck, CheckSquare } from "lucide-react"

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
  const verificacoesPorAmbiente = await prisma.$queryRaw`
    SELECT a.name, COUNT(v.id) as count
    FROM Ambientes a
    LEFT JOIN Maquinas m ON a.id = m.ambienteId
    LEFT JOIN Verificacoes v ON m.id = v.maquinaId
    GROUP BY a.id, a.name
    ORDER BY count DESC
    LIMIT 10
  `

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

  // Cores para os gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuários por Função</CardTitle>
            <CardDescription>Distribuição de usuários por função</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosUsuariosPorFuncao}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosUsuariosPorFuncao.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verificações por Status</CardTitle>
            <CardDescription>Distribuição de verificações por status</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosVerificacoesPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosVerificacoesPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verificações por Ambiente</CardTitle>
            <CardDescription>Número de verificações por ambiente</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={verificacoesPorAmbiente as any}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Verificações" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessões por Status</CardTitle>
            <CardDescription>Distribuição de sessões por status</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosSessoesPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosSessoesPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

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
