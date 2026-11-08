"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Usuario {
  id: number
  name: string
  email: string
  matricula: number
  role: string
}

export default function EditarUsuarioPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoadingUsuario, setIsLoadingUsuario] = useState(true)

  useEffect(() => {
    async function fetchUsuario() {
      try {
        const response = await fetch(`/api/usuarios/${params.id}`)

        if (!response.ok) {
          throw new Error("Erro ao buscar usuário")
        }

        const data = await response.json()
        setUsuario(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar usuário",
          description: "Não foi possível carregar os dados do usuário",
        })
      } finally {
        setIsLoadingUsuario(false)
      }
    }

    fetchUsuario()
  }, [params.id, toast])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const matricula = formData.get("matricula") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    try {
      const response = await fetch(`/api/usuarios/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          matricula: Number.parseInt(matricula),
          password: password || undefined, // Só envia a senha se for preenchida
          role,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erro ao atualizar usuário")
      }

      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso",
      })

      router.push("/admin/usuarios")
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o usuário",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingUsuario) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p>Usuário não encontrado</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Editar Usuário</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
            <CardDescription>Edite as informações do usuário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" name="name" defaultValue={usuario.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={usuario.email} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input id="matricula" name="matricula" type="number" defaultValue={usuario.matricula} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha (deixe em branco para manter a atual)</Label>
              <Input id="password" name="password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select name="role" defaultValue={usuario.role}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
