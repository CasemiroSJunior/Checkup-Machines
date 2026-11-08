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
import { Camera, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
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

interface VerificacaoMaquina {
  maquinaId: number
  mouse: string
  teclado: string
  monitor: string
  cabos: string
  observacao: string
  fotos: File[]
}

export default function VerificarAmbientePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null)
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [verificacoes, setVerificacoes] = useState<Record<number, VerificacaoMaquina>>({})
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("0")

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar o ambiente
        const ambienteResponse = await fetch(`/api/ambientes/${params.id}`)
        if (!ambienteResponse.ok) throw new Error("Erro ao buscar ambiente")
        const ambienteData = await ambienteResponse.json()
        setAmbiente(ambienteData)

        // Buscar as máquinas do ambiente
        const maquinasResponse = await fetch(`/api/maquinas?ambienteId=${params.id}`)
        if (!maquinasResponse.ok) throw new Error("Erro ao buscar máquinas")
        const maquinasData = await maquinasResponse.json()
        setMaquinas(maquinasData)

        // Inicializar as verificações
        const verificacoesInit: Record<number, VerificacaoMaquina> = {}
        maquinasData.forEach((maquina: Maquina) => {
          verificacoesInit[maquina.id] = {
            maquinaId: maquina.id,
            mouse: "OK",
            teclado: "OK",
            monitor: "OK",
            cabos: "OK",
            observacao: "",
            fotos: [],
          }
        })
        setVerificacoes(verificacoesInit)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados necessários",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [params.id, toast])

  const handleVerificacaoChange = (maquinaId: number, field: keyof VerificacaoMaquina, value: any) => {
    setVerificacoes((prev) => ({
      ...prev,
      [maquinaId]: {
        ...prev[maquinaId],
        [field]: value,
      },
    }))
  }

  const handleFotoChange = (maquinaId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFotos = Array.from(event.target.files)
      setVerificacoes((prev) => ({
        ...prev,
        [maquinaId]: {
          ...prev[maquinaId],
          fotos: [...prev[maquinaId].fotos, ...newFotos],
        },
      }))
    }
  }

  const removeFoto = (maquinaId: number, index: number) => {
    setVerificacoes((prev) => ({
      ...prev,
      [maquinaId]: {
        ...prev[maquinaId],
        fotos: prev[maquinaId].fotos.filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para realizar verificações",
      })
      return
    }

    setIsLoading(true)
    try {
      // Para cada máquina, criar uma verificação
      for (const maquinaId in verificacoes) {
        const verificacao = verificacoes[Number(maquinaId)]

        // Criar a verificação
        const verificacaoResponse = await fetch("/api/verificacoes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            maquinaId: Number(maquinaId),
            userId: Number(session.user.id),
            mouse: verificacao.mouse,
            teclado: verificacao.teclado,
            monitor: verificacao.monitor,
            cabos: verificacao.cabos,
            observacao: verificacao.observacao || null,
          }),
        })

        if (!verificacaoResponse.ok) {
          throw new Error(`Erro ao criar verificação para máquina ${maquinaId}`)
        }

        const verificacaoData = await verificacaoResponse.json()
        const verificacaoId = verificacaoData.verificacao.id

        // Enviar fotos, se houver
        if (verificacao.fotos.length > 0) {
          for (const foto of verificacao.fotos) {
            const fotoFormData = new FormData()
            fotoFormData.append("foto", foto)
            fotoFormData.append("verificacaoId", verificacaoId.toString())

            const fotoResponse = await fetch("/api/verificacoes/fotos", {
              method: "POST",
              body: fotoFormData,
            })

            if (!fotoResponse.ok) {
              throw new Error(`Erro ao enviar foto para verificação ${verificacaoId}`)
            }
          }
        }
      }

      toast({
        title: "Verificações registradas",
        description: "Todas as verificações foram registradas com sucesso",
      })

      router.push(`/ambientes/visualizar/${params.id}`)
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar verificações",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao registrar as verificações",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!ambiente) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Ambiente não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/ambientes/visualizar/${params.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Verificar Ambiente: {ambiente.name}</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 mb-4">
          {maquinas.map((maquina, index) => (
            <TabsTrigger key={maquina.id} value={index.toString()} className="text-xs sm:text-sm">
              {maquina.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {maquinas.map((maquina, index) => (
          <TabsContent key={maquina.id} value={index.toString()}>
            <Card>
              <CardHeader>
                <CardTitle>Verificação de {maquina.name}</CardTitle>
                <CardDescription>
                  {maquina.patrimonio ? `Patrimônio: ${maquina.patrimonio}` : ""}
                  {maquina.ip ? (maquina.patrimonio ? ` • ` : "") + `IP: ${maquina.ip}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`mouse-${maquina.id}`}>Mouse</Label>
                    <Select
                      value={verificacoes[maquina.id]?.mouse}
                      onValueChange={(value) => handleVerificacaoChange(maquina.id, "mouse", value)}
                    >
                      <SelectTrigger id={`mouse-${maquina.id}`}>
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
                    <Label htmlFor={`teclado-${maquina.id}`}>Teclado</Label>
                    <Select
                      value={verificacoes[maquina.id]?.teclado}
                      onValueChange={(value) => handleVerificacaoChange(maquina.id, "teclado", value)}
                    >
                      <SelectTrigger id={`teclado-${maquina.id}`}>
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
                    <Label htmlFor={`monitor-${maquina.id}`}>Monitor</Label>
                    <Select
                      value={verificacoes[maquina.id]?.monitor}
                      onValueChange={(value) => handleVerificacaoChange(maquina.id, "monitor", value)}
                    >
                      <SelectTrigger id={`monitor-${maquina.id}`}>
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
                    <Label htmlFor={`cabos-${maquina.id}`}>Cabos</Label>
                    <Select
                      value={verificacoes[maquina.id]?.cabos}
                      onValueChange={(value) => handleVerificacaoChange(maquina.id, "cabos", value)}
                    >
                      <SelectTrigger id={`cabos-${maquina.id}`}>
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
                  <Label htmlFor={`observacao-${maquina.id}`}>Observações (opcional)</Label>
                  <Textarea
                    id={`observacao-${maquina.id}`}
                    placeholder="Descreva aqui qualquer observação adicional"
                    className="min-h-[100px]"
                    value={verificacoes[maquina.id]?.observacao}
                    onChange={(e) => handleVerificacaoChange(maquina.id, "observacao", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`fotos-${maquina.id}`}>Fotos (opcional)</Label>
                  <div className="flex items-center gap-4">
                    <Label
                      htmlFor={`fotos-${maquina.id}`}
                      className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Adicionar Fotos</span>
                    </Label>
                    <Input
                      id={`fotos-${maquina.id}`}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFotoChange(maquina.id, e)}
                      className="hidden"
                    />
                  </div>

                  {verificacoes[maquina.id]?.fotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {verificacoes[maquina.id].fotos.map((foto, index) => (
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
                            onClick={() => removeFoto(maquina.id, index)}
                          >
                            <span className="sr-only">Remover</span>
                            &times;
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      verificacoes[maquina.id]?.mouse === "OK" &&
                      verificacoes[maquina.id]?.teclado === "OK" &&
                      verificacoes[maquina.id]?.monitor === "OK" &&
                      verificacoes[maquina.id]?.cabos === "OK"
                        ? "success"
                        : "destructive"
                    }
                  >
                    {verificacoes[maquina.id]?.mouse === "OK" &&
                    verificacoes[maquina.id]?.teclado === "OK" &&
                    verificacoes[maquina.id]?.monitor === "OK" &&
                    verificacoes[maquina.id]?.cabos === "OK" ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Tudo OK</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        <span>Problemas encontrados</span>
                      </div>
                    )}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  {index > 0 && (
                    <Button variant="outline" onClick={() => setActiveTab((index - 1).toString())}>
                      Anterior
                    </Button>
                  )}

                  {index < maquinas.length - 1 && (
                    <Button onClick={() => setActiveTab((index + 1).toString())}>Próxima</Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Registrando..." : "Registrar Todas as Verificações"}
        </Button>
      </div>
    </div>
  )
}
