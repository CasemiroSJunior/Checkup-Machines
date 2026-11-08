import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sistema de Verificação de Ambientes</CardTitle>
          <CardDescription>Faça login para acessar o sistema de verificação de ambientes escolares</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/login" className="w-full">
            <Button className="w-full" size="lg">
              Login
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button className="w-full" variant="outline" size="lg">
              Registrar
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Sistema para verificação e monitoramento de ambientes escolares
        </CardFooter>
      </Card>
    </main>
  )
}
