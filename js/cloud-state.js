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

  async function systemEvents(crawlerId,limit=50){
    if(!client||!user)return [];
    let q=client.from('system_events').select('*').order('created_at',{ascending:true}).limit(limit);
    if(crawlerId)q=q.eq('recipient_id',crawlerId);
    const {data,error}=await q;if(error)throw error;return data||[];
  }
  async function acknowledgeSystemEvent(eventId){
    if(!client||!user)throw new Error('Cloud is not ready.');
    const {data,error}=await client.from('system_events').update({status:'acknowledged',updated_at:new Date().toISOString()}).eq('id',eventId).select().single();
    if(error)throw error;return data;
  }
  function subscribeSystemEvents(crawlerId,fn){
    if(!client)return null;
    const filter=crawlerId?`recipient_id=eq.${crawlerId}`:undefined;
    let ch=client.channel('system-events:'+String(crawlerId||'all')).on('postgres_changes',{event:'INSERT',schema:'public',table:'system_events',...(filter?{filter}:{})},p=>fn(p.new,p));
    ch=ch.on('postgres_changes',{event:'UPDATE',schema:'public',table:'system_events',...(filter?{filter}:{})},p=>fn(p.new,p));return ch.subscribe();
  }

  async function activeEncounter(){
    if(!client||!user)return null;
    const {data,error}=await client.from('active_encounters').select('*').eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(error)throw error;return data?.data||data||null;
  }
  function subscribeActiveEncounter(fn){
    if(!client)return null;
    return client.channel('crawler-active-encounter').on('postgres_changes',{event:'*',schema:'public',table:'active_encounters'},p=>fn(p.new?.data||p.new,p)).subscribe();
  }
  async function partyMessages(limit=100){
    if(!client||!user)return [];
    const {data,error}=await client.from('party_messages').select('*').order('created_at',{ascending:false}).limit(limit);
    if(error)throw error;return data||[];
  }
  async function sendPartyMessage(crawlerId,text,senderName=null){
    if(!client||!user)throw new Error('Cloud is not ready.');
    const {data,error}=await client.from('party_messages').insert({sender_crawler_id:crawlerId,sender_name:senderName,text}).select().single();
    if(error)throw error;return data;
  }
  function subscribePartyMessages(fn){
    if(!client)return null;
    return client.channel('party-messages').on('postgres_changes',{event:'INSERT',schema:'public',table:'party_messages'},p=>fn(p.new,p)).subscribe();
  }
  return {init,configured,signIn,signOut,profile,crawler,updateCrawler,feed,subscribeCrawler,subscribeFeed,systemEvents,acknowledgeSystemEvent,subscribeSystemEvents,activeEncounter,subscribeActiveEncounter,partyMessages,sendPartyMessage,subscribePartyMessages,get client(){return client},get user(){return user}};
})();
