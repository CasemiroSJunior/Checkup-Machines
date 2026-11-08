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

    const verificacao = await prisma.verificacoes.findUnique({
      where: { id },
      include: {
        maquina: {
          include: {
            ambiente: true,
          },
        },
        user: true,
        VerificacaoFoto: true,
      },
    })

    if (!verificacao) {
      return NextResponse.json({ message: "Verificação não encontrada" }, { status: 404 })
    }

    return NextResponse.json(verificacao)
  } catch (error) {
    console.error("Erro ao buscar verificação:", error)
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

    // Excluir fotos associadas
    await prisma.verificacaoFoto.deleteMany({
      where: {
        verificacaoId: id,
      },
    })

    // Excluir verificação
    await prisma.verificacoes.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Verificação excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir verificação:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
