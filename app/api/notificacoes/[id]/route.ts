import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
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
    })

    if (!notificacao) {
      return NextResponse.json({ message: "Notificação não encontrada" }, { status: 404 })
    }

    // Verificar se a notificação pertence ao usuário
    if (notificacao.userId !== Number.parseInt(session.user.id) && session.user.role !== "admin") {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(notificacao)
  } catch (error) {
    console.error("Erro ao buscar notificação:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    const body = await req.json()
    const { lida } = body

    if (lida === undefined) {
      return NextResponse.json({ message: "Campo 'lida' é obrigatório" }, { status: 400 })
    }

    // Verificar se a notificação existe
    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
    })

    if (!notificacao) {
      return NextResponse.json({ message: "Notificação não encontrada" }, { status: 404 })
    }

    // Verificar se a notificação pertence ao usuário
    if (notificacao.userId !== Number.parseInt(session.user.id) && session.user.role !== "admin") {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 })
    }

    // Atualizar a notificação
    const updatedNotificacao = await prisma.notificacao.update({
      where: { id },
      data: { lida },
    })

    return NextResponse.json({ notificacao: updatedNotificacao, message: "Notificação atualizada com sucesso" })
  } catch (error) {
    console.error("Erro ao atualizar notificação:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    // Verificar se a notificação existe
    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
    })

    if (!notificacao) {
      return NextResponse.json({ message: "Notificação não encontrada" }, { status: 404 })
    }

    // Verificar se a notificação pertence ao usuário
    if (notificacao.userId !== Number.parseInt(session.user.id) && session.user.role !== "admin") {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 })
    }

    // Excluir a notificação
    await prisma.notificacao.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Notificação excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir notificação:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
