import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { compare } from "bcrypt"
import NextAuth, { type AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais inválidas")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user?.password) {
          throw new Error("Credenciais inválidas")
        }

        const isCorrectPassword = await compare(credentials.password, user.password)

        if (!isCorrectPassword) {
          throw new Error("Credenciais inválidas")
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          matricula: user.matricula,
          role: user.role,
        }
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          matricula: token.matricula,
          role: token.role,
        },
      }
    },
    jwt: ({ token, user }) => {
      if (user) {
        return {
          ...token,
          id: user.id,
          matricula: user.matricula,
          role: user.role,
        }
      }
      return token
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
