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

    const sessao = await prisma.sessaoVerificacao.findUnique({
      where: { id },
      include: {
        ambiente: true,
        user: true,
        verificacoes: {
          include: {
            maquina: true,
            VerificacaoFoto: true,
          },
        },
      },
    })

    if (!sessao) {
      return NextResponse.json({ message: "Sessão de verificação não encontrada" }, { status: 404 })
    }

    // Buscar todas as máquinas do ambiente para saber quais ainda não foram verificadas
    const maquinasDoAmbiente = await prisma.maquinas.findMany({
      where: { ambienteId: sessao.ambienteId },
    })

    const maquinasVerificadas = new Set(sessao.verificacoes.map((v) => v.maquinaId))
    const maquinasNaoVerificadas = maquinasDoAmbiente.filter((m) => !maquinasVerificadas.has(m.id))

    return NextResponse.json({
      ...sessao,
      maquinasNaoVerificadas,
    })
  } catch (error) {
    console.error("Erro ao buscar sessão de verificação:", error)
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
    const { status } = body

    if (!status) {
      return NextResponse.json({ message: "Status é obrigatório" }, { status: 400 })
    }

    // Verificar se a sessão existe
    const sessaoExistente = await prisma.sessaoVerificacao.findUnique({
      where: { id },
    })

    if (!sessaoExistente) {
      return NextResponse.json({ message: "Sessão de verificação não encontrada" }, { status: 404 })
    }

    // Verificar se a sessão já está finalizada
    if (sessaoExistente.status === "finalizada") {
      return NextResponse.json({ message: "Sessão já finalizada não pode ser alterada" }, { status: 400 })
    }

    // Atualizar a sessão
    const data: any = { status }

    // Se estiver finalizando, adicionar a data de finalização
    if (status === "finalizada") {
      data.finalizadaEm = new Date()
    }

    const sessao = await prisma.sessaoVerificacao.update({
      where: { id },
      data,
    })

    return NextResponse.json({ sessao, message: "Sessão de verificação atualizada com sucesso" })
  } catch (error) {
    console.error("Erro ao atualizar sessão de verificação:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
