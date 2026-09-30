// Phase 2 cloud state adapter.
// Existing Phase 1 UI can continue using local state while this adapter is connected page-by-page.
const DSCloud = (() => {
  let client=null, user=null;
  function configured(){
    const c=window.DESCENT_SUPABASE||{};
    return !!(window.supabase && c.url && c.anonKey && !c.url.startsWith('PASTE_') && !c.anonKey.startsWith('PASTE_'));
  }
  async function init(){
    if(!configured()) return {configured:false};
    client=window.supabase.createClient(window.DESCENT_SUPABASE.url,window.DESCENT_SUPABASE.anonKey);
    const {data}=await client.auth.getSession(); user=data.session?.user||null;
    client.auth.onAuthStateChange((_e,s)=>{user=s?.user||null});
    return {configured:true,user};
  }
  async function signIn(email,password){const r=await client.auth.signInWithPassword({email,password});if(r.error)throw r.error;user=r.data.user;return user}
  async function signOut(){await client.auth.signOut();user=null}
  async function profile(){if(!user)return null;const {data,error}=await client.from('profiles').select('*').eq('id',user.id).single();if(error)throw error;return data}
  async function crawler(id){const {data,error}=await client.from('crawlers').select('*').eq('id',id).single();if(error)throw error;return data}
  async function updateCrawler(id,patch){const {data,error}=await client.from('crawlers').update(patch).eq('id',id).select().single();if(error)throw error;return data}
  async function feed(limit=100){const {data,error}=await client.from('activity_feed').select('*').order('created_at',{ascending:false}).limit(limit);if(error)throw error;return data}
  function subscribeCrawler(id,fn){return client.channel('crawler:'+id).on('postgres_changes',{event:'*',schema:'public',table:'crawlers',filter:`id=eq.${id}`},p=>fn(p.new,p)).subscribe()}
  function subscribeFeed(fn){return client.channel('party-feed').on('postgres_changes',{event:'INSERT',schema:'public',table:'activity_feed'},p=>fn(p.new)).subscribe()}
  return {init,configured,signIn,signOut,profile,crawler,updateCrawler,feed,subscribeCrawler,subscribeFeed,get client(){return client},get user(){return user}};
})();
