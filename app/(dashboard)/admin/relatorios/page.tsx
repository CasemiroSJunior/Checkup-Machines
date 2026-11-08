"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

interface Verificacao {
  id: number
  createdAt: string
  mouse: string
  teclado: string
  monitor: string
  cabos: string
  maquina: {
    name: string
    ambiente: {
      name: string
    }
  }
  user: {
    name: string
  }
}

export default function RelatoriosPage() {
  const { toast } = useToast()
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [tipoRelatorio, setTipoRelatorio] = useState("verificacoes")
  const [isLoading, setIsLoading] = useState(false)
  const [verificacoes, setVerificacoes] = useState<Verificacao[]>([])
  const [activeTab, setActiveTab] = useState("grafico")

  async function gerarRelatorio() {
    if (!dataInicio || !dataFim) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha as datas de início e fim",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/relatorios?tipo=${tipoRelatorio}&dataInicio=${dataInicio}&dataFim=${dataFim}`)

      if (!response.ok) {
        throw new Error("Erro ao gerar relatório")
      }

      const data = await response.json()
      setVerificacoes(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o relatório",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Preparar dados para os gráficos
  const dadosVerificacoesPorAmbiente = verificacoes.reduce(
    (acc, verificacao) => {
      const ambiente = verificacao.maquina.ambiente.name
      const index = acc.findIndex((item) => item.name === ambiente)
      if (index !== -1) {
        acc[index].value += 1
      } else {
        acc.push({ name: ambiente, value: 1 })
      }
      return acc
    },
    [] as { name: string; value: number }[],
  )

  const dadosVerificacoesPorStatus = verificacoes.reduce(
    (acc, verificacao) => {
      const temProblema =
        verificacao.mouse !== "OK" ||
        verificacao.teclado !== "OK" ||
        verificacao.monitor !== "OK" ||
        verificacao.cabos !== "OK"

      if (temProblema) {
        acc[0].value += 1
      } else {
        acc[1].value += 1
      }
      return acc
    },
    [
      { name: "Com Problemas", value: 0 },
      { name: "Sem Problemas", value: 0 },
    ],
  )

  const dadosVerificacoesPorComponente = [
    { name: "Mouse", ok: 0, problema: 0 },
    { name: "Teclado", ok: 0, problema: 0 },
    { name: "Monitor", ok: 0, problema: 0 },
    { name: "Cabos", ok: 0, problema: 0 },
  ]

  verificacoes.forEach((verificacao) => {
    dadosVerificacoesPorComponente[0].ok += verificacao.mouse === "OK" ? 1 : 0
    dadosVerificacoesPorComponente[0].problema += verificacao.mouse !== "OK" ? 1 : 0
    dadosVerificacoesPorComponente[1].ok += verificacao.teclado === "OK" ? 1 : 0
    dadosVerificacoesPorComponente[1].problema += verificacao.teclado !== "OK" ? 1 : 0
    dadosVerificacoesPorComponente[2].ok += verificacao.monitor === "OK" ? 1 : 0
    dadosVerificacoesPorComponente[2].problema += verificacao.monitor !== "OK" ? 1 : 0
    dadosVerificacoesPorComponente[3].ok += verificacao.cabos === "OK" ? 1 : 0
    dadosVerificacoesPorComponente[3].problema += verificacao.cabos !== "OK" ? 1 : 0
  })

  // Cores para os gráficos
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>

      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório</CardTitle>
          <CardDescription>Selecione o período e o tipo de relatório que deseja gerar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoRelatorio">Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger id="tipoRelatorio">
                  <SelectValue placeholder="Selecione o tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verificacoes">Verificações</SelectItem>
                  <SelectItem value="problemas">Problemas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={gerarRelatorio} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Relatório"
            )}
          </Button>
        </CardFooter>
      </Card>

      {verificacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Relatório de {tipoRelatorio === "verificacoes" ? "Verificações" : "Problemas"} (
              {new Date(dataInicio).toLocaleDateString("pt-BR")} a {new Date(dataFim).toLocaleDateString("pt-BR")})
            </CardTitle>
            <CardDescription>Total de registros: {verificacoes.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grafico">Gráficos</TabsTrigger>
                <TabsTrigger value="tabela">Tabela</TabsTrigger>
              </TabsList>
              <TabsContent value="grafico" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-80">
                    <h3 className="text-lg font-medium mb-2">Verificações por Ambiente</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosVerificacoesPorAmbiente}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dadosVerificacoesPorAmbiente.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-80">
                    <h3 className="text-lg font-medium mb-2">Verificações por Status</h3>
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
                          <Cell fill="#FF8042" />
                          <Cell fill="#00C49F" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="h-80">
                  <h3 className="text-lg font-medium mb-2">Problemas por Componente</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosVerificacoesPorComponente}
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
                      <Bar dataKey="ok" name="OK" fill="#00C49F" />
                      <Bar dataKey="problema" name="Problema" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="tabela" className="pt-4">
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-medium">Data</th>
                        <th className="p-2 text-left font-medium">Máquina</th>
                        <th className="p-2 text-left font-medium">Ambiente</th>
                        <th className="p-2 text-left font-medium">Técnico</th>
                        <th className="p-2 text-left font-medium">Mouse</th>
                        <th className="p-2 text-left font-medium">Teclado</th>
                        <th className="p-2 text-left font-medium">Monitor</th>
                        <th className="p-2 text-left font-medium">Cabos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificacoes.map((verificacao) => (
                        <tr key={verificacao.id} className="border-b">
                          <td className="p-2">{new Date(verificacao.createdAt).toLocaleDateString("pt-BR")}</td>
                          <td className="p-2">{verificacao.maquina.name}</td>
                          <td className="p-2">{verificacao.maquina.ambiente.name}</td>
                          <td className="p-2">{verificacao.user.name}</td>
                          <td className="p-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                verificacao.mouse === "OK" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {verificacao.mouse}
                            </span>
                          </td>
                          <td className="p-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                verificacao.teclado === "OK" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {verificacao.teclado}
                            </span>
                          </td>
                          <td className="p-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                verificacao.monitor === "OK" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {verificacao.monitor}
                            </span>
                          </td>
                          <td className="p-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                verificacao.cabos === "OK" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {verificacao.cabos}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
