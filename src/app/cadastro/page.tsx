"use client";

import { useActionState } from "react";
import { signUpAction } from "@/app/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-bg-main text-text-primary">
      <div className="w-full max-w-md space-y-8 p-8 border border-white/10 rounded-md bg-bg-card shadow-none">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-gothic tracking-wider text-blood-red">
            CHRONICLEOS
          </h1>
          <p className="text-xs uppercase tracking-widest text-text-muted font-data">
            Novo Narrador / Jogador
          </p>
          <div className="h-px w-16 bg-blood-red/40 mx-auto my-4" />
        </div>

        <form action={formAction} className="mt-8 space-y-6">
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
            className="w-full py-3 bg-blood-red hover:bg-burgundy text-white rounded font-data uppercase tracking-wider text-sm font-bold transition-colors duration-150 cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-gold-accent outline-none"
          >
            {isPending ? "Configurando Perfil do Sangue..." : "Iniciar Cadastro"}
          </button>
        </form>

        <div className="text-center text-sm text-text-muted mt-6 font-sans">
          Já possui conta cadastrada?{" "}
          <Link 
            href="/" 
            className="text-text-primary hover:text-gold-accent underline transition-colors duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-gold-accent outline-none rounded px-1"
          >
            Faça login
          </Link>
        </div>
      </div>
    </main>
  );
}
