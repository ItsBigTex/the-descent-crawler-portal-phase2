import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  const auth=req.headers.get("Authorization")||"";
  const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{global:{headers:{Authorization:auth}}});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return new Response("Unauthorized",{status:401,headers:cors});
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(profile?.role!=="gm") return new Response("GM only",{status:403,headers:cors});

  const body=await req.json();
  // Phase 2 AI boundary: call your selected LLM provider here using a server-side secret.
  // Never return or expose the provider API key to the browser.
  // Expected structured result:
  const result={
    title:`${body.tier||"Bronze"} Reward Draft`,
    items:[],
    note:"AI provider not connected yet. Add provider call in this Edge Function."
  };
  return new Response(JSON.stringify(result),{headers:{...cors,"Content-Type":"application/json"}});
});
