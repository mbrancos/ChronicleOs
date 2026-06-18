import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  const { data: session } = await auth.getSession();
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/" || pathname === "/cadastro";

  // Se o usuário estiver autenticado e tentar acessar login ou cadastro, redireciona para /hub
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/hub", request.url));
  }

  // Se o usuário não estiver autenticado e tentar acessar rotas privadas, redireciona para o login (/)
  const isPublicRoute = isAuthRoute || pathname.startsWith("/convite");
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas para permitir redirecionamento inteligente.
     * Ignora apenas arquivos estáticos e rotas de API internas do Next.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
