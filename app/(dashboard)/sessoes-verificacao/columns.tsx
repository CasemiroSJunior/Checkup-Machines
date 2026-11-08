"use client"

import { Button } from "@/components/ui/button"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

type SessaoVerificacao = {
  id: number
  status: string
  createdAt: string
  finalizadaEm: string | null
  ambiente: {
    id: number
    name: string
  }
  user: {
    id: number
    name: string
  }
  _count: {
    verificacoes: number
  }
}

export const columns: ColumnDef<SessaoVerificacao>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="w-[50px]">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "ambiente.name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Ambiente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "user.name",
    header: "Verificador",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge
          variant={status === "finalizada" ? "success" : status === "em_andamento" ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          {status === "finalizada" ? (
            <>
              <CheckCircle className="h-3 w-3" />
              <span>Finalizada</span>
            </>
          ) : status === "em_andamento" ? (
            <>
              <AlertTriangle className="h-3 w-3" />
              <span>Em andamento</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3 w-3" />
              <span>Iniciada</span>
            </>
          )}
        </Badge>
      )
    },
  },
  {
    accessorKey: "_count.verificacoes",
    header: "Verificações",
    cell: ({ row }) => <div>{row.original._count.verificacoes}</div>,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Data de Início
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
    accessorKey: "finalizadaEm",
    header: "Data de Finalização",
    cell: ({ row }) => {
      const date = row.getValue("finalizadaEm")
      return <div>{date ? new Date(date as string).toLocaleDateString("pt-BR") : "-"}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Link href={`/sessoes-verificacao/${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver</span>
            </Button>
          </Link>
        </div>
      )
    },
  },
]
