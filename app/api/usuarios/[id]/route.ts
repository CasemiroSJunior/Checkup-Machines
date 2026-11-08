import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.id !== params.id) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    const usuario = await prisma.user.findUnique({
      where: { id },
    })

    if (!usuario) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    }

    // Remover a senha do objeto retornado
    const { password, ...usuarioSemSenha } = usuario

    return NextResponse.json(usuarioSemSenha)
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    if (session.user.role !== "admin" && session.user.id !== params.id) {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    const body = await req.json()
    const { name, email, matricula, password, role } = body

    if (!name || !email || !matricula) {
      return NextResponse.json({ message: "Nome, email e matrícula são obrigatórios" }, { status: 400 })
    }

    // Verificar se o usuário existe
    const usuario = await prisma.user.findUnique({
      where: { id },
    })

    if (!usuario) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar se o email já está em uso por outro usuário
    if (email !== usuario.email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUserByEmail && existingUserByEmail.id !== id) {
        return NextResponse.json({ message: "Email já está em uso" }, { status: 400 })
      }
    }

    // Verificar se a matrícula já está em uso por outro usuário
    if (matricula !== usuario.matricula) {
      const existingUserByMatricula = await prisma.user.findUnique({
        where: { matricula },
      })

      if (existingUserByMatricula && existingUserByMatricula.id !== id) {
        return NextResponse.json({ message: "Matrícula já está em uso" }, { status: 400 })
      }
    }

    // Preparar os dados para atualização
    const updateData: any = {
      name,
      email,
      matricula,
    }

    // Apenas administradores podem alterar a função
    if (session.user.role === "admin" && role) {
      updateData.role = role
    }

    // Se uma nova senha foi fornecida, criptografá-la
    if (password) {
      updateData.password = await hash(password, 10)
    }

    // Atualizar o usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    // Remover a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({ user: userWithoutPassword, message: "Usuário atualizado com sucesso" })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Não autorizado" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ message: "Acesso negado" }, { status: 403 })
    }

    const id = Number.parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 })
    }

    // Verificar se o usuário existe
    const usuario = await prisma.user.findUnique({
      where: { id },
    })

    if (!usuario) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 })
    }

    // Não permitir excluir o próprio usuário
    if (id === Number.parseInt(session.user.id)) {
      return NextResponse.json({ message: "Não é possível excluir o próprio usuário" }, { status: 400 })
    }

    // Excluir o usuário
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Usuário excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
