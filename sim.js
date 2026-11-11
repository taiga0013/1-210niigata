// 使い方: node sim.js index.html [人数]
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const N=+(process.argv[3]||4000);
// ダミーDOM
const fake=new Proxy(function(){},{get:(t,k)=>k==='hidden'?false:fake,set:()=>true,apply:()=>fake});
const ctx={console,Math,Date,JSON,Object,Array,Set,Map,String,Number,Error,Proxy,
  document:{getElementById:()=>fake,querySelector:()=>fake,querySelectorAll:()=>[],documentElement:fake},
  window:{scrollTo(){},devicePixelRatio:1,matchMedia:()=>({addEventListener(){}}),addEventListener(){}},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},getComputedStyle:()=>({getPropertyValue:()=>''}),
  requestAnimationFrame(){},setInterval(){},clearTimeout(){},setTimeout(){}};
ctx.globalThis=ctx;ctx.__EXPOSE__={};
vm.createContext(ctx);vm.runInContext(code,ctx);
const A=ctx.__EXPOSE__;
// 生命表から e0
for(const s of ['m','f']){let e=0;const lx=A.LX[s];for(let a=0;a<119;a++)e+=(lx[a]+lx[a+1])/2;console.log('lx e0',s,(e/1e5).toFixed(2));}
const agg={m:[],f:[]},br={},errs=[];let stuck=0,disHits=0,disPref={},years=0,ach={},ill=0,mar=0,kids=0,out=0,ret=0,causes={};
const inc=(o,k)=>o[k]=(o[k]||0)+1;
for(let i=0;i<N;i++){
  try{
    const mode=i%2?'A':'B';
    const P=A.newProfile(mode,null);
    const G=A.begin(P,1800);
    let guard=0;
    while(!G.ended&&guard<5000){
      if(G.queue.length){A.choose(A.autoIndex(G.queue[0]));}
      else A.stepYear();
      guard++;
    }
    if(!G.ended){stuck++;continue;}
    const L=G.L;
    agg[L.sex].push(L.deathAge);years+=L.deathAge;
    for(const k in G.prefDis)disPref[k]=(disPref[k]||0)+G.prefDis[k];
    disHits+=L.disasters;
    if(L.hsName)inc(br,'高校');
    if(L.edu==='univ')inc(br,L.school?'大学(在学中)':'大学卒');
    if(L.edu==='senmon')inc(br,'専門卒');
    if(L.edu==='hs')inc(br,'高卒就職');
    if(L.ronin)inc(br,'浪人'+L.ronin);
    if(L.turns.some(t=>/大学に入学/.test(t.text)&&!/新潟|長岡|三条/.test(t.text)))inc(br,'県外大学');
    if(L.turns.some(t=>/(新潟大学|新潟県立大学|長岡技術科学大学|三条市立大学)に入学/.test(t.text)))inc(br,'県内大学');
    if(L.turns.some(t=>/県外の専門/.test(t.text)))inc(br,'県外専門');
    if(L.turns.some(t=>/県外で就職/.test(t.text)))inc(br,'県外就職18');
    if(L.deathAge>=18&&L.deathAge<30&&!L.hsName)inc(br,'高校なし!?');
    if(L.illCount)ill++;if(L.marriedAt!=null)mar++;kids+=L.kids.length;if(L.everOut)out++;if(L.returned)ret++;
    inc(causes,L.cause);
    A.achieved(L).forEach(a=>inc(ach,a));
    if(Number.isNaN(L.savings)||Number.isNaN(L.m.h))errs.push('NaN '+i);
  }catch(e){errs.push(e.stack.split('\n').slice(0,3).join(' | '));}
}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
console.log('N',N,'stuck',stuck,'errors',errs.length);errs.slice(0,5).forEach(e=>console.log(' ',e));
console.log('平均死亡年齢+0.5  男',(mean(agg.m)+.5).toFixed(2),'(目標81.35) 女',(mean(agg.f)+.5).toFixed(2),'(目標87.33)');
console.log('男比率',(agg.m.length/(agg.m.length+agg.f.length)).toFixed(3));
const tot=Object.values(disPref).reduce((a,b)=>a+b,0);
console.log('県内の災害/年',(tot/years).toFixed(4),'(目標',(17/62).toFixed(4),')',Object.fromEntries(Object.entries(disPref).map(([k,v])=>[k,(v/years*62).toFixed(2)+'/62年'])));
console.log('被災/人',(disHits/N).toFixed(2));
console.log('分岐',br);
console.log('病気経験',(ill/N).toFixed(2),'結婚',(mar/N).toFixed(2),'子/人',(kids/N).toFixed(2),'県外経験',(out/N).toFixed(2),'Uターン',(ret/N).toFixed(2));
console.log('死因',causes);
console.log('実績',ach);
