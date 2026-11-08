import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Certifique-se de que a pasta uploads existe
const uploadsDir = path.join(process.cwd(), "public", "uploads")

// Criar a pasta se não existir
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

export async function saveImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Gerar um nome único para o arquivo
  const fileName = `${uuidv4()}-${file.name.replace(/\s/g, "_")}`
  const filePath = path.join(uploadsDir, fileName)

  // Salvar o arquivo
  fs.writeFileSync(filePath, buffer)

  // Retornar o caminho relativo para o arquivo
  return `/uploads/${fileName}`
}
