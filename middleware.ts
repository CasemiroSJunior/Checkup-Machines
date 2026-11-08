import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Verificar se o usuário está autenticado
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verificar se a rota é administrativa
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Verificar se o usuário é administrador
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/ambientes/:path*",
    "/maquinas/:path*",
    "/verificacoes/:path*",
    "/sessoes-verificacao/:path*",
  ],
}
