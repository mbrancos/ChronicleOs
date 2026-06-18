"use client";

import { useActionState } from "react";
import { signUpAction } from "@/app/actions/auth";
import Link from "next/link";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8 p-8 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-black">
        <div className="text-center">
          <h1 className="text-3xl font-bold">ChronicleOS - Cadastro</h1>
          <p className="mt-2 text-sm text-zinc-500 font-sans">Crie sua conta para jogar ou narrar.</p>
        </div>

        <form action={formAction} className="mt-8 space-y-6">
          {state?.error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900/50">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">Nome</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black rounded font-medium disabled:opacity-50"
          >
            {isPending ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-4 font-sans">
          Já tem conta?{" "}
          <Link href="/" className="text-zinc-900 dark:text-zinc-100 underline">
            Faça login
          </Link>
        </p>
      </div>
    </main>
  );
}
