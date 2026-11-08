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
import { Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Maquina {
  id: number
  name: string
  ip: string | null
  mac: string | null
  patrimonio: string | null
  ambiente: {
    id: number
    name: string
  }
}

export default function VerificarMaquinaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [maquina, setMaquina] = useState<Maquina | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [mouse, setMouse] = useState("OK")
  const [teclado, setTeclado] = useState("OK")
  const [monitor, setMonitor] = useState("OK")
  const [cabos, setCabos] = useState("OK")
  const [observacao, setObservacao] = useState("")
  const [fotos, setFotos] = useState<File[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar a máquina
        const maquinaResponse = await fetch(`/api/maquinas/${params.id}`)
        if (!maquinaResponse.ok) throw new Error("Erro ao buscar máquina")
        const maquinaData = await maquinaResponse.json()
        setMaquina(maquinaData)
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

  function handleFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files.length > 0) {
      const newFotos = Array.from(event.target.files)
      setFotos((prevFotos) => [...prevFotos, ...newFotos])
    }
  }

  function removeFoto(index: number) {
    setFotos((prevFotos) => prevFotos.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
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
      // Criar a verificação
      const verificacaoResponse = await fetch("/api/verificacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maquinaId: Number(params.id),
          userId: Number(session.user.id),
          mouse,
          teclado,
          monitor,
          cabos,
          observacao: observacao || null,
        }),
      })

      if (!verificacaoResponse.ok) {
        throw new Error("Erro ao criar verificação")
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

      if (maquina?.ambiente) {
        router.push(`/ambientes/visualizar/${maquina.ambiente.id}`)
      } else {
        router.push("/verificacoes")
      }
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

  if (!maquina) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Máquina não encontrada</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/ambientes/visualizar/${maquina.ambiente.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Verificar Máquina: {maquina.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Verificação</CardTitle>
          <CardDescription>
            Ambiente: {maquina.ambiente.name}
            {maquina.patrimonio ? ` • Patrimônio: ${maquina.patrimonio}` : ""}
            {maquina.ip ? ` • IP: ${maquina.ip}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mouse">Mouse</Label>
              <Select value={mouse} onValueChange={setMouse}>
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
              <Select value={teclado} onValueChange={setTeclado}>
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
              <Select value={monitor} onValueChange={setMonitor}>
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
              <Select value={cabos} onValueChange={setCabos}>
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
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
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
              <Input id="fotos" type="file" accept="image/*" multiple onChange={handleFotoChange} className="hidden" />
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
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Registrando..." : "Registrar Verificação"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
