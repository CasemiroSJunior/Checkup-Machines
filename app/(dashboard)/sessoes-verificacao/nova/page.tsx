"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSession } from "next-auth/react"

interface Ambiente {
  id: number
  name: string
}

export default function NovaSessaoVerificacaoPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [ambientes, setAmbientes] = useState<Ambiente[]>([])
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>("")
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

    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para iniciar uma sessão de verificação",
      })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/sessoes-verificacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ambienteId: Number.parseInt(selectedAmbienteId),
          userId: Number.parseInt(session.user.id),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Se já existe uma sessão ativa, redirecionar para ela
        if (response.status === 400 && data.sessao) {
          toast({
            title: "Sessão já iniciada",
            description: "Já existe uma sessão ativa para este ambiente. Redirecionando...",
          })
          router.push(`/sessoes-verificacao/${data.sessao.id}`)
          return
        }

        throw new Error(data.message || "Erro ao iniciar sessão de verificação")
      }

      toast({
        title: "Sessão iniciada",
        description: "A sessão de verificação foi iniciada com sucesso",
      })

      router.push(`/sessoes-verificacao/${data.sessao.id}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao iniciar sessão",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao iniciar a sessão de verificação",
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
      <h1 className="text-3xl font-bold tracking-tight mb-6">Nova Sessão de Verificação</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Verificação</CardTitle>
            <CardDescription>Selecione o ambiente que deseja verificar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ambienteId">Ambiente</Label>
              <Select value={selectedAmbienteId} onValueChange={setSelectedAmbienteId} required>
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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !selectedAmbienteId}>
              {isLoading ? "Iniciando..." : "Iniciar Verificação"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
