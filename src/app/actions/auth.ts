"use server";

import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signUpAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { error: "Todos os campos são obrigatórios." };
  }

  let userId: string | undefined;

  try {
    // 1. Tenta criar a conta no Neon Auth (Better Auth retorna { data, error })
    const { data, error } = await auth.signUp.email({
      email,
      password,
      name,
    });

    if (error) {
      return { error: error.message || "Erro ao criar conta no Neon Auth." };
    }

    userId = data?.user?.id;

    if (!userId) {
      return { error: "ID do usuário não retornado pelo Neon Auth." };
    }

    try {
      // 2. Tenta gravar na tabela pública users via Drizzle
      await db.insert(users).values({
        id: userId,
        name,
        email,
        role: "user",
      });
    } catch (dbError) {
      // 3. Rollback de Segurança: Se a inserção falhar, deleta o usuário criado no Neon Auth
      console.error("Erro ao gravar usuário no banco público. Iniciando rollback...", dbError);
      
      const neonApiKey = process.env.NEON_API_KEY;
      const projectId = process.env.NEON_PROJECT_ID;

      if (userId && neonApiKey && projectId) {
        try {
          await fetch(`https://console.neon.tech/api/v2/projects/${projectId}/branches/main/auth/users/${userId}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${neonApiKey}`,
              "Accept": "application/json",
            },
          });
        } catch (rollbackError) {
          console.error("Falha ao executar rollback no Neon Auth:", rollbackError);
        }
      }
      return { error: "Falha ao configurar perfil. Tente novamente." };
    }
  } catch (err: any) {
    console.error("Erro inesperado no cadastro:", err);
    return { error: "Ocorreu um erro inesperado. Tente novamente." };
  }

  redirect("/hub");
}

export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "E-mail e senha são obrigatórios." };
  }

  try {
    const { error } = await auth.signIn.email({
      email,
      password,
    });

    if (error) {
      return { error: "Credenciais inválidas. Verifique seu e-mail e senha." };
    }
  } catch (err: any) {
    console.error("Erro inesperado no login:", err);
    return { error: "Ocorreu um erro inesperado. Tente novamente." };
  }

  redirect("/hub");
}

export async function signOutAction() {
  try {
    await auth.signOut({
      fetchOptions: {
        headers: await headers(),
      },
    });
  } catch (error) {
    console.error("Erro no signOut:", error);
  }
  redirect("/");
}
