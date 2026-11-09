import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  if (ext === ".png") return "image/png"
  if (ext === ".webp") return "image/webp"
  if (ext === ".gif") return "image/gif"
  if (ext === ".svg") return "image/svg+xml"
  return "image/jpeg"
}

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const filename = decodeURIComponent(params.filename)
  const contentType = getMimeType(filename)

  // 1. Se o S3 estiver configurado, busca diretamente do Bucket S3 usando a IAM Role da EC2
  if (process.env.AWS_S3_BUCKET) {
    try {
      const region = process.env.AWS_REGION || "us-east-1"
      const bucket = process.env.AWS_S3_BUCKET
      const s3 = new S3Client({ region, followRegionRedirects: true })

      const response = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: `verificacoes/${filename}`,
        })
      )

      if (response.Body) {
        const byteArray = await response.Body.transformToByteArray()
        return new NextResponse(Buffer.from(byteArray), {
          headers: {
            "Content-Type": response.ContentType || contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      }
    } catch (error) {
      console.error("Erro ao buscar imagem no S3, tentando fallback local:", error)
    }
  }

  // 2. Fallback: lê do disco local (public/uploads)
  const localPath = path.join(process.cwd(), "public", "uploads", path.basename(filename))
  if (fs.existsSync(localPath)) {
    const fileBuffer = fs.readFileSync(localPath)
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  }

  return NextResponse.json({ message: "Imagem não encontrada" }, { status: 404 })
}
