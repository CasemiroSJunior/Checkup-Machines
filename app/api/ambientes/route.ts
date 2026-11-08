import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    const ambientes = await prisma.ambientes.findMany({
      include: {
        _count: {
          select: {
            Maquinas: true,
          },
        },
      },
    })

    return NextResponse.json(ambientes)
  } catch (error) {
    console.error("Erro ao buscar ambientes:", error)
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
    const { name } = body

    if (!name) {
      return NextResponse.json({ message: "Nome é obrigatório" }, { status: 400 })
    }

    const ambiente = await prisma.ambientes.create({
      data: { name },
    })

    return NextResponse.json({ ambiente, message: "Ambiente criado com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar ambiente:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
