"use client";

import { useActionState, Suspense } from "react";
import { signUpAction } from "@/app/actions/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function RegisterContent() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  return (
    <main 
      style={{ backgroundImage: "radial-gradient(circle at center, #1b0205 0%, #000000 100%)" }}
      className="flex min-h-screen flex-col items-center justify-center p-6 text-text-primary"
    >
      <div className="w-full max-w-md space-y-8 p-8 border border-white/10 rounded-md bg-bg-card/90 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="text-center space-y-2">
          <h1 
            style={{ textShadow: "0 0 15px rgba(139, 0, 0, 0.8)" }}
            className="text-5xl font-gothic tracking-wider text-blood-red"
          >
            CHRONICLEOS
          </h1>
          <p className="text-xs uppercase tracking-widest text-text-muted font-data">
            Novo Narrador / Jogador
          </p>
          <div className="h-px w-16 bg-blood-red/40 mx-auto my-4" />
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          {/* Campo oculto para passar o callbackUrl para a Server Action */}
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          {state?.error && (
            <div className="p-3 text-sm text-blood-red bg-burgundy/10 rounded border border-blood-red/30 font-reading">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label 
                htmlFor="name" 
                className="block text-xs uppercase tracking-wider text-text-muted font-data font-semibold"
              >
                Seu Nome de Exibição
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-2 block w-full px-3 py-2.5 rounded bg-bg-input border border-white/10 text-text-primary text-sm font-reading focus:border-gold-accent focus:ring-1 focus:ring-gold-accent focus-visible:ring-2 focus-visible:ring-gold-accent outline-none transition-colors duration-150"
                placeholder="Ex: Moisés"
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-xs uppercase tracking-wider text-text-muted font-data font-semibold"
              >
                Endereço de E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-2 block w-full px-3 py-2.5 rounded bg-bg-input border border-white/10 text-text-primary text-sm font-reading focus:border-gold-accent focus:ring-1 focus:ring-gold-accent focus-visible:ring-2 focus-visible:ring-gold-accent outline-none transition-colors duration-150"
                placeholder="exemplo@dominio.com"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-xs uppercase tracking-wider text-text-muted font-data font-semibold"
              >
                Defina sua Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-2 block w-full px-3 py-2.5 rounded bg-bg-input border border-white/10 text-text-primary text-sm font-reading focus:border-gold-accent focus:ring-1 focus:ring-gold-accent focus-visible:ring-2 focus-visible:ring-gold-accent outline-none transition-colors duration-150"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-blood-red hover:bg-burgundy text-white rounded font-data uppercase tracking-wider text-sm font-bold transition-colors duration-150 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-gold-accent outline-none flex items-center justify-center space-x-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Configurando Perfil do Sangue...</span>
              </>
            ) : (
              <span>Iniciar Cadastro</span>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-text-muted mt-6 font-sans">
          Já possui conta cadastrada?{" "}
          <Link 
            href={callbackUrl ? `/?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/"} 
            className="text-text-primary hover:text-gold-accent underline transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-gold-accent outline-none rounded px-1"
          >
            Faça login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-bg-main text-text-muted font-data uppercase tracking-widest text-xs">
        Carregando...
      </main>
    }>
      <RegisterContent />
    </Suspense>
  );
}

