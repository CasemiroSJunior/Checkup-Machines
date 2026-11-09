import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const uploadsDir = path.join(process.cwd(), "public", "uploads")

export async function saveImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Gerar um nome único e seguro para o arquivo
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const fileName = `${uuidv4()}-${safeName}`

  // Salvar cópia local como backup
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }
  const filePath = path.join(uploadsDir, fileName)
  fs.writeFileSync(filePath, buffer)

  // Se AWS_S3_BUCKET estiver configurado no .env, envia para o Amazon S3
  if (process.env.AWS_S3_BUCKET) {
    try {
      const region = process.env.AWS_REGION || "us-east-1"
      const bucket = process.env.AWS_S3_BUCKET

      const s3 = new S3Client({ region, followRegionRedirects: true })

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `verificacoes/${fileName}`,
          Body: buffer,
          ContentType: file.type || "image/jpeg",
        })
      )
    } catch (error) {
      console.error("Erro ao enviar para o S3 (mantido backup local):", error)
    }
  }

  return `/api/verificacoes/fotos/${fileName}`
}
