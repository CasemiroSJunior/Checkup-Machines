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

    const maquina = await prisma.maquinas.findUnique({
      where: { id },
      include: {
        ambiente: true,
        _count: {
          select: {
            Verificacao: true,
          },
        },
      },
    })

    if (!maquina) {
      return NextResponse.json({ message: "Máquina não encontrada" }, { status: 404 })
    }

    return NextResponse.json(maquina)
  } catch (error) {
    console.error("Erro ao buscar máquina:", error)
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

    // Verificar se a máquina existe
    const existingMaquina = await prisma.maquinas.findUnique({
      where: { id },
    })

    if (!existingMaquina) {
      return NextResponse.json({ message: "Máquina não encontrada" }, { status: 404 })
    }

    // Verificar se o IP já existe (se fornecido e diferente do atual)
    if (ip && ip !== existingMaquina.ip) {
      const existingMaquinaByIp = await prisma.maquinas.findUnique({
        where: { ip },
      })

      if (existingMaquinaByIp && existingMaquinaByIp.id !== id) {
        return NextResponse.json({ message: "Endereço IP já está em uso" }, { status: 400 })
      }
    }

    // Verificar se o MAC já existe (se fornecido e diferente do atual)
    if (mac && mac !== existingMaquina.mac) {
      const existingMaquinaByMac = await prisma.maquinas.findUnique({
        where: { mac },
      })

      if (existingMaquinaByMac && existingMaquinaByMac.id !== id) {
        return NextResponse.json({ message: "Endereço MAC já está em uso" }, { status: 400 })
      }
    }

    // Verificar se o patrimônio já existe (se fornecido e diferente do atual)
    if (patrimonio && patrimonio !== existingMaquina.patrimonio) {
      const existingMaquinaByPatrimonio = await prisma.maquinas.findUnique({
        where: { patrimonio },
      })

      if (existingMaquinaByPatrimonio && existingMaquinaByPatrimonio.id !== id) {
        return NextResponse.json({ message: "Número de patrimônio já está em uso" }, { status: 400 })
      }
    }

    const maquina = await prisma.maquinas.update({
      where: { id },
      data: {
        name,
        ambienteId,
        ip,
        mac,
        patrimonio,
      },
    })

    return NextResponse.json({ maquina, message: "Máquina atualizada com sucesso" })
  } catch (error) {
    console.error("Erro ao atualizar máquina:", error)
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

    // Verificar se existem verificações associadas
    const verificacoes = await prisma.verificacoes.findMany({
      where: { maquinaId: id },
    })

    // Se existirem verificações, excluir fotos associadas
    if (verificacoes.length > 0) {
      const verificacaoIds = verificacoes.map((v) => v.id)

      // Excluir fotos de verificação
      await prisma.verificacaoFoto.deleteMany({
        where: {
          verificacaoId: {
            in: verificacaoIds,
          },
        },
      })

      // Excluir verificações
      await prisma.verificacoes.deleteMany({
        where: {
          maquinaId: id,
        },
      })
    }

    // Excluir máquina
    await prisma.maquinas.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Máquina excluída com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir máquina:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
