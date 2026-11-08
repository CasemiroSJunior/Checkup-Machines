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

export default function NovaMaquinaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [isLoadingAmbientes, setIsLoadingAmbientes] = useState(true)

  useEffect(() => {
    async function fetchAmbientes() {
      try {
        const response = await fetch("/api/ambientes")

        if (!response.ok) {
          throw new Error("Erro ao buscar ambientes")
        }

        const data = await response.json()
        setAmbientes(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar ambientes",
          description: "Não foi possível carregar a lista de ambientes",
        })
      } finally {
        setIsLoadingAmbientes(false)
      }
    }

    fetchAmbientes()
  }, [toast])

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
      const response = await fetch("/api/maquinas", {
        method: "POST",
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
        throw new Error(data.message || "Erro ao criar máquina")
      }

      toast({
        title: "Máquina criada",
        description: "A máquina foi criada com sucesso",
      })

      router.push("/maquinas")
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar máquina",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a máquina",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingAmbientes) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Carregando ambientes...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Nova Máquina</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Máquina</CardTitle>
            <CardDescription>Preencha as informações para criar uma nova máquina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Máquina</Label>
              <Input id="name" name="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ambienteId">Ambiente</Label>
              <Select name="ambienteId" required>
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
              <Input id="ip" name="ip" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mac">Endereço MAC (opcional)</Label>
              <Input id="mac" name="mac" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="patrimonio">Número de Patrimônio (opcional)</Label>
              <Input id="patrimonio" name="patrimonio" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Máquina"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
