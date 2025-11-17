import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const TEBI_ENDPOINT = 'https://s3.tebi.io'
const TEBI_BUCKET = process.env.TEBI_BUCKET || 'user-cv'

function getS3() {
  const accessKeyId = process.env.TEBI_ACCESS_KEY
  const secretAccessKey = process.env.TEBI_SECRET_KEY
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing TEBI_ACCESS_KEY or TEBI_SECRET_KEY environment variables')
  }
  return new S3Client({
    region: 'global',
    endpoint: TEBI_ENDPOINT,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType, data } = await req.json()

    if (!fileName || !contentType || !data) {
      return NextResponse.json(
        { error: 'Missing fileName, contentType, or data in request body' },
        { status: 400 }
      )
    }

    // Convert base64 → Buffer
    const buffer = Buffer.from(data, 'base64')

    const s3 = getS3()
    await s3.send(
      new PutObjectCommand({
        Bucket: TEBI_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      })
    )

    const publicUrl = `${TEBI_ENDPOINT}/${TEBI_BUCKET}/${encodeURIComponent(fileName)}`
    return NextResponse.json({ url: publicUrl }, { status: 200 })
  } catch (error: any) {
    console.error('[upload-tebi] Upload failed:', error)
    const message = error?.message || 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
