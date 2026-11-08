import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, matricula, password, role } = body

    if (!name || !email || !matricula || !password) {
      return NextResponse.json({ message: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Verificar se o email já existe
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUserByEmail) {
      return NextResponse.json({ message: "Email já está em uso" }, { status: 400 })
    }

    // Verificar se a matrícula já existe
    const existingUserByMatricula = await prisma.user.findUnique({
      where: { matricula },
    })

    if (existingUserByMatricula) {
      return NextResponse.json({ message: "Matrícula já está em uso" }, { status: 400 })
    }

    // Criptografar a senha
    const hashedPassword = await hash(password, 10)

    // Criar o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        matricula,
        password: hashedPassword,
        role: role || "tecnico", // Default para técnico se não for especificado
      },
    })

    // Remover a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword, message: "Usuário criado com sucesso" }, { status: 201 })
  } catch (error) {
    console.error("Erro ao registrar usuário:", error)
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 })
  }
}
