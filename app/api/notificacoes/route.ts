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
    const lida = url.searchParams.get("lida")

    const where: any = {
      userId: Number.parseInt(session.user.id),
    }

    if (lida) {
      where.lida = lida === "true"
    }

    const notificacoes = await prisma.notificacao.findMany({
      where,
      include: {
        verificacao: {
          include: {
            maquina: {
              include: {
                ambiente: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(notificacoes)
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
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
    const { titulo, mensagem, verificacaoId, userId } = body

    if (!titulo || !mensagem || !userId) {
      return NextResponse.json({ message: "Título, mensagem e usuário são obrigatórios" }, { status: 400 })
    }

    // Verificar se o usuário existe
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!usuario) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    }

    // Se verificacaoId for fornecido, verificar se a verificação existe
    if (verificacaoId) {
      const verificacao = await prisma.verificacoes.findUnique({
        where: { id: verificacaoId },
      })

      if (!verificacao) {
        return NextResponse.json({ message: "Verificação não encontrada" }, { status: 404 })
      }
    }

    // Criar a notificação
    const notificacao = await prisma.notificacao.create({
      data: {
        titulo,
        mensagem,
        verificacaoId,
        userId,
      },
    })

    return NextResponse.json({ notificacao, message: "Notificação criada com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar notificação:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
