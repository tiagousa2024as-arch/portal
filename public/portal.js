(function(){
  var DEFAULT={"tab": "inicio", "cfg": {"entrada": 10000, "cambio": 5, "consorcio": 1075.68, "lanceMensal": 3300, "lanceMeta": 20000, "reservaMeta": 0, "pctReserva": 0.625, "taxa": 0.05, "idade": 33, "metaMilhao": 1000000, "aptoMeta": 1000000, "carroMeta": 600000, "rendaLiquida": "", "horasMes": "", "esconderSabedoria": false}, "acordos": [{"nome": "Zema", "valor": 614.81, "inicio": "2026-11", "n": 2}, {"nome": "Recovery", "valor": 84.67, "inicio": "2026-10", "n": 47}, {"nome": "Ipanema", "valor": 53.08, "inicio": "2026-10", "n": 18}], "saldos": {"reserva": 76.92, "lance": 1, "apto": 1, "carro": 1, "arcaInvestir": 0, "A": 0, "R": 0, "C": 0, "I": 0, "dividendos": 0}, "aportes": {}, "checkins": {}, "escolhas": [], "sonhos": [], "timeline": [], "cenarios": [], "livros": [{"id": "graham", "titulo": "O Investidor Inteligente", "autor": "Benjamin Graham", "status": "quero ler", "inicio": "", "fim": "", "ideia": ""}, {"id": "housel", "titulo": "A Psicologia Financeira", "autor": "Morgan Housel", "status": "quero ler", "inicio": "", "fim": "", "ideia": ""}, {"id": "nigro", "titulo": "Do Mil ao Milhão", "autor": "Thiago Nigro", "status": "quero ler", "inicio": "", "fim": "", "ideia": ""}, {"id": "clear", "titulo": "Hábitos Atômicos", "autor": "James Clear", "status": "quero ler", "inicio": "", "fim": "", "ideia": ""}, {"id": "holiday", "titulo": "O Obstáculo é o Caminho", "autor": "Ryan Holiday", "status": "quero ler", "inicio": "", "fim": "", "ideia": ""}], "feitos": {}, "negocios": ["Cráton/Stratum", "OPERO", "Lojas online", "Curso online"], "movs": [], "seq": 1, "ativos": [{"t": "BOVA11", "l": "A", "nome": "ETF Ibovespa", "qtd": 0, "pm": 0, "preco": 0, "hist": []}, {"t": "HGLG11", "l": "R", "nome": "FII galpões logísticos", "qtd": 0, "pm": 0, "preco": 0, "hist": []}, {"t": "XPML11", "l": "R", "nome": "FII shoppings", "qtd": 0, "pm": 0, "preco": 0, "hist": []}, {"t": "KNRI11", "l": "R", "nome": "FII lajes e galpões", "qtd": 0, "pm": 0, "preco": 0, "hist": []}, {"t": "KNCR11", "l": "R", "nome": "FII títulos imobiliários", "qtd": 0, "pm": 0, "preco": 0, "hist": []}, {"t": "Tesouro IPCA+ 2035", "l": "C", "nome": "Tesouro Direto", "qtd": 0, "pm": 0, "preco": 0, "hist": []}, {"t": "IVVB11", "l": "I", "nome": "ETF S&P 500", "qtd": 0, "pm": 0, "preco": 0, "hist": []}], "caixinhasMov": [], "conferencia": null, "outrasContas": [{"nome": "PicPay", "funcao": "", "saldo": 0}], "avisos": {"sabado": false, "arca": false, "contas": false, "nudge": false, "revisao": false}};
  var S=JSON.parse(JSON.stringify(DEFAULT));
  var brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  var compact=new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1});
  var money=function(v){return brl.format(Math.round((v||0)*100)/100)};
  function textoDinheiro(v){
    if(v===''||v==null) return '';
    var n=typeof v==='number'?v:num(v);
    if(!isFinite(n)) return '';
    return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function mascaraMeta(el){
    var raw=String(el.value);
    if(raw.trim()==='') return;
    var caret=el.selectionStart==null?raw.length:el.selectionStart;
    var commaIn=raw.indexOf(',');
    var noDecimais=commaIn<0||caret<=commaIn;
    var body=raw.replace(/\./g,'');
    var i=body.indexOf(',');
    var inteiro, dec;
    if(i>=0){
      inteiro=body.slice(0,i).replace(/\D/g,'');
      var decDigits=body.slice(i+1).replace(/\D/g,'');
      dec=(!noDecimais&&decDigits.length>2)?decDigits.slice(-2):decDigits.slice(0,2);
    }else{
      inteiro=body.replace(/\D/g,'');
      dec='00';
    }
    inteiro=inteiro.replace(/^0+(?=\d)/,'');
    if(!inteiro){ el.value=''; return }
    var mil=inteiro.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
    var formatted=(noDecimais&&(dec===''||dec==='00'))?mil+',00':mil+','+dec;
    el.value=formatted;
    var pos=(noDecimais&&(dec===''||dec==='00'))?mil.length:formatted.length;
    if(el.setSelectionRange) el.setSelectionRange(pos,pos);
  }
  function textoQtd(v){
    if(v===''||v==null) return '';
    var n=typeof v==='number'?v:num(v);
    if(!isFinite(n)) return '';
    var r=Math.round(n*10000)/10000;
    if(Math.abs(r-Math.round(r))<1e-9) return String(Math.round(r));
    return String(r);
  }
  var num=function(v){v=String(v==null?'':v).trim(); if(v.indexOf(',')>=0) v=v.replace(/\./g,'').replace(',','.'); v=parseFloat(v); return isFinite(v)?v:0};
  var esc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
  var mode='pending', timer=null, pendingDel=null, loaded=false;
  var view={sab:null, ciDate:null, movTipo:'inv', aiText:'', aiNote:'', aiQ:'', aiPropostas:[], desejoOpen:false, desejoOut:null, desejoPick:false, mural:false, linha:false, estante:false, seExtra:0, seAporte:null, seTaxa:null, vozModo:'off', vozTexto:'', vozInterim:'', vozCampos:null, vozBusy:false, vozLeft:30, cxHist:'', cxTipo:'todos', cxConf:false, cxForm:'', cxPend:null, insights:null, insightsChave:'', insightsErro:false, insightOk:null, cmdTexto:'', cmdOuvindo:false, cmdBusy:false, cmdLeft:30, cmdResposta:'', cmdProposta:null, cmdRec:null, cmdTimer:null, cmdParar:false, memLembrar:null, memTela:false, memLista:null, memErro:'', memEdit:null, memApagar:null, briefing:null, briefingDia:'', uso:null, usoPediu:false};
  var SAB=[];
  var vozRec=null, vozTimer=null, vozParar=false;
  var ciDraft={};
  var TABS=[['inicio','Início'],['sabado','Sábado'],['checkin','Check-in'],['arca','ARCA'],['mercado','Mercado'],['assistente','Assistente IA'],['negocios','Negócios'],['futuro','Futuro'],['ajustes','Ajustes']];
  var sampleApi=true, aiCtl=null, aiBusy=false;
  var motion={flow:false,stone:false,festa:false,escolha:false};
  var seenN={};
  if(!S.ativos) S.ativos=[];
  var FIIS=['HGLG11','XPML11','KNRI11','KNCR11'];
  var FII_DESC={HGLG11:'galpões logísticos',XPML11:'shoppings',KNRI11:'lajes e galpões',KNCR11:'títulos imobiliários'};

  /* ---------- datas ---------- */
  function pad(n){return String(n).padStart(2,'0')}
  function ymd(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function parse(s){var p=s.split('-');return new Date(+p[0],+p[1]-1,+(p[2]||1))}
  function addDays(d,n){var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);return x}
  function today(){var t=new Date();return new Date(t.getFullYear(),t.getMonth(),t.getDate())}
  function satOnOrAfter(d){return addDays(d,(6-d.getDay()+7)%7)}
  function satOnOrBefore(d){return addDays(d,-((d.getDay()+1)%7))}
  function fmtDate(d){return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
  function fmtLong(d){return d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}
  function diasAte5(d){
    if(d.getDate()<5) return 5-d.getDate();
    var n=new Date(d.getFullYear(),d.getMonth()+1,5); return Math.round((n-d)/864e5);
  }
  function isRent(d){var x=diasAte5(d);return x>=1&&x<=7}
  function cycleOf(d){ // retorna {rent, idx (0=aluguel), sats:[cascatas], mes}
    var r=d, i=0; while(!isRent(r)&&i<8){r=addDays(r,-7);i++}
    var sats=[], s=addDays(r,7); while(!isRent(s)&&sats.length<6){sats.push(s);s=addDays(s,7)}
    var first=sats[0]||addDays(r,7);
    return {rent:r, idx:i, sats:sats, mes:first.getFullYear()+'-'+pad(first.getMonth()+1)};
  }
  function acordosNo(mes){
    var t=0; S.acordos.forEach(function(a){
      if(!a.inicio||!(a.n>0)) return;
      var p=a.inicio.split('-'), m=mes.split('-');
      var k=(+m[0]-+p[0])*12+(+m[1]-+p[1]);
      if(k>=0&&k<a.n) t+=num(a.valor);
    }); return Math.round(t*100)/100;
  }
  function fiiDoMes(mes){var p=mes.split('-');var k=((+p[0]-2026)*12+(+p[1]-10))%4;return FIIS[(k+4)%4]}

  /* ---------- cascata ---------- */
  function metas(cyc){
    var C=S.cfg, exL=0, exR=0;
    cyc.sats.forEach(function(s){var a=S.aportes[ymd(s)]; if(a){exL+=a.lance||0; exR+=a.reserva||0}});
    var lanceAntes=S.saldos.lance-exL, resAntes=S.saldos.reserva-exR;
    var ac=acordosNo(cyc.mes);
    var lance=lanceAntes>=C.lanceMeta?0:Math.min(C.lanceMensal,Math.max(0,C.lanceMeta-lanceAntes));
    var cheia=C.reservaMeta>0&&resAntes>=C.reservaMeta;
    var base=C.entrada-C.consorcio-lance;
    var res=cheia?0:Math.max(0,Math.min(base*C.pctReserva-ac/2,C.reservaMeta>0?C.reservaMeta-resAntes:1e15,C.entrada-C.consorcio-ac-lance));
    var arca=Math.max(0,C.entrada-C.consorcio-ac-lance-res);
    return {consorcio:C.consorcio,acordos:ac,lance:lance,reserva:res,arca:arca,cheia:cheia};
  }
  var ORDER=['consorcio','acordos','lance','reserva','arca'];
  function waterfall(total,t){
    var out={},left=total;
    ORDER.forEach(function(k){var v=Math.min(left,t[k]);out[k]=v;left-=v});
    if(left>0){ if(t.cheia) out.arca+=left; else out.reserva+=left; }
    return out;
  }
  function semana(d){ // alocação de um sábado de cascata
    var cyc=cycleOf(d), t=metas(cyc), key=ymd(d), before=0, mine=null;
    for(var i=0;i<cyc.sats.length;i++){
      var k=ymd(cyc.sats[i]), a=S.aportes[k];
      if(k===key){ mine=a?a.recebido:(view.rec!=null&&view.recKey===key?view.rec:S.cfg.entrada/3); break; }
      before+=a?a.recebido:0;
    }
    var w1=waterfall(before,t), w2=waterfall(before+mine,t), out={};
    ORDER.forEach(function(k){out[k]=Math.max(0,w2[k]-w1[k])});
    return {cyc:cyc,t:t,rec:mine,alloc:out,done:!!S.aportes[key]};
  }

  /* ---------- progresso ---------- */
  function streaks(){
    var ds=Object.keys(S.checkins).sort(); if(!ds.length) return {atual:0,melhor:0,total:0,ultima:null};
    var best=1,cur=1;
    for(var i=1;i<ds.length;i++){var g=Math.round((parse(ds[i])-parse(ds[i-1]))/864e5); cur=g===7?cur+1:1; if(cur>best)best=cur}
    var last=parse(ds[ds.length-1]), ref=satOnOrBefore(today());
    var atual=(ref-last)/864e5>7?0:cur;
    return {atual:atual,melhor:best,total:ds.length,ultima:last};
  }
  function outrasTotal(){var t=0;(Array.isArray(S.outrasContas)?S.outrasContas:[]).forEach(function(c){t+=num(c&&c.saldo)});return t}
  function patrimonio(){var s=S.saldos;return s.reserva+s.lance+s.apto+s.carro+s.arcaInvestir+s.A+s.R+s.C+s.I+outrasTotal()}
  function arcaTotal(){var s=S.saldos;return s.A+s.R+s.C+s.I}
  function marcos(){
    var st=streaks(), s=S.saldos, C=S.cfg;
    return [['1º check-in',st.total>=1],['4 sábados seguidos',st.melhor>=4],['12 sábados seguidos',st.melhor>=12],['26 sábados seguidos',st.melhor>=26],['52 sábados seguidos',st.melhor>=52],
      ['R$ 1.000 na Reserva',s.reserva>=1000],['R$ 5.000 na Reserva',s.reserva>=5000],['R$ 10.000 no Lance',s.lance>=10000],['Lance completo',s.lance>=C.lanceMeta],
      ['1º dividendo',s.dividendos>0],['R$ 10.000 na ARCA',arcaTotal()>=10000],['R$ 50.000 na ARCA',arcaTotal()>=50000],
      ['R$ 10.000 no Apartamento',s.apto>=10000],['R$ 100.000 de patrimônio',patrimonio()>=100000],['Reserva cheia',C.reservaMeta>0&&s.reserva>=C.reservaMeta],
      ['Primeira escolha',escolhasTotal().n>=1],['R$ 1.000 em escolhas',escolhasTotal().valor>=1000],
      ['Sangue frio',!!(S.feitos&&S.feitos.sangue)],['Leitor de Primeira Geração',livrosProntos().length>=1]];
  }
  function fase(){
    var s=S.saldos,C=S.cfg, lanceOk=s.lance>=C.lanceMeta, resOk=C.reservaMeta>0&&s.reserva>=C.reservaMeta;
    if(s.apto>=C.aptoMeta) return ['Fase 3: Liberdade','Apartamento conquistado. ARCA é o motor.'];
    if(lanceOk&&resOk) return ['Fase 2: Crescimento','Hora de abastecer a caixinha Apartamento.'];
    return ['Fase 1: Construção',lanceOk?'Lance completo. Enchendo a reserva.':'Construindo o lance e a reserva.'];
  }

  /* ---------- finanças ---------- */
  function rm(taxa){return Math.pow(1+(taxa==null?S.cfg.taxa:taxa),1/12)-1}
  function fv(pmt,months,pv,taxa){var r=rm(taxa);return (pv||0)*Math.pow(1+r,months)+pmt*(Math.pow(1+r,months)-1)/r}
  function nper(pmt,pv,meta,taxa){var r=rm(taxa); if(pv>=meta) return 0; if(pmt<=0) return null; return Math.log((meta*r+pmt)/(pv*r+pmt))/Math.log(1+r)/12}
  function livre(){var m=ymd(today()).slice(0,7);return Math.max(0,S.cfg.entrada-S.cfg.consorcio-acordosNo(m))}
  function escolhasTotal(){
    var list=Array.isArray(S.escolhas)?S.escolhas:[];
    var valor=0;
    list.forEach(function(e){valor+=num(e.valor)});
    return {n:list.length, valor:Math.round(valor*100)/100};
  }
  function metaDoDesejo(){
    var nome=fase()[0];
    if(nome.indexOf('Fase 2')===0) return 'o apartamento';
    if(nome.indexOf('Fase 3')===0) return 'o primeiro milhão';
    if(S.saldos.lance<S.cfg.lanceMeta) return 'o lance';
    return 'a reserva';
  }
  function fraseQtd(n, um, muitos){
    if(!isFinite(n)) return '—';
    var r=Math.abs(n)>=10?Math.round(n):Math.round(n*10)/10;
    var s=String(r).replace('.',',');
    return s+' '+(r===1?um:muitos);
  }
  function trabalhoPronto(){return num(S.cfg.rendaLiquida)>0&&num(S.cfg.horasMes)>0}
  function desejoHtml(){
    var tot=escolhasTotal();
    var h='<section id="desejo" class="card desejo"><h2>Quero comprar…</h2>';
    h+='<p class="desejo-total'+(motion.escolha?' is-laid':'')+'">Escolhas de Primeira Geração: <b class="num">'+money(tot.valor)+'</b> guardados em '+tot.n+' '+(tot.n===1?'decisão':'decisões')+'.</p>';
    if(motion.escolha) h+='<div class="sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><p class="note">Uma pedra a mais na fundação.</p>';
    if(!view.desejoOpen){
      h+='<div class="actions"><button type="button" class="main" data-act="desejo-open">Quero comprar…</button></div></section>';
      return h;
    }
    if(!trabalhoPronto()){
      h+='<p class="sub">Para traduzir o preço em horas de trabalho, preciso da sua renda líquida e de quantas horas você trabalha no mês.</p>';
      h+='<div class="grid2" style="margin-top:12px"><label class="field"><span>Renda líquida por mês (R$)</span><input id="desejoRenda" inputmode="decimal" value="'+esc(S.cfg.rendaLiquida||'')+'"></label>';
      h+='<label class="field"><span>Horas trabalhadas por mês</span><input id="desejoHoras" inputmode="decimal" value="'+esc(S.cfg.horasMes||'')+'"></label></div>';
      h+='<div class="actions"><button type="button" class="main" data-act="desejo-cfg">Usar estes números</button><button type="button" class="ghost" data-act="desejo-fechar">Fechar</button></div></section>';
      return h;
    }
    var out=view.desejoOut;
    h+='<div class="grid2" style="margin-top:12px"><label class="field"><span>Valor (R$)</span><input id="desejoVal" inputmode="decimal" value="'+esc(out?out.valor:'')+'"></label>';
    h+='<label class="field"><span>O que é (opcional)</span><input id="desejoDesc" value="'+esc(out?out.desc:'')+'" placeholder="Ex.: fone novo"></label></div>';
    h+='<div class="actions"><button type="button" class="main" data-act="desejo-calc">Calcular</button><button type="button" class="ghost" data-act="desejo-fechar">Fechar</button></div>';
    if(out){
      h+='<div class="desejo-out">';
      h+='<p>Isso equivale a '+fraseQtd(out.horas,'hora','horas')+' ('+fraseQtd(out.dias,'dia','dias')+') do seu trabalho.</p>';
      h+=out.atraso==null?'<p>Com a sobra deste mês em zero, não dá para estimar o atraso de '+esc(out.meta)+'.</p>':'<p>Isso atrasa '+esc(out.meta)+' em '+fraseQtd(out.atraso,'dia','dias')+'.</p>';
      h+='<p>Investido por 10 anos, viraria '+money(out.w)+'.</p></div>';
      if(!view.desejoPick){
        h+='<div class="actions"><button type="button" class="ghost" data-act="desejo-comprar">Vou comprar mesmo assim</button><button type="button" class="main" data-act="desejo-pick">Desisti, vou guardar</button></div>';
      }else{
        h+='<label class="field"><span>Guardar em qual caixinha?</span><select id="desejoCaixa">';
        [['reserva','Reserva'],['lance','Lance'],['apto','Apartamento'],['carro','Carro'],['arcaInvestir','ARCA – a investir']].forEach(function(c){h+='<option value="'+c[0]+'">'+c[1]+'</option>'});
        h+='</select></label><div class="actions"><button type="button" class="main" data-act="desejo-guardar">Guardar '+money(out.valor)+'</button><button type="button" class="ghost" data-act="desejo-comprar">Vou comprar mesmo assim</button></div>';
      }
    }
    return h+'</section>';
  }

  /* ---------- gráficos ---------- */
  function lineChart(series,labels,H){
    H=H||240; var W=680,L=58,B=28,T=12;
    var max=1; series.forEach(function(s){s.v.forEach(function(x){if(x>max)max=x})});
    var n=labels.length, X=function(i){return L+(W-L-12)*i/Math.max(1,n-1)}, Y=function(v){return T+(H-T-B)*(1-v/max)};
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Gráfico de linhas">';
    for(var g=0;g<=4;g++){var y=Y(max*g/4);s+='<line x1="'+L+'" x2="'+W+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="var(--muted)">'+compact.format(max*g/4)+'</text>'}
    series.forEach(function(se){
      s+='<path d="'+se.v.map(function(v,i){return (i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)}).join(' ')+'" fill="none" stroke="'+se.c+'" stroke-width="'+(se.dash?1.5:2.5)+'"'+(se.dash?' stroke-dasharray="5 5"':' pathLength="1"')+' stroke-linejoin="round"/>';
    });
    labels.forEach(function(l,i){ if(l!=='') s+='<text x="'+X(i)+'" y="'+(H-8)+'" text-anchor="middle" font-size="11" fill="var(--muted)">'+esc(l)+'</text>'});
    return s+'</svg>';
  }
  function barChart(items){
    var W=680,H=230,L=58,B=36,T=12, max=1;
    items.forEach(function(d){max=Math.max(max,d.a,d.b)});
    var cw=(W-L-10)/Math.max(1,items.length), bw=Math.min(26,cw/3);
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Investido e retorno por negócio">';
    for(var g=0;g<=4;g++){var y=T+(H-T-B)*(1-g/4);s+='<line x1="'+L+'" x2="'+W+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="var(--muted)">'+compact.format(max*g/4)+'</text>'}
    items.forEach(function(d,i){
      var cx=L+cw*i+cw/2, h1=(H-T-B)*d.a/max, h2=(H-T-B)*d.b/max;
      s+='<rect x="'+(cx-bw-2)+'" y="'+(H-B-h1)+'" width="'+bw+'" height="'+h1+'" rx="3" fill="var(--amber)"><title>'+esc(d.n)+': investido '+money(d.a)+'</title></rect>';
      s+='<rect x="'+(cx+2)+'" y="'+(H-B-h2)+'" width="'+bw+'" height="'+h2+'" rx="3" fill="var(--green)"><title>'+esc(d.n)+': retorno '+money(d.b)+'</title></rect>';
      s+='<text x="'+cx+'" y="'+(H-B+18)+'" text-anchor="middle" font-size="12" fill="var(--ink)">'+esc(d.n.length>13?d.n.slice(0,12)+'…':d.n)+'</text>';
    });
    return s+'</svg>';
  }

  /* ---------- telas ---------- */
  function goal(nome,saldo,meta,cor,extra){
    var pc=meta>0?Math.min(100,saldo/meta*100):0;
    var foot=meta>0?('de '+money(meta)+(pc>0?' · '+pc.toFixed(pc<1&&pc>0?2:0)+'%':'')):(extra||'');
    return '<div class="stat"><span>'+nome+'</span><b class="num">'+money(saldo)+'</b>'+
      '<div class="bar" style="--c:'+cor+'"><i style="width:'+pc.toFixed(2)+'%"></i></div>'+
      (foot?'<small class="num">'+foot+'</small>':'')+'<!--g--></div>';
  }

  function vozOk(){return !!(window.SpeechRecognition||window.webkitSpeechRecognition)}
  function pararMic(){
    vozParar=true;
    if(vozTimer){clearInterval(vozTimer);vozTimer=null}
    if(vozRec){try{vozRec.onend=null;vozRec.stop()}catch(e){} vozRec=null}
  }
  function ligarMic(){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){view.vozModo='texto';render();return}
    vozParar=false;
    vozRec=new SR();
    vozRec.lang='pt-BR';
    vozRec.continuous=true;
    vozRec.interimResults=true;
    vozRec.onresult=function(e){
      var fin='', mid='';
      for(var i=0;i<e.results.length;i++){
        var t=e.results[i][0].transcript;
        if(e.results[i].isFinal) fin+=t+' '; else mid+=t;
      }
      view.vozTexto=fin.trim();
      view.vozInterim=mid.trim();
      var el=document.getElementById('vozLive');
      if(el) el.textContent=(view.vozTexto+' '+view.vozInterim).trim()||'Ouvindo…';
    };
    vozRec.onerror=function(ev){
      if(ev.error==='not-allowed'||ev.error==='service-not-allowed'||ev.error==='audio-capture'){
        pararMic(); view.vozModo='texto';
        flash('O microfone não foi permitido. Escreva o relato aqui.');
        render();
      }
    };
    vozRec.onend=function(){ if(!vozParar&&view.vozModo==='ouvindo'&&vozRec){ try{vozRec.start()}catch(err){} } };
    try{vozRec.start()}catch(err){view.vozModo='texto';render();return}
    var fim=Date.now()+30000;
    vozTimer=setInterval(function(){
      var left=Math.max(0,Math.ceil((fim-Date.now())/1000));
      view.vozLeft=left;
      var n=document.getElementById('vozCount');
      if(n) n.textContent=left+'s';
      if(left<=0) concluirVoz();
    },250);
  }
  function enviarVoz(texto){
    view.vozBusy=true;
    render();
    fetch('/api/checkin-voz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texto:texto})})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
      .then(function(x){
        view.vozBusy=false;
        if(!x.ok||!x.j||x.j.error){flash((x.j&&x.j.error)||'Não consegui organizar o relato.');view.vozModo='texto';render();return}
        var j=x.j, campos={};
        if(j.mexeu==='sim'||j.mexeu==='não'){ciDraft.mexeu=j.mexeu;campos.mexeu=1}
        ['motivo','foraNormal','negocios','extraOrigem','vitoria','escorreguei'].forEach(function(k){
          if(typeof j[k]==='string'&&j[k].trim()){ciDraft[k]=j[k].trim();campos[k]=1}
        });
        if(j.gastos!=null&&isFinite(+j.gastos)){ciDraft.gastos=String(j.gastos).replace('.',',');campos.gastos=1}
        if(j.extra!=null&&isFinite(+j.extra)){ciDraft.extra=String(j.extra).replace('.',',');campos.extra=1}
        view.vozCampos=campos;
        view.vozModo='off';
        flash('Revise os campos marcados. Nada foi salvo ainda.');
        render();
      })
      .catch(function(){view.vozBusy=false;view.vozModo='texto';flash('Sem conexão com o assistente.');render()});
  }
  function concluirVoz(){
    if(view.vozModo!=='ouvindo') return;
    var texto=((view.vozTexto||'')+' '+(view.vozInterim||'')).trim();
    pararMic();
    view.vozTexto=texto;
    view.vozInterim='';
    view.vozModo='off';
    if(!texto){flash('Não ouvi nada. Tente de novo ou escreva.');view.vozModo='texto';render();return}
    enviarVoz(texto);
  }
  function micDesenho(){
    return '<svg class="mic-ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6.5 11a5.5 5.5 0 0 0 11 0"/><path d="M12 16.5V20"/><path d="M8.5 20h7"/></svg>';
  }
  function vozBloco(){
    var h='<div class="voz"><p class="note">Fale por até 30 segundos. Nada é salvo até você tocar em Salvar check-in.</p>';
    if(view.vozModo==='ouvindo'){
      h+='<p id="vozLive" class="voz-live" aria-live="polite">'+esc(((view.vozTexto||'')+' '+(view.vozInterim||'')).trim()||'Ouvindo…')+'</p>';
      h+='<button type="button" class="main mic" data-act="voz-parar">'+micDesenho()+'Parar · <span id="vozCount">'+view.vozLeft+'s</span></button>';
    }else if(view.vozBusy){
      h+='<p class="voz-live" aria-live="polite">'+esc(view.vozTexto||'Organizando o relato…')+'</p>';
      h+='<button type="button" class="main mic" disabled>Organizando…</button>';
    }else if(view.vozModo==='texto'||!vozOk()){
      h+='<label class="field full"><span>Fale pelo ditado do teclado ou escreva aqui</span><textarea id="vozCaixa">'+esc(view.vozTexto||'')+'</textarea></label>';
      h+='<button type="button" class="main mic" data-act="voz-enviar"'+(view.vozBusy?' disabled':'')+'>Preencher o check-in</button>';
    }else{
      h+='<button type="button" class="main mic" data-act="voz-iniciar">'+micDesenho()+'Fazer por voz</button>';
    }
    return h+'</div>';
  }
  function quandoSonho(pmt,saldo,meta){
    var anos=nper(pmt,saldo,meta);
    if(anos==null) return 'Sem data estimada ainda.';
    if(anos<=0) return 'A meta já está aqui.';
    var d=new Date(today().getFullYear(), today().getMonth()+Math.round(anos*12), 1);
    return 'Por volta de '+d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  }
  function sonhosLista(){
    var fotos={};
    (S.sonhos||[]).forEach(function(s){ if(s&&s.id) fotos[s.id]=s });
    var out=[];
    if(S.saldos.lance<S.cfg.lanceMeta) out.push({id:'lance',nome:'Lance da CB 650R',metaRef:'lance',meta:S.cfg.lanceMeta,saldo:S.saldos.lance,fixo:true,pmt:S.cfg.lanceMensal});
    out.push({id:'apto',nome:'Apartamento',metaRef:'apto',meta:S.cfg.aptoMeta,saldo:S.saldos.apto,fixo:true,pmt:livre()});
    out.push({id:'carro',nome:'Carro dos sonhos',metaRef:'carro',meta:S.cfg.carroMeta,saldo:S.saldos.carro,fixo:true,pmt:livre()});
    (S.sonhos||[]).forEach(function(s){
      if(!s||s.id==='lance'||s.id==='apto'||s.id==='carro') return;
      var ref=s.metaRef==null?'reserva':s.metaRef;
      var saldo=ref&&S.saldos[ref]!=null?num(S.saldos[ref]):0;
      out.push({id:s.id,nome:s.nome||'Sonho',metaRef:ref,meta:num(s.meta),saldo:saldo,fixo:false,pmt:livre()});
    });
    out.forEach(function(c){ var f=fotos[c.id]; c.foto=f&&f.foto?f.foto:''; c.fotoV=f&&f.fotoV?f.fotoV:'' });
    return out;
  }
  function guardarSonho(id,nome,metaRef,foto,meta){
    if(!Array.isArray(S.sonhos)) S.sonhos=[];
    var s=null;
    S.sonhos.forEach(function(x){ if(x.id===id) s=x });
    if(!s){ s={id:id,nome:nome,foto:foto||'',metaRef:metaRef}; S.sonhos.push(s) }
    s.nome=nome; s.metaRef=metaRef;
    if(foto){ s.foto=foto; s.fotoV=Date.now() }
    if(meta!=null) s.meta=meta;
    commit();
  }
  function mostrarFotoQuadro(id, src){
    if(!view.fotoPrevia) view.fotoPrevia={};
    var anterior=view.fotoPrevia[id];
    if(anterior&&anterior!==src&&String(anterior).indexOf('blob:')===0) URL.revokeObjectURL(anterior);
    view.fotoPrevia[id]=src;
    document.querySelectorAll('[data-sonho-foto]').forEach(function(input){
      if(input.getAttribute('data-sonho-foto')!==id) return;
      var card=input.closest('.sonho-card');
      if(!card) return;
      var img=card.querySelector('img.sonho-foto');
      if(!img){
        img=document.createElement('img');
        img.className='sonho-foto';
        var nome=card.querySelector('h3');
        img.alt=nome?nome.textContent:'Sonho';
        var ph=card.querySelector('.sonho-ph');
        if(ph) ph.replaceWith(img);
        else card.insertBefore(img, card.firstChild);
      }
      img.src=src;
    });
  }
  function reduzirFoto(file,cb){
    var url=URL.createObjectURL(file), img=new Image();
    img.onload=function(){
      var max=1600, w=img.width, h=img.height, s=Math.min(1,max/Math.max(w,h,1));
      var c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(w*s)); c.height=Math.max(1,Math.round(h*s));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      c.toBlob(function(blob){ URL.revokeObjectURL(url); cb(blob) }, 'image/jpeg', 0.82);
    };
    img.onerror=function(){ URL.revokeObjectURL(url); cb(null) };
    img.src=url;
  }
  function sonhoCard(c,cheio){
    var pc=c.meta>0?Math.min(100,c.saldo/c.meta*100):0;
    var h='<article class="card sonho-card">';
    var previa=view.fotoPrevia&&view.fotoPrevia[c.id];
    var src=previa||(c.foto?'/api/imagem?path='+encodeURIComponent(c.foto)+(c.fotoV?'&v='+encodeURIComponent(c.fotoV):''):'');
    if(src) h+='<img class="sonho-foto" src="'+src+'" alt="'+esc(c.nome)+'">';
    else h+='<div class="sonho-ph"><span>Uma foto deste sonho</span></div>';
    h+='<h3>'+esc(c.nome)+'</h3>';
    h+='<b class="num">'+money(c.saldo)+'</b>';
    h+='<div class="bar" style="--c:var(--plum)"><i style="width:'+pc.toFixed(2)+'%"></i></div>';
    h+='<small class="num">'+(c.meta>0?'de '+money(c.meta):'meta a definir')+'</small>';
    h+='<p class="sonho-quando">'+esc(c.meta>0?quandoSonho(c.pmt,c.saldo,c.meta):'Sem data estimada ainda.')+'</p>';
    h+='<label class="ghost sonho-up">Escolher foto<input type="file" accept="image/*" data-sonho-foto="'+esc(c.id)+'" hidden></label>';
    if(cheio&&!c.fixo){
      var del=pendingDel==='s:'+c.id;
      h+='<button type="button" class="mini'+(del?' warn':'')+'" data-act="sonho-del" data-sonho="'+esc(c.id)+'">'+(del?'Confirmar remoção':'Remover')+'</button>';
    }
    return h+'</article>';
  }
  function sonhosClasse(){
    var n=sonhosLista().length;
    if(n<=3) return 'is-lg';
    if(n<=6) return 'is-md';
    return 'is-sm';
  }
  function sonhosExtras(){
    return (S.sonhos||[]).filter(function(s){ return s&&s.id&&s.id!=='lance'&&s.id!=='apto'&&s.id!=='carro' });
  }
  function sonhosQtde(){
    var n=sonhosLista().length, pode=sonhosExtras().length>0;
    return '<div class="sonhos-qtde" role="group" aria-label="Quantidade de quadros dos sonhos"><span>Quantidade de quadros</span><div class="sonhos-qtde-ctrl"><button type="button" class="mini" data-act="sonho-menos"'+(pode?'':' disabled')+' aria-label="Diminuir a quantidade">−</button><b class="num">'+n+'</b><button type="button" class="main" data-act="sonho-mais" aria-label="Aumentar a quantidade de quadros">Aumentar</button></div></div>';
  }
  function muralResumo(){
    var h='<h2>Mural dos sonhos</h2>'+sonhosQtde()+'<div class="sonhos-row '+sonhosClasse()+'">';
    sonhosLista().forEach(function(c){ h+=sonhoCard(c,false) });
    h+='</div><div class="actions"><button type="button" class="ghost" data-act="mural-abrir">Ver o mural</button></div>';
    return h;
  }
  function muralCheio(){
    var h='<h1>Mural dos sonhos</h1><p class="sub">O que você está construindo, um sábado de cada vez.</p>';
    h+=sonhosQtde();
    h+='<div class="actions"><button type="button" class="ghost" data-act="mural-fechar">Voltar ao início</button></div>';
    h+='<div class="sonhos-grid '+sonhosClasse()+'">';
    sonhosLista().forEach(function(c){ h+=sonhoCard(c,true) });
    h+='</div>';
    h+='<p class="note">A data do apartamento, do carro e dos sonhos novos usa a sobra do mês, como no Futuro. O lance usa a parcela planejada.</p>';
    h+='<h2>Mais um quadro</h2><div class="card"><div class="grid2">';
    h+='<label class="field"><span>Nome</span><input id="sonhoNome" placeholder="Ex.: viagem"></label>';
    h+='<label class="field"><span>Meta (R$)</span><input id="sonhoMeta" inputmode="decimal" placeholder="0,00"></label>';
    h+='<label class="field"><span>Caixinha ligada</span><select id="sonhoCaixa">';
    [['reserva','Reserva'],['lance','Lance'],['apto','Apartamento'],['carro','Carro'],['arcaInvestir','ARCA – a investir']].forEach(function(c){ h+='<option value="'+c[0]+'">'+c[1]+'</option>' });
    h+='</select></label></div>';
    h+='<div class="actions"><button type="button" class="main" data-act="sonho-add">Adicionar ao mural</button></div></div>';
    return h;
  }

  function estadoInsights(){
    var ch={};
    Object.keys(S.checkins||{}).forEach(function(k){
      var g=S.checkins[k]&&S.checkins[k].gastos;
      if(g!=null&&g!=='') ch[k]={gastos:g};
    });
    return {
      cfg:{entrada:S.cfg.entrada, consorcio:S.cfg.consorcio, lanceMensal:S.cfg.lanceMensal, lanceMeta:S.cfg.lanceMeta, reservaMeta:S.cfg.reservaMeta, pctReserva:S.cfg.pctReserva, taxa:S.cfg.taxa, aptoMeta:S.cfg.aptoMeta},
      acordos:(S.acordos||[]).map(function(a){ return {nome:a.nome, valor:a.valor, inicio:a.inicio, n:a.n} }),
      saldos:S.saldos,
      aportes:S.aportes,
      checkins:ch,
      caixinhasMov:(S.caixinhasMov||[]).map(function(m){ return {caixinha:m.caixinha, tipo:m.tipo, valor:m.valor, data:m.data, origem:m.origem} }),
      bandaFora:S.bandaFora||{},
      patrimonio:patrimonio()
    };
  }
  function chaveInsights(){ return ymd(today())+'|'+JSON.stringify(estadoInsights()) }
  function htmlInsights(){
    var h='<section id="insights" class="insights" aria-label="O que importa agora"><h2>O que importa agora</h2>';
    var chave=chaveInsights();
    if(view.insightsErro&&view.insightsChave===chave){
      h+='<p class="sub">Não deu para olhar agora. O sábado continua aqui embaixo.</p></section>';
      return h;
    }
    if(!view.insights||view.insightsChave!==chave){
      h+='<p class="sub">Olhando o sábado, as contas e o ritmo.</p></section>';
      return h;
    }
    if(!view.insights.length){ h+='<p class="sub">Nada pedindo atenção agora.</p></section>'; return h }
    view.insights.forEach(function(it){
      h+='<article class="insight '+(it.severity==='importante'||it.severity==='atencao'?it.severity:'info')+'"><h3>'+esc(it.title)+'</h3><p>'+esc(it.detail)+'</p>';
      var a=it.action||{};
      if(a.confirmar&&a.confirmar.chave==='reservaMeta'){
        var v=num(a.confirmar.valor);
        if(view.insightOk===v) h+='<button type="button" class="main" data-act="insight-meta" data-valor="'+v+'" data-ok="1">Confirmar '+esc(money(v))+'</button>';
        else h+='<button type="button" class="ghost" data-act="insight-meta" data-valor="'+v+'">'+esc(a.rotulo||'Definir a meta da reserva')+'</button>';
      } else if(a.destino){
        h+='<button type="button" class="ghost" data-go="'+esc(a.destino)+'">'+esc(a.rotulo||'Abrir')+'</button>';
      }
      h+='</article>';
    });
    return h+'</section>';
  }
  function htmlBriefing(){
    if(today().getDay()!==6||!view.briefing) return '';
    function bloco(b, extra){
      if(!b) return '';
      var h='<section class="briefing" aria-label="'+esc(b.titulo||'Seu sábado')+'"><h2>'+esc(b.titulo||'Seu sábado')+'</h2>';
      (b.linhas||[]).forEach(function(l){ h+='<p>'+esc(l)+'</p>' });
      if(b.frases) h+='<p class="briefing-voz">'+esc(b.frases)+'</p>';
      if(extra) h+=extra;
      return h+'</section>';
    }
    var mesNota=view.briefing.mes&&view.briefing.mes.na_linha?'<p class="note">Este relatório também ficou na linha do tempo.</p>':'';
    return bloco(view.briefing.sabado,'')+bloco(view.briefing.mes, mesNota);
  }
  function pedirBriefing(){
    if(S.tab!=='inicio'||view.mural||today().getDay()!==6) return;
    var dia=ymd(today());
    if(view.briefingDia===dia) return;
    view.briefingDia=dia;
    fetch('/api/briefing?data='+encodeURIComponent(dia))
      .then(function(r){ if(r.status===401){location.href='/login';return null} return r.json() })
      .then(function(j){
        if(!j||!j.ok) return;
        view.briefing={sabado:j.sabado||null, mes:j.mes||null};
        if(S.tab==='inicio'&&!view.mural&&today().getDay()===6) render();
      })
      .catch(function(){});
  }
  function pintarInsights(){
    var el=document.getElementById('insights');
    if(el) el.outerHTML=htmlInsights();
  }
  function pedirInsights(){
    if(S.tab!=='inicio'||view.mural) return;
    var chave=chaveInsights();
    if(view.insights&&view.insightsChave===chave) return;
    var pedido=chave;
    fetch('/api/insights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hoje:ymd(today()), estado:estadoInsights()})})
      .then(function(r){ if(r.status===401){location.href='/login';return null} if(!r.ok) throw new Error('insights'); return r.json() })
      .then(function(j){
        if(!j||chaveInsights()!==pedido) return;
        view.insightsErro=false;
        view.insights=Array.isArray(j.insights)?j.insights.slice(0,3):[];
        view.insightsChave=pedido;
        var confirma=view.insights.some(function(it){ return it.action&&it.action.confirmar&&num(it.action.confirmar.valor)===view.insightOk });
        if(!confirma) view.insightOk=null;
        pintarInsights();
      })
      .catch(function(){
        if(chaveInsights()!==pedido) return;
        view.insightsErro=true;
        view.insights=null;
        view.insightsChave=pedido;
        view.insightOk=null;
        pintarInsights();
      });
  }

  function pararCmd(){
    view.cmdParar=true;
    view.cmdOuvindo=false;
    if(view.cmdTimer){clearInterval(view.cmdTimer);view.cmdTimer=null}
    if(view.cmdRec){try{view.cmdRec.onend=null;view.cmdRec.stop()}catch(e){} view.cmdRec=null}
  }
  function ouvirComando(){
    if(view.vozModo==='ouvindo'){pararMic();view.vozModo='off'}
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){flash('Este aparelho não dita. Escreva o que aconteceu.');return}
    view.cmdParar=false;
    view.cmdOuvindo=true;
    view.cmdLeft=30;
    render();
    var rec=new SR();
    view.cmdRec=rec;
    rec.lang='pt-BR';
    rec.continuous=true;
    rec.interimResults=true;
    rec.onresult=function(e){
      var fin='', mid='';
      for(var i=0;i<e.results.length;i++){
        var t=e.results[i][0].transcript;
        if(e.results[i].isFinal) fin+=t+' '; else mid+=t;
      }
      view.cmdTexto=(fin+' '+mid).trim();
      var el=document.getElementById('cmdQ');
      if(el) el.value=view.cmdTexto;
    };
    rec.onerror=function(ev){
      if(ev.error==='not-allowed'||ev.error==='service-not-allowed'||ev.error==='audio-capture'){
        pararCmd(); flash('O microfone não foi permitido. Escreva o que aconteceu.'); render();
      }
    };
    rec.onend=function(){ if(!view.cmdParar&&view.cmdOuvindo&&view.cmdRec){ try{view.cmdRec.start()}catch(err){} } };
    try{rec.start()}catch(err){pararCmd();flash('Não consegui abrir o microfone.');render();return}
    var fim=Date.now()+30000;
    view.cmdTimer=setInterval(function(){
      var left=Math.max(0,Math.ceil((fim-Date.now())/1000));
      view.cmdLeft=left;
      var n=document.getElementById('cmdCount');
      if(n) n.textContent=left+'s';
      if(left<=0){pararCmd(); if(S.tab==='inicio') render()}
    },250);
  }
  function htmlComando(){
    var h='<section class="comando" aria-label="Diga o que aconteceu"><label class="field" for="cmdQ"><span>Diga o que aconteceu…</span>';
    h+='<textarea id="cmdQ" placeholder="Ex.: guardei 300 na reserva">'+esc(view.cmdTexto||'')+'</textarea></label>';
    h+='<div class="actions">';
    if(view.cmdOuvindo) h+='<button type="button" class="main mic" data-act="cmd-parar">'+micDesenho()+'Parar · <span id="cmdCount">'+view.cmdLeft+'s</span></button>';
    else h+='<button type="button" class="ghost mic" data-act="cmd-voz">'+micDesenho()+'Falar</button>';
    h+='<button type="button" class="main" data-act="cmd-enviar"'+(view.cmdBusy?' disabled':'')+'>'+(view.cmdBusy?'Olhando…':'Registrar')+'</button></div>';
    if(view.cmdResposta) h+='<p class="cmd-resposta">'+esc(view.cmdResposta)+'</p>';
    if(view.cmdProposta){
      var p=view.cmdProposta;
      h+='<article class="proposta"><h3>'+esc(p.titulo||'Confirmar')+'</h3><p>'+esc(p.detalhe||'')+'</p><p class="note">Nada muda até você confirmar.</p>';
      h+='<div class="actions"><button type="button" class="main" data-act="cmd-confirma">Confirmar</button><button type="button" class="ghost" data-act="cmd-cancela">Cancelar</button></div></article>';
    }
    return h+'</section>';
  }
  function enviarComando(){
    pararCmd();
    var el=document.getElementById('cmdQ');
    var texto=el?String(el.value).trim():String(view.cmdTexto||'').trim();
    if(!texto){flash('Diga o que aconteceu.');return}
    view.cmdTexto=texto;
    view.cmdBusy=true; view.cmdResposta=''; view.cmdProposta=null;
    render();
    fetch('/api/comando',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({texto:texto, hoje:ymd(today()), estado:estadoAgente()})})
      .then(function(r){ if(r.status===401){location.href='/login';return null} return r.json() })
      .then(function(j){
        if(!j) return;
        if(j.tipo==='proposta'&&j.proposta){ view.cmdProposta=j.proposta; view.cmdResposta=''; }
        else { view.cmdProposta=null; view.cmdResposta=j.texto||'Não entendi. Tente de outro jeito.'; }
      })
      .catch(function(){ view.cmdProposta=null; view.cmdResposta='Não deu para entender agora.'; })
      .then(function(){ view.cmdBusy=false; if(S.tab==='inicio'&&!view.mural) render(); });
  }
  function registrarCompra(at, q, pr){
    if(!(q>0&&pr>0)||!at) return false;
    at.pm=(at.qtd*at.pm+q*pr)/(at.qtd+q);
    at.qtd=Math.round((at.qtd+q)*10000)/10000;
    at.pm=Math.round(at.pm*100)/100;
    if(!at.preco){at.preco=pr; at.hist=[{d:ymd(today()),p:pr}]}
    return true;
  }

  function tInicio(){
    if(view.mural) return muralCheio();
    var st=streaks(), f=fase(), prox=satOnOrAfter(today()), cyc=cycleOf(prox), M=marcos(), ok=M.filter(function(m){return m[1]}).length;
    var tipo=cyc.idx===0?'Aluguel':'Cascata '+cyc.idx;
    var h='<div class="home">'+sangueHtml()+'<h1>Olá, Tiago</h1><p class="sub">'+f[0]+' · '+esc(f[1])+'</p>';
    h+=htmlBriefing();
    h+=htmlComando();
    h+=htmlInsights();
    h+=sabedoriaHtml();
    h+='<div class="grid3"><div class="stat hl"><span>Próximo sábado</span><b>'+fmtDate(prox)+'</b><span>'+tipo+'</span></div>';
    h+='<div class="stat"><span>Sequência</span>'+fig('hero-streak',st.atual,String(st.atual),'int')+'<span>melhor: '+st.melhor+'</span></div>';
    h+='<div class="stat"><span>Patrimônio</span>'+fig('hero-patr',patrimonio(),compact.format(patrimonio()),'compact')+'<span>'+money(patrimonio())+'</span></div></div>';
    h+=muroHtml();
    var ref=satOnOrBefore(today());
    if(st.ultima&&(ref-st.ultima)/864e5>=14) h+='<p class="alert red">Dois sábados seguidos sem check-in. Volte neste sábado: nunca falhar dois seguidos.</p>';
    h+='<div class="actions"><button class="main" data-go="sabado">Abrir o sábado</button><button class="ghost" data-go="checkin">Fazer check-in</button></div>';
    h+=desejoHtml();
    h+=muralResumo();
    h+='<h2>Caixinhas</h2><div class="grid2">';
    h+=goal('Reserva',S.saldos.reserva,S.cfg.reservaMeta,'var(--blue)','meta a definir');
    h+=goal('Lance CB650R',S.saldos.lance,S.cfg.lanceMeta,'var(--amber)');
    h+=goal('Apartamento',S.saldos.apto,S.cfg.aptoMeta,'var(--plum)');
    h+=goal('Carro dos sonhos',S.saldos.carro,S.cfg.carroMeta,'var(--plum)');
    h+='</div>';
    h+='<div class="grid2"><div class="stat"><span>ARCA investida</span><b class="num">'+money(arcaTotal())+'</b></div><div class="stat"><span>ARCA – a investir</span><b class="num">'+money(S.saldos.arcaInvestir)+'</b>'+(S.saldos.arcaInvestir>0?'<span>comprar na segunda ou terça</span>':'')+'</div></div>';
    h+=conferenciaAviso();
    h+='<div class="actions"><button type="button" class="ghost" data-go="caixinhas">Abrir caixinhas</button></div>';
    h+='<h2>Marcos · '+ok+' de '+M.length+'</h2><div class="card"><div class="marcos">';
    M.forEach(function(m){h+='<div class="'+(m[1]?'ok':'')+'"><span class="mark" aria-hidden="true"></span>'+esc(m[0])+'</div>'});
    h+='</div></div>';
    h+='<button type="button" class="fab" data-act="desejo-open">Quero comprar…</button>';
    h+='<div class="fab-space"></div></div>';
    return h;
  }

  function lembretesSabado(){
    var itens=[];
    var parada=diasArcaParada();
    if(num(S.saldos.arcaInvestir)>0&&parada>7) itens.push({tipo:'arca', texto:'ARCA – a investir está com '+money(S.saldos.arcaInvestir)+' há '+parada+' dias. É passagem: compre no próximo dia útil.'});
    var data=S.conferencia&&S.conferencia.data;
    var diasConf=data?Math.round((today()-parse(data))/864e5):null;
    if(diasConf==null||diasConf>30) itens.push({tipo:'conf', texto:diasConf==null?'Nenhuma conferência com o Nubank ainda. Uma vez por mês, digite o saldo do app.':'Conferência com o Nubank há '+diasConf+' dias. Uma vez por mês, digite o saldo do app.'});
    var corte=ymd(addDays(today(),-7));
    var retiradas=movsCaixa('reserva').filter(function(m){ return m.tipo==='retirada'&&m.data>=corte });
    if(retiradas.length){
      var soma=0;
      retiradas.forEach(function(m){ soma+=num(m.valor) });
      var det=retiradas.slice(0,3).map(function(m){ return money(m.valor)+(m.motivo?' · '+m.motivo:'') }).join('; ');
      itens.push({tipo:'reserva', texto:'Retirada da Reserva nos últimos 7 dias: '+money(soma)+'. '+det+'.'});
    }
    return itens;
  }
  function textoLembrete(){
    return lembretesSabado().map(function(i){ return i.texto }).join('\n');
  }
  function dispararLembrete(){
    if(today().getDay()!==6||new Date().getHours()<8) return;
    var chave=ymd(today());
    try{ if(localStorage.getItem('portal-lembrete-sabado')===chave) return }catch(e){}
    var corpo=textoLembrete();
    if(!corpo||!window.Notification||Notification.permission!=='granted') return;
    try{
      var n=new Notification('Sábado de manhã',{body:corpo,tag:'portal-sabado',lang:'pt-BR'});
      n.onclick=function(){ window.focus(); S.tab='sabado'; view.sab=today(); render() };
      localStorage.setItem('portal-lembrete-sabado', chave);
    }catch(e){}
  }
  function armarLembrete(){
    clearTimeout(armarLembrete.t);
    var agora=new Date();
    var alvo=new Date(agora.getFullYear(),agora.getMonth(),agora.getDate(),8,0,0,0);
    var falta=(6-agora.getDay()+7)%7;
    if(falta===0&&agora.getHours()>=8){ dispararLembrete(); return }
    if(falta!==0) alvo.setDate(alvo.getDate()+falta);
    var espera=alvo-agora;
    if(espera<=0||espera>8*864e5) return;
    armarLembrete.t=setTimeout(dispararLembrete, espera);
  }
  function blocoLembrete(){
    var itens=lembretesSabado();
    var perm=window.Notification?Notification.permission:'unsupported';
    if(!itens.length&&perm!=='default') return '';
    var h='<section class="lembrete" aria-label="Lembrete de sábado de manhã">';
    if(itens.length){
      h+='<h2>Sábado de manhã</h2>';
      itens.forEach(function(i){ h+='<p>'+esc(i.texto)+'</p>' });
      if(itens.some(function(i){ return i.tipo==='conf' })) h+='<div class="actions"><button type="button" class="main" data-act="lembrete-conf">Conferir com o Nubank</button></div>';
    }else h+='<p>No sábado de manhã o aviso chega se a ARCA – a investir passar de 7 dias, a conferência passar de 30 dias ou você tirar da Reserva.</p>';
    if(perm==='default') h+='<div class="actions"><button type="button" class="ghost" data-act="lembrete-perm">Receber este aviso no sábado de manhã</button></div>';
    if(perm==='denied') h+='<p class="note">O aviso deste aparelho está bloqueado. O lembrete continua aqui quando você abre o sábado.</p>';
    return h+'</section>';
  }
  function tSabado(){
    var d=view.sab||satOnOrAfter(today()); view.sab=d;
    var key=ymd(d), cyc=cycleOf(d), h='<h1>Sábado</h1><p class="sub">Recebeu, executa a sua parte da cascata e faz o check-in.</p>';
    h+=blocoLembrete();
    h+='<div class="week"><button class="ghost icon-btn" data-sab="-7" aria-label="Sábado anterior">←</button><h3>'+fmtLong(d)+'</h3><button class="ghost icon-btn" data-sab="7" aria-label="Próximo sábado">→</button></div>';
    if(cyc.idx===0){
      h+='<div class="card" style="margin-top:12px"><svg class="house" viewBox="0 0 48 40" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 18 L24 6 L42 18"/><path d="M10 16 V34 H38 V16"/><path d="M20 34 V24 H28 V34"/></svg><span class="pill amber">Sábado do aluguel</span><p>Nesta semana a pedra vai para a casa. O pagamento de hoje vai para o aluguel, que vence dia 5. Sem aporte nesta semana.</p></div>';
      h+='<div class="actions"><button class="main" data-go="checkin">Fazer check-in</button></div>';
      return h;
    }
    var w=semana(d), a=w.alloc, t=w.t, mes=cyc.mes, fii=fiiDoMes(mes);
    var bonus=cyc.idx>3;
    h+='<div class="card" style="margin-top:12px"><div class="row"><span class="pill">Cascata '+cyc.idx+(bonus?' · bônus':'')+'</span>'+(w.done?'<span class="pill seal">Feito</span>':'')+(motion.flow?'<span class="laid"><i class="stone solid is-new"></i></span>':'')+'</div>';
    h+='<div class="field" style="margin-top:12px"><span>Quanto chegou este sábado (R$)</span><input data-rec="'+key+'" inputmode="decimal" value="'+(Math.round(w.rec*100)/100)+'"'+(w.done?' disabled':'')+'></div>';
    var L=[['consorcio','Co','var(--muted)','Consórcio','Separar para o boleto (vence ~dia 18)'],['acordos','Ac','var(--muted)','Acordos','Recovery dia 25'+(acordosNo(mes)>200?', Zema dia 5':'')+', Ipanema'],
      ['lance','La','var(--amber)','Caixinha Lance CB650R',w.t.lance>0?'Meta do mês: '+money(t.lance):'Lance completo'],['reserva','Re','var(--blue)','Caixinha Reserva',t.cheia?'Reserva cheia':'Meta do mês: '+money(t.reserva)],
      ['arca','AR','var(--green)','Caixinha ARCA – a investir','Comprar na segunda ou terça']];
    h+='<div class="list'+(motion.flow?' is-flow':'')+'" style="margin-top:8px">';
    L.forEach(function(l){ var v=a[l[0]]; h+='<div class="li"'+(v>0?'':' style="opacity:.45"')+'><div class="tag" style="--c:'+l[2]+'">'+l[1]+'</div><div><b>'+l[3]+'</b><small>'+esc(l[4])+'</small></div><div class="v num">'+money(v)+'</div></div>'});
    h+='</div>';
    h+='<div class="actions">'+(w.done?'<button class="ghost" data-act="undo" data-k="'+key+'">Desfazer</button>':'<button class="main" data-act="exec" data-k="'+key+'">Executei a cascata</button>')+'<button class="ghost" data-go="checkin">Check-in</button></div>';
    h+='<p class="note">Executar soma esses valores nas caixinhas do portal. Ciclo deste mês: entrada de '+money(S.cfg.entrada)+' dividida nos sábados de cascata. FII do mês: '+fii+'.</p></div>';
    h+='<h2>Metas do ciclo</h2><div class="card num"><div class="list">';
    [['Consórcio',t.consorcio],['Acordos',t.acordos],['Lance',t.lance],['Reserva',t.reserva],['ARCA',t.arca]].forEach(function(x){h+='<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)"><span>'+x[0]+'</span><span>'+money(x[1])+'</span></div>'});
    h+='</div></div>';
    return h;
  }

  function tCheckin(){
    var d=view.ciDate||satOnOrAfter(today()); view.ciDate=d;
    var key=ymd(d), c=Object.assign({},S.checkins[key]||{},ciDraft), cyc=cycleOf(d);
    var h='<h1>Check-in</h1><p class="sub">Cinco minutos. O objetivo é aparecer.</p>';
    h+='<div class="week"><button class="ghost icon-btn" data-ci="-7" aria-label="Sábado anterior">←</button><h3>'+fmtLong(d)+'</h3><button class="ghost icon-btn" data-ci="7" aria-label="Próximo sábado">→</button></div>';
    h+=vozBloco();
    var vz=function(k){return view.vozCampos&&view.vozCampos[k]?' is-voz':''};
    h+='<div class="card" style="margin-top:12px"><div class="grid2">';
    h+='<div class="field full'+vz('mexeu')+'"><span>1. Mexi em alguma caixinha?</span><div class="seg"><button type="button" data-mexeu="não" aria-pressed="'+(c.mexeu!=='sim')+'">Não</button><button type="button" data-mexeu="sim" aria-pressed="'+(c.mexeu==='sim')+'">Sim</button></div></div>';
    if(c.mexeu==='sim') h+='<label class="field full'+vz('motivo')+'"><span>Por quê?</span><input data-ci-f="motivo" value="'+esc(c.motivo)+'"></label>';
    h+='<label class="field'+vz('gastos')+'"><span>2. Gastos da semana (R$)</span><input data-ci-f="gastos" inputmode="decimal" value="'+esc(c.gastos)+'"></label>';
    h+='<label class="field'+vz('foraNormal')+'"><span>Algum fora do normal?</span><input data-ci-f="foraNormal" value="'+esc(c.foraNormal)+'"></label>';
    h+='<label class="field full'+vz('negocios')+'"><span>3. Negócios: o que avancei?</span><textarea data-ci-f="negocios">'+esc(c.negocios)+'</textarea></label>';
    h+='<label class="field'+vz('extra')+'"><span>4. Dinheiro extra (R$)</span><input data-ci-f="extra" inputmode="decimal" value="'+esc(c.extra)+'"></label>';
    h+='<label class="field'+vz('extraOrigem')+'"><span>De onde?</span><input data-ci-f="extraOrigem" value="'+esc(c.extraOrigem)+'"></label>';
    h+='<label class="field full'+vz('vitoria')+'"><span>5. Maior vitória da semana</span><input data-ci-f="vitoria" value="'+esc(c.vitoria)+'"></label>';
    h+='<label class="field full'+vz('escorreguei')+'"><span>6. Onde quase escorreguei</span><input data-ci-f="escorreguei" value="'+esc(c.escorreguei)+'"></label>';
    h+='</div>'+(motion.festa?'<div class="sparks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>':'')+'<div class="actions"><button class="main'+(S.checkins[key]?' sealed':'')+(motion.stone&&S.checkins[key]?' is-laid':'')+'" data-act="saveci" data-k="'+key+'">'+(motion.stone&&S.checkins[key]?'<span class="laid"><i class="stone solid is-new"></i></span>':'')+(S.checkins[key]?'Atualizar check-in':'Salvar check-in')+'</button>'+(cyc.idx===0?'<span class="pill amber">Sábado do aluguel</span>':'<span class="pill">Cascata '+cyc.idx+'</span>')+'</div></div>';
    var ks=Object.keys(S.checkins).sort().reverse();
    var gs=ks.map(function(k){return num(S.checkins[k].gastos)}).filter(function(x){return x>0});
    if(gs.length){var media=gs.reduce(function(a,b){return a+b},0)/gs.length, sug=Math.round(media*4.33*6);
      h+='<div class="grid2" style="margin-top:12px"><div class="stat"><span>Gasto médio por semana</span><b class="num">'+money(media)+'</b></div><div class="stat"><span>Custo de vida estimado (×4,33)</span><b class="num">'+money(media*4.33)+'</b><span>meta da reserva ≈ '+money(sug)+'</span></div></div>';
      h+='<div class="actions"><button class="ghost" data-act="usemeta" data-meta="'+sug+'">Definir meta da reserva em '+money(sug)+'</button></div>';}
    h+='<h2>Histórico</h2>';
    if(!ks.length) h+='<p class="empty">O primeiro check-in aparece aqui. Cinco minutos, neste sábado.</p>';
    else{ h+='<div class="hist">'; ks.slice(0,20).forEach(function(k){var x=S.checkins[k];
      h+='<div class="card"><div class="row"><strong>'+fmtDate(parse(k))+'</strong><small class="num">'+(x.gastos?'gastos '+money(num(x.gastos)):'')+'</small></div>'+(x.vitoria?'<p><span class="k">Vitória</span>'+esc(x.vitoria)+'</p>':'')+(x.negocios?'<p><span class="k">Negócios</span>'+esc(x.negocios)+'</p>':'')+(x.mexeu==='sim'?'<p><span class="k">Caixinha</span>'+esc(x.motivo||'Mexeu')+'</p>':'')+'</div>'});
      h+='</div>'; }
    return h;
  }

  function mergeState(saved){
    var base=JSON.parse(JSON.stringify(DEFAULT));
    if(!saved||!saved.cfg) return base;
    ['cfg','saldos'].forEach(function(k){ Object.keys(saved[k]||{}).forEach(function(j){ base[k][j]=saved[k][j] }) });
    ['acordos','negocios','movs','ativos','aportes','checkins'].forEach(function(k){ if(saved[k]!=null) base[k]=saved[k] });
    if(typeof saved.seq==='number') base.seq=saved.seq;
    if(saved.tab) base.tab=saved.tab;
    if(saved.tema) base.tema=saved.tema;
    if(saved.ultimaCotacao) base.ultimaCotacao=saved.ultimaCotacao;
    if(saved.bandaFora&&typeof saved.bandaFora==='object') base.bandaFora=saved.bandaFora;
    if(Array.isArray(saved.escolhas)) base.escolhas=saved.escolhas;
    if(Array.isArray(saved.sonhos)) base.sonhos=saved.sonhos;
    if(Array.isArray(saved.timeline)) base.timeline=saved.timeline;
    if(Array.isArray(saved.cenarios)) base.cenarios=saved.cenarios;
    if(Array.isArray(saved.livros)) base.livros=saved.livros;
    if(Array.isArray(saved.caixinhasMov)) base.caixinhasMov=saved.caixinhasMov;
    if(Array.isArray(saved.outrasContas)) base.outrasContas=saved.outrasContas;
    if(saved.conferencia&&typeof saved.conferencia==='object'&&saved.conferencia.data) base.conferencia=saved.conferencia;
    if(base.cfg.esconderSabedoria==null) base.cfg.esconderSabedoria=false;
    if(saved.feitos&&typeof saved.feitos==='object'&&!Array.isArray(saved.feitos)) base.feitos=saved.feitos;
    if(saved.avisos&&typeof saved.avisos==='object'&&!Array.isArray(saved.avisos)){
      ['sabado','arca','contas','nudge','revisao'].forEach(function(k){ if(typeof saved.avisos[k]==='boolean') base.avisos[k]=saved.avisos[k] });
    }
    if(base.cfg.rendaLiquida==null) base.cfg.rendaLiquida='';
    if(base.cfg.horasMes==null) base.cfg.horasMes='';
    if(!base.ativos||!base.ativos.length) base.ativos=JSON.parse(JSON.stringify(DEFAULT.ativos));
    base.ativos.forEach(classificarAtivo);
    return base;
  }
  function atualizarBanda(){
    if(!S.bandaFora||typeof S.bandaFora!=='object') S.bandaFora={};
    var tot=arcaTotal();
    ['A','R','C','I'].forEach(function(k){
      if(!(tot>=4000)){ delete S.bandaFora[k]; return }
      var pc=S.saldos[k]/tot*100;
      if(pc<15||pc>35){ if(!S.bandaFora[k]) S.bandaFora[k]=ymd(today()) }
      else delete S.bandaFora[k];
    });
  }
  function avisoBanda(){
    var tot=arcaTotal(); if(tot<4000) return '';
    var html='';
    ['A','R','C','I'].forEach(function(k){
      var pc=S.saldos[k]/tot*100; if(pc>=15&&pc<=35) return;
      var desde=S.bandaFora&&S.bandaFora[k];
      var dias=desde?Math.max(0,Math.round((today()-parse(desde))/864e5)):0;
      var linha=dias>=183
        ? k+' está fora da faixa há '+dias+' dias, desde '+fmtDate(parse(desde))+'. Já faz cerca de 6 meses: pode considerar vender o excesso.'
        : k+' está em '+Math.round(pc)+'%, fora de 15% a 35%'+(desde?' há '+dias+' dias':'')+'. O aporte corrige primeiro. Vender entra em jogo se continuar assim por uns 6 meses.';
      html+='<p class="alert'+(dias>=183?' red':'')+'">'+esc(linha)+'</p>';
    });
    return html;
  }
  function applyTheme(){
    var t=S.tema||'sistema';
    if(t==='sistema') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }
  function setPreco(a,p){
    if(!(p>0)) return;
    a.preco=p; a.hist=a.hist||[];
    var dd=ymd(today());
    if(a.hist.length&&a.hist[a.hist.length-1].d===dd) a.hist[a.hist.length-1].p=p;
    else a.hist.push({d:dd,p:p});
    if(a.hist.length>52) a.hist=a.hist.slice(-52);
  }
  function ondeDados(){
    if(mode==='supabase') return 'no Supabase';
    if(mode==='file') return 'neste computador, no arquivo do servidor';
    if(mode==='local') return 'só neste navegador';
    return 'carregando';
  }
  function arcaAlloc(){
    var amt=S.saldos.arcaInvestir, L=['A','R','C','I'], tot=arcaTotal()+amt, tgt=tot/4;
    var def=L.map(function(k){return Math.max(0,tgt-S.saldos[k])}), sd=def.reduce(function(a,b){return a+b},0);
    return L.map(function(k,i){return sd<=0?amt/4:amt*def[i]/sd});
  }
  function tArca(){
    var tot=arcaTotal(), al=arcaAlloc(), mes=ymd(today()).slice(0,7), fii=fiiDoMes(mes);
    var h='<h1>ARCA</h1><p class="sub">Compra direta no Nubank, de segunda a sexta. O dinheiro espera na caixinha "ARCA – a investir".</p>';
    h+='<div class="grid2" style="margin-top:16px"><div class="stat hl"><span>Para investir agora</span>'+fig('arca-agora',S.saldos.arcaInvestir,money(S.saldos.arcaInvestir),'money')+'</div><div class="stat"><span>ARCA investida</span>'+fig('arca-tot',tot,money(tot),'money')+'</div></div>';
    h+=pilaresHtml();
    var D=[['A','Ações BR','BOVA11 (ou BOVX11)','var(--green)'],['R','Fundos imobiliários',fii+' ('+FII_DESC[fii]+'). Rodízio mensal','var(--green)'],['C','Caixa','Tesouro IPCA+ 2035','var(--green)'],['I','Internacional','IVVB11 (S&P 500, sem hedge)','var(--plum)']];
    h+='<h2>O que comprar</h2><div class="card"><div class="list">';
    D.forEach(function(x,i){var s=S.saldos[x[0]], pc=tot>0?s/tot*100:0;
      h+='<div class="li"><div class="tag" style="--c:'+x[3]+'">'+x[0]+'</div><div><b>'+esc(x[2])+'</b><small>'+x[1]+' · '+pc.toFixed(0)+'% da ARCA</small></div><div class="v num">'+money(al[i])+'</div></div>'});
    h+='</div>';
    h+=avisoBanda();
    h+='<div class="actions"><button class="main" data-act="comprei"'+(S.saldos.arcaInvestir>0?'':' disabled')+'>Comprei tudo</button></div><p class="note">"Comprei tudo" move o valor da caixinha para as letras. Se comprou valores diferentes, ajuste os saldos abaixo.</p></div>';
    h+='<h2>Saldos por letra</h2><div class="grid4">';
    D.forEach(function(x){h+='<label class="field"><span>'+x[0]+' – '+x[1]+'</span><input data-saldo="'+x[0]+'" inputmode="decimal" value="'+S.saldos[x[0]]+'"></label>'});
    h+='</div>';
    h+='<h2>Dividendos</h2><div class="card"><div class="row"><span>Recebidos até hoje</span><b class="num">'+money(S.saldos.dividendos)+'</b></div><div class="actions"><input id="divIn" inputmode="decimal" placeholder="Valor recebido" style="flex:1;min-width:140px"><button class="main" data-act="div">Registrar dividendo</button></div><p class="note">O dividendo entra na caixinha "ARCA – a investir" para o próximo aporte.</p></div>';
    return h;
  }

  function negStats(n){var a=0,b=0;S.movs.forEach(function(m){if(n&&m.neg!==n)return;if(m.tipo==='inv')a+=m.valor;else b+=m.valor});return {inv:a,ret:b,saldo:b-a}}
  function tNegocios(){
    var T=negStats(null), h='<h1>Negócios</h1><p class="sub">As máquinas de renda: quanto entrou, quanto voltou.</p>';
    h+='<div class="grid3" style="margin-top:16px"><div class="stat"><span>Investido</span>'+fig('neg-inv',T.inv,money(T.inv),'money')+'</div><div class="stat"><span>Retorno</span>'+fig('neg-ret',T.ret,money(T.ret),'money')+'</div><div class="stat hl"><span>Saldo</span>'+fig('neg-saldo',T.saldo,money(T.saldo),'money')+'</div></div>';
    h+='<h2>Registrar</h2><div class="card"><div class="grid2">';
    h+='<label class="field"><span>Negócio</span><select id="mNeg">'+S.negocios.map(function(n){return '<option>'+esc(n)+'</option>'}).join('')+'</select></label>';
    h+='<div class="field"><span>Tipo</span><div class="seg"><button type="button" data-mt="inv" aria-pressed="'+(view.movTipo==='inv')+'">Investi</button><button type="button" data-mt="ret" aria-pressed="'+(view.movTipo==='ret')+'">Retornou</button></div></div>';
    h+='<label class="field"><span>Valor (R$)</span><input id="mVal" inputmode="decimal" placeholder="0,00"></label>';
    h+='<label class="field"><span>Data</span><input id="mData" type="date" value="'+ymd(today())+'"></label>';
    h+='<label class="field full"><span>Nota</span><input id="mNota" placeholder="Ex.: anúncios, domínio, primeira venda"></label>';
    h+='</div><div class="actions"><button class="main" data-act="addmov">Registrar</button></div></div>';
    if(!S.movs.length) h+='<p class="empty">Nenhum movimento ainda. O primeiro registro começa o gráfico.</p>';
    if(S.movs.length){ h+='<h2>Investido x retorno</h2><div class="card chart">'+barChart(S.negocios.map(function(n){var s=negStats(n);return {n:n,a:s.inv,b:s.ret}}))+'<div class="legend"><span><i style="background:var(--amber)"></i>Investido</span><span><i style="background:var(--green)"></i>Retorno</span></div></div>'; }
    h+='<h2>Por negócio</h2><div class="grid2">';
    S.negocios.forEach(function(n){var s=negStats(n), r30=renda30(n), pc=s.inv>0?Math.min(100,s.ret/s.inv*100):0, mil=Math.min(100,Math.max(0,r30.mes)/10), del=pendingDel==='n:'+n;
      h+='<div class="stat"><div class="row"><span><strong>'+esc(n)+'</strong>'+(r30.ativo?gearSvg():'')+'</span><button class="mini'+(del?' warn':'')+'" data-deln="'+esc(n)+'">'+(del?'Confirmar':'Remover')+'</button></div><div class="row" style="margin-top:6px"><small>Investido</small><span class="num">'+money(s.inv)+'</span></div><div class="row"><small>Retorno</small><span class="num">'+money(s.ret)+'</span></div>'+fig('neg-'+n,s.saldo,money(s.saldo),'money',s.saldo>=0?'pos':'neg')+'<div class="bar"><i style="width:'+pc.toFixed(1)+'%"></i></div><small>'+(s.inv>0?'Recuperou '+pc.toFixed(0)+'% do investido':'Sem investimento ainda')+'</small><div class="bar" style="margin-top:8px"><i style="width:'+mil.toFixed(1)+'%"></i></div><small>'+(r30.usou30?'Retorno em 30 dias: ':'Retorno acumulado: ')+money(r30.mes)+' · rumo a R$ 1.000/mês</small></div>'});
    h+='</div><div class="actions"><input id="novoNeg" placeholder="Nome do novo negócio" style="flex:1;min-width:160px"><button class="ghost" data-act="addneg">Adicionar</button></div>';
    if(S.movs.length){ h+='<h2>Histórico</h2><div class="tw"><table><thead><tr><th>Data</th><th>Negócio</th><th>Nota</th><th class="v">Valor</th><th></th></tr></thead><tbody>';
      S.movs.slice().sort(function(a,b){return a.data<b.data?1:-1}).forEach(function(m){var del=pendingDel==='m:'+m.id;
        h+='<tr><td>'+fmtDate(parse(m.data))+'</td><td>'+esc(m.neg)+'</td><td>'+esc(m.nota)+'</td><td class="v '+(m.tipo==='inv'?'neg':'pos')+'">'+(m.tipo==='inv'?'− ':'+ ')+money(m.valor)+'</td><td><button class="mini'+(del?' warn':'')+'" data-delm="'+m.id+'">'+(del?'Confirmar':'Apagar')+'</button></td></tr>'});
      h+='</tbody></table></div>'; }
    return h;
  }

  function precoHaQuatroSemanas(a){
    var h=(a.hist||[]).filter(function(x){return x&&x.d&&num(x.p)>0});
    if(h.length<2) return null;
    var last=h[h.length-1], tLast=parse(last.d).getTime(), best=null, bestDist=1e15;
    for(var i=0;i<h.length-1;i++){
      var dias=(tLast-parse(h[i].d).getTime())/864e5;
      if(dias<21||dias>42) continue;
      var dist=Math.abs(dias-28);
      if(dist<bestDist){ bestDist=dist; best={p:num(h[i].p), d:h[i].d, agora:num(last.p)}; }
    }
    return best;
  }
  function sangueFrio(){
    /* Limiar de 7% sobre o histórico do próprio usuário (a.hist), não um número de crise citado de fora. */
    var nomes=[];
    ['BOVA11','IVVB11'].forEach(function(t){
      var a=(S.ativos||[]).filter(function(x){return x.t===t})[0];
      if(!a) return;
      var c=precoHaQuatroSemanas(a);
      if(c&&c.p>0&&c.agora/c.p-1<=-0.07) nomes.push(t);
    });
    var agora=0, antes=0, n=0;
    (S.ativos||[]).forEach(function(a){
      if(['A','R','C','I'].indexOf(a.l)<0||!(num(a.qtd)>0)) return;
      var c=precoHaQuatroSemanas(a);
      var pNow=num(a.preco)>0?num(a.preco):(c?c.agora:0);
      if(!c||!(pNow>0)||!(c.p>0)) return;
      agora+=num(a.qtd)*pNow; antes+=num(a.qtd)*c.p; n++;
    });
    var carteira=n>0&&antes>0&&agora/antes-1<=-0.07;
    if(!nomes.length&&!carteira) return null;
    return {nomes:nomes, carteira:carteira};
  }
  function sangueHtml(){
    var q=sangueFrio();
    if(!q) return '';
    var frase='';
    if(q.nomes.length) frase=q.nomes.join(' e ')+(q.nomes.length>1?' estão':' está')+' mais baixo do que cerca de quatro semanas atrás.';
    if(q.carteira) frase+=(frase?' ':'')+(q.nomes.length?'O valor de mercado da ARCA também está mais baixo.':'O valor de mercado da ARCA está mais baixo do que cerca de quatro semanas atrás.');
    var h='<section class="card sangue" aria-label="Modo sangue frio"><h2>O mercado caiu. Sua fundação não.</h2>';
    h+='<p>'+esc(frase)+'</p>';
    h+='<p>Graham descreveu o mercado como um sócio que aparece todo dia oferecendo um preço. Você não é obrigado a aceitar. Buffett tratava a oscilação como parte do ofício: quedas assim já aconteceram muitas vezes, e o plano de quem investe para ficar não muda por causa delas.</p>';
    h+='<p>A sua regra continua de pé: só rebalancear se uma letra ficar fora de 15% a 35% por cerca de 6 meses. O aporte deste mês compra mais do mesmo pelo mesmo dinheiro.</p></section>';
    return h;
  }
  function checkinSemRetirada(){
    var keys=[ymd(satOnOrBefore(today()))], prox=ymd(satOnOrAfter(today()));
    if(keys.indexOf(prox)<0) keys.push(prox);
    for(var i=0;i<keys.length;i++){
      var c=S.checkins&&S.checkins[keys[i]];
      if(c&&c.mexeu!=='sim') return true;
    }
    return false;
  }
  function indiceSabedoria(){
    var sab=satOnOrBefore(today()), epoch=new Date(2020,0,4);
    var n=Math.round((sab-epoch)/864e5/7);
    return n<0?0:n;
  }
  function sabedoriaHtml(){
    if(S.cfg.esconderSabedoria||!SAB.length) return '';
    var item=SAB[indiceSabedoria()%SAB.length];
    if(!item||!item.texto) return '';
    return '<section class="card sab" aria-label="Sabedoria da semana"><p class="sab-ref">'+esc(item.ref)+'</p><p class="sab-texto">'+esc(item.texto)+'</p><p class="sab-ap">'+esc(item.aplicacao||'')+'</p></section>';
  }
  function livrosLista(){return Array.isArray(S.livros)?S.livros:[]}
  function livroPronto(b){return !!(b&&b.status==='lido'&&String(b.ideia||'').trim())}
  function livrosProntos(){return livrosLista().filter(livroPronto)}
  function livroPorId(id){var achou=null; livrosLista().forEach(function(b){if(b.id===id) achou=b}); return achou}
  function carimbarFeitos(){
    if(!S.feitos||typeof S.feitos!=='object'||Array.isArray(S.feitos)) S.feitos={};
    var h=ymd(today()), s=S.saldos, C=S.cfg;
    function por(id,ok){ if(ok&&!S.feitos[id]) S.feitos[id]=h; }
    por('r1', s.reserva>=1000);
    por('r5', s.reserva>=5000);
    por('reserva', C.reservaMeta>0&&s.reserva>=C.reservaMeta);
    por('l10', s.lance>=10000);
    por('lance', C.lanceMeta>0&&s.lance>=C.lanceMeta);
    por('div', s.dividendos>0);
    por('a10', arcaTotal()>=10000);
    por('a50', arcaTotal()>=50000);
    por('ap10', s.apto>=10000);
    por('p100', patrimonio()>=100000);
    por('fase2', s.lance>=C.lanceMeta&&C.reservaMeta>0&&s.reserva>=C.reservaMeta);
    por('fase3', s.apto>=C.aptoMeta);
    por('arcaCompra', arcaTotal()>0);
    por('sangue', !!sangueFrio()&&checkinSemRetirada());
    livrosLista().forEach(function(b){ por('livro:'+b.id, livroPronto(b)); });
    por('leitor', livrosProntos().length>=1);
  }
  function seloMarca(){
    return '<svg class="tl-seal" viewBox="0 0 48 48" width="32" height="32" aria-hidden="true"><rect x="3" y="36" width="12" height="12"/><rect x="3" y="9" width="12" height="27"/><rect x="15" y="27" width="30" height="9"/><rect x="33" y="9" width="12" height="18"/><rect x="3" y="0" width="42" height="9"/></svg>';
  }
  function eventosAuto(){
    var ev=[], ds=Object.keys(S.checkins).sort();
    if(ds.length) ev.push({data:ds[0], titulo:'Primeiro check-in', texto:'A fundação começou neste sábado.', selo:true});
    var best=1, cur=1, bestDate=ds[0], nomes={4:'4 sábados seguidos',12:'12 sábados seguidos',26:'26 sábados seguidos',52:'52 sábados seguidos'};
    for(var i=1;i<ds.length;i++){
      var g=Math.round((parse(ds[i])-parse(ds[i-1]))/864e5);
      cur=g===7?cur+1:1;
      if(cur>best){
        best=cur; bestDate=ds[i];
        if(nomes[cur]) ev.push({data:ds[i], titulo:nomes[cur], texto:'A sequência chegou neste sábado.', selo:cur>=12});
      }
    }
    if(best>1&&!nomes[best]) ev.push({data:bestDate, titulo:'Recorde de sequência: '+best+' sábados', texto:'O melhor encadeamento até aqui.', selo:best>=12});
    var ap=Object.keys(S.aportes||{}).filter(function(k){return S.aportes[k]&&num(S.aportes[k].arca)>0}).sort();
    if(ap.length) ev.push({data:ap[0], titulo:'Primeira compra da ARCA', texto:'A cascata chegou na carteira.', selo:true});
    var rets=(S.movs||[]).filter(function(m){return m&&m.tipo==='ret'&&m.data&&num(m.valor)>0}).sort(function(a,b){return a.data<b.data?-1:1});
    if(rets.length) ev.push({data:rets[0].data, titulo:'Primeiro retorno de negócio', texto:(rets[0].neg?rets[0].neg+' devolveu ':'Um negócio devolveu ')+money(rets[0].valor)+'.', selo:true});
    var escList=(S.escolhas||[]).filter(function(e){return e&&e.data}).sort(function(a,b){return a.data<b.data?-1:1});
    if(escList.length) ev.push({data:escList[0].data, titulo:'Primeira escolha', texto:'Guardou em vez de comprar.', selo:false});
    var acum=0, cruzou=null;
    escList.forEach(function(e){ acum+=num(e.valor); if(!cruzou&&acum>=1000) cruzou=e.data; });
    if(cruzou) ev.push({data:cruzou, titulo:'R$ 1.000 em escolhas', texto:'Mil reais que ficaram na fundação.', selo:true});
    var F=S.feitos||{};
    function fe(id,titulo,texto,selo){ if(F[id]) ev.push({data:F[id], titulo:titulo, texto:texto, selo:!!selo}); }
    fe('lance','Lance completo','A CB 650R chegou na meta.',true);
    fe('reserva','Reserva cheia','O custo de vida de seis meses está no lugar.',true);
    fe('fase2','Fase 2: Crescimento','Lance e reserva prontos. A vez do apartamento.',true);
    fe('fase3','Fase 3: Liberdade','O apartamento está conquistado. A ARCA é o motor.',true);
    fe('div','Primeiro dividendo','A carteira começou a devolver.',true);
    if(!ap.length) fe('arcaCompra','Primeira compra da ARCA','As letras receberam o primeiro dinheiro.',true);
    fe('r1','R$ 1.000 na Reserva','',false);
    fe('r5','R$ 5.000 na Reserva','',false);
    fe('l10','R$ 10.000 no Lance','',false);
    fe('a10','R$ 10.000 na ARCA','',false);
    fe('a50','R$ 50.000 na ARCA','',true);
    fe('ap10','R$ 10.000 no Apartamento','',false);
    fe('p100','R$ 100.000 de patrimônio','',true);
    fe('sangue','Sangue frio','Fez o check-in da semana sem mexer nas caixinhas, com o mercado em queda.',true);
    var prontos=livrosProntos().slice().sort(function(a,b){
      var da=(F['livro:'+a.id])||a.fim||'';
      var db=(F['livro:'+b.id])||b.fim||'';
      return da<db?-1:da>db?1:0;
    });
    prontos.forEach(function(b,i){
      var data=(b.fim&&String(b.fim).slice(0,10))||F['livro:'+b.id]||ymd(today());
      var titulo=i===0?'Leitor de Primeira Geração: '+b.titulo:'Leu: '+b.titulo;
      ev.push({data:data, titulo:titulo, texto:String(b.ideia).trim(), selo:true});
    });
    return ev;
  }
  function linhaEventos(){
    var ev=eventosAuto();
    (S.timeline||[]).forEach(function(m){
      if(m&&m.data&&m.titulo) ev.push({data:String(m.data).slice(0,10), titulo:m.titulo, texto:m.texto||'', foto:m.foto||'', selo:false, id:m.id, manual:true});
    });
    ev.sort(function(a,b){return a.data<b.data?1:a.data>b.data?-1:0});
    return ev;
  }
  function tLinha(){
    var ev=linhaEventos();
    var h='<h1>Linha do tempo</h1><p class="sub">A Primeira Geração, um momento de cada vez.</p>';
    h+='<div class="actions no-print"><button type="button" class="ghost" data-act="linha-fechar">Voltar ao futuro</button><button type="button" class="ghost" data-act="tl-print">Guardar em PDF</button></div>';
    h+='<h2 class="no-print">Adicionar momento</h2><div class="card no-print"><div class="grid2">';
    h+='<label class="field"><span>Data</span><input id="tlData" type="date" value="'+ymd(today())+'"></label>';
    h+='<label class="field"><span>Título</span><input id="tlTitulo" maxlength="80" placeholder="Ex.: quitei o acordo"></label>';
    h+='<label class="field full"><span>Texto curto</span><input id="tlTexto" maxlength="280" placeholder="Uma frase basta"></label>';
    h+='<label class="field"><span>Foto (opcional)</span><input id="tlFoto" type="file" accept="image/*"></label>';
    h+='</div><div class="actions"><button type="button" class="main" data-act="tl-add">Adicionar momento</button></div></div>';
    if(!ev.length) return h+'<p class="empty">A linha começa no primeiro sábado. Check-in, marco ou um momento seu aparecem aqui.</p>';
    var ano='';
    h+='<div class="tl">';
    ev.forEach(function(e){
      var y=String(e.data).slice(0,4);
      if(y!==ano){ ano=y; h+='<h2 class="tl-ano">'+esc(y)+'</h2>'; }
      var quando=parse(e.data).toLocaleDateString('pt-BR',{day:'numeric',month:'long'});
      h+='<article class="tl-item'+(e.selo?' is-major':'')+'">';
      if(e.selo) h+=seloMarca();
      h+='<p class="tl-data">'+esc(quando)+'</p><h3>'+esc(e.titulo)+'</h3>';
      if(e.texto) h+='<p>'+esc(e.texto)+'</p>';
      if(e.foto) h+='<img class="tl-foto" src="/api/imagem?path='+encodeURIComponent(e.foto)+'" alt="">';
      if(e.manual){
        var del=pendingDel==='t:'+e.id;
        h+='<button type="button" class="mini no-print'+(del?' warn':'')+'" data-act="tl-del" data-tl="'+esc(e.id)+'">'+(del?'Confirmar':'Apagar')+'</button>';
      }
      h+='</article>';
    });
    return h+'</div>';
  }
  function anoDe(anos){
    if(anos==null||!isFinite(anos)) return null;
    return new Date(today().getFullYear(), today().getMonth()+Math.round(Math.max(0,anos)*12), 1).getFullYear();
  }
  function fraseAnos(h,c){
    if(h==null&&c==null) return 'Sem data enquanto o aporte estiver em zero.';
    if(h==null) return 'Hoje: sem data · Com o cenário: '+c;
    if(c==null) return 'Hoje: '+h+' · Com o cenário: sem data';
    var d=h-c;
    var lado=d>0?(d+' '+(d===1?'ano antes':'anos antes')):d<0?((-d)+' '+(-d===1?'ano depois':'anos depois')):'no mesmo ano';
    return 'Hoje: '+h+' · Com o cenário: '+c+' · '+lado;
  }
  function seValores(){
    var extra=view.seExtra||0;
    var aporte=view.seAporte==null?livre():view.seAporte;
    var taxa=view.seTaxa==null?S.cfg.taxa:view.seTaxa;
    return {extra:extra, aporte:aporte, taxa:taxa, hoje:livre(), taxaHoje:S.cfg.taxa};
  }
  function sePainelHtml(){
    var v=seValores(), patr=patrimonio(), idade=S.cfg.idade;
    var pHoje=v.hoje, pCena=v.aporte+v.extra;
    function bloco(nome, saldo, meta){
      var a=nper(pHoje,saldo,meta), b=nper(pCena,saldo,meta,v.taxa);
      var ih=a==null?null:Math.round(idade+Math.max(0,a)), ic=b==null?null:Math.round(idade+Math.max(0,b));
      var ida=(ih==null||ic==null)?'':('Aos '+ih+' anos hoje. No cenário, aos '+ic+' anos.');
      return '<div class="se-cmp"><span>'+nome+'</span><p>'+fraseAnos(anoDe(a),anoDe(b))+'</p>'+(ida?'<small>'+ida+'</small>':'')+'</div>';
    }
    var h=bloco('Primeiro milhão', patr, S.cfg.metaMilhao);
    h+=bloco('Apartamento', S.saldos.apto, S.cfg.aptoMeta);
    h+=bloco('Carro dos sonhos', S.saldos.carro, S.cfg.carroMeta);
    function rico(meses,rotulo){
      var a=fv(pHoje,meses,patr), b=fv(pCena,meses,patr,v.taxa);
      return '<div class="se-cmp"><span>'+rotulo+'</span><p>Hoje: '+money(a)+' · Com o cenário: '+money(b)+'</p></div>';
    }
    h+=rico(120,'Patrimônio em 10 anos');
    h+=rico(240,'Patrimônio em 20 anos');
    return h;
  }
  function seHtml(){
    var v=seValores();
    var maxAp=Math.max(30000, Math.ceil(livre()/100)*100);
    var taxaPct=Math.min(8, Math.max(2, Math.round((v.taxa*100)*10)/10));
    var h='<h2>E se…</h2><p class="sub">Direção, não promessa. Nada fica salvo até você tocar em Salvar cenário.</p>';
    h+='<div class="card se">';
    h+='<label class="field" for="seExtra"><span>Renda extra dos negócios por mês <b class="num" id="seExtraV">'+money(v.extra)+'</b></span>';
    h+='<input id="seExtra" type="range" min="0" max="30000" step="100" value="'+v.extra+'" aria-valuemin="0" aria-valuemax="30000" aria-valuenow="'+v.extra+'"></label>';
    h+='<label class="field" for="seAporte"><span>Aporte do salário por mês <b class="num" id="seAporteV">'+money(v.aporte)+'</b></span>';
    h+='<input id="seAporte" type="range" min="0" max="'+maxAp+'" step="100" value="'+Math.min(maxAp,v.aporte)+'" aria-valuemin="0" aria-valuemax="'+maxAp+'" aria-valuenow="'+v.aporte+'"></label>';
    h+='<label class="field" for="seTaxa"><span>Rendimento real ao ano <b class="num" id="seTaxaV">'+String(taxaPct).replace(".",",")+'%</b></span>';
    h+='<input id="seTaxa" type="range" min="2" max="8" step="0.1" value="'+taxaPct+'" aria-valuemin="2" aria-valuemax="8" aria-valuenow="'+taxaPct+'"></label>';
    h+='<div id="sePainel">'+sePainelHtml()+'</div>';
    h+='<div class="actions"><button type="button" class="main" data-act="se-salvar">Salvar cenário</button></div></div>';
    var lista=S.cenarios||[];
    if(lista.length){
      h+='<div class="card" style="margin-top:10px"><h3>Cenários salvos</h3>';
      lista.slice().reverse().slice(0,6).forEach(function(c){
        h+='<p class="note">'+esc(c.data?parse(c.data).toLocaleDateString('pt-BR'):'')+' · extra '+money(c.extra)+' · aporte '+money(c.aporte)+' · '+String(Math.round((c.taxa||0)*1000)/10).replace(".",",")+'% ao ano</p>';
      });
      h+='</div>';
    }
    return h;
  }

  function livroCard(b){
    var del=pendingDel==='l:'+b.id;
    var h='<article class="card est-book"><div class="row"><div><h3>'+esc(b.titulo)+'</h3><p class="note" style="margin:0">'+esc(b.autor||'')+'</p></div>';
    h+='<button type="button" class="mini'+(del?' warn':'')+'" data-act="livro-del" data-livro="'+esc(b.id)+'">'+(del?'Confirmar':'Remover')+'</button></div>';
    h+='<div class="seg" role="group" aria-label="Situação de '+esc(b.titulo)+'">';
    [['quero ler','Quero ler'],['lendo','Lendo'],['lido','Lido']].forEach(function(s){
      h+='<button type="button" data-act="livro-status" data-livro="'+esc(b.id)+'" data-st="'+s[0]+'" aria-pressed="'+((b.status||'quero ler')===s[0])+'">'+s[1]+'</button>';
    });
    h+='</div><div class="grid2" style="margin-top:12px">';
    h+='<label class="field"><span>Começou</span><input type="date" data-livro="'+esc(b.id)+'" data-lf="inicio" value="'+esc(b.inicio||'')+'"></label>';
    h+='<label class="field"><span>Terminou</span><input type="date" data-livro="'+esc(b.id)+'" data-lf="fim" value="'+esc(b.fim||'')+'"></label>';
    h+='<label class="field full"><span>Uma ideia que vou aplicar</span><input data-livro="'+esc(b.id)+'" data-lf="ideia" maxlength="280" value="'+esc(b.ideia||'')+'" placeholder="Uma frase"></label>';
    h+='</div></article>';
    return h;
  }
  function tEstante(){
    var h='<h1>Estante</h1><p class="sub">O que você lê entra na fundação quando vira uma ideia aplicada.</p>';
    h+='<div class="actions"><button type="button" class="ghost" data-act="estante-fechar">Voltar ao futuro</button></div>';
    h+='<h2>Novo livro</h2><div class="card"><div class="grid2">';
    h+='<label class="field"><span>Título</span><input id="lvTitulo" maxlength="120"></label>';
    h+='<label class="field"><span>Autor</span><input id="lvAutor" maxlength="80"></label>';
    h+='</div><div class="actions"><button type="button" class="main" data-act="livro-add">Adicionar à estante</button></div></div>';
    var lista=livrosLista(), ordem=['lendo','quero ler','lido'], rotulo={lendo:'Lendo','quero ler':'Quero ler',lido:'Lidos'};
    if(!lista.length) h+='<p class="empty">A estante está vazia. Adicione um título quando quiser voltar a ler com o portal.</p>';
    ordem.forEach(function(st){
      var grupo=lista.filter(function(b){return (b.status||'quero ler')===st});
      if(!grupo.length) return;
      h+='<h2>'+rotulo[st]+'</h2>';
      grupo.forEach(function(b){ h+=livroCard(b); });
    });
    h+='<p class="note">Marcado como lido, com uma ideia preenchida, o livro aparece na linha do tempo e conta para o marco Leitor de Primeira Geração.</p>';
    return h;
  }
  function tFuturo(){
    if(view.estante) return tEstante();
    if(view.linha) return tLinha();
    var C=S.cfg, L=livre(), f=fase(), patr=patrimonio();
    var h='<h1>Futuro</h1><p class="sub">'+f[0]+'. Valores em reais de hoje, rendendo '+(C.taxa*100).toFixed(0)+'% ao ano acima da inflação. Direção, não promessa.</p>';
    h+='<div class="actions"><button type="button" class="ghost" data-act="linha-abrir">Linha do tempo</button><button type="button" class="ghost" data-act="estante-abrir">Estante</button></div>';
    h+='<h2>As 3 fases</h2>'+predioHtml();
    h+='<h2>Sonhos</h2><div class="grid2">';
    [['Apartamento',S.saldos.apto,C.aptoMeta],['Carro dos sonhos',S.saldos.carro,C.carroMeta]].forEach(function(x){var a=nper(L,x[1],x[2]);
      h+=goal(x[0],x[1],x[2],'var(--plum)').replace('<!--g--></div>','<small class="num">'+(a===null?'':'~'+a.toFixed(1).replace('.',',')+' anos com '+money(L)+'/mês')+'</small><!--g--></div>')});
    h+='</div><p class="note">Ordem: apartamento primeiro. Carro quando '+money(C.carroMeta)+' for no máximo ~10% do patrimônio (≈ '+money(C.carroMeta/0.1)+' investidos).</p>';
    var sc=[['Só o salário',0,'var(--muted)'],['+R$ 5 mil dos negócios',5000,'var(--blue)'],['+R$ 10 mil',10000,'var(--green)'],['+R$ 20 mil',20000,'var(--plum)']];
    var meta=C.metaMilhao;
    h+='<h2>Rumo ao primeiro milhão</h2><div class="grid3"><div class="stat hl"><span>No ritmo atual</span><b class="num">'+(nper(L,patr,meta)||0).toFixed(1).replace('.',',')+' anos</b><span>aos '+Math.round(C.idade+(nper(L,patr,meta)||0))+' anos</span></div>';
    var need=meta*rm()/(Math.pow(1+rm(),48)-1);
    h+='<div class="stat"><span>Para chegar em 4 anos</span><b class="num">'+money(need)+'</b><span>por mês investido</span></div><div class="stat"><span>Falta dos negócios</span><b class="num">'+money(Math.max(0,need-L))+'</b><span>por mês</span></div></div>';
    h+='<div class="card tw" style="margin-top:10px"><table><thead><tr><th>Cenário</th><th class="v">Por mês</th><th class="v">Milhão em</th><th class="v">Em 10 anos</th><th class="v">Em 20 anos</th></tr></thead><tbody>';
    sc.forEach(function(x){var p=L+x[1], a=nper(p,patr,meta); h+='<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:'+x[2]+';margin-right:6px"></i>'+x[0]+'</td><td class="v">'+money(p)+'</td><td class="v">'+(a===null?'—':a.toFixed(1).replace('.',',')+' anos')+'</td><td class="v">'+compact.format(fv(p,120,patr))+'</td><td class="v">'+compact.format(fv(p,240,patr))+'</td></tr>'});
    h+='</tbody></table></div>';
    var labels=[],series=sc.map(function(x){return {c:x[2],v:[]}}); series.push({c:'var(--amber)',v:[],dash:true});
    for(var y=0;y<=30;y++){labels.push(y%5===0?String(y):''); sc.forEach(function(x,i){series[i].v.push(fv(L+x[1],y*12,patr))}); series[4].v.push(meta)}
    h+='<div class="card chart'+(chartOnce()?' chart-in':'')+'" style="margin-top:10px">'+lineChart(series,labels,250)+'<div class="legend">'+sc.map(function(x){return '<span><i style="background:'+x[2]+'"></i>'+x[0]+'</span>'}).join('')+'<span><i style="background:var(--amber)"></i>Meta</span><span>eixo: anos</span></div></div>';
    h+=seHtml();
    h+='<h2>Manutenção</h2><div class="card"><div class="list">';
    [['Todo sábado','Cascata + check-in'],['Segunda ou terça','Comprar a ARCA'],['Trimestral (jan, abr, jul, out)','Checagem rápida'],['Anual (março, com o IR)','Revisar metas e ativos'],['Vender para rebalancear','Só fora de 15%–35% por ~6 meses']].forEach(function(x){h+='<div class="row" style="padding:8px 0;border-bottom:1px dashed var(--line)"><span>'+x[0]+'</span><small style="text-align:right">'+x[1]+'</small></div>'});
    h+='</div></div>';
    return h;
  }

  function celExcel(v){
    if(typeof v==='number'&&isFinite(v)) return '<Cell><Data ss:Type="Number">'+v+'</Data></Cell>';
    return '<Cell><Data ss:Type="String">'+esc(v==null?'':v)+'</Data></Cell>';
  }
  function linhaExcel(vals){return '<Row>'+vals.map(celExcel).join('')+'</Row>'}
  function abaExcel(nome,linhas){
    var nomeAba=String(nome).replace(/[\\/*?:\[\]]/g,'').slice(0,31);
    return '<Worksheet ss:Name="'+esc(nomeAba)+'"><Table>'+linhas.map(linhaExcel).join('')+'</Table></Worksheet>';
  }
  function exportarExcel(){
    var f=fase(), st=streaks(), abas=[];
    abas.push(abaExcel('Resumo',[
      ['Campo','Valor'],
      ['Gerado em', ymd(today())],
      ['Fase', f[0]],
      ['Detalhe', f[1]],
      ['Patrimônio', patrimonio()],
      ['Reserva', S.saldos.reserva],
      ['Lance', S.saldos.lance],
      ['Apartamento', S.saldos.apto],
      ['Carro', S.saldos.carro],
      ['ARCA investida', arcaTotal()],
      ['ARCA a investir', S.saldos.arcaInvestir],
      ['Dividendos', S.saldos.dividendos],
      ['Sequência atual', st.atual],
      ['Melhor sequência', st.melhor],
      ['Check-ins', st.total],
      ['Sobra do mês', livre()]
    ]));
    abas.push(abaExcel('Plano',[
      ['Campo','Valor'],
      ['Entrada por mês', S.cfg.entrada],
      ['Consórcio', S.cfg.consorcio],
      ['Lance por mês', S.cfg.lanceMensal],
      ['Meta do lance', S.cfg.lanceMeta],
      ['Meta da reserva', S.cfg.reservaMeta],
      ['Percentual da reserva', S.cfg.pctReserva],
      ['Rendimento real ao ano', S.cfg.taxa],
      ['Idade', S.cfg.idade],
      ['Meta de patrimônio', S.cfg.metaMilhao],
      ['Meta do apartamento', S.cfg.aptoMeta],
      ['Meta do carro', S.cfg.carroMeta],
      ['Dólar líquido', S.cfg.cambio],
      ['Renda líquida', S.cfg.rendaLiquida===''||S.cfg.rendaLiquida==null?'':num(S.cfg.rendaLiquida)],
      ['Horas por mês', S.cfg.horasMes===''||S.cfg.horasMes==null?'':num(S.cfg.horasMes)]
    ]));
    var acordos=[['Credor','Parcela','Primeira parcela','Parcelas']];
    (S.acordos||[]).forEach(function(a){acordos.push([a.nome,num(a.valor),a.inicio,num(a.n)])});
    abas.push(abaExcel('Acordos',acordos));
    var checks=[['Sábado','Mexeu','Motivo','Gastos','Fora do normal','Negócios','Extra','Origem do extra','Vitória','Quase escorreguei']];
    Object.keys(S.checkins||{}).sort().forEach(function(k){
      var c=S.checkins[k]||{};
      checks.push([k,c.mexeu||'',c.motivo||'',c.gastos===''||c.gastos==null?'':num(c.gastos),c.foraNormal||'',c.negocios||'',c.extra===''||c.extra==null?'':num(c.extra),c.extraOrigem||'',c.vitoria||'',c.escorreguei||'']);
    });
    abas.push(abaExcel('Check-ins',checks));
    var aportes=[['Sábado','Recebido','Consórcio','Acordos','Lance','Reserva','ARCA']];
    Object.keys(S.aportes||{}).sort().forEach(function(k){
      var a=S.aportes[k]||{};
      aportes.push([k,num(a.recebido),num(a.consorcio),num(a.acordos),num(a.lance),num(a.reserva),num(a.arca)]);
    });
    abas.push(abaExcel('Sábados',aportes));
    var negs=[['Negócio','Investido','Retorno','Saldo']];
    (S.negocios||[]).forEach(function(n){var s=negStats(n); negs.push([n,s.inv,s.ret,s.saldo])});
    abas.push(abaExcel('Negócios',negs));
    var movs=[['Data','Negócio','Tipo','Valor','Nota']];
    (S.movs||[]).slice().sort(function(a,b){return a.data<b.data?-1:1}).forEach(function(m){
      movs.push([m.data,m.neg,m.tipo==='inv'?'Investi':'Retornou',num(m.valor),m.nota||'']);
    });
    abas.push(abaExcel('Movimentos',movs));
    var sonhos=[['Sonho','Caixinha','Saldo','Meta','Quando']];
    sonhosLista().forEach(function(c){sonhos.push([c.nome,c.metaRef,c.saldo,c.meta,quandoSonho(c.pmt,c.saldo,c.meta)])});
    abas.push(abaExcel('Sonhos',sonhos));
    var escolhas=[['Data','Valor','Descrição','Caixinha']];
    (S.escolhas||[]).forEach(function(e){escolhas.push([e.data,num(e.valor),e.descricao||'',e.caixinha||''])});
    abas.push(abaExcel('Escolhas',escolhas));
    var ativos=[['Ativo','Classe','Tipo','Letra','Nome','Quantidade','Preço médio','Cotação','Valor']];
    (S.ativos||[]).forEach(function(a){classificarAtivo(a); var info=infoTipo(a.classe,a.tipo); ativos.push([a.t,info.classe,info.tipo,a.l||'',a.nome,num(a.qtd),num(a.pm),num(a.preco),Math.round(num(a.qtd)*num(a.preco)*100)/100])});
    abas.push(abaExcel('Mercado',ativos));
    var livros=[['Título','Autor','Situação','Começou','Terminou','Ideia']];
    livrosLista().forEach(function(b){livros.push([b.titulo,b.autor||'',b.status||'',b.inicio||'',b.fim||'',b.ideia||''])});
    abas.push(abaExcel('Estante',livros));
    var linha=[['Data','Título','Texto']];
    linhaEventos().slice().sort(function(a,b){return a.data<b.data?-1:1}).forEach(function(e){linha.push([e.data,e.titulo,e.texto||''])});
    abas.push(abaExcel('Linha do tempo',linha));
    var xml='<?xml version="1.0" encoding="UTF-8"?>'
      +'<?mso-application progid="Excel.Sheet"?>'
      +'<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
      +abas.join('')+'</Workbook>';
    var arquivo=new Blob([xml],{type:'application/vnd.ms-excel'});
    var link=URL.createObjectURL(arquivo), baixar=document.createElement('a');
    baixar.href=link; baixar.download='portal-'+ymd(today())+'.xls'; baixar.click();
    setTimeout(function(){URL.revokeObjectURL(link)},1000);
    flash('Excel baixado');
  }
  function tAjustes(){
    if(view.memTela) return tMemoria();
    var C=S.cfg, h='<h1>Ajustes</h1><p class="sub">Os números que movem o portal inteiro.</p>';
    var dinheiroCfg={entrada:1,consorcio:1,lanceMensal:1,lanceMeta:1,reservaMeta:1,metaMilhao:1,aptoMeta:1,carroMeta:1,cambio:1};
    var qtdCfg={idade:1};
    var F=[['entrada','Entrada por mês (R$)'],['consorcio','Parcela do consórcio'],['lanceMensal','Lance por mês'],['lanceMeta','Meta do lance'],['reservaMeta','Meta da reserva (6 meses de custo)'],['pctReserva','% da sobra para a Reserva (0 a 1)'],['taxa','Rendimento real ao ano (0,05 = 5%)'],['idade','Sua idade'],['metaMilhao','Meta de patrimônio'],['aptoMeta','Meta do apartamento'],['carroMeta','Meta do carro'],['cambio','Dólar líquido (R$)']];
    h+='<h2>Plano</h2><div class="grid2">';
    F.forEach(function(f){
      var mostrado=dinheiroCfg[f[0]]?textoDinheiro(C[f[0]]):qtdCfg[f[0]]?textoQtd(C[f[0]]):num(C[f[0]]).toLocaleString('pt-BR',{maximumFractionDigits:4});
      h+='<label class="field"><span>'+f[1]+'</span><input data-cfg="'+f[0]+'" inputmode="decimal" value="'+esc(mostrado)+'"></label>';
    });
    h+='</div>';
    h+='<h2>Trabalho</h2><div class="grid2">';
    h+='<label class="field"><span>Renda líquida por mês (R$)</span><input data-cfg="rendaLiquida" inputmode="decimal" value="'+esc(C.rendaLiquida===''||C.rendaLiquida==null?'':textoDinheiro(C.rendaLiquida))+'" placeholder="Usada na calculadora do desejo"></label>';
    h+='<label class="field"><span>Horas trabalhadas por mês</span><input data-cfg="horasMes" inputmode="decimal" value="'+esc(C.horasMes===''||C.horasMes==null?'':textoQtd(C.horasMes))+'" placeholder="Usada na calculadora do desejo"></label>';
    h+='</div>';
    if(C.cambio>0) h+='<p class="note">Com o dólar líquido de '+money(C.cambio)+', a entrada de '+money(C.entrada)+' equivale a cerca de US$ '+Math.round(C.entrada/C.cambio).toLocaleString('pt-BR')+' por mês. A cascata segue em reais.</p>';
    if(!(C.reservaMeta>0)) h+='<p class="alert">A meta da reserva ainda está em zero. Os check-ins vão mostrar o seu custo de vida real; a aba Check-in calcula uma sugestão.</p>';
    h+='<h2>Sabedoria da semana</h2><p class="note">Um versículo curto no Início, estável de sábado a sábado.</p><div class="actions"><button type="button" class="ghost" data-act="sab-toggle" aria-pressed="'+(S.cfg.esconderSabedoria?'true':'false')+'">'+(S.cfg.esconderSabedoria?'Mostrar o versículo no Início':'Ocultar o versículo no Início')+'</button></div>';
    h+='<h2>Aparência</h2><div class="seg" style="max-width:420px"><button type="button" data-tema="sistema" aria-pressed="'+((S.tema||'sistema')==='sistema')+'">Sistema</button><button type="button" data-tema="light" aria-pressed="'+(S.tema==='light')+'">Claro</button><button type="button" data-tema="dark" aria-pressed="'+(S.tema==='dark')+'">Escuro</button></div>';
    h+='<h2>Acordos</h2><div class="card tw"><table><thead><tr><th>Credor</th><th class="v">Parcela</th><th>1ª parcela (mês)</th><th class="v">Parcelas</th><th></th></tr></thead><tbody>';
    S.acordos.forEach(function(a,i){var del=pendingDel==='a:'+i;
      h+='<tr><td><input data-ac="'+i+'" data-f="nome" value="'+esc(a.nome)+'"></td><td><input data-ac="'+i+'" data-f="valor" inputmode="decimal" value="'+esc(textoDinheiro(a.valor))+'"></td><td><input data-ac="'+i+'" data-f="inicio" type="month" value="'+esc(a.inicio)+'"></td><td><input data-ac="'+i+'" data-f="n" inputmode="decimal" value="'+esc(textoQtd(a.n))+'"></td><td><button class="mini'+(del?' warn':'')+'" data-dela="'+i+'">'+(del?'Confirmar':'×')+'</button></td></tr>'});
    h+='</tbody></table><div class="actions"><button class="ghost" data-act="addac">Adicionar acordo</button></div></div>';
    h+='<h2>Saldos das caixinhas</h2><div class="grid3">';
    [['reserva','Reserva'],['lance','Lance'],['apto','Apartamento'],['carro','Carro'],['arcaInvestir','ARCA – a investir']].forEach(function(x){h+='<label class="field"><span>'+x[1]+'</span><input data-saldo="'+x[0]+'" inputmode="decimal" value="'+esc(textoDinheiro(S.saldos[x[0]]))+'"></label>'});
    h+='</div><p class="note">Use para corrigir quando o valor do app for diferente do portal.</p>';
    h+='<h2>Avisos no celular</h2><p class="note">No iPhone, o aviso só chega depois de Adicionar à tela de início. No máximo 3 por semana, de manhã até antes da noite, no fuso de Nova York. Sem alerta de cotação.</p>';
    var AV=S.avisos||{sabado:false,arca:false,contas:false,nudge:false,revisao:false};
    [['sabado','Sábado de manhã'],['arca','Segunda, se a ARCA – a investir tiver dinheiro'],['contas','Conta que vence amanhã'],['nudge','Dois sábados sem check-in'],['revisao','Checagem trimestral e do ano']].forEach(function(x){
      h+='<div class="actions"><button type="button" class="aviso" data-act="aviso-toggle" data-tipo="'+x[0]+'" aria-pressed="'+(AV[x[0]]?'true':'false')+'">'+esc(x[1])+' · '+(AV[x[0]]?'Ligado':'Desligado')+'</button></div>';
    });
    h+='<div class="actions"><button type="button" class="main" data-act="push-ativar">Ativar neste aparelho</button><button type="button" class="ghost" data-act="push-parar">Desativar neste aparelho</button></div>';
    h+=blocoUso();
    h+='<h2>Memória do Lastro</h2><p class="note">O que ele pode lembrar. Você vê, edita e apaga.</p><div class="actions"><button type="button" class="ghost" data-act="mem-abrir">Abrir a memória</button></div>';
    h+='<h2>Backup</h2><div class="card"><p style="margin:0">Seus dados ficam '+ondeDados()+'. Baixe uma cópia de vez em quando.</p><div class="actions"><button class="ghost" data-act="export">Baixar backup (.json)</button><button class="ghost" data-act="excel">Exportar Excel</button><label class="ghost" style="border:1px solid var(--line);border-radius:10px;padding:10px 14px;cursor:pointer">Restaurar backup<input type="file" id="impFile" accept="application/json" style="display:none"></label><a class="ghost" href="/api/logout" style="border:1px solid var(--line);border-radius:10px;padding:10px 14px;color:var(--ink);text-decoration:none">Sair</a></div></div>';
    return h;
  }


  function classesAtivos(){
    return [
      {id:'rv', nome:'Renda variável', tipos:[
        {id:'acao', nome:'Ações'},
        {id:'unit', nome:'Units'},
        {id:'fii', nome:'Fundos imobiliários'},
        {id:'etf', nome:'ETFs'},
        {id:'bdr', nome:'BDRs'},
        {id:'fiagro', nome:'FIAGRO'},
        {id:'fi-infra', nome:'FI-Infra'},
        {id:'opcao', nome:'Opções'}
      ]},
      {id:'rf', nome:'Renda fixa', tipos:[
        {id:'tesouro', nome:'Tesouro Direto'},
        {id:'cdb', nome:'CDB'},
        {id:'lci', nome:'LCI'},
        {id:'lca', nome:'LCA'},
        {id:'lc', nome:'LC'},
        {id:'debenture', nome:'Debêntures'},
        {id:'cri', nome:'CRI'},
        {id:'cra', nome:'CRA'}
      ]},
      {id:'fundos', nome:'Fundos de investimento', tipos:[
        {id:'fundo-acao', nome:'Ações'},
        {id:'fundo-rf', nome:'Renda fixa'},
        {id:'fundo-multi', nome:'Multimercado'},
        {id:'fundo-cambial', nome:'Cambial'},
        {id:'fip', nome:'FIP'},
        {id:'fidc', nome:'FIDC'}
      ]},
      {id:'prev', nome:'Previdência', tipos:[
        {id:'pgbl', nome:'PGBL'},
        {id:'vgbl', nome:'VGBL'}
      ]},
      {id:'outros', nome:'Outros', tipos:[
        {id:'coe', nome:'COE'},
        {id:'outro', nome:'Outro'}
      ]}
    ];
  }
  function infoTipo(classe, tipo){
    var c=classesAtivos().filter(function(x){return x.id===classe})[0];
    if(!c) return {classe:'Outros', tipo:'Outro', cid:'outros', tid:'outro'};
    var t=c.tipos.filter(function(x){return x.id===tipo})[0];
    if(!t) return {classe:c.nome, tipo:'Outro', cid:c.id, tid:'outro'};
    return {classe:c.nome, tipo:t.nome, cid:c.id, tid:t.id};
  }
  function classificarAtivo(a){
    if(!a||typeof a!=='object') return;
    if(a.classe&&a.tipo&&infoTipo(a.classe,a.tipo).tid===a.tipo&&infoTipo(a.classe,a.tipo).cid===a.classe) return;
    var t=String(a.t||'').toUpperCase();
    if(t==='BOVA11'||t==='BOVX11'||t==='IVVB11'||t==='SMAL11'||t==='HASH11'){ a.classe='rv'; a.tipo='etf'; return }
    if(FIIS.indexOf(t)>=0||a.l==='R'){ a.classe='rv'; a.tipo='fii'; return }
    if(a.l==='C'||/tesouro/i.test(t)||/tesouro/i.test(a.nome||'')){ a.classe='rf'; a.tipo='tesouro'; return }
    if(a.l==='I'){ a.classe='rv'; a.tipo='etf'; return }
    if(a.l==='A'){ a.classe='rv'; a.tipo='acao'; return }
    a.classe='outros'; a.tipo='outro';
  }
  function htmlTipos(classeId){
    var c=classesAtivos().filter(function(x){return x.id===classeId})[0]||classesAtivos()[0];
    return c.tipos.map(function(t){return '<option value="'+t.id+'">'+esc(t.nome)+'</option>'}).join('');
  }
  function opcoesAtivos(){
    var h='', usados={};
    classesAtivos().forEach(function(c){
      c.tipos.forEach(function(tp){
        var lista=[];
        S.ativos.forEach(function(a,i){
          classificarAtivo(a);
          if(a.classe===c.id&&a.tipo===tp.id){ lista.push(i); usados[i]=1 }
        });
        if(!lista.length) return;
        h+='<optgroup label="'+esc(c.nome+' · '+tp.nome)+'">';
        lista.forEach(function(i){ h+='<option value="'+i+'">'+esc(S.ativos[i].t)+'</option>' });
        h+='</optgroup>';
      });
    });
    var resto=[];
    S.ativos.forEach(function(a,i){ if(!usados[i]) resto.push(i) });
    if(resto.length){
      h+='<optgroup label="Outros">';
      resto.forEach(function(i){ h+='<option value="'+i+'">'+esc(S.ativos[i].t)+'</option>' });
      h+='</optgroup>';
    }
    return h;
  }
  function atStats(a){var v=a.qtd*a.preco, c=a.qtd*a.pm; var h=a.hist||[]; var ch=h.length>=2&&h[h.length-2].p>0?(h[h.length-1].p/h[h.length-2].p-1)*100:null;
    return {valor:v,custo:c,rent:c>0?(v/c-1)*100:null,var:ch,data:h.length?h[h.length-1].d:null}}
  function linhaAtivo(a,i){
    var x=atStats(a);
    var onde=a.l?('Letra '+a.l):'Fora da ARCA';
    var tirar=a.livre&&!(a.qtd>0);
    var del=pendingDel==='at:'+i;
    var qtd=a.qtd%1?a.qtd.toFixed(2):a.qtd;
    var rent=x.rent==null?'':(x.rent>=0?'+':'')+x.rent.toFixed(1).replace('.',',')+'%';
    var h='<div class="li"><div><b>'+esc(a.t)+'</b><small>'+esc(a.nome||'')+' · '+esc(onde)+'</small>';
    h+='<small>'+qtd+' · médio '+money(a.pm)+(rent?' · '+rent:'')+'</small>'+sparkHtml(a);
    h+='<label class="field"><span>Cotação</span><input data-preco="'+i+'" inputmode="decimal" value="'+(a.preco?textoDinheiro(a.preco):'')+'" placeholder="0,00" aria-label="Cotação de '+esc(a.t)+'"></label>';
    if(tirar) h+='<button type="button" class="mini'+(del?' warn':'')+'" data-act="ativo-tirar" data-i="'+i+'">'+(del?'Confirmar':'Tirar')+'</button>';
    h+='</div><div class="v num">'+money(x.valor)+'</div></div>';
    return h;
  }
  var BOLSA_TIPOS=[['acao','Ações'],['unit','Units'],['fii','Fundos imobiliários'],['etf','ETFs'],['bdr','BDRs'],['fiagro','FIAGRO'],['fi-infra','FI-Infra'],['fip','FIP'],['fidc','FIDC']];
  function htmlBolsaLista(){
    var itens=view.bolsaItens||[];
    var h='';
    if(view.bolsaMsg) h+='<p class="note">'+esc(view.bolsaMsg)+'</p>';
    if(view.bolsaTotal&&itens.length) h+='<p class="note">'+itens.length+' de '+view.bolsaTotal+'</p>';
    if(itens.length){
      h+='<div class="list bolsa-lista">';
      itens.forEach(function(it,i){
        var ja=S.ativos.some(function(a){ return String(a.t).toUpperCase()===it.t });
        h+='<div class="li"><div><b>'+esc(it.t)+'</b><small>'+esc(it.tipoNome)+' · '+esc(it.nome)+'</small></div>';
        h+=ja?'<span class="pill">No painel</span>':'<button type="button" class="mini" data-act="bolsa-add" data-i="'+i+'">Incluir</button>';
        h+='</div>';
      });
      h+='</div>';
      if(view.bolsaMais) h+='<div class="actions"><button type="button" class="ghost" data-act="bolsa-mais">Mostrar mais</button></div>';
    }
    return h;
  }
  function carregarBolsa(append){
    var seq=++carregarBolsa.n;
    var q=String(view.bolsaQ||'').trim();
    var tipo=view.bolsaTipo||'';
    if(q.length>0&&q.length<2&&!tipo){
      view.bolsaItens=[]; view.bolsaMais=false; view.bolsaTotal=0; view.bolsaMsg='Digite pelo menos 2 letras.'; pintarBolsa(); return;
    }
    if(q.length<2&&!tipo){
      view.bolsaItens=[]; view.bolsaMais=false; view.bolsaTotal=0; view.bolsaMsg='Busque pelo código ou pelo nome, ou escolha um tipo. A lista é a bolsa inteira.'; pintarBolsa(); return;
    }
    if(!append) view.bolsaPage=1;
    view.bolsaMsg=append?'':'Buscando…';
    if(!append) pintarBolsa();
    var page=view.bolsaPage||1;
    fetch('/api/bolsa?q='+encodeURIComponent(q.length>=2?q:'')+'&tipo='+encodeURIComponent(tipo)+'&page='+page)
      .then(function(r){ if(r.status===401){ location.href='/login'; throw 0 } return r.json() })
      .then(function(j){
        if(seq!==carregarBolsa.n) return;
        var novos=j.itens||[];
        view.bolsaItens=append?(view.bolsaItens||[]).concat(novos):novos;
        view.bolsaMais=!!j.hasNext;
        view.bolsaTotal=j.total||view.bolsaItens.length;
        view.bolsaMsg=j.error?j.error:(view.bolsaItens.length?'':'Nenhum ativo com esse filtro.');
        pintarBolsa();
      })
      .catch(function(e){ if(e!==0&&seq===carregarBolsa.n){ view.bolsaMsg='Não foi possível consultar a bolsa.'; pintarBolsa() } });
  }
  carregarBolsa.n=0;
  function pintarBolsa(){
    var el=document.getElementById('bolsaLista');
    if(el) el.innerHTML=htmlBolsaLista();
  }
  function tMercado(){
    S.ativos.forEach(classificarAtivo);
    var tv=0,tc=0; S.ativos.forEach(function(a){var x=atStats(a);tv+=x.valor;tc+=x.custo});
    var h=sangueHtml()+'<h1>Mercado</h1><p class="sub">A bolsa inteira está aqui. Busque ou escolha o tipo.</p>';
    h+='<div class="card" style="margin-top:16px"><div class="chips bolsa-tipos">'+BOLSA_TIPOS.map(function(t){ return '<button type="button" data-bolsa="'+t[0]+'" aria-pressed="'+(view.bolsaTipo===t[0])+'">'+esc(t[1])+'</button>' }).join('')+'</div>';
    h+='<label class="field" style="margin-top:12px"><span>Buscar na bolsa</span><input id="bolsaQ" value="'+esc(view.bolsaQ||'')+'" placeholder="Código ou nome. Ex.: PETR4, Vale, HGLG11" autocomplete="off"></label>';
    h+='<div id="bolsaLista">'+htmlBolsaLista()+'</div>';
    h+='<p class="note">Ações, units, FIIs, ETFs, BDRs, FIAGRO, FI-Infra, FIP e FIDC. Incluir não mexe nos 25% da ARCA.</p></div>';
    h+='<div class="grid3" style="margin-top:16px"><div class="stat"><span>Valor de mercado</span><b class="num">'+money(tv)+'</b></div><div class="stat"><span>Quanto você pagou</span><b class="num">'+money(tc)+'</b></div><div class="stat hl"><span>Resultado</span><b class="num '+(tv>=tc?'pos':'neg')+'">'+(tc>0?((tv/tc-1)*100).toFixed(1).replace('.',',')+'%':'—')+'</b><span>'+money(tv-tc)+'</span></div></div>';
    classesAtivos().forEach(function(c){
      var itens=[];
      S.ativos.forEach(function(a,i){ if(a.classe===c.id) itens.push({a:a,i:i}) });
      if(!itens.length) return;
      var sub=0; itens.forEach(function(x){ sub+=atStats(x.a).valor });
      var pct=tv>0?Math.round(sub/tv*1000)/10:0;
      h+='<section class="mercado-classe" aria-label="'+esc(c.nome)+'"><div class="mercado-head"><h2>'+esc(c.nome)+'</h2><b class="num">'+money(sub)+(tv>0?' · '+String(pct).replace('.',',')+'%':'')+'</b></div>';
      c.tipos.forEach(function(tp){
        var doTipo=itens.filter(function(x){ return x.a.tipo===tp.id });
        if(!doTipo.length) return;
        var st=0; doTipo.forEach(function(x){ st+=atStats(x.a).valor });
        h+='<h3>'+esc(tp.nome)+' <span class="num">'+money(st)+'</span></h3><div class="list">';
        doTipo.forEach(function(x){ h+=linhaAtivo(x.a,x.i) });
        h+='</div>';
      });
      h+='</section>';
    });
    h+='<div class="actions"><button type="button" class="ghost" data-act="merc-novo" aria-expanded="'+(view.mercNovo?'true':'false')+'">'+(view.mercNovo?'Fechar':'Fora da bolsa')+'</button><button class="ghost" data-act="quotes">Atualizar cotações</button></div>';
    if(S.ultimaCotacao) h+='<p class="note">Última atualização: '+esc(S.ultimaCotacao)+'.</p>';
    if(view.mercNovo){
      h+='<div class="card"><p style="margin:0">Tesouro, CDB, LCI e o que não tem código na B3.</p>';
      h+='<div class="grid2" style="margin-top:12px"><label class="field"><span>Classe</span><select id="nvClasse">'+classesAtivos().map(function(c){return '<option value="'+c.id+'"'+(c.id==='rf'?' selected':'')+'>'+esc(c.nome)+'</option>'}).join('')+'</select></label><label class="field"><span>Tipo</span><select id="nvTipo">'+htmlTipos('rf')+'</select></label><label class="field"><span>Código</span><input id="nvT" placeholder="Ex.: Tesouro IPCA+ 2035" autocomplete="off"></label><label class="field"><span>Nome</span><input id="nvN" placeholder="Ex.: Tesouro Direto" autocomplete="off"></label><label class="field"><span>Na ARCA</span><select id="nvL"><option value="">Fora da ARCA</option><option value="A">Letra A · Ações BR</option><option value="R">Letra R · Fundos imobiliários</option><option value="C">Letra C · Caixa</option><option value="I">Letra I · Internacional</option></select></label></div>';
      h+='<div class="actions"><button type="button" class="main" data-act="ativo-add">Incluir fora da bolsa</button></div></div>';
    }
    var opts=opcoesAtivos();
    h+='<h2>Registrar compra</h2><div class="card"><div class="grid3"><label class="field"><span>Ativo</span><select id="cpAt">'+opts+'</select></label><label class="field"><span>Quantidade</span><input id="cpQ" inputmode="decimal" placeholder="Ex.: 3"></label><label class="field"><span>Preço pago</span><input id="cpP" inputmode="decimal" placeholder="0,00"></label></div><div class="actions"><button class="main" data-act="compra">Registrar compra</button><button class="ghost" data-act="sync">Usar valores de mercado na ARCA</button></div><p class="note">"Usar valores de mercado na ARCA" troca o saldo de cada letra pelo valor das posições marcadas com A, R, C ou I. O que está fora da ARCA fica de fora dessa conta.</p></div>';
    h+='<h2>Registrar venda</h2><div class="card"><div class="grid3"><label class="field"><span>Ativo</span><select id="vdAt">'+opts+'</select></label><label class="field"><span>Quantidade</span><input id="vdQ" inputmode="decimal" placeholder="Ex.: 1"></label><label class="field"><span>Preço de venda</span><input id="vdP" inputmode="decimal" placeholder="0,00"></label></div><div class="actions"><button class="main" data-act="venda">Registrar venda</button></div><p class="note">A venda reduz a quantidade e manda o valor recebido para "ARCA – a investir". Na letra da ARCA, o saldo da letra também desce. Faz sentido vender para rebalancear quando uma letra está fora de 15%–35% há uns 6 meses.</p></div>';
    h+='<h2>Notícias</h2><div class="card"><p style="margin:0">Na aba Assistente IA, o botão "Notícias dos meus ativos" pesquisa o que aconteceu na semana com cada ativo.</p><div class="actions"><button class="ghost" data-go="assistente">Abrir o assistente</button></div></div>';
    return h;
  }

  var PERGUNTAS={
    analise:'Faça uma análise curta da situação atual da minha carteira e das caixinhas: o que está bem, o que merece atenção e qual é o próximo passo mais importante.',
    comprar:'Com o dinheiro que está na caixinha "ARCA – a investir", o que eu devo comprar agora e por quê, seguindo as regras da ARCA? Se a caixinha estiver vazia, diga o que vou comprar no próximo aporte.',
    negocios:'Olhe para os meus negócios e meus últimos check-ins. Onde devo concentrar energia para chegar mais rápido aos primeiros R$ 1.000 por mês?',
    noticias:'Pesquise na internet as notícias mais relevantes dos últimos 7 dias sobre os meus ativos (BOVA11/Ibovespa, HGLG11, XPML11, KNRI11, KNCR11, Tesouro IPCA+ e IVVB11/S&P 500) e sobre juros e câmbio no Brasil. Para cada um, uma linha: o que aconteceu e se isso muda algo no meu plano de longo prazo (quase sempre não muda). Termine lembrando a regra de não reagir a oscilações.',
    semana:'Faça um resumo da minha semana com base nos últimos check-ins: hábito, gastos, vitórias e um conselho prático para o próximo sábado.'
  };
  function tAssistente(){
    var h='<h1>Assistente IA</h1><p class="sub">Analisa a sua carteira, as caixinhas, os negócios e os check-ins com as regras do seu sistema.</p>';
    h+='<h2>Pergunte</h2><div class="chips">';
    [['analise','Analisar carteira'],['comprar','O que comprar agora'],['noticias','Notícias dos meus ativos'],['negocios','Meus negócios'],['semana','Resumo da semana']].forEach(function(x){h+='<button data-ai="'+x[0]+'"'+(aiBusy?' disabled':'')+'>'+x[1]+'</button>'});
    h+='</div><div class="card" style="margin-top:12px"><label class="field"><span>Ou escreva a sua pergunta</span><textarea id="aiQ" placeholder="Ex.: vale a pena aumentar o aporte no IVVB11 este mês?">'+esc(view.aiQ)+'</textarea></label><div class="actions"><button class="main" data-ai="livre"'+(aiBusy?' disabled aria-busy="true"':'')+'>Perguntar</button>'+(aiBusy?'<button class="ghost" data-act="aistop">Parar</button>':'')+'</div></div>';
    h+='<h2>Resposta</h2><div class="card'+(aiBusy?' is-thinking':'')+'">'+(aiBusy?'<div class="think-stones" aria-hidden="true"><i></i><i></i><i></i></div>':'')+'<div id="aiOut" class="ai-out'+((view.aiText&&!aiBusy)?' fade-in':'')+'">'+esc(view.aiText||'As respostas aparecem aqui.')+'</div>'+(view.aiNote?'<p class="note">'+esc(view.aiNote)+'</p>':'')+'</div>';
    h+=htmlPropostas();
    h+=htmlLembrar();
    h+='<p class="note">O Lastro pede os números ao portal e explica. Ele não grava nada: depósito, check-in e meta só entram quando você toca em Confirmar. "Notícias dos meus ativos" é a única pergunta que pesquisa na internet.</p>';
    return h;
  }
  function nomeMem(kind){
    return kind==='decisao'?'Decisão':kind==='preferencia'?'Preferência':'Contexto';
  }
  function dataMem(iso){
    var d=new Date(iso);
    if(isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR',{day:'numeric', month:'short', year:'numeric'});
  }
  function htmlLembrar(){
    var lista=view.memLembrar||[];
    if(!lista.length) return '';
    var h='<article class="proposta" aria-label="Lastro quer lembrar"><h3>Lastro quer lembrar:</h3>';
    lista.forEach(function(m,i){
      h+='<p><span class="mem-kind">'+esc(nomeMem(m.kind))+'</span><br>'+esc(m.text)+'</p>';
      h+='<button type="button" class="mini" data-act="mem-tirar" data-i="'+i+'">Tirar este</button>';
    });
    h+='<p class="note">Nada fica gravado até você confirmar.</p>';
    h+='<div class="actions"><button type="button" class="main" data-act="mem-confirma">Confirmar</button><button type="button" class="ghost" data-act="mem-cancela">Agora não</button></div></article>';
    return h;
  }
  function blocoUso(){
    if(!view.usoPediu) pedirUso();
    var h='<h2>Uso do Lastro este mês</h2>';
    if(!view.uso) return h+'<p class="note">Contando.</p>';
    if(view.uso.ok===false&&view.uso.motivo==='tabela') return h+'<p class="note">O uso ainda não está no banco. No Supabase, execute de novo o arquivo supabase/schema.sql.</p>';
    if(view.uso.ok===false) return h+'<p class="note">Não deu para ler o uso agora.</p>';
    if(!view.uso.respostas) return h+'<p class="note">Nenhuma resposta neste mês.</p>';
    var tokens=Number(view.uso.entrada||0)+Number(view.uso.saida||0);
    var erros=Number(view.uso.erros||0);
    h+='<p class="note">'+view.uso.respostas+(view.uso.respostas===1?' resposta':' respostas')+' · '+tokens.toLocaleString('pt-BR')+' tokens · '+(erros?erros+(erros===1?' erro':' erros'):'nenhum erro')+'.</p>';
    if(view.uso.ferramentas&&view.uso.ferramentas.length) h+='<p class="note">Ferramentas: '+view.uso.ferramentas.map(function(f){return esc(f.nome)+' ('+f.vezes+')'}).join(', ')+'.</p>';
    return h;
  }
  function pedirUso(){
    if(view.usoPediu) return;
    view.usoPediu=true;
    fetch('/api/uso?mes='+ymd(today()).slice(0,7))
      .then(function(r){ if(r.status===401){location.href='/login';return null} return r.json().catch(function(){return null}) })
      .then(function(j){ view.uso=j||{ok:false,motivo:'erro'}; if(S.tab==='ajustes'&&!view.memTela) render(); })
      .catch(function(){ view.uso={ok:false,motivo:'erro'}; if(S.tab==='ajustes'&&!view.memTela) render(); });
  }
  function proporMemoria(pergunta, resposta){
    fetch('/api/memoria/extrair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pergunta:String(pergunta).slice(0,4000), resposta:String(resposta).slice(0,8000), hoje:ymd(today())})})
      .then(function(r){ if(r.status===401){location.href='/login';return null} return r.json().catch(function(){return null}) })
      .then(function(j){
        if(!j||!j.itens||!j.itens.length) return;
        view.memLembrar=j.itens;
        if(S.tab==='assistente') render();
      })
      .catch(function(){});
  }
  function abrirMemoria(){
    view.memTela=true; view.memLista=null; view.memErro=''; view.memEdit=null; view.memApagar=null;
    render();
    fetch('/api/memoria')
      .then(function(r){ if(r.status===401){location.href='/login';return null} return r.json() })
      .then(function(j){
        if(!j) return;
        view.memLista=j.itens||[];
        view.memErro=j.ok===false?(j.motivo||'erro'):'';
        if(S.tab==='ajustes'&&view.memTela) render();
      })
      .catch(function(){ view.memLista=[]; view.memErro='erro'; if(S.tab==='ajustes'&&view.memTela) render(); });
  }
  function chavePush(base64){
    var pad='='.repeat((4-base64.length%4)%4);
    var s=atob((base64+pad).replace(/-/g,'+').replace(/_/g,'/'));
    var out=new Uint8Array(s.length);
    for(var i=0;i<s.length;i++) out[i]=s.charCodeAt(i);
    return out;
  }
  function ativarPush(){
    if(!window.Notification||!navigator.serviceWorker){ flash('Este aparelho não recebe aviso.'); return }
    Notification.requestPermission().then(function(perm){
      if(perm!=='granted'){ flash('Sem permissão. O aviso continua desligado.'); return }
      fetch('/api/push').then(function(r){ if(r.status===401){ location.href='/login'; return null } return r.json() }).then(function(j){
        if(!j||!j.chave){ flash('O servidor ainda não tem a chave de aviso.'); return }
        return navigator.serviceWorker.register('/sw.js').then(function(reg){
          return reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:chavePush(j.chave) });
        }).then(function(sub){
          var json=sub.toJSON();
          return fetch('/api/push',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ endpoint:json.endpoint, p256dh:json.keys&&json.keys.p256dh, auth:json.keys&&json.keys.auth }) });
        }).then(function(r){ if(r&&r.ok) flash('Avisos ligados neste aparelho.'); else flash('Não deu para ligar o aviso agora.'); });
      }).catch(function(){ flash('Não deu para ligar o aviso agora.'); });
    });
  }
  function pararPush(){
    if(!navigator.serviceWorker){ flash('Este aparelho não recebe aviso.'); return }
    navigator.serviceWorker.getRegistration('/sw.js').then(function(reg){
      if(!reg) return null;
      return reg.pushManager.getSubscription().then(function(sub){
        if(!sub) return null;
        var endpoint=sub.endpoint;
        return sub.unsubscribe().then(function(){ return endpoint });
      });
    }).then(function(endpoint){
      if(!endpoint){ flash('Este aparelho já estava desligado.'); return }
      return fetch('/api/push',{ method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ endpoint:endpoint }) }).then(function(){ flash('Avisos desligados neste aparelho.'); });
    }).catch(function(){ flash('Não deu para desligar o aviso agora.'); });
  }
  function tMemoria(){
    var h='<h1>Memória do Lastro</h1><p class="sub">Só entra o que você confirma. Dado sensível não fica aqui.</p>';
    h+='<div class="actions"><button type="button" class="ghost" data-act="mem-fechar">Voltar aos ajustes</button></div>';
    if(view.memLista===null) return h+'<p class="note">Olhando a memória.</p>';
    if(view.memErro==='tabela') return h+'<p class="alert">A memória ainda não está no banco. No Supabase, execute de novo o arquivo supabase/schema.sql.</p>';
    if(view.memErro) return h+'<p class="alert">Não deu para abrir a memória agora.</p>';
    if(!view.memLista.length) return h+'<p class="note">Nada guardado ainda. Depois de uma conversa, ele pede licença para lembrar.</p>';
    view.memLista.forEach(function(m){
      h+='<article class="card memoria"><p class="mem-kind">'+esc(nomeMem(m.kind))+(m.created_at?' · '+esc(dataMem(m.created_at)):'')+'</p>';
      if(view.memEdit===m.id){
        h+='<label class="field"><span>Tipo</span><select id="memKind"><option value="decisao"'+(m.kind==='decisao'?' selected':'')+'>Decisão</option><option value="preferencia"'+(m.kind==='preferencia'?' selected':'')+'>Preferência</option><option value="contexto"'+(m.kind==='contexto'?' selected':'')+'>Contexto</option></select></label>';
        h+='<label class="field"><span>Texto</span><textarea id="memTexto">'+esc(m.text)+'</textarea></label>';
        h+='<div class="actions"><button type="button" class="main" data-act="mem-salvar" data-id="'+esc(m.id)+'">Salvar</button><button type="button" class="ghost" data-act="mem-editar-cancela">Cancelar</button></div>';
      } else {
        h+='<p>'+esc(m.text)+'</p>';
        var apagando=view.memApagar===m.id;
        h+='<div class="actions"><button type="button" class="ghost" data-act="mem-editar" data-id="'+esc(m.id)+'">Editar</button><button type="button" class="mini'+(apagando?' warn':'')+'" data-act="mem-apagar" data-id="'+esc(m.id)+'">'+(apagando?'Apagar de vez':'Apagar')+'</button></div>';
      }
      h+='</article>';
    });
    return h;
  }
  function aiErr(c){return {not_granted:'Você não autorizou o uso do Claude nesta página.',rate_limited:'Muitas perguntas seguidas. Espere um pouco e tente de novo.',session_expired:'Sua sessão expirou. Recarregue a página.',prompt_too_large:'Dados demais para uma pergunta.',refused:'O Claude não respondeu a esta pergunta.',sampling_disabled:'O assistente está desativado na sua conta.'}[c]||'Não foi possível responder agora.'}
  function estadoAgente(){
    function corta(s,n){return String(s==null?'':s).slice(0,n)}
    var ch={};
    Object.keys(S.checkins||{}).forEach(function(k){
      var c=S.checkins[k]||{};
      ch[k]={gastos:c.gastos, extra:c.extra, mexeu:c.mexeu, motivo:corta(c.motivo,160), negocios:corta(c.negocios,400), vitoria:corta(c.vitoria,240), escorreguei:corta(c.escorreguei,240), foraNormal:corta(c.foraNormal,160), extraOrigem:corta(c.extraOrigem,80)};
    });
    return {
      cfg:{entrada:S.cfg.entrada, cambio:S.cfg.cambio, consorcio:S.cfg.consorcio, lanceMensal:S.cfg.lanceMensal, lanceMeta:S.cfg.lanceMeta, reservaMeta:S.cfg.reservaMeta, pctReserva:S.cfg.pctReserva, taxa:S.cfg.taxa, idade:S.cfg.idade, metaMilhao:S.cfg.metaMilhao, aptoMeta:S.cfg.aptoMeta, carroMeta:S.cfg.carroMeta, rendaLiquida:S.cfg.rendaLiquida, horasMes:S.cfg.horasMes},
      acordos:(S.acordos||[]).map(function(a){return {nome:a.nome, valor:a.valor, inicio:a.inicio, n:a.n}}),
      saldos:S.saldos, aportes:S.aportes, checkins:ch,
      caixinhasMov:(S.caixinhasMov||[]).slice(-400).map(function(m){return {caixinha:m.caixinha, tipo:m.tipo, valor:m.valor, data:m.data, motivo:corta(m.motivo,120), origem:m.origem}}),
      bandaFora:S.bandaFora||{},
      outrasContas:(S.outrasContas||[]).map(function(c){return {nome:c.nome, saldo:c.saldo}}),
      negocios:S.negocios||[],
      movs:(S.movs||[]).slice(-200).map(function(m){return {neg:m.neg, tipo:m.tipo, valor:m.valor, data:m.data}}),
      ativos:(S.ativos||[]).map(function(a){return {t:a.t, l:a.l||'', qtd:a.qtd}}),
      conferencia:S.conferencia&&S.conferencia.data?{data:S.conferencia.data}:null
    };
  }
  function htmlPropostas(){
    var lista=view.aiPropostas||[];
    if(!lista.length) return '';
    var h='';
    lista.forEach(function(p,i){
      h+='<article class="proposta"><h3>'+esc(p.titulo||'Lastro quer registrar')+'</h3><p>'+esc(p.detalhe||'')+'</p><p class="note">Nada muda até você confirmar.</p>';
      h+='<div class="actions"><button type="button" class="main" data-act="ai-confirma" data-i="'+i+'">Confirmar</button><button type="button" class="ghost" data-act="ai-cancela" data-i="'+i+'">Cancelar</button></div></article>';
    });
    return h;
  }
  function separarAi(t){
    var partes=String(t||'').split('@@PROPOSTA@@');
    var texto=partes[0].replace(/@@FIM@@/g,'').trim();
    var propostas=[];
    for(var i=1;i<partes.length;i++){
      var pedaco=partes[i].split('@@FIM@@')[0];
      try{ propostas.push(JSON.parse(decodeURIComponent(pedaco))) }catch(err){}
    }
    return {texto:texto, propostas:propostas};
  }
  function visivelAi(buf){
    var i=buf.indexOf('@@PROPOSTA@@');
    var base=i<0?buf:buf.slice(0,i);
    if(i<0){ var corte=base.lastIndexOf('@@'); if(corte>=0) base=base.slice(0,corte) }
    return base;
  }
  function perguntar(tipo){
    if(!sampleApi||aiBusy) return;
    var q=tipo==='livre'?(document.getElementById('aiQ')||{}).value||'':PERGUNTAS[tipo];
    q=String(q).trim(); if(!q){flash('Escreva uma pergunta');return}
    view.aiQ=tipo==='livre'?q:view.aiQ;
    view.aiPropostas=[];
    view.memLembrar=null;
    aiCtl=new AbortController(); aiBusy=true; view.aiText='Pensando…'; view.aiNote=''; render();
    var modo=tipo==='noticias'?'noticias':'portal';
    fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pergunta:q, modo:modo, hoje:ymd(today()), estado:estadoAgente()}),signal:aiCtl.signal})
      .then(function(r){
        if(r.status===401){location.href='/login';throw {code:'auth'}}
        if(!r.ok||!r.body) throw {code:'http'};
        var reader=r.body.getReader(), dec=new TextDecoder(), buf='';
        function pump(){return reader.read().then(function(x){
          if(x.done) return buf;
          buf+=dec.decode(x.value,{stream:true});
          var vis=visivelAi(buf).trim();
          view.aiText=vis||'Pensando…';
          var el=document.getElementById('aiOut'); if(el) el.textContent=view.aiText;
          return pump();
        })}
        return pump();
      })
      .then(function(t){
        var sep=separarAi(t);
        view.aiText=sep.texto||'(sem resposta)';
        view.aiPropostas=sep.propostas;
        if(sep.texto) proporMemoria(q, sep.texto);
      })
      .catch(function(e){ if(e&&e.name==='AbortError'){view.aiNote='Interrompido.'} else {view.aiNote='Não foi possível responder agora. Confira a chave da API nas variáveis de ambiente.'} })
      .then(function(){aiBusy=false; aiCtl=null; if(S.tab==='assistente') render()});
  }

  function navMark(id){
    var p={
      inicio:'<path d="M4 11 L12 4.5 L20 11"/><path d="M7 10.5 V20 H17 V10.5"/>',
      sabado:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3.5 V7 M16 3.5 V7 M4 10 H20"/>',
      checkin:'<circle cx="12" cy="12" r="8"/><path d="M8.5 12.2 L11 14.5 L15.5 9.5"/>',
      arca:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/>',
      mercado:'<path d="M4 16 L9 11 L13 14 L20 7"/><path d="M15 7 H20 V12"/>',
      caixinhas:'<rect x="3" y="4" width="8" height="7" rx="1.4"/><rect x="13" y="4" width="8" height="7" rx="1.4"/><rect x="3" y="13" width="8" height="7" rx="1.4"/><rect x="13" y="13" width="8" height="7" rx="1.4"/>',
      assistente:'<path d="M5 16.5 V8.5 A4 4 0 0 1 12 6.5"/><path d="M19 7.5 V15.5 A4 4 0 0 1 12 17.5"/><path d="M12 6.5 V17.5"/>',
      negocios:'<path d="M4 18 V11 H9 V18"/><path d="M10 18 V6 H15 V18"/><path d="M16 18 V13 H20 V18"/>',
      futuro:'<path d="M12 19 V6"/><path d="M7 10 L12 5 L17 10"/>',
      ajustes:'<path d="M4 8 H14"/><circle cx="17" cy="8" r="2"/><path d="M4 16 H8"/><circle cx="11" cy="16" r="2"/><path d="M14 16 H20"/>',
      mais:'<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>'
    };
    return '<span class="nav-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">'+(p[id]||'')+'</svg></span>';
  }
  function navBtn(id,label){
    return '<button type="button" data-tab="'+id+'"'+(S.tab===id?' aria-current="page"':'')+'>'+navMark(id)+'<span>'+label+'</span></button>';
  }

  /* ---------- motion (reads data, does not write it) ---------- */
  function fig(key, value, text, fmt, extra){
    return '<b class="num'+(extra?' '+extra:'')+'" data-n="'+value+'" data-k="'+esc(key)+'"'+(fmt?' data-fmt="'+fmt+'"':'')+'>'+text+'</b>';
  }
  function muralSaturdays(){
    var keys=Object.keys(S.checkins).sort();
    if(!keys.length) return null;
    var start=satOnOrBefore(parse(keys[0])), end=satOnOrBefore(today()), days=[], d;
    for(d=new Date(start);d<=end;d=addDays(d,7)) days.push(ymd(d));
    var cut=days.length>24;
    if(cut) days=days.slice(-24);
    return {days:days, cut:cut};
  }
  function muroHtml(){
    var wall=muralSaturdays();
    if(!wall) return '<p class="muro-note sub">O muro começa no primeiro sábado.</p><div class="muro" aria-label="Muro de sábados"><i class="stone"></i></div>';
    var h='<h2>O muro</h2><div class="muro" aria-label="Muro de sábados">';
    wall.days.forEach(function(k,i){
      var solid=!!S.checkins[k], newest=i===wall.days.length-1&&solid;
      h+='<i class="stone'+(solid?' solid':'')+(newest?' is-new':'')+'" title="'+k+'"></i>';
    });
    h+='</div>';
    if(wall.cut) h+='<p class="muro-note sub">As últimas 24 semanas.</p>';
    return h;
  }
  function pilaresHtml(){
    var tot=arcaTotal(), al=arcaAlloc(), letters=['A','R','C','I'], next=-1, best=-1;
    if(S.saldos.arcaInvestir>0) al.forEach(function(v,i){ if(v>best+1e-9){ best=v; next=i; } });
    var h='<h2>Os 4 pilares</h2><div class="pilares">';
    letters.forEach(function(k,i){
      var pc=tot>0?S.saldos[k]/tot:0;
      h+='<div class="pilar'+(i===next?' is-next':'')+'"><div class="pilar-track"><i class="band"></i><i class="target"></i><b style="--h:'+pc.toFixed(4)+'"></b></div><span>'+k+'</span><small class="num">'+(tot>0?Math.round(pc*100)+'%':'—')+'</small></div>';
    });
    return h+'</div>';
  }
  function renda30(n){
    var lim=ymd(addDays(today(),-30)), ret=0, ativo=false;
    S.movs.forEach(function(m){
      if(m.neg!==n||!(m.data>=lim)) return;
      ativo=true;
      if(m.tipo==='ret') ret+=num(m.valor);
    });
    return {mes:ativo?ret:negStats(n).ret, ativo:ativo, usou30:ativo};
  }
  function gearSvg(){
    return '<svg class="gear" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.6 V3.1 M8 12.9 V14.4 M1.6 8 H3.1 M12.9 8 H14.4 M3.4 3.4 L4.5 4.5 M11.5 11.5 L12.6 12.6 M12.6 3.4 L11.5 4.5 M4.5 11.5 L3.4 12.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/></svg>';
  }
  function predioHtml(){
    var nome=fase()[0];
    var floors=[['Liberdade','ARCA é o motor','Fase 3'],['Crescimento','ARCA + Apartamento','Fase 2'],['Construção','Lance + reserva','Fase 1']];
    var h='<div class="predio" aria-label="As três fases">';
    floors.forEach(function(x){
      var on=nome.indexOf(x[2])===0;
      h+='<div class="floor'+(on?' is-here':'')+'"><b>'+x[0]+'</b><span>'+x[1]+'</span>'+(on?'<em>Você está aqui</em>':'')+'</div>';
    });
    return h+'</div>';
  }
  function chartOnce(){
    try{
      if(sessionStorage.getItem('pg-chart')==='1') return false;
      sessionStorage.setItem('pg-chart','1');
      return !(window.PG&&window.PG.reduce());
    }catch(e){ return true; }
  }
  function sparkHtml(a){
    var h=a.hist||[];
    if(h.length<2) return '';
    var min=Infinity, max=-Infinity;
    h.forEach(function(p){ if(p.p<min) min=p.p; if(p.p>max) max=p.p; });
    var span=max-min||1;
    var pts=h.map(function(p,i){
      var x=(i/(h.length-1))*64, y=18-((p.p-min)/span)*16;
      return x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
    var up=h[h.length-1].p>=h[h.length-2].p;
    var drew=false;
    try{ drew=sessionStorage.getItem('pg-spark')==='1'; }catch(e){}
    sparkHtml.any=true;
    return '<svg class="spark'+(drew?' drew':'')+'" viewBox="0 0 64 20" aria-hidden="true"><polyline points="'+pts+'" pathLength="1" stroke="'+(up?'var(--brand)':'var(--red)')+'"/></svg>';
  }
  function rememberSparks(){
    if(!sparkHtml.any) return;
    try{ sessionStorage.setItem('pg-spark','1'); }catch(e){}
    sparkHtml.any=false;
  }
  function runCounts(){
    var PG=window.PG;
    document.querySelectorAll('[data-n]').forEach(function(el){
      var key=el.getAttribute('data-k')||'';
      var to=parseFloat(el.getAttribute('data-n'));
      if(!isFinite(to)) return;
      var fmt=el.getAttribute('data-fmt')||'raw';
      function render(v){
        if(fmt==='compact') return compact.format(v);
        if(fmt==='money') return money(v);
        if(fmt==='int') return String(Math.round(v));
        return String(Math.round(v*100)/100);
      }
      var seen=Object.prototype.hasOwnProperty.call(seenN, key);
      var from=seen?seenN[key]:null;
      seenN[key]=to;
      if(!seen){
        if(key.indexOf('hero-')===0&&to!==0&&PG&&!PG.reduce()) PG.countUp(el,0,to,420,render);
        return;
      }
      if(from===to||!PG||PG.reduce()) return;
      PG.countUp(el, from, to, 420, render);
    });
  }
  function skeleton(){
    return '<div class="skel" aria-busy="true" aria-label="Carregando"><i class="lg"></i><i class="w40"></i><i></i><i class="w70"></i><i></i><i class="w40"></i></div>';
  }
  function saudacao(){
    var h=new Date().getHours();
    if(h<12) return 'Bom dia, Tiago';
    if(h<18) return 'Boa tarde';
    return 'Boa noite';
  }
  function streakLine(st){
    if(st.atual===1) return '1 sábado seguido';
    if(st.atual>1) return st.atual+' sábados seguidos';
    return 'Nenhum sábado seguido';
  }
  function maybeWelcome(){
    var PG=window.PG;
    if(!PG||PG.reduce()) return;
    var day=ymd(today());
    try{ if(localStorage.getItem('pg-day')===day) return; localStorage.setItem('pg-day', day); }catch(e){ return; }
    var st=streaks(), patr=patrimonio();
    var el=document.createElement('div');
    el.className='welcome go';
    el.innerHTML='<div class="welcome-card"><p>'+saudacao()+'</p><b class="num" id="pg-hello">'+compact.format(0)+'</b><span>'+streakLine(st)+'</span></div>';
    document.body.appendChild(el);
    PG.countUp(document.getElementById('pg-hello'), 0, patr, 700, function(v){return compact.format(v)});
    function close(){ if(el.parentNode) el.parentNode.removeChild(el); }
    el.addEventListener('click', close);
    setTimeout(close, 1050);
  }

  var CAIXAS=[
    {id:'reserva', nome:'Reserva de Emergência', funcao:'Emergências reais. Nunca para desejos.', meta:'reservaMeta', cor:'var(--reserve)', tom:'reserve'},
    {id:'lance', nome:'Lance CB650R', funcao:'Dinheiro do lance do consórcio, em renda fixa. Meta prevista para abril/2027.', meta:'lanceMeta', cor:'var(--lance)', tom:'lance'},
    {id:'apto', nome:'Apartamento', funcao:'Sonho de Primeira Geração. Recebe aporte a partir da Fase 2.', meta:'aptoMeta', cor:'var(--dream)', tom:'dream'},
    {id:'carro', nome:'Carro dos sonhos', funcao:'Só quando o valor for no máximo 10% do patrimônio investido.', meta:'carroMeta', cor:'var(--dream)', tom:'dream'},
    {id:'arcaInvestir', nome:'ARCA – a investir', funcao:'Passagem. O dinheiro espera aqui só até a compra na segunda ou terça. Deve voltar a zero toda semana.', meta:'', cor:'var(--arca)', tom:'arca'}
  ];
  function caixaPorId(id){var a=null; CAIXAS.forEach(function(c){if(c.id===id)a=c}); return a}
  function movsCaixa(id){
    return (Array.isArray(S.caixinhasMov)?S.caixinhasMov:[]).filter(function(m){return m&&(!id||m.caixinha===id)}).slice().sort(function(a,b){return a.data<b.data?1:a.data>b.data?-1:0});
  }
  function anotarCaixa(caixinha, tipo, valor, data, motivo, origem){
    var v=Math.round(num(valor)*100)/100;
    if(!(v>0)) return;
    if(!Array.isArray(S.caixinhasMov)) S.caixinhasMov=[];
    S.caixinhasMov.push({id:'cx'+data+caixinha+tipo+S.caixinhasMov.length, caixinha:caixinha, tipo:tipo, valor:v, data:data, motivo:motivo||'', origem:origem});
  }
  function ritmoSemanal(id){
    if(id==='lance'||id==='reserva'||id==='arcaInvestir'){
      var sat=satOnOrAfter(today());
      for(var i=0;i<6;i++){
        var cyc=cycleOf(sat);
        if(cyc.idx!==0&&cyc.sats.length){
          var t=metas(cyc), chave=id==='arcaInvestir'?'arca':id, v=t[chave]/cyc.sats.length;
          if(v>0) return v;
        }
        sat=addDays(sat,7);
      }
      return 0;
    }
    var corte=addDays(today(),-28), soma=0;
    movsCaixa(id).forEach(function(m){ if(m.tipo==='deposito'&&parse(m.data)>=corte) soma+=num(m.valor) });
    return soma/4;
  }
  function diasArcaParada(){
    if(!(num(S.saldos.arcaInvestir)>0)) return 0;
    var movs=movsCaixa('arcaInvestir').slice().reverse();
    var desde=null, bal=0;
    if(movs.length){
      movs.forEach(function(m){
        if(m.tipo==='deposito'){ if(bal<=0.004) desde=m.data; bal+=num(m.valor) }
        else { bal-=num(m.valor); if(bal<=0.004){ bal=0; desde=null } }
      });
    }
    if(!desde){
      var ks=Object.keys(S.aportes||{}).filter(function(k){return S.aportes[k]&&num(S.aportes[k].arca)>0}).sort();
      if(ks.length) desde=ks[ks.length-1];
    }
    if(!desde) return null;
    return Math.max(0, Math.round((today()-parse(desde))/864e5));
  }
  function preencherMexeu(motivo){
    view.ciDate=satOnOrBefore(today());
    ciDraft.mexeu='sim';
    ciDraft.motivo=motivo;
  }
  function aplicarMovimento(id, tipo, valor, motivo, origem){
    var v=Math.round(num(valor)*100)/100;
    if(!(v>0)||!caixaPorId(id)) return false;
    if(tipo==='retirada'&&v>num(S.saldos[id])+1e-9){ flash('O valor passa do saldo.'); return false }
    if(tipo==='retirada') S.saldos[id]=Math.max(0, Math.round((num(S.saldos[id])-v)*100)/100);
    else S.saldos[id]=Math.round((num(S.saldos[id])+v)*100)/100;
    anotarCaixa(id, tipo, v, ymd(today()), motivo, origem);
    round();
    return true;
  }
  function linhasMov(lista){
    if(!lista.length) return '<p class="sub">Nenhum movimento ainda.</p>';
    var h='<ul class="cx-movs">';
    lista.forEach(function(m){
      h+='<li><span>'+fmtDate(parse(m.data))+' · '+(m.tipo==='retirada'?'Retirada':'Depósito')+'</span><b class="num '+(m.tipo==='retirada'?'neg':'pos')+'">'+(m.tipo==='retirada'?'− ':'+ ')+money(m.valor)+'</b>'+(m.motivo?'<small>'+esc(m.motivo)+'</small>':'')+'</li>';
    });
    return h+'</ul>';
  }
  function conferenciaAviso(){
    var c=S.conferencia, data=c&&c.data;
    var h='<p class="sub">Última conferência: '+(data?fmtDate(parse(data)):'nenhuma ainda')+'</p>';
    var dias=data?Math.round((today()-parse(data))/864e5):31;
    if(dias>30) h+='<p class="alert">Uma vez por mês, digite o saldo do app do Nubank. Se diferir, o portal se ajusta. O app é a fonte da verdade.</p>';
    return h;
  }
  function tCaixinhas(){
    if(view.cxHist){
      var alvo=caixaPorId(view.cxHist);
      if(!alvo){ view.cxHist=''; }
      else {
        var lista=movsCaixa(alvo.id).filter(function(m){ return view.cxTipo==='todos'||m.tipo===view.cxTipo });
        var h0='<h1>'+esc(alvo.nome)+'</h1><p class="sub">Histórico</p>';
        h0+='<div class="chips" style="margin-top:12px">';
        [['todos','Todos'],['deposito','Depósitos'],['retirada','Retiradas']].forEach(function(f){
          h0+='<button type="button" data-act="cx-tipo" data-tipo="'+f[0]+'" aria-pressed="'+(view.cxTipo===f[0])+'">'+f[1]+'</button>';
        });
        h0+='</div><div class="card" style="margin-top:12px">'+linhasMov(lista)+'</div>';
        h0+='<div class="actions"><button type="button" class="ghost" data-act="cx-voltar">Voltar às caixinhas</button></div>';
        return h0;
      }
    }
    var h='<h1>Caixinhas</h1><p class="sub">As cinco caixinhas estão no Nubank, em renda fixa com liquidez diária, perto de 100% do CDI.</p>';
    h+=conferenciaAviso();
    h+='<div class="actions"><button type="button" class="main" data-act="cx-conf">'+(view.cxConf?'Fechar conferência':'Conferir com o Nubank')+'</button></div>';
    if(view.cxConf){
      h+='<div class="card cx-conf"><p>Uma vez por mês, digite o saldo que o app do Nubank mostra em cada caixinha. Se for diferente, o portal se ajusta. O app é a fonte da verdade.</p>';
      CAIXAS.forEach(function(c){
        var ja=(view.cxDiff||[]).filter(function(x){return x.id===c.id})[0];
        h+='<label class="field"><span>'+esc(c.nome)+'</span><input id="cxn-'+c.id+'" inputmode="decimal" value="'+esc(textoDinheiro(ja?ja.app:S.saldos[c.id]))+'" aria-label="Saldo no Nubank de '+esc(c.nome)+'"></label>';
      });
      h+='<div class="actions"><button type="button" class="main" data-act="cx-comparar">Comparar</button></div>';
      if(view.cxDiff){
        var difs=view.cxDiff.filter(function(d){return !d.igual});
        if(!difs.length) h+='<p class="note">Os valores batem com o portal.</p>';
        difs.forEach(function(d){
          var c=caixaPorId(d.id);
          h+='<p>'+esc(c.nome)+': o app mostra '+money(d.app)+' e o portal '+money(d.portal)+'.</p>';
          h+='<div class="actions"><button type="button" class="ghost" data-act="cx-ajustar" data-cx="'+d.id+'">Ajustar o portal para o valor do app</button></div>';
        });
      }
      h+='</div>';
    }
    var parada=diasArcaParada();
    h+='<div class="cx-list">';
    CAIXAS.forEach(function(c){
      var saldo=num(S.saldos[c.id]), meta=c.meta?num(S.cfg[c.meta]):0, pc=meta>0?Math.min(100, saldo/meta*100):0;
      h+='<article class="card cx-card cx-'+c.tom+'" style="--cx:'+c.cor+'" aria-label="'+esc(c.nome)+'">';
      h+='<div class="cx-head"><span class="cx-ico" aria-hidden="true"></span><div><h2>'+esc(c.nome)+'</h2><p>'+esc(c.funcao)+'</p></div></div>';
      h+='<p class="cx-saldo num">'+money(saldo)+'</p>';
      if(c.meta){
        h+=meta>0?'<p class="sub">Meta '+money(meta)+' · '+pc.toFixed(pc>0&&pc<1?1:0)+'%</p><div class="bar" aria-hidden="true"><i style="width:'+pc.toFixed(1)+'%;--c:'+c.cor+'"></i></div>':'<p class="sub">Meta a definir</p>';
      }
      if(c.id==='arcaInvestir'&&saldo>0&&parada>7) h+='<p class="alert">ARCA – a investir é passagem e deve zerar toda semana. Este valor está aqui há '+parada+' dias. Compre no próximo dia útil.</p>';
      h+='<h3>Últimos movimentos</h3>'+linhasMov(movsCaixa(c.id).slice(0,3));
      h+='<div class="actions"><button type="button" class="main" data-act="cx-form" data-cx="'+c.id+'" data-tipo="deposito">Depositar</button><button type="button" class="ghost" data-act="cx-form" data-cx="'+c.id+'" data-tipo="retirada">Retirar</button><button type="button" class="ghost" data-act="cx-hist" data-cx="'+c.id+'">Histórico</button></div>';
      if(view.cxForm===c.id+'|deposito'||view.cxForm===c.id+'|retirada'){
        var tipo=view.cxForm.split('|')[1], pede=tipo==='retirada'&&c.id!=='arcaInvestir';
        h+='<div class="cx-form"><label class="field"><span>Valor (R$)</span><input id="cxv" inputmode="decimal" placeholder="0,00"></label>';
        h+='<label class="field"><span>Motivo'+(pede?'':' (opcional)')+'</span><input id="cxm" placeholder="'+(pede?'Por que vai sair desta caixinha':'')+'"></label>';
        h+='<div class="actions"><button type="button" class="main" data-act="cx-ok" data-cx="'+c.id+'" data-tipo="'+tipo+'">'+(tipo==='retirada'?'Ver impacto':'Guardar depósito')+'</button></div></div>';
      }
      if(view.cxPend&&view.cxPend.id===c.id){
        var pend=view.cxPend;
        h+='<div class="card cx-pend" role="region" aria-label="Confirmar retirada"><p>Retirar '+money(pend.valor)+' de '+esc(c.nome)+'.</p>';
        h+=pend.dias==null?'<p>Não dá para estimar o atraso: ainda não há um ritmo semanal.</p>':'<p>No ritmo desta semana, isso atrasa a meta em '+pend.dias+' '+(pend.dias===1?'dia':'dias')+'.</p>';
        h+='<div class="actions"><button type="button" class="main" data-act="cx-confirma">Confirmar retirada</button><button type="button" class="ghost" data-act="cx-cancela">Cancelar</button></div></div>';
      }
      h+='</article>';
    });
    h+='</div>';
    h+='<h2>Outras contas</h2><p class="sub">Fora das caixinhas. Entram no patrimônio, não na soma das caixinhas.</p><div class="card">';
    (Array.isArray(S.outrasContas)?S.outrasContas:[]).forEach(function(c,i){
      h+='<div class="grid2"><label class="field"><span>Nome</span><input id="cxo-nome-'+i+'" value="'+esc(c.nome||'')+'"></label>';
      h+='<label class="field"><span>Saldo (R$)</span><input id="cxo-saldo-'+i+'" inputmode="decimal" value="'+esc(c.saldo===''||c.saldo==null?'':textoDinheiro(c.saldo))+'"></label>';
      h+='<label class="field full"><span>Função</span><input id="cxo-fun-'+i+'" value="'+esc(c.funcao||'')+'" placeholder="Você define depois"></label></div>';
    });
    h+='<div class="actions"><button type="button" class="main" data-act="cx-contas">Salvar contas</button><button type="button" class="ghost" data-act="cx-conta-add">Adicionar conta</button></div></div>';
    return h;
  }

  function render(){
    applyTheme();
    var main=[['inicio','Início'],['sabado','Sábado'],['checkin','Check-in'],['arca','ARCA'],['mercado','Mercado']];
    var more=[['caixinhas','Caixinhas'],['assistente','Assistente'],['negocios','Negócios'],['futuro','Futuro'],['ajustes','Ajustes']];
    var nav='<input class="nav-mais-input" id="nav-mais" type="checkbox">'
      +'<div class="nav-bar">'+main.map(function(t){return navBtn(t[0],t[1])}).join('')
      +'<label class="nav-mais" for="nav-mais">'+navMark('mais')+'<span>Mais</span></label></div>'
      +'<div class="nav-sheet">'+more.map(function(t){return navBtn(t[0],t[1])}).join('')+'</div>';
    document.getElementById('nav').innerHTML=nav;
    var f={inicio:tInicio,sabado:tSabado,checkin:tCheckin,arca:tArca,mercado:tMercado,caixinhas:tCaixinhas,assistente:tAssistente,negocios:tNegocios,futuro:tFuturo,ajustes:tAjustes}[S.tab]||tInicio;
    document.getElementById('root').innerHTML=f();
    motion.escolha=false;
    pedirInsights();
    pedirBriefing();
  }

  /* ---------- salvar ---------- */
  function flash(m){var el=document.getElementById('status');el.textContent=m;el.classList.add('on');clearTimeout(flash.t);flash.t=setTimeout(function(){el.classList.remove('on')},1800)}
  function save(){
    try{localStorage.setItem('portal-tiago',JSON.stringify(S))}catch(e){}
    if(!loaded) return;
    clearTimeout(timer);
    timer=setTimeout(function(){
      flash('Salvando…');
      fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(S)})
        .then(function(r){ if(r.status===401){location.href='/login';return} flash(r.ok?'Salvo':'Não foi possível salvar agora') })
        .catch(function(){flash('Sem conexão: salvo só neste aparelho')});
    },900);
  }
  function commit(){carimbarFeitos();atualizarBanda();render();save()}

  /* ---------- eventos ---------- */
  document.addEventListener('input',function(e){
    var t=e.target;
    if(t.dataset&&t.dataset.ciF){ciDraft[t.dataset.ciF]=t.value}
    if(t.id==='aiQ'){view.aiQ=t.value}
    if(t.id==='cmdQ'){view.cmdTexto=t.value;return}
    if(t.id==='bolsaQ'){
      view.bolsaQ=t.value;
      clearTimeout(carregarBolsa.espera);
      carregarBolsa.espera=setTimeout(function(){ carregarBolsa(false) }, 300);
      return}
    if(t.id==='sonhoMeta'){mascaraMeta(t);return}
    if(t.id==='seExtra'||t.id==='seAporte'||t.id==='seTaxa'){
      if(t.id==='seExtra') view.seExtra=num(t.value);
      if(t.id==='seAporte') view.seAporte=num(t.value);
      if(t.id==='seTaxa') view.seTaxa=num(t.value)/100;
      var ev=document.getElementById('seExtraV'), av=document.getElementById('seAporteV'), tv=document.getElementById('seTaxaV'), painel=document.getElementById('sePainel');
      var v=seValores();
      if(ev) ev.textContent=money(v.extra);
      if(av) av.textContent=money(v.aporte);
      if(tv) tv.textContent=String(Math.round(v.taxa*1000)/10).replace('.',',')+'%';
      if(painel) painel.innerHTML=sePainelHtml();
      t.setAttribute('aria-valuenow', t.value);
    }
  });
  document.addEventListener('change',function(e){
    var t=e.target, d=t.dataset||{};
    if(t.id==='sonhoMeta'){
      var bruto=String(t.value).trim();
      if(bruto!=='') t.value=textoDinheiro(num(bruto));
      return}
    if(d.lf&&d.livro){
      var lv=livroPorId(d.livro);
      if(lv&&(d.lf==='inicio'||d.lf==='fim'||d.lf==='ideia')){
        lv[d.lf]=d.lf==='ideia'?String(t.value).trim().slice(0,280):t.value;
        commit();
      }
      return}
    if(d.cfg){
      if(d.cfg==='rendaLiquida'||d.cfg==='horasMes'){var raw=String(t.value).trim(); S.cfg[d.cfg]=raw===''?'':num(raw);}
      else S.cfg[d.cfg]=num(t.value);
      commit();return}
    if(d.saldo){S.saldos[d.saldo]=num(t.value);commit();return}
    if(d.ac!=null&&d.f){var a=S.acordos[+d.ac]; a[d.f]=(d.f==='nome'||d.f==='inicio')?t.value:num(t.value); commit(); return}
    if(d.rec){view.rec=num(t.value);view.recKey=d.rec;render();return}
    if(t.id==='impFile'&&t.files&&t.files[0]){var fr=new FileReader();fr.onload=function(){try{var o=JSON.parse(fr.result); if(o&&o.cfg&&o.saldos){S=mergeState(o);commit();flash('Backup restaurado')} else flash('Arquivo inválido')}catch(e){flash('Arquivo inválido')}};fr.readAsText(t.files[0]);return}
    if(d.sonhoFoto&&t.files&&t.files[0]){var sid=d.sonhoFoto, file=t.files[0];
      var local=URL.createObjectURL(file);
      mostrarFotoQuadro(sid, local);
      reduzirFoto(file,function(blob){
        if(!blob){flash('Não consegui preparar a foto.');return}
        var fd=new FormData(), nome=sid+'-'+Date.now();
        fd.append('id', nome); fd.append('file', blob, nome+'.jpg');
        fetch('/api/upload',{method:'POST',body:fd}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})}).then(function(x){
          if(!x.ok||!x.j||!x.j.path){flash((x.j&&x.j.error)||'A foto não foi salva.');return}
          var card=null; sonhosLista().forEach(function(c){if(c.id===sid)card=c});
          if(!card){flash('Sonho não encontrado.');return}
          if(view.fotoPrevia) delete view.fotoPrevia[sid];
          URL.revokeObjectURL(local);
          guardarSonho(card.id,card.nome,card.metaRef,x.j.path,card.fixo?null:card.meta);
          flash('Foto guardada.');
        }).catch(function(){flash('Sem conexão para enviar a foto.')});
      });
      return}
    if(t.id==='nvClasse'){var nvTipo=document.getElementById('nvTipo'); if(nvTipo) nvTipo.innerHTML=htmlTipos(t.value); return}
    if(d.preco!=null){var a=S.ativos[+d.preco], p=num(t.value); if(p>0&&p!==a.preco){setPreco(a,p); commit(); flash('Cotação atualizada')} return}
  });
  document.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b) return; var d=b.dataset;
    if(d.tema){S.tema=d.tema;commit();return}
    if(d.tab||d.go){if(view.vozModo==='ouvindo'){pararMic();view.vozModo='off'} pararCmd(); var proxTab=d.tab||d.go; if(proxTab!=='inicio') view.mural=false; if(proxTab!=='futuro'){view.linha=false;view.estante=false} if(proxTab!=='ajustes') view.memTela=false; S.tab=proxTab;pendingDel=null;render();window.scrollTo(0,0);return}
    if(d.sab){view.sab=addDays(view.sab,+d.sab);view.rec=null;render();return}
    if(d.ci){flushCi();view.ciDate=addDays(view.ciDate,+d.ci);ciDraft={};render();return}
    if(d.mexeu){flushCi();ciDraft.mexeu=d.mexeu;render();return}
    if(d.mt){view.movTipo=d.mt;render();return}
    if(d.act==='exec'){var dt=parse(d.k), w=semana(dt); S.aportes[d.k]={recebido:w.rec,consorcio:w.alloc.consorcio,acordos:w.alloc.acordos,lance:w.alloc.lance,reserva:w.alloc.reserva,arca:w.alloc.arca};
      S.saldos.lance+=w.alloc.lance;S.saldos.reserva+=w.alloc.reserva;S.saldos.arcaInvestir+=w.alloc.arca;round();
      anotarCaixa('lance','deposito',w.alloc.lance,d.k,'Cascata do sábado','cascata');
      anotarCaixa('reserva','deposito',w.alloc.reserva,d.k,'Cascata do sábado','cascata');
      anotarCaixa('arcaInvestir','deposito',w.alloc.arca,d.k,'Cascata do sábado','cascata');
      view.rec=null;commit();flash('Cascata registrada');return}
    if(d.act==='undo'){var a=S.aportes[d.k]; if(a){var antesArca=num(S.saldos.arcaInvestir);S.saldos.lance-=a.lance;S.saldos.reserva-=a.reserva;S.saldos.arcaInvestir=Math.max(0,S.saldos.arcaInvestir-a.arca);delete S.aportes[d.k];round();
      anotarCaixa('lance','retirada',a.lance,d.k,'Desfazer cascata','cascata');
      anotarCaixa('reserva','retirada',a.reserva,d.k,'Desfazer cascata','cascata');
      anotarCaixa('arcaInvestir','retirada',antesArca-num(S.saldos.arcaInvestir),d.k,'Desfazer cascata','cascata');
      commit()}return}
    if(d.act==='saveci'){flushCi();pararMic();view.vozCampos=null;view.vozModo='off';var k2=d.k;S.checkins[k2]=Object.assign({mexeu:'não'},S.checkins[k2]||{},ciDraft);ciDraft={};commit();flash('Check-in salvo ✓');return}
    if(d.act==='voz-iniciar'){view.vozTexto='';view.vozInterim='';view.vozLeft=30;view.vozModo='ouvindo';render();ligarMic();return}
    if(d.act==='voz-parar'){concluirVoz();return}
    if(d.act==='voz-enviar'){var caixa=document.getElementById('vozCaixa'); var relato=caixa?String(caixa.value).trim():String(view.vozTexto||'').trim();
      if(!relato){flash('Escreva ou dite o relato antes.');return}
      view.vozTexto=relato; enviarVoz(relato); return}
    if(d.act==='lembrete-conf'){S.tab='caixinhas'; view.cxConf=true; view.cxHist=''; render(); window.scrollTo(0,0); return}
    if(d.act==='insight-meta'){
      var valorMeta=num(d.valor);
      if(!(valorMeta>0)) return;
      if(d.ok==='1'&&view.insightOk===valorMeta){
        S.cfg.reservaMeta=valorMeta;
        view.insightOk=null;
        view.insights=null;
        view.insightsChave='';
        commit();
        flash('Meta da reserva definida');
        return;
      }
      view.insightOk=valorMeta;
      pintarInsights();
      return;
    }
    if(d.act==='lembrete-perm'){
      if(!window.Notification){flash('Este aparelho não mostra aviso.');return}
      Notification.requestPermission().then(function(p){
        if(p==='granted'){flash('Aviso ligado. No sábado, às 8h, ele chega se houver o que dizer.'); dispararLembrete()}
        else flash('Sem permissão. O lembrete continua na tela de sábado.');
        render();
      });
      return}
    if(d.act==='cmd-voz'){ouvirComando();return}
    if(d.act==='cmd-parar'){pararCmd();render();return}
    if(d.act==='cmd-enviar'){enviarComando();return}
    if(d.act==='cmd-cancela'){view.cmdProposta=null;render();return}
    if(d.act==='mem-tirar'){
      view.memLembrar=(view.memLembrar||[]).filter(function(_,i){return i!==+d.i});
      if(!view.memLembrar.length) view.memLembrar=null;
      render(); return}
    if(d.act==='mem-cancela'){view.memLembrar=null;render();return}
    if(d.act==='mem-confirma'){
      var lembrar=view.memLembrar||[];
      if(!lembrar.length) return;
      fetch('/api/memoria',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({itens:lembrar})})
        .then(function(r){ if(r.status===401){location.href='/login';return null} return r.json() })
        .then(function(j){
          if(j&&j.ok){ view.memLembrar=null; view.memLista=null; flash('Memória guardada'); }
          else if(j&&j.motivo==='sensivel') flash('Esse texto tem dado sensível. Não guardo.');
          else if(j&&j.motivo==='tabela') flash('A memória ainda não está no banco.');
          else flash('Não deu para guardar agora.');
          if(S.tab==='assistente') render();
        })
        .catch(function(){ flash('Não deu para guardar agora.'); });
      return}
    if(d.act==='mem-abrir'){abrirMemoria();return}
    if(d.act==='aviso-toggle'){
      if(!S.avisos) S.avisos={sabado:false,arca:false,contas:false,nudge:false,revisao:false};
      if(!Object.prototype.hasOwnProperty.call(S.avisos,d.tipo)) return;
      S.avisos[d.tipo]=!S.avisos[d.tipo];
      commit();
      return}
    if(d.act==='push-ativar'){ativarPush();return}
    if(d.act==='push-parar'){pararPush();return}
    if(d.act==='mem-fechar'){view.memTela=false;view.memEdit=null;view.memApagar=null;render();return}
    if(d.act==='mem-editar'){view.memEdit=d.id;view.memApagar=null;render();return}
    if(d.act==='mem-editar-cancela'){view.memEdit=null;render();return}
    if(d.act==='mem-salvar'){
      var kindEl=document.getElementById('memKind'), textoEl=document.getElementById('memTexto');
      var kind=kindEl?kindEl.value:'contexto', texto=textoEl?String(textoEl.value).trim():'';
      fetch('/api/memoria',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:d.id, kind:kind, text:texto})})
        .then(function(r){ if(r.status===401){location.href='/login';return null} return r.json() })
        .then(function(j){
          if(j&&j.ok&&j.item){
            view.memLista=(view.memLista||[]).map(function(m){return m.id===j.item.id?j.item:m});
            view.memEdit=null; flash('Memória atualizada');
          } else if(j&&j.motivo==='sensivel') flash('Esse texto tem dado sensível. Não guardo.');
          else flash('Não deu para guardar agora.');
          if(S.tab==='ajustes') render();
        })
        .catch(function(){ flash('Não deu para guardar agora.'); });
      return}
    if(d.act==='mem-apagar'){
      if(view.memApagar!==d.id){ view.memApagar=d.id; render(); return }
      fetch('/api/memoria',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:d.id})})
        .then(function(r){ if(r.status===401){location.href='/login';return null} return r.json() })
        .then(function(j){
          if(j&&j.ok){ view.memLista=(view.memLista||[]).filter(function(m){return m.id!==d.id}); view.memApagar=null; flash('Memória apagada'); }
          else flash('Não deu para apagar agora.');
          if(S.tab==='ajustes') render();
        })
        .catch(function(){ flash('Não deu para apagar agora.'); });
      return}
    if(d.act==='cmd-confirma'){
      var cp=view.cmdProposta; if(!cp) return;
      var okCmd=false;
      if(cp.tipo==='movimento'&&cp.movimento){
        var mv=cp.movimento;
        okCmd=aplicarMovimento(mv.caixinha, mv.tipo, mv.valor, mv.motivo||'', 'manual');
        if(okCmd&&mv.tipo==='retirada') preencherMexeu(mv.motivo||'Retirada manual');
        if(okCmd) flash(mv.tipo==='retirada'?'Retirada registrada. O check-in desta semana ficou marcado; falta salvar.':'Depósito registrado');
      } else if(cp.tipo==='compra'&&cp.compra){
        var alvo=null;
        (S.ativos||[]).forEach(function(a){ if(String(a.t).toUpperCase()===String(cp.compra.ticker||'').toUpperCase()) alvo=a });
        okCmd=registrarCompra(alvo, num(cp.compra.quantidade), num(cp.compra.preco));
        if(okCmd) flash('Compra registrada');
        else flash('Esse ativo não está no Mercado.');
      } else if(cp.tipo==='retorno'&&cp.retorno&&num(cp.retorno.valor)>0){
        var negNome=cp.retorno.negocio;
        if((S.negocios||[]).indexOf(negNome)<0){ flash('Esse negócio não está mais na lista.'); return }
        if(!Array.isArray(S.movs)) S.movs=[];
        S.movs.push({id:'m'+(S.seq++), neg:negNome, tipo:'ret', valor:num(cp.retorno.valor), data:cp.retorno.data||ymd(today()), nota:''});
        okCmd=true; flash('Retorno registrado');
      }
      if(!okCmd){ if(!view.cmdResposta) view.cmdResposta='Não deu para registrar.'; render(); return }
      view.cmdProposta=null;
      view.cmdTexto='';
      commit();
      return}
    if(d.act==='mural-abrir'){view.mural=true;render();window.scrollTo(0,0);return}
    if(d.act==='sonho-novo'){view.mural=true;render();var nomeNovo=document.getElementById('sonhoNome'); if(nomeNovo){ nomeNovo.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}); nomeNovo.focus(); } return}
    if(d.act==='mural-fechar'){view.mural=false;render();window.scrollTo(0,0);return}
    if(d.act==='sonho-mais'){guardarSonho('s'+Date.now(),'Novo sonho','','',0); flash('Quadro adicionado.'); return}
    if(d.act==='sonho-menos'){var extras=sonhosExtras(); if(!extras.length){flash('O lance, o apartamento e o carro continuam no mural.');return} var ultimo=extras[extras.length-1]; S.sonhos=(S.sonhos||[]).filter(function(s){return !s||s.id!==ultimo.id}); commit(); flash('Quadro removido.'); return}
    if(d.act==='sonho-add'){var nomeEl=document.getElementById('sonhoNome'), metaEl=document.getElementById('sonhoMeta'), caixaEl=document.getElementById('sonhoCaixa');
      var nome=nomeEl?String(nomeEl.value).trim():'', meta=num(metaEl?metaEl.value:0), caixa=caixaEl?caixaEl.value:'reserva';
      if(!nome||!(meta>0)){flash('Diga o nome e a meta do sonho.');return}
      guardarSonho('s'+Date.now(),nome,caixa,'',meta); flash('Sonho no mural.'); return}
    if(d.act==='sonho-del'){var sid2=d.sonho; if(pendingDel!=='s:'+sid2){pendingDel='s:'+sid2;render();return}
      S.sonhos=(S.sonhos||[]).filter(function(s){return s.id!==sid2}); pendingDel=null; commit(); return}
    if(d.act==='linha-abrir'){view.linha=true;view.estante=false;render();window.scrollTo(0,0);return}
    if(d.act==='estante-abrir'){view.estante=true;view.linha=false;render();window.scrollTo(0,0);return}
    if(d.act==='estante-fechar'){view.estante=false;render();window.scrollTo(0,0);return}
    if(d.act==='sab-toggle'){S.cfg.esconderSabedoria=!S.cfg.esconderSabedoria;commit();return}
    if(d.act==='livro-add'){var lt=document.getElementById('lvTitulo'), la=document.getElementById('lvAutor');
      var ltit=lt?String(lt.value).trim().slice(0,120):'', laut=la?String(la.value).trim().slice(0,80):'';
      if(!ltit){flash('Diga o título do livro.');return}
      if(!Array.isArray(S.livros)) S.livros=[];
      S.livros.push({id:'b'+Date.now(), titulo:ltit, autor:laut, status:'quero ler', inicio:'', fim:'', ideia:''});
      commit(); flash('Livro na estante.'); return}
    if(d.act==='livro-status'){var lb=livroPorId(d.livro); if(!lb) return;
      lb.status=d.st==='lendo'||d.st==='lido'?d.st:'quero ler';
      if(lb.status==='lendo'&&!lb.inicio) lb.inicio=ymd(today());
      if(lb.status==='lido'&&!lb.fim) lb.fim=ymd(today());
      commit(); return}
    if(d.act==='livro-del'){var lid=d.livro; if(pendingDel!=='l:'+lid){pendingDel='l:'+lid;render();return}
      S.livros=livrosLista().filter(function(b){return b.id!==lid}); pendingDel=null; commit(); return}
    if(d.act==='linha-fechar'){view.linha=false;render();window.scrollTo(0,0);return}
    if(d.act==='tl-print'){window.print();return}
    if(d.act==='tl-add'){
      var dataEl=document.getElementById('tlData'), titEl=document.getElementById('tlTitulo'), txtEl=document.getElementById('tlTexto'), fotoEl=document.getElementById('tlFoto');
      var data=dataEl&&dataEl.value?dataEl.value:ymd(today());
      var titulo=titEl?String(titEl.value).trim().slice(0,80):'';
      var texto=txtEl?String(txtEl.value).trim().slice(0,280):'';
      if(!titulo){flash('Dê um título ao momento.');return}
      var file=fotoEl&&fotoEl.files&&fotoEl.files[0];
      function gravar(foto){
        if(!Array.isArray(S.timeline)) S.timeline=[];
        S.timeline.push({id:'t'+Date.now(), data:data, titulo:titulo, texto:texto, foto:foto||''});
        commit(); flash('Momento na linha.');
      }
      if(!file){gravar('');return}
      var mid='t'+Date.now();
      reduzirFoto(file,function(blob){
        if(!blob){flash('Não consegui preparar a foto.');return}
        var fd=new FormData(); fd.append('id',mid); fd.append('file',blob,mid+'.jpg');
        fetch('/api/upload',{method:'POST',body:fd}).then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})}).then(function(x){
          if(!x.ok||!x.j||!x.j.path){flash((x.j&&x.j.error)||'A foto não foi salva.');return}
          if(!Array.isArray(S.timeline)) S.timeline=[];
          S.timeline.push({id:mid, data:data, titulo:titulo, texto:texto, foto:x.j.path});
          commit(); flash('Momento na linha.');
        }).catch(function(){flash('Sem conexão para enviar a foto.')});
      });
      return}
    if(d.act==='tl-del'){var tid=d.tl; if(pendingDel!=='t:'+tid){pendingDel='t:'+tid;render();return}
      S.timeline=(S.timeline||[]).filter(function(m){return m.id!==tid}); pendingDel=null; commit(); return}
    if(d.act==='se-salvar'){var sv=seValores(); if(!Array.isArray(S.cenarios)) S.cenarios=[];
      S.cenarios.push({data:ymd(today()), extra:sv.extra, aporte:sv.aporte, taxa:sv.taxa});
      commit(); flash('Cenário salvo.'); return}
    if(d.act==='desejo-open'){view.desejoOpen=true;render();var box=document.getElementById('desejo');if(box)box.scrollIntoView({block:'nearest'});return}
    if(d.act==='desejo-fechar'||d.act==='desejo-comprar'){view.desejoOpen=false;view.desejoOut=null;view.desejoPick=false;render();return}
    if(d.act==='desejo-cfg'){var renda=document.getElementById('desejoRenda'), horas=document.getElementById('desejoHoras');
      var rv=renda?String(renda.value).trim():'', hv=horas?String(horas.value).trim():'';
      if(!(num(rv)>0)||!(num(hv)>0)){flash('Informe a renda e as horas, maiores que zero.');return}
      S.cfg.rendaLiquida=num(rv);S.cfg.horasMes=num(hv);commit();flash('Números do trabalho salvos');return}
    if(d.act==='desejo-calc'){var valEl=document.getElementById('desejoVal'), descEl=document.getElementById('desejoDesc');
      var valor=num(valEl?valEl.value:0), desc=descEl?String(descEl.value).trim():'';
      if(!(valor>0)){flash('Informe um valor maior que zero.');return}
      var renda=num(S.cfg.rendaLiquida), horasMes=num(S.cfg.horasMes);
      var horas=valor/(renda/horasMes), dias=horas/(horasMes/30), sobra=livre(), meta=metaDoDesejo();
      view.desejoOpen=true;view.desejoPick=false;
      view.desejoOut={valor:valor,desc:desc,horas:horas,dias:dias,atraso:sobra>0?valor*30/sobra:null,meta:meta,w:fv(0,120,valor)};
      render();return}
    if(d.act==='desejo-pick'){if(!view.desejoOut)return;view.desejoPick=true;render();return}
    if(d.act==='desejo-guardar'){var out=view.desejoOut; if(!out||!(out.valor>0))return;
      var sel=document.getElementById('desejoCaixa'), caixa=sel?sel.value:'reserva';
      if(!S.saldos||S.saldos[caixa]==null){flash('Escolha uma caixinha.');return}
      if(!Array.isArray(S.escolhas)) S.escolhas=[];
      S.saldos[caixa]=Math.round((num(S.saldos[caixa])+out.valor)*100)/100;
      S.escolhas.push({data:ymd(today()),valor:Math.round(out.valor*100)/100,descricao:out.desc||'',caixinha:caixa});
      anotarCaixa(caixa,'deposito',out.valor,ymd(today()),out.desc||'Escolha de guardar','escolha');
      motion.escolha=true;
      view.desejoOpen=false;view.desejoOut=null;view.desejoPick=false;
      commit();flash('Guardado.');return}
    if(d.act==='comprei'){var al=arcaAlloc(), saiuArca=num(S.saldos.arcaInvestir);['A','R','C','I'].forEach(function(k,i){S.saldos[k]+=al[i]});S.saldos.arcaInvestir=0;round();anotarCaixa('arcaInvestir','retirada',saiuArca,ymd(today()),'Compra da ARCA','compra_arca');commit();flash('Compra registrada');return}
    if(d.act==='div'){var v=num(document.getElementById('divIn').value); if(v>0){S.saldos.dividendos+=v;S.saldos.arcaInvestir+=v;round();anotarCaixa('arcaInvestir','deposito',v,ymd(today()),'Dividendo','dividendo');commit();flash('Dividendo registrado')}return}
    if(d.act==='cx-hist'){view.cxHist=d.cx;view.cxTipo='todos';render();window.scrollTo(0,0);return}
    if(d.act==='cx-voltar'){view.cxHist='';render();return}
    if(d.act==='cx-tipo'){view.cxTipo=d.tipo||'todos';render();return}
    if(d.act==='cx-form'){view.cxForm=d.cx+'|'+d.tipo;view.cxPend=null;render();return}
    if(d.act==='cx-cancela'){view.cxPend=null;render();return}
    if(d.act==='cx-ok'){
      var valorCx=num((document.getElementById('cxv')||{}).value), motivoCx=String((document.getElementById('cxm')||{}).value||'').trim();
      if(!(valorCx>0)){flash('Informe um valor maior que zero.');return}
      if(d.tipo==='retirada'&&d.cx!=='arcaInvestir'&&!motivoCx){flash('Diga o motivo da retirada.');return}
      if(d.tipo==='deposito'){
        if(aplicarMovimento(d.cx,'deposito',valorCx,motivoCx,'manual')){view.cxForm='';commit();flash('Depósito registrado')}
        return}
      var ritmo=ritmoSemanal(d.cx);
      view.cxPend={id:d.cx, valor:Math.round(valorCx*100)/100, motivo:motivoCx, dias:ritmo>0?Math.max(1,Math.round(valorCx/ritmo*7)):null};
      render();return}
    if(d.act==='cx-confirma'){
      var pend=view.cxPend; if(!pend)return;
      if(aplicarMovimento(pend.id,'retirada',pend.valor,pend.motivo,'manual')){
        preencherMexeu(pend.motivo||'Retirada manual');
        view.cxPend=null;view.cxForm='';
        commit();flash('Retirada registrada. O check-in desta semana ficou marcado; falta salvar.');
      }
      return}
    if(d.act==='cx-conf'){view.cxConf=!view.cxConf;view.cxDiff=null;render();return}
    if(d.act==='cx-comparar'){
      view.cxDiff=CAIXAS.map(function(c){
        var app=num((document.getElementById('cxn-'+c.id)||{}).value), portal=num(S.saldos[c.id]);
        return {id:c.id, app:app, portal:portal, igual:Math.abs(app-portal)<0.01};
      });
      if(view.cxDiff.every(function(x){return x.igual})){
        S.conferencia={data:ymd(today()), ok:true};
        view.cxConf=false;view.cxDiff=null;commit();flash('Conferência feita. Os valores batem.');
      } else render();
      return}
    if(d.act==='cx-ajustar'){
      var item=(view.cxDiff||[]).filter(function(x){return x.id===d.cx})[0];
      if(!item)return;
      var delta=Math.round((item.app-num(S.saldos[d.cx]))*100)/100;
      if(Math.abs(delta)>=0.01){
        if(delta>0) aplicarMovimento(d.cx,'deposito',delta,'Ajuste de conferência','manual');
        else aplicarMovimento(d.cx,'retirada',-delta,'Ajuste de conferência','manual');
      }
      item.portal=num(S.saldos[d.cx]); item.igual=Math.abs(item.app-item.portal)<0.01;
      if(view.cxDiff.every(function(x){return x.igual})){
        S.conferencia={data:ymd(today()), ok:true};
        view.cxConf=false;view.cxDiff=null;commit();flash('Portal ajustado ao app.');
      } else { commit(); render() }
      return}
    if(d.act==='cx-contas'){
      if(!Array.isArray(S.outrasContas)) S.outrasContas=[];
      S.outrasContas.forEach(function(c,i){
        var nomeEl=document.getElementById('cxo-nome-'+i), funEl=document.getElementById('cxo-fun-'+i), salEl=document.getElementById('cxo-saldo-'+i);
        c.nome=nomeEl?String(nomeEl.value).trim():c.nome;
        c.funcao=funEl?String(funEl.value).trim():(c.funcao||'');
        c.saldo=salEl?num(salEl.value):num(c.saldo);
      });
      commit();flash('Contas salvas');return}
    if(d.act==='cx-conta-add'){if(!Array.isArray(S.outrasContas)) S.outrasContas=[];S.outrasContas.push({nome:'',funcao:'',saldo:0});commit();return}
    if(d.ai){perguntar(d.ai);return}
    if(d.act==='aistop'){if(aiCtl)aiCtl.abort();return}
    if(d.act==='ai-cancela'){
      view.aiPropostas=(view.aiPropostas||[]).filter(function(_,idx){return idx!==+d.i});
      render(); return}
    if(d.act==='ai-confirma'){
      var prop=(view.aiPropostas||[])[+d.i];
      if(!prop) return;
      var okProp=false;
      if(prop.tipo==='movimento'&&prop.movimento){
        var mv=prop.movimento;
        okProp=aplicarMovimento(mv.caixinha, mv.tipo, mv.valor, mv.motivo||'', 'manual');
        if(okProp&&mv.tipo==='retirada') preencherMexeu(mv.motivo||'Retirada manual');
        if(okProp) flash(mv.tipo==='retirada'?'Retirada registrada. O check-in desta semana ficou marcado; falta salvar.':'Depósito registrado');
      } else if(prop.tipo==='checkin'&&prop.checkin&&/^\d{4}-\d{2}-\d{2}$/.test(prop.checkin.sabado||'')){
        var camposCi={};
        ['gastos','extra','mexeu','motivo','negocios','vitoria','escorreguei','foraNormal','extraOrigem'].forEach(function(k){
          var val=prop.checkin.campos&&prop.checkin.campos[k];
          if(val!=null&&val!=='') camposCi[k]=val;
        });
        S.checkins[prop.checkin.sabado]=Object.assign({mexeu:'não'}, S.checkins[prop.checkin.sabado]||{}, camposCi);
        okProp=true; flash('Check-in salvo ✓');
      } else if(prop.tipo==='meta'&&prop.meta&&{reservaMeta:1,lanceMeta:1,aptoMeta:1,carroMeta:1,lanceMensal:1}[prop.meta.chave]&&num(prop.meta.valor)>0){
        S.cfg[prop.meta.chave]=num(prop.meta.valor);
        okProp=true; flash('Meta atualizada');
      }
      if(!okProp){ flash('Não deu para registrar.'); return }
      view.aiPropostas=(view.aiPropostas||[]).filter(function(_,idx){return idx!==+d.i});
      commit(); return}
    if(d.act==='usemeta'){var meta=num(d.meta); if(meta>0){S.cfg.reservaMeta=meta;commit();flash('Meta da reserva atualizada')} return}
    if(d.bolsa){
      view.bolsaTipo=view.bolsaTipo===d.bolsa?'':d.bolsa;
      view.bolsaPage=1;
      document.querySelectorAll('[data-bolsa]').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.bolsa===view.bolsaTipo?'true':'false') });
      carregarBolsa(false);
      return}
    if(d.act==='bolsa-mais'){ if(!view.bolsaMais) return; view.bolsaPage=(view.bolsaPage||1)+1; carregarBolsa(true); return }
    if(d.act==='bolsa-add'){
      var item=(view.bolsaItens||[])[+d.i];
      if(!item) return;
      if(S.ativos.some(function(a){ return String(a.t).toUpperCase()===item.t })){ flash('Esse ativo já está no painel'); return }
      var preco=num(item.preco);
      S.ativos.push({t:item.t,l:'',nome:item.nome,classe:item.classe,tipo:item.tipo,qtd:0,pm:0,preco:preco,hist:preco>0?[{d:ymd(today()),p:preco}]:[],livre:true});
      commit(); flash(item.t+' incluído em '+item.tipoNome); return}
    if(d.act==='merc-novo'){view.mercNovo=!view.mercNovo; if(!view.mercNovo){ view.bolsaMsg=''; } render(); if(view.mercNovo){ var bq=document.getElementById('bolsaQ'); if(bq) bq.focus() } return}
    if(d.act==='ativo-add'){
      var nvC=document.getElementById('nvClasse'), nvTp=document.getElementById('nvTipo'), nvTk=document.getElementById('nvT'), nvNm=document.getElementById('nvN'), nvL=document.getElementById('nvL');
      var classe=nvC?nvC.value:'rv', tipo=nvTp?nvTp.value:'', ticker=String(nvTk?nvTk.value:'').trim().toUpperCase().replace(/\s+/g,' '), nome=String(nvNm?nvNm.value:'').trim(), letra=nvL?nvL.value:'';
      if(!ticker){flash('Digite o código do ativo');return}
      if(!infoTipo(classe,tipo).tid||infoTipo(classe,tipo).tid!==tipo){flash('Escolha a classe e o tipo');return}
      if(S.ativos.some(function(a){return String(a.t).toUpperCase()===ticker})){flash('Esse ativo já está no painel');return}
      if(['A','R','C','I'].indexOf(letra)<0) letra='';
      S.ativos.push({t:ticker,l:letra,nome:nome||ticker,classe:classe,tipo:tipo,qtd:0,pm:0,preco:0,hist:[],livre:true});
      commit(); flash('Ativo incluído em '+infoTipo(classe,tipo).classe+' · '+infoTipo(classe,tipo).tipo); return}
    if(d.act==='ativo-tirar'){
      var ix=+d.i, alvo=S.ativos[ix];
      if(!alvo||!alvo.livre||alvo.qtd>0){flash('Só dá para tirar um ativo incluído por você, com quantidade zerada');return}
      var chaveAt='at:'+ix; if(pendingDel!==chaveAt){pendingDel=chaveAt;render();return}
      S.ativos.splice(ix,1); pendingDel=null; commit(); flash('Ativo tirado'); return}
    if(d.act==='venda'){var vi=+document.getElementById('vdAt').value, vq=num(document.getElementById('vdQ').value), vp=num(document.getElementById('vdP').value), vat=S.ativos[vi];
      if(!(vq>0&&vp>0)||!vat){flash('Digite a quantidade e o preço');return}
      if(vq>vat.qtd+1e-9){flash('Quantidade acima da posição');return}
      var bruto=Math.round(vq*vp*100)/100;
      vat.qtd=Math.round((vat.qtd-vq)*10000)/10000;
      if(vat.qtd<=0){vat.qtd=0;vat.pm=0}
      if(['A','R','C','I'].indexOf(vat.l)>=0) S.saldos[vat.l]=Math.max(0,Math.round((S.saldos[vat.l]-bruto)*100)/100);
      S.saldos.arcaInvestir=Math.round((S.saldos.arcaInvestir+bruto)*100)/100;
      setPreco(vat,vp); commit(); flash('Venda registrada'); return}
    if(d.act==='compra'){var ai=+document.getElementById('cpAt').value, q=num(document.getElementById('cpQ').value), pr=num(document.getElementById('cpP').value);
      var at=S.ativos[ai]; if(!registrarCompra(at,q,pr)){flash(!at?'Escolha o ativo':'Digite a quantidade e o preço');return} commit(); flash('Compra registrada'); return}
    if(d.act==='quotes'){var tks=S.ativos.filter(function(a){return /^[A-Z0-9]{4,8}$/.test(a.t)}).map(function(a){return a.t});
      flash('Buscando cotações…');
      fetch('/api/quotes?tickers='+tks.join(',')).then(function(r){if(r.status===401){location.href='/login';throw 0}return r.json()}).then(function(j){
        var n=0; S.ativos.forEach(function(a){var q=j.quotes&&j.quotes[a.t]; if(q&&q.price>0){setPreco(a,q.price); n++}});
        S.ultimaCotacao=new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); commit(); flash(n?n+' cotações atualizadas':(j.error||'Nenhuma cotação recebida. Confira a chave da brapi no servidor.'));
      }).catch(function(e){if(e!==0)flash('Não foi possível buscar as cotações')}); return}
    if(d.act==='sync'){var sums={A:0,R:0,C:0,I:0}; S.ativos.forEach(function(a){ if(sums[a.l]!=null) sums[a.l]+=a.qtd*a.preco }); ['A','R','C','I'].forEach(function(k){S.saldos[k]=Math.round(sums[k]*100)/100}); commit(); flash('Saldos da ARCA atualizados'); return}
    if(d.act==='addmov'){var val=num(document.getElementById('mVal').value); if(!(val>0)){flash('Digite um valor');return}
      S.movs.push({id:'m'+(S.seq++),neg:document.getElementById('mNeg').value,tipo:view.movTipo,valor:val,data:document.getElementById('mData').value||ymd(today()),nota:document.getElementById('mNota').value.trim()});commit();flash('Registrado');return}
    if(d.act==='addneg'){var nm=document.getElementById('novoNeg').value.trim(); if(nm&&S.negocios.indexOf(nm)<0){S.negocios.push(nm);commit()}return}
    if(d.act==='export'){var blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a2=document.createElement('a');a2.href=u;a2.download='portal-tiago-'+ymd(today())+'.json';a2.click();setTimeout(function(){URL.revokeObjectURL(u)},1000);return}
    if(d.act==='excel'){exportarExcel();return}
    if(d.act==='addac'){S.acordos.push({nome:'Novo acordo',valor:0,inicio:ymd(today()).slice(0,7),n:1});commit();return}
    if(d.deln!=null){var k3='n:'+d.deln; if(pendingDel!==k3){pendingDel=k3;render();return} S.negocios=S.negocios.filter(function(n){return n!==d.deln});S.movs=S.movs.filter(function(m){return m.neg!==d.deln});pendingDel=null;commit();return}
    if(d.delm){var k4='m:'+d.delm; if(pendingDel!==k4){pendingDel=k4;render();return} S.movs=S.movs.filter(function(m){return m.id!==d.delm});pendingDel=null;commit();return}
    if(d.dela!=null){var k5='a:'+d.dela; if(pendingDel!==k5){pendingDel=k5;render();return} S.acordos.splice(+d.dela,1);pendingDel=null;commit();return}
  });
  function flushCi(){document.querySelectorAll('[data-ci-f]').forEach(function(el){ciDraft[el.dataset.ciF]=el.value})}
  function round(){['reserva','lance','apto','carro','arcaInvestir','A','R','C','I','dividendos'].forEach(function(k){S.saldos[k]=Math.round(S.saldos[k]*100)/100})}

  function adotarLocal(){
    try{var ls=localStorage.getItem('portal-tiago'); if(ls){var o=JSON.parse(ls); if(o&&o.cfg) S=mergeState(o)}}catch(x){}
  }
  render();
  fetch('/api/state').then(function(r){ if(r.status===401){location.href='/login';throw 0} if(!r.ok) throw new Error('state'); return r.json() })
    .then(function(j){
      var tinha=!!(j&&j.state&&j.state.cfg);
      if(tinha) S=mergeState(j.state); else adotarLocal();
      loaded=true; mode=(j&&j.storage)==='supabase'?'supabase':'file';
      var antes=JSON.stringify(S.bandaFora||{});
      atualizarBanda();
      render();
      armarLembrete();
      if(!tinha||JSON.stringify(S.bandaFora||{})!==antes) save();
    })
    .catch(function(e){ if(e===0) return; adotarLocal(); loaded=true; mode='local'; atualizarBanda(); render(); armarLembrete(); flash('Sem conexão com o servidor. Alterações ficam neste navegador.'); });
  fetch('/sabedoria.json').then(function(r){ if(!r.ok) throw 0; return r.json() }).then(function(j){
    if(!Array.isArray(j)||!j.length) return;
    SAB=j; if(loaded) render();
  }).catch(function(){});
})();
