"use client"

import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
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

type Maquina = {
  id: number
  name: string
  ip: string | null
  mac: string | null
  patrimonio: string | null
  ambiente: {
    id: number
    name: string
  }
  _count: {
    Verificacao: number
  }
}

export const columns: ColumnDef<Maquina>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="w-[50px]">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "ambiente.name",
    header: "Ambiente",
  },
  {
    accessorKey: "ip",
    header: "IP",
    cell: ({ row }) => <div>{row.getValue("ip") || "-"}</div>,
  },
  {
    accessorKey: "mac",
    header: "MAC",
    cell: ({ row }) => <div>{row.getValue("mac") || "-"}</div>,
  },
  {
    accessorKey: "patrimonio",
    header: "Patrimônio",
    cell: ({ row }) => <div>{row.getValue("patrimonio") || "-"}</div>,
  },
  {
    accessorKey: "_count.Verificacao",
    header: "Verificações",
    cell: ({ row }) => <div>{row.original._count.Verificacao}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell maquina={row.original} />,
  },
]

function ActionCell({ maquina }: { maquina: Maquina }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function deleteMaquina() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/maquinas/${maquina.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir máquina")
      }

      toast({
        title: "Máquina excluída",
        description: "A máquina foi excluída com sucesso",
      })

      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir a máquina",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/maquinas/editar/${maquina.id}`}>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editar</span>
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a máquina
              {maquina._count.Verificacao > 0 && " e todas as suas verificações associadas"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMaquina}
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
