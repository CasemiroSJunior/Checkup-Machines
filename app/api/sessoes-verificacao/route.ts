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
    const status = url.searchParams.get("status")
    const userId = url.searchParams.get("userId")

    const where: any = {}

    if (ambienteId) {
      where.ambienteId = Number.parseInt(ambienteId)
    }

    if (status) {
      where.status = status
    }

    if (userId) {
      where.userId = Number.parseInt(userId)
    }

    const sessoes = await prisma.sessaoVerificacao.findMany({
      where,
      include: {
        ambiente: true,
        user: true,
        _count: {
          select: {
            verificacoes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(sessoes)
  } catch (error) {
    console.error("Erro ao buscar sessões de verificação:", error)
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
    const { ambienteId, userId } = body

    if (!ambienteId || !userId) {
      return NextResponse.json({ message: "Ambiente e usuário são obrigatórios" }, { status: 400 })
    }

    // Verificar se já existe uma sessão ativa para este ambiente
    const sessaoAtiva = await prisma.sessaoVerificacao.findFirst({
      where: {
        ambienteId,
        status: {
          in: ["iniciada", "em_andamento"],
        },
      },
    })

    if (sessaoAtiva) {
      return NextResponse.json(
        {
          message: "Já existe uma sessão de verificação ativa para este ambiente",
          sessao: sessaoAtiva,
        },
        { status: 400 },
      )
    }

    // Criar nova sessão
    const sessao = await prisma.sessaoVerificacao.create({
      data: {
        ambienteId,
        userId,
        status: "iniciada",
      },
    })

    return NextResponse.json({ sessao, message: "Sessão de verificação iniciada com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar sessão de verificação:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
