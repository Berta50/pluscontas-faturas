import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Lê o utilizador atual (renovando o token se necessário)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Se não estiver com sessão iniciada e tentar aceder a áreas protegidas:
  if (!user && (pathname.startsWith("/admin") || pathname.startsWith("/cliente"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Se já estiver com sessão iniciada e for para a página de login:
  if (user && pathname === "/login") {
    // Procura o perfil para saber se é admin ou cliente
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.role === "admin") {
      url.pathname = "/admin/empresas";
    } else {
      url.pathname = "/cliente/enviar";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
