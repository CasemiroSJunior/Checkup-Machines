"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Ambiente {
  id: number
  name: string
}

interface Maquina {
  id: number
  name: string
  ambienteId: number
  ip: string | null
  mac: string | null
  patrimonio: string | null
}

export default function EditarMaquinaPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [maquina, setMaquina] = useState<Maquina | null>(null)
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar a máquina
        const maquinaResponse = await fetch(`/api/maquinas/${params.id}`)

        if (!maquinaResponse.ok) {
          throw new Error("Erro ao buscar máquina")
        }

        const maquinaData = await maquinaResponse.json()
        setMaquina(maquinaData)

        // Buscar os ambientes
        const ambientesResponse = await fetch("/api/ambientes")

        if (!ambientesResponse.ok) {
          throw new Error("Erro ao buscar ambientes")
        }

        const ambientesData = await ambientesResponse.json()
        setAmbientes(ambientesData)
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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const ambienteId = formData.get("ambienteId") as string
    const ip = formData.get("ip") as string
    const mac = formData.get("mac") as string
    const patrimonio = formData.get("patrimonio") as string

    try {
      const response = await fetch(`/api/maquinas/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          ambienteId: Number.parseInt(ambienteId),
          ip: ip || null,
          mac: mac || null,
          patrimonio: patrimonio || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erro ao atualizar máquina")
      }

      toast({
        title: "Máquina atualizada",
        description: "A máquina foi atualizada com sucesso",
      })

      router.push("/maquinas")
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar máquina",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar a máquina",
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Editar Máquina</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Máquina</CardTitle>
            <CardDescription>Edite as informações da máquina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Máquina</Label>
              <Input id="name" name="name" defaultValue={maquina.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambienteId">Ambiente</Label>
              <Select name="ambienteId" defaultValue={maquina.ambienteId.toString()} required>
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
              <Label htmlFor="ip">Endereço IP (opcional)</Label>
              <Input id="ip" name="ip" defaultValue={maquina.ip || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mac">Endereço MAC (opcional)</Label>
              <Input id="mac" name="mac" defaultValue={maquina.mac || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patrimonio">Número de Patrimônio (opcional)</Label>
              <Input id="patrimonio" name="patrimonio" defaultValue={maquina.patrimonio || ""} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
