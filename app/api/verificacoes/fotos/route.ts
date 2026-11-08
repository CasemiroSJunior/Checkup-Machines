import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { saveImage } from "@/lib/upload"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    const formData = await req.formData()
    const foto = formData.get("foto") as File
    const verificacaoId = formData.get("verificacaoId") as string

    if (!foto || !verificacaoId) {
      return NextResponse.json({ message: "Foto e ID da verificação são obrigatórios" }, { status: 400 })
    }

    // Verificar se a verificação existe
    const verificacao = await prisma.verificacoes.findUnique({
      where: { id: Number.parseInt(verificacaoId) },
    })

    if (!verificacao) {
      return NextResponse.json({ message: "Verificação não encontrada" }, { status: 404 })
    }

    // Salvar a imagem no servidor e obter o caminho
    const imagePath = await saveImage(foto)

    // Salvar o caminho da foto no banco de dados
    const verificacaoFoto = await prisma.verificacaoFoto.create({
      data: {
        verificacaoId: Number.parseInt(verificacaoId),
        url: imagePath,
      },
    })

    return NextResponse.json({ verificacaoFoto, message: "Foto adicionada com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar foto:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
