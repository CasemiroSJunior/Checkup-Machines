"use client"

import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

type Verificacao = {
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
  _count: {
    VerificacaoFoto: number
  }
}

export const columns: ColumnDef<Verificacao>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="w-[50px]">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "maquina.name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Máquina
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "maquina.ambiente.name",
    header: "Ambiente",
  },
  {
    accessorKey: "user.name",
    header: "Verificado por",
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div>{date.toLocaleDateString("pt-BR")}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const verificacao = row.original
      const hasIssue =
        verificacao.mouse !== "OK" ||
        verificacao.teclado !== "OK" ||
        verificacao.monitor !== "OK" ||
        verificacao.cabos !== "OK"

      return <Badge variant={hasIssue ? "destructive" : "success"}>{hasIssue ? "Com problemas" : "OK"}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell verificacao={row.original} />,
  },
]

function ActionCell({ verificacao }: { verificacao: Verificacao }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function deleteVerificacao() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/verificacoes/${verificacao.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir verificação")
      }

      toast({
        title: "Verificação excluída",
        description: "A verificação foi excluída com sucesso",
      })

      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a verificação",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/verificacoes/${verificacao.id}`}>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Ver</span>
        </Button>
      </Link>
      <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Excluir</span>
      </Button>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a verificação
              {verificacao._count.VerificacaoFoto > 0 && " e todas as suas fotos associadas"}.
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
  )
}
