import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("https://aftlhyhiskoeyflfiljr.supabase.co")!,
    Deno.env.get("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdGxoeWhpc2tvZXlmbGZpbGpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQxMTgxNSwiZXhwIjoyMDcwOTg3ODE1fQ.9FtsshnJL8lae6T6YGvIeuFDmPAMpqRkmbuQXp-fFWc")!
  )

  const { email, password } = await req.json()

  // 기본 로그인 시도
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return new Response(error.message, { status: 400 })

  // 승인 여부 확인
  const { data: profile } = await supabase
    .from("profile")
    .select("approved")
    .eq("id", data.user.id)
    .single()

  if (!profile?.approved) {
    return new Response("관리자 승인 대기 중입니다.", { status: 403 })
  }

  return new Response(JSON.stringify(data), { status: 200 })
})
