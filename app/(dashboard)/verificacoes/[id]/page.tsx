"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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
import { Trash2 } from "lucide-react"

interface Verificacao {
  id: number
  createdAt: string
  mouse: string
  teclado: string
  monitor: string
  cabos: string
  observacao: string | null
  maquina: {
    id: number
    name: string
    ambiente: {
      id: number
      name: string
    }
  }
  user: {
    id: number
    name: string
  }
  VerificacaoFoto: {
    id: number
    url: string
  }[]
}

export default function VerificacaoDetalhesPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [verificacao, setVerificacao] = useState<Verificacao | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function fetchVerificacao() {
      try {
        const response = await fetch(`/api/verificacoes/${params.id}`)

        if (!response.ok) {
          throw new Error("Erro ao buscar verificação")
        }

        const data = await response.json()
        setVerificacao(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar verificação",
          description: "Não foi possível carregar os dados da verificação",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVerificacao()
  }, [params.id, toast])

  async function deleteVerificacao() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/verificacoes/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir verificação")
      }

      toast({
        title: "Verificação excluída",
        description: "A verificação foi excluída com sucesso",
      })

      router.push("/verificacoes")
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a verificação",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  function getStatusBadge(status: string) {
    return <Badge variant={status === "OK" ? "success" : "destructive"}>{status}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!verificacao) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Verificação não encontrada</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Detalhes da Verificação</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a verificação
                  {verificacao.VerificacaoFoto.length > 0 && " e todas as suas fotos associadas"}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteVerificacao}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>Detalhes gerais da verificação</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Máquina</p>
                <p className="text-lg font-semibold">{verificacao.maquina.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ambiente</p>
                <p className="text-lg font-semibold">{verificacao.maquina.ambiente.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verificado por</p>
                <p className="text-lg font-semibold">{verificacao.user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data</p>
                <p className="text-lg font-semibold">
                  {new Date(verificacao.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado dos Componentes</CardTitle>
            <CardDescription>Estado dos componentes verificados</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mouse</p>
                <div className="mt-1">{getStatusBadge(verificacao.mouse)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teclado</p>
                <div className="mt-1">{getStatusBadge(verificacao.teclado)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monitor</p>
                <div className="mt-1">{getStatusBadge(verificacao.monitor)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cabos</p>
                <div className="mt-1">{getStatusBadge(verificacao.cabos)}</div>
              </div>
            </div>

            {verificacao.observacao && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Observações</p>
                <p className="mt-1 p-3 bg-muted rounded-md">{verificacao.observacao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {verificacao.VerificacaoFoto.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fotos</CardTitle>
              <CardDescription>Fotos registradas durante a verificação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {verificacao.VerificacaoFoto.map((foto) => (
                  <div key={foto.id} className="relative">
                    <img
                      src={foto.url || "/placeholder.svg"}
                      alt={`Foto ${foto.id}`}
                      className="w-full h-40 object-cover rounded-md"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
