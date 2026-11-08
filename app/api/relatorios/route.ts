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

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 })
    }

    const url = new URL(req.url)
    const tipo = url.searchParams.get("tipo") || "verificacoes"
    const dataInicio = url.searchParams.get("dataInicio")
    const dataFim = url.searchParams.get("dataFim")

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ message: "Datas de início e fim são obrigatórias" }, { status: 400 })
    }

    // Converter as datas para o formato ISO
    const dataInicioISO = new Date(dataInicio)
    dataInicioISO.setHours(0, 0, 0, 0)

    const dataFimISO = new Date(dataFim)
    dataFimISO.setHours(23, 59, 59, 999)

    // Construir a consulta base
    const where: any = {
      createdAt: {
        gte: dataInicioISO,
        lte: dataFimISO,
      },
    }

    // Se o tipo for "problemas", adicionar filtro para verificações com problemas
    if (tipo === "problemas") {
      where.OR = [
        { mouse: { not: "OK" } },
        { teclado: { not: "OK" } },
        { monitor: { not: "OK" } },
        { cabos: { not: "OK" } },
      ]
    }

    // Buscar as verificações
    const verificacoes = await prisma.verificacoes.findMany({
      where,
      include: {
        maquina: {
          include: {
            ambiente: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(verificacoes)
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
