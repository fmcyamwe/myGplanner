import{d as o,_ as n,r as s,j as i,k as l,l as u,m as t,p as a,Q as c,q as p,s as d,t as f}from"./index.8a609466.js";import{Q as m,a as v,b as k,c as h,d as _}from"./QLayout.b0dfcbf6.js";import"./QItem.be20be7b.js";o({name:"EssentialLink",props:{title:{type:String,required:!0},caption:{type:String,default:""},link:{type:String,default:"#"},icon:{type:String,default:""}}});const q=[{title:"Docs",caption:"quasar.dev",icon:"school",link:"https://quasar.dev"},{title:"Github",caption:"github.com/quasarframework",icon:"code",link:"https://github.com/quasarframework"},{title:"Discord Chat Channel",caption:"chat.quasar.dev",icon:"chat",link:"https://chat.quasar.dev"},{title:"Forum",caption:"forum.quasar.dev",icon:"record_voice_over",link:"https://forum.quasar.dev"},{title:"Twitter",caption:"@quasarframework",icon:"rss_feed",link:"https://twitter.quasar.dev"},{title:"Facebook",caption:"@QuasarFramework",icon:"public",link:"https://facebook.quasar.dev"},{title:"Quasar Awesome",caption:"Community Quasar projects",icon:"favorite",link:"https://awesome.quasar.dev"}],w=o({name:"MainLayout",components:{},setup(){const e=s(!1);return{essentialLinks:q,leftDrawerOpen:e,toggleLeftDrawer(){e.value=!e.value}}}});function Q(e,g,b,y,C,L){const r=i("router-view");return l(),u(m,{view:"lHh Lpr lFf"},{default:t(()=>[a(h,{elevated:""},{default:t(()=>[a(v,null,{default:t(()=>[a(c,{flat:"",dense:"",round:"",icon:"menu","aria-label":"Menu",onClick:e.toggleLeftDrawer},null,8,["onClick"]),a(k,null,{default:t(()=>[p(" Quasar App ")]),_:1}),d("div",null,"Quasar v"+f(e.$q.version),1)]),_:1})]),_:1}),a(_,null,{default:t(()=>[a(r)]),_:1})]),_:1})}var $=n(w,[["render",Q]]);export{$ as default};
