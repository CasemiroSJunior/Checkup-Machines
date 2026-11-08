"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface Notificacao {
  id: number
  titulo: string
  mensagem: string
  lida: boolean
  verificacaoId: number | null
  createdAt: string
}

export function Notificacoes() {
  const router = useRouter()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNotificacoes()

    // Atualizar notificações a cada 30 segundos
    const interval = setInterval(fetchNotificacoes, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchNotificacoes() {
    try {
      const response = await fetch("/api/notificacoes")
      if (response.ok) {
        const data = await response.json()
        setNotificacoes(data)
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function marcarComoLida(id: number) {
    try {
      const response = await fetch(`/api/notificacoes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lida: true }),
      })

      if (response.ok) {
        setNotificacoes((prev) =>
          prev.map((notificacao) => (notificacao.id === id ? { ...notificacao, lida: true } : notificacao)),
        )
      }
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  function handleClick(notificacao: Notificacao) {
    marcarComoLida(notificacao.id)
    if (notificacao.verificacaoId) {
      router.push(`/verificacoes/${notificacao.verificacaoId}`)
    }
  }

  const notificacoesNaoLidas = notificacoes.filter((n) => !n.lida)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notificacoesNaoLidas.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {notificacoesNaoLidas.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Carregando notificações...</div>
        ) : notificacoes.length > 0 ? (
          <div className="max-h-[300px] overflow-y-auto">
            {notificacoes.map((notificacao) => (
              <DropdownMenuItem
                key={notificacao.id}
                className={`flex cursor-pointer flex-col items-start p-3 ${!notificacao.lida ? "bg-muted/50" : ""}`}
                onClick={() => handleClick(notificacao)}
              >
                <div className="flex w-full justify-between">
                  <span className="font-medium">{notificacao.titulo}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notificacao.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{notificacao.mensagem}</p>
                {!notificacao.lida && (
                  <Badge variant="secondary" className="mt-2">
                    Nova
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação encontrada.</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
