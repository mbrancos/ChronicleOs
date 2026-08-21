import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return new NextResponse("ID inválido", { status: 400 });
    }

    const [asset] = await db
      .select({
        data: mediaAssets.data,
        mimeType: mediaAssets.mimeType,
        sizeBytes: mediaAssets.sizeBytes,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, id))
      .limit(1);

    if (!asset || !asset.data) {
      return new NextResponse("Mídia não encontrada", { status: 404 });
    }

    // Extrair Base64 puro removendo prefixo Data URL se houver (ex: data:image/webp;base64,...)
    const base64Data = asset.data.includes(",")
      ? asset.data.split(",")[1]
      : asset.data;

    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType || "image/webp",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Erro ao servir mídia:", error);
    return new NextResponse("Erro interno ao carregar imagem", { status: 500 });
  }
}
