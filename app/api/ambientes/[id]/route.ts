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

    const ambiente = await prisma.ambientes.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Maquinas: true,
          },
        },
      },
    })

    if (!ambiente) {
      return NextResponse.json({ message: "Ambiente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(ambiente)
  } catch (error) {
    console.error("Erro ao buscar ambiente:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
    const { name } = body

    if (!name) {
      return NextResponse.json({ message: "Nome é obrigatório" }, { status: 400 })
    }

    const ambiente = await prisma.ambientes.update({
      where: { id },
      data: { name },
    })

    return NextResponse.json({ ambiente, message: "Ambiente atualizado com sucesso" })
  } catch (error) {
    console.error("Erro ao atualizar ambiente:", error)
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

    // Verificar se existem máquinas associadas
    const maquinas = await prisma.maquinas.findMany({
      where: { ambienteId: id },
    })

    // Se existirem máquinas, excluir verificações e fotos associadas
    if (maquinas.length > 0) {
      const maquinaIds = maquinas.map((m) => m.id)

      // Buscar todas as verificações associadas às máquinas
      const verificacoes = await prisma.verificacoes.findMany({
        where: {
          maquinaId: {
            in: maquinaIds,
          },
        },
      })

      const verificacaoIds = verificacoes.map((v) => v.id)

      // Excluir fotos de verificação
      if (verificacaoIds.length > 0) {
        await prisma.verificacaoFoto.deleteMany({
          where: {
            verificacaoId: {
              in: verificacaoIds,
            },
          },
        })
      }

      // Excluir verificações
      if (maquinaIds.length > 0) {
        await prisma.verificacoes.deleteMany({
          where: {
            maquinaId: {
              in: maquinaIds,
            },
          },
        })
      }

      // Excluir máquinas
      await prisma.maquinas.deleteMany({
        where: {
          ambienteId: id,
        },
      })
    }

    // Excluir ambiente
    await prisma.ambientes.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Ambiente excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir ambiente:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
