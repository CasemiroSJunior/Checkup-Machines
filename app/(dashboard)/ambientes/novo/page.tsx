"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function NovoAmbientePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string

    try {
      const response = await fetch("/api/ambientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erro ao criar ambiente")
      }

      toast({
        title: "Ambiente criado",
        description: "O ambiente foi criado com sucesso",
      })

      router.push("/ambientes")
      router.refresh()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar ambiente",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar o ambiente",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Novo Ambiente</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Ambiente</CardTitle>
            <CardDescription>Preencha as informações para criar um novo ambiente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Ambiente</Label>
              <Input id="name" name="name" required />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Ambiente"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
