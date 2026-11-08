"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react"
import { Camera } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Ambiente {
  id: number
  name: string
}

interface Maquina {
  id: number
  name: string
  ambienteId: number
}

export default function NovaVerificacaoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [filteredMaquinas, setFilteredMaquinas] = useState<Maquina[]>([])
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>("")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [fotos, setFotos] = useState<File[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar os ambientes
        const ambientesResponse = await fetch("/api/ambientes")

        if (!ambientesResponse.ok) {
          throw new Error("Erro ao buscar ambientes")
        }

        const ambientesData = await ambientesResponse.json()
        setAmbientes(ambientesData)

        // Buscar as máquinas
        const maquinasResponse = await fetch("/api/maquinas")

        if (!maquinasResponse.ok) {
          throw new Error("Erro ao buscar máquinas")
        }

        const maquinasData = await maquinasResponse.json()
        setMaquinas(maquinasData)
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
  }, [toast])

  useEffect(() => {
    if (selectedAmbienteId) {
      const filtered = maquinas.filter((maquina) => maquina.ambienteId === Number.parseInt(selectedAmbienteId))
      setFilteredMaquinas(filtered)
    } else {
      setFilteredMaquinas([])
    }
  }, [selectedAmbienteId, maquinas])

  function handleAmbienteChange(value: string) {
    setSelectedAmbienteId(value)
  }

  function handleFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      const newFotos = Array.from(event.target.files)
      setFotos((prevFotos) => [...prevFotos, ...newFotos])
    }
  }

  function removeFoto(index: number) {
    setFotos((prevFotos) => prevFotos.filter((_, i) => i !== index))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const maquinaId = formData.get("maquinaId") as string
    const mouse = formData.get("mouse") as string
    const teclado = formData.get("teclado") as string
    const monitor = formData.get("monitor") as string
    const cabos = formData.get("cabos") as string
    const observacao = formData.get("observacao") as string

    try {
      // Criar a verificação
      const verificacaoResponse = await fetch("/api/verificacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maquinaId: Number.parseInt(maquinaId),
          userId: Number.parseInt(session?.user?.id as string),
          mouse,
          teclado,
          monitor,
          cabos,
          observacao: observacao || null,
        }),
      })

      if (!verificacaoResponse.ok) {
        const data = await verificacaoResponse.json()
        throw new Error(data.message || "Erro ao criar verificação")
      }

      const verificacaoData = await verificacaoResponse.json()
      const verificacaoId = verificacaoData.verificacao.id

      // Enviar fotos, se houver
      if (fotos.length > 0) {
        for (const foto of fotos) {
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

      router.push("/verificacoes")
      router.refresh()
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

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Nova Verificação</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Verificação</CardTitle>
            <CardDescription>Preencha as informações para registrar uma nova verificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ambienteId">Ambiente</Label>
              <Select value={selectedAmbienteId} onValueChange={handleAmbienteChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ambiente" />
                </SelectTrigger>
                <SelectContent>
                  {ambientes.map((ambiente) => (
                    <SelectItem key={ambiente.id} value={ambiente.id.toString()}>
                      {ambiente.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maquinaId">Máquina</Label>
              <Select name="maquinaId" required disabled={!selectedAmbienteId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={selectedAmbienteId ? "Selecione uma máquina" : "Selecione um ambiente primeiro"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredMaquinas.map((maquina) => (
                    <SelectItem key={maquina.id} value={maquina.id.toString()}>
                      {maquina.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mouse">Estado do Mouse</Label>
              <Select name="mouse" defaultValue="OK" required>
                <SelectTrigger>
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
              <Label htmlFor="teclado">Estado do Teclado</Label>
              <Select name="teclado" defaultValue="OK" required>
                <SelectTrigger>
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
              <Label htmlFor="monitor">Estado do Monitor</Label>
              <Select name="monitor" defaultValue="OK" required>
                <SelectTrigger>
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
              <Label htmlFor="cabos">Estado dos Cabos</Label>
              <Select name="cabos" defaultValue="OK" required>
                <SelectTrigger>
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
              <Label htmlFor="observacao">Observações (opcional)</Label>
              <Textarea
                id="observacao"
                name="observacao"
                placeholder="Descreva aqui qualquer observação adicional"
                className="min-h-[100px]"
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

              {fotos.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {fotos.map((foto, index) => (
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Verificação"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
