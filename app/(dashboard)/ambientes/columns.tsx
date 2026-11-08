"use client"

import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2, Eye } from "lucide-react"
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

type Ambiente = {
  id: number
  name: string
  _count: {
    Maquinas: number
  }
}

export const columns: ColumnDef<Ambiente>[] = [
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
    accessorKey: "_count.Maquinas",
    header: "Máquinas",
    cell: ({ row }) => <div>{row.original._count.Maquinas}</div>,
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell ambiente={row.original} />,
  },
]

function ActionCell({ ambiente }: { ambiente: Ambiente }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function deleteAmbiente() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/ambientes/${ambiente.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao excluir ambiente")
      }

      toast({
        title: "Ambiente excluído",
        description: "O ambiente foi excluído com sucesso",
      })

      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir o ambiente",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/ambientes/visualizar/${ambiente.id}`}>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar</span>
        </Button>
      </Link>
      <Link href={`/ambientes/editar/${ambiente.id}`}>
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
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o ambiente
              {ambiente._count.Maquinas > 0 && " e todas as suas máquinas associadas"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAmbiente}
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
