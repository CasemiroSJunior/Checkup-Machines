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
    const sessaoId = url.searchParams.get("sessaoId")
    const maquinaId = url.searchParams.get("maquinaId")

    const where: any = {}

    if (sessaoId) {
      where.sessaoVerificacaoId = Number.parseInt(sessaoId)
    }

    if (maquinaId) {
      where.maquinaId = Number.parseInt(maquinaId)
    }

    const verificacoes = await prisma.verificacoes.findMany({
      where,
      include: {
        maquina: {
          include: {
            ambiente: true,
          },
        },
        user: true,
        _count: {
          select: {
            VerificacaoFoto: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(verificacoes)
  } catch (error) {
    console.error("Erro ao buscar verificações:", error)
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
    const { maquinaId, userId, sessaoVerificacaoId, mouse, teclado, monitor, cabos, observacao } = body

    if (!maquinaId || !userId) {
      return NextResponse.json({ message: "Máquina e usuário são obrigatórios" }, { status: 400 })
    }

    // Verificar se a máquina existe
    const maquina = await prisma.maquinas.findUnique({
      where: { id: maquinaId },
    })

    if (!maquina) {
      return NextResponse.json({ message: "Máquina não encontrada" }, { status: 404 })
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    }

    // Se tiver sessão, verificar se ela existe e não está finalizada
    if (sessaoVerificacaoId) {
      const sessao = await prisma.sessaoVerificacao.findUnique({
        where: { id: sessaoVerificacaoId },
      })

      if (!sessao) {
        return NextResponse.json({ message: "Sessão de verificação não encontrada" }, { status: 404 })
      }

      if (sessao.status === "finalizada") {
        return NextResponse.json(
          { message: "Não é possível adicionar verificações a uma sessão finalizada" },
          { status: 400 },
        )
      }

      // Verificar se já existe uma verificação para esta máquina nesta sessão
      const verificacaoExistente = await prisma.verificacoes.findFirst({
        where: {
          maquinaId,
          sessaoVerificacaoId,
        },
      })

      if (verificacaoExistente) {
        return NextResponse.json({ message: "Esta máquina já foi verificada nesta sessão" }, { status: 400 })
      }

      // Atualizar status da sessão para "em_andamento" se estiver "iniciada"
      if (sessao.status === "iniciada") {
        await prisma.sessaoVerificacao.update({
          where: { id: sessaoVerificacaoId },
          data: { status: "em_andamento" },
        })
      }
    }

    const verificacao = await prisma.verificacoes.create({
      data: {
        maquinaId,
        userId,
        sessaoVerificacaoId,
        mouse,
        teclado,
        monitor,
        cabos,
        observacao,
      },
    })

    return NextResponse.json({ verificacao, message: "Verificação registrada com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar verificação:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
