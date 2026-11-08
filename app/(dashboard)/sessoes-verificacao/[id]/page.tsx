"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Camera, ArrowLeft, CheckCircle, XCircle, Check } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Ambiente {
  id: number
  name: string
}

interface Maquina {
  id: number
  name: string
  ip: string | null
  mac: string | null
  patrimonio: string | null
}

interface Verificacao {
  id: number
  maquinaId: number
  mouse: string
  teclado: string
  monitor: string
  cabos: string
  observacao: string | null
  createdAt: string
  maquina: Maquina
  VerificacaoFoto: {
    id: number
    url: string
  }[]
}

interface SessaoVerificacao {
  id: number
  ambienteId: number
  userId: number
  status: string
  createdAt: string
  finalizadaEm: string | null
  ambiente: Ambiente
  verificacoes: Verificacao[]
  maquinasNaoVerificadas: Maquina[]
}

interface NovaVerificacao {
  maquinaId: number
  mouse: string
  teclado: string
  monitor: string
  cabos: string
  observacao: string
  fotos: File[]
}

export default function SessaoVerificacaoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFinalizando, setIsFinalizando] = useState(false)
  const [sessao, setSessao] = useState<SessaoVerificacao | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("verificadas")
  const [selectedMaquinaId, setSelectedMaquinaId] = useState<string>("")
  const [novaVerificacao, setNovaVerificacao] = useState<NovaVerificacao>({
    maquinaId: 0,
    mouse: "OK",
    teclado: "OK",
    monitor: "OK",
    cabos: "OK",
    observacao: "",
    fotos: [],
  })

  useEffect(() => {
    fetchSessao()
  }, [params.id])

  async function fetchSessao() {
    try {
      const response = await fetch(`/api/sessoes-verificacao/${params.id}`)

      if (!response.ok) {
        throw new Error("Erro ao buscar sessão de verificação")
      }

      const data = await response.json()
      setSessao(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar sessão",
        description: "Não foi possível carregar os dados da sessão de verificação",
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  function handleMaquinaChange(value: string) {
    setSelectedMaquinaId(value)
    setNovaVerificacao({
      ...novaVerificacao,
      maquinaId: Number.parseInt(value),
    })
  }

  function handleVerificacaoChange(field: keyof NovaVerificacao, value: any) {
    setNovaVerificacao({
      ...novaVerificacao,
      [field]: value,
    })
  }

  function handleFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      const newFotos = Array.from(event.target.files)
      setNovaVerificacao({
        ...novaVerificacao,
        fotos: [...novaVerificacao.fotos, ...newFotos],
      })
    }
  }

  function removeFoto(index: number) {
    setNovaVerificacao({
      ...novaVerificacao,
      fotos: novaVerificacao.fotos.filter((_, i) => i !== index),
    })
  }

  async function handleSubmitVerificacao() {
    if (!session?.user?.id || !sessao) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para realizar verificações",
      })
      return
    }

    setIsLoading(true)
    try {
      // Criar a verificação
      const verificacaoResponse = await fetch("/api/verificacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maquinaId: novaVerificacao.maquinaId,
          userId: Number.parseInt(session.user.id),
          sessaoVerificacaoId: sessao.id,
          mouse: novaVerificacao.mouse,
          teclado: novaVerificacao.teclado,
          monitor: novaVerificacao.monitor,
          cabos: novaVerificacao.cabos,
          observacao: novaVerificacao.observacao || null,
        }),
      })

      if (!verificacaoResponse.ok) {
        const data = await verificacaoResponse.json()
        throw new Error(data.message || "Erro ao criar verificação")
      }

      const verificacaoData = await verificacaoResponse.json()
      const verificacaoId = verificacaoData.verificacao.id

      // Enviar fotos, se houver
      if (novaVerificacao.fotos.length > 0) {
        for (const foto of novaVerificacao.fotos) {
          const fotoFormData = new FormData()
          fotoFormData.append("foto", foto)
          fotoFormData.append("verificacaoId", verificacaoId.toString())

          const fotoResponse = await fetch("/api/verificacoes/fotos", {
            method: "POST",
            body: fotoFormData,
          })

          if (!fotoResponse.ok) {
            throw new Error("Erro ao enviar foto")
          }
        }
      }

      toast({
        title: "Verificação registrada",
        description: "A verificação foi registrada com sucesso",
      })

      // Resetar o formulário
      setNovaVerificacao({
        maquinaId: 0,
        mouse: "OK",
        teclado: "OK",
        monitor: "OK",
        cabos: "OK",
        observacao: "",
        fotos: [],
      })
      setSelectedMaquinaId("")

      // Atualizar a sessão
      fetchSessao()
      setActiveTab("verificadas")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar verificação",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao registrar a verificação",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function finalizarSessao() {
    if (!sessao) return

    setIsFinalizando(true)
    try {
      const response = await fetch(`/api/sessoes-verificacao/${sessao.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "finalizada",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erro ao finalizar sessão")
      }

      toast({
        title: "Sessão finalizada",
        description: "A sessão de verificação foi finalizada com sucesso",
      })

      fetchSessao()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar sessão",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao finalizar a sessão",
      })
    } finally {
      setIsFinalizando(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!sessao) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Sessão não encontrada</p>
      </div>
    )
  }

  const isFinalizada = sessao.status === "finalizada"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/sessoes-verificacao">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Verificação: {sessao.ambiente.name}</h1>
            <p className="text-muted-foreground">
              Iniciada em {new Date(sessao.createdAt).toLocaleDateString("pt-BR")}
              {isFinalizada && sessao.finalizadaEm
                ? ` • Finalizada em ${new Date(sessao.finalizadaEm).toLocaleDateString("pt-BR")}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              sessao.status === "finalizada" ? "success" : sessao.status === "em_andamento" ? "default" : "secondary"
            }
            className="flex items-center gap-1"
          >
            {sessao.status === "finalizada" ? (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Finalizada</span>
              </>
            ) : sessao.status === "em_andamento" ? (
              <>
                <XCircle className="h-3 w-3" />
                <span>Em andamento</span>
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                <span>Iniciada</span>
              </>
            )}
          </Badge>

          {!isFinalizada && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Finalizar Verificação
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalizar verificação?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja finalizar esta sessão de verificação? Após finalizada, não será possível
                    adicionar ou modificar verificações.
                    {sessao.maquinasNaoVerificadas.length > 0 && (
                      <p className="mt-2 font-semibold text-destructive">
                        Atenção: Ainda existem {sessao.maquinasNaoVerificadas.length} máquinas não verificadas.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={finalizarSessao}
                    disabled={isFinalizando}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isFinalizando ? "Finalizando..." : "Finalizar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="verificadas" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Máquinas Verificadas ({sessao.verificacoes.length})
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="flex items-center gap-2" disabled={isFinalizada}>
            <XCircle className="h-4 w-4" />
            Máquinas Pendentes ({sessao.maquinasNaoVerificadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verificadas" className="mt-4">
          {sessao.verificacoes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessao.verificacoes.map((verificacao) => {
                const temProblema =
                  verificacao.mouse !== "OK" ||
                  verificacao.teclado !== "OK" ||
                  verificacao.monitor !== "OK" ||
                  verificacao.cabos !== "OK"

                return (
                  <Card key={verificacao.id} className="overflow-hidden">
                    <div className={`h-2 ${temProblema ? "bg-destructive" : "bg-green-500"}`} />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{verificacao.maquina.name}</CardTitle>
                      <CardDescription>
                        {verificacao.maquina.patrimonio ? `Patrimônio: ${verificacao.maquina.patrimonio}` : ""}
                        {verificacao.maquina.ip
                          ? (verificacao.maquina.patrimonio ? ` • ` : "") + `IP: ${verificacao.maquina.ip}`
                          : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Mouse:</span>{" "}
                          <Badge variant={verificacao.mouse === "OK" ? "success" : "destructive"}>
                            {verificacao.mouse}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Teclado:</span>{" "}
                          <Badge variant={verificacao.teclado === "OK" ? "success" : "destructive"}>
                            {verificacao.teclado}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Monitor:</span>{" "}
                          <Badge variant={verificacao.monitor === "OK" ? "success" : "destructive"}>
                            {verificacao.monitor}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Cabos:</span>{" "}
                          <Badge variant={verificacao.cabos === "OK" ? "success" : "destructive"}>
                            {verificacao.cabos}
                          </Badge>
                        </div>
                      </div>

                      {verificacao.observacao && (
                        <div className="mt-2">
                          <span className="font-medium">Observações:</span>
                          <p className="text-sm mt-1">{verificacao.observacao}</p>
                        </div>
                      )}

                      {verificacao.VerificacaoFoto.length > 0 && (
                        <div className="mt-2">
                          <span className="font-medium">Fotos:</span>
                          <div className="grid grid-cols-3 gap-1 mt-1">
                            {verificacao.VerificacaoFoto.slice(0, 3).map((foto) => (
                              <img
                                key={foto.id}
                                src={foto.url || "/placeholder.svg"}
                                alt={`Foto ${foto.id}`}
                                className="w-full h-16 object-cover rounded-md"
                              />
                            ))}
                            {verificacao.VerificacaoFoto.length > 3 && (
                              <div className="flex items-center justify-center bg-muted rounded-md h-16">
                                <span className="text-xs">+{verificacao.VerificacaoFoto.length - 3}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Link href={`/verificacoes/${verificacao.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Detalhes
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhuma máquina verificada ainda.</p>
              <Button onClick={() => setActiveTab("pendentes")} disabled={isFinalizada}>
                Iniciar Verificações
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pendentes" className="mt-4">
          {isFinalizada ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Esta sessão de verificação já foi finalizada.</p>
            </div>
          ) : sessao.maquinasNaoVerificadas.length > 0 ? (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nova Verificação</CardTitle>
                  <CardDescription>Selecione uma máquina para verificar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="maquinaId">Máquina</Label>
                    <Select value={selectedMaquinaId} onValueChange={handleMaquinaChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma máquina" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessao.maquinasNaoVerificadas.map((maquina) => (
                          <SelectItem key={maquina.id} value={maquina.id.toString()}>
                            {maquina.name}
                            {maquina.patrimonio ? ` (Patrimônio: ${maquina.patrimonio})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMaquinaId && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="mouse">Mouse</Label>
                          <Select
                            value={novaVerificacao.mouse}
                            onValueChange={(value) => handleVerificacaoChange("mouse", value)}
                          >
                            <SelectTrigger id="mouse">
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Danificado">Danificado</SelectItem>
                              <SelectItem value="Ausente">Ausente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="teclado">Teclado</Label>
                          <Select
                            value={novaVerificacao.teclado}
                            onValueChange={(value) => handleVerificacaoChange("teclado", value)}
                          >
                            <SelectTrigger id="teclado">
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Danificado">Danificado</SelectItem>
                              <SelectItem value="Ausente">Ausente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="monitor">Monitor</Label>
                          <Select
                            value={novaVerificacao.monitor}
                            onValueChange={(value) => handleVerificacaoChange("monitor", value)}
                          >
                            <SelectTrigger id="monitor">
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Danificado">Danificado</SelectItem>
                              <SelectItem value="Ausente">Ausente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cabos">Cabos</Label>
                          <Select
                            value={novaVerificacao.cabos}
                            onValueChange={(value) => handleVerificacaoChange("cabos", value)}
                          >
                            <SelectTrigger id="cabos">
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OK">OK</SelectItem>
                              <SelectItem value="Danificado">Danificado</SelectItem>
                              <SelectItem value="Ausente">Ausente</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacao">Observações (opcional)</Label>
                        <Textarea
                          id="observacao"
                          placeholder="Descreva aqui qualquer observação adicional"
                          className="min-h-[100px]"
                          value={novaVerificacao.observacao}
                          onChange={(e) => handleVerificacaoChange("observacao", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fotos">Fotos (opcional)</Label>
                        <div className="flex items-center gap-4">
                          <Label
                            htmlFor="fotos"
                            className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Adicionar Fotos</span>
                          </Label>
                          <Input
                            id="fotos"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFotoChange}
                            className="hidden"
                          />
                        </div>

                        {novaVerificacao.fotos.length > 0 && (
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            {novaVerificacao.fotos.map((foto, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(foto) || "/placeholder.svg"}
                                  alt={`Foto ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-md"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-6 w-6"
                                  onClick={() => removeFoto(index)}
                                >
                                  <span className="sr-only">Remover</span>
                                  &times;
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedMaquinaId("")
                      setNovaVerificacao({
                        maquinaId: 0,
                        mouse: "OK",
                        teclado: "OK",
                        monitor: "OK",
                        cabos: "OK",
                        observacao: "",
                        fotos: [],
                      })
                    }}
                  >
                    Limpar
                  </Button>
                  <Button type="button" onClick={handleSubmitVerificacao} disabled={isLoading || !selectedMaquinaId}>
                    {isLoading ? "Registrando..." : "Registrar Verificação"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Todas as máquinas já foram verificadas!</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default">
                    <Check className="mr-2 h-4 w-4" />
                    Finalizar Verificação
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalizar verificação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja finalizar esta sessão de verificação? Após finalizada, não será possível
                      adicionar ou modificar verificações.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={finalizarSessao}
                      disabled={isFinalizando}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isFinalizando ? "Finalizando..." : "Finalizar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
