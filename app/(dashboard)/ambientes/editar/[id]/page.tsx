"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Ambiente {
  id: number
  name: string
}

export default function EditarAmbientePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null)
  const [isLoadingAmbiente, setIsLoadingAmbiente] = useState(true)

  useEffect(() => {
    async function fetchAmbiente() {
      try {
        const response = await fetch(`/api/ambientes/${params.id}`)

        if (!response.ok) {
          throw new Error("Erro ao buscar ambiente")
        }

        const data = await response.json()
        setAmbiente(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar ambiente",
          description: "Não foi possível carregar os dados do ambiente",
        })
      } finally {
        setIsLoadingAmbiente(false)
      }
    }

    fetchAmbiente()
  }, [params.id, toast])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string

    try {
      const response = await fetch(`/api/ambientes/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erro ao atualizar ambiente")
      }

      toast({
        title: "Ambiente atualizado",
        description: "O ambiente foi atualizado com sucesso",
      })

      router.push("/ambientes")
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar ambiente",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o ambiente",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingAmbiente) {
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Editar Ambiente</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Ambiente</CardTitle>
            <CardDescription>Edite as informações do ambiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Ambiente</Label>
              <Input id="name" name="name" defaultValue={ambiente.name} required />
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
