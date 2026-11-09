import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// Pasta local usada como fallback caso o S3 não esteja configurado
const uploadsDir = path.join(process.cwd(), "public", "uploads")

export async function saveImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Gerar um nome único para o arquivo
  const fileName = `${uuidv4()}-${file.name.replace(/\s/g, "_")}`

  // Se AWS_S3_BUCKET estiver configurado no .env, envia para o Amazon S3
  if (process.env.AWS_S3_BUCKET) {
    const region = process.env.AWS_REGION || "us-east-1"
    const bucket = process.env.AWS_S3_BUCKET

    const s3 = new S3Client({ region })

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `verificacoes/${fileName}`,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      })
    )

    return `https://${bucket}.s3.${region}.amazonaws.com/verificacoes/${fileName}`
  }

  // Fallback local se AWS_S3_BUCKET estiver vazio
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const filePath = path.join(uploadsDir, fileName)
  fs.writeFileSync(filePath, buffer)

  return `/uploads/${fileName}`
}
