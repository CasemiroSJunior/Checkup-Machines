import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    const url = new URL(req.url)
    const ambienteId = url.searchParams.get("ambienteId")

    const where = ambienteId ? { ambienteId: Number.parseInt(ambienteId) } : {}

    const maquinas = await prisma.maquinas.findMany({
      where,
      include: {
        ambiente: true,
        _count: {
          select: {
            Verificacao: true,
          },
        },
      },
    })

    return NextResponse.json(maquinas)
  } catch (error) {
    console.error("Erro ao buscar máquinas:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { name, ambienteId, ip, mac, patrimonio } = body

    if (!name || !ambienteId) {
      return NextResponse.json({ message: "Nome e ambiente são obrigatórios" }, { status: 400 })
    }

    // Verificar se o ambiente existe
    const ambiente = await prisma.ambientes.findUnique({
      where: { id: ambienteId },
    })

    if (!ambiente) {
      return NextResponse.json({ message: "Ambiente não encontrado" }, { status: 404 })
    }

    // Verificar se o IP já existe (se fornecido)
    if (ip) {
      const existingMaquinaByIp = await prisma.maquinas.findUnique({
        where: { ip },
      })

      if (existingMaquinaByIp) {
        return NextResponse.json({ message: "Endereço IP já está em uso" }, { status: 400 })
      }
    }

    // Verificar se o MAC já existe (se fornecido)
    if (mac) {
      const existingMaquinaByMac = await prisma.maquinas.findUnique({
        where: { mac },
      })

      if (existingMaquinaByMac) {
        return NextResponse.json({ message: "Endereço MAC já está em uso" }, { status: 400 })
      }
    }

    // Verificar se o patrimônio já existe (se fornecido)
    if (patrimonio) {
      const existingMaquinaByPatrimonio = await prisma.maquinas.findUnique({
        where: { patrimonio },
      })

      if (existingMaquinaByPatrimonio) {
        return NextResponse.json({ message: "Número de patrimônio já está em uso" }, { status: 400 })
      }
    }

    const maquina = await prisma.maquinas.create({
      data: {
        name,
        ambienteId,
        ip,
        mac,
        patrimonio,
      },
    })

    return NextResponse.json({ maquina, message: "Máquina criada com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar máquina:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
