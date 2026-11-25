import {parsePacket,inside,fresh,accrue,ranked,tied,windAt,dronePosition} from './engine.mjs';
const $=id=>document.getElementById(id),ids=['A','B'],palette=[['#e88b67','#fff0df'],['#408f83','#dff4ed']];
let players=ids.map((id,i)=>({id,name:'플레이어 '+id,roll:0,pitch:0,seen:null,x:0,y:0,current:0,best:0,total:0})),state='idle',demo=false,port=null,reader=null,connecting=false,game=0,started=0,deadline=0,last=0,packets=0,logs=[],history=[],windSeed=0,currentWind={x:0,y:0};
try{const h=JSON.parse(localStorage.getItem('neo-city-wind-v2')||'[]');if(Array.isArray(h))history=h.filter(x=>x&&Array.isArray(x.results)).slice(0,50)}catch{}
const number=()=>+$('count').value,active=()=>players.slice(0,number()),tolerance=()=>+$('level').value;
function log(text){logs.unshift(new Date().toLocaleTimeString('ko-KR')+'  '+text);logs=logs.slice(0,40);$('logs').textContent=logs.join('\n')}
$('players').innerHTML=players.map((p,i)=>`<article class="card" id="card${i}" style="--color:${palette[i][0]};--tint:${palette[i][1]}"><div class="cardhead"><span class="badge">${p.id}</span><div style="min-width:0"><input class="name" aria-label="플레이어 ${p.id} 이름" id="name${i}" value="${p.name}" maxlength="20"><div class="status" id="status${i}">● 수신 대기</div></div></div><div class="flight-zone"><div class="city-silhouette" aria-hidden="true"></div><span class="district">PILOT ${p.id} · 바람 속 중심 찾기</span><div class="levelboard"><div class="target" id="target${i}"></div><span class="axis top">앞</span><span class="axis bottom">뒤</span><div class="pad-label">H</div><div class="drone-shadow"></div><div class="ball" id="ball${i}"><div class="drone-visual"><span class="drone-arm arm-l"></span><span class="drone-arm arm-r"></span><span class="rotor rotor-tl"><i></i></span><span class="rotor rotor-tr"><i></i></span><span class="rotor rotor-bl"><i></i></span><span class="rotor rotor-br"><i></i></span><span class="motor motor-l"></span><span class="motor motor-r"></span><span class="landing-leg leg-l"></span><span class="landing-leg leg-r"></span><span class="landing-skid"></span><span class="drone-body"><span class="drone-light"></span></span></div></div><div class="flight-spark spark-one">✦</div><div class="flight-spark spark-two">✧</div></div></div><div class="angles"><span id="roll${i}">좌우 0°</span><span id="pitch${i}">앞뒤 0°</span></div><span class="verdict" id="verdict${i}">연결을 기다려요</span><div class="bestline"><span>최장 연속 유지</span><b><span id="best${i}" style="font:inherit;color:inherit">0.0</span><small>초</small></b></div><div class="stats"><span>현재 <strong id="current${i}">0.0초</strong></span><span>누적 <strong id="total${i}">0.0초</strong></span></div></article>`).join('');
players.forEach((p,i)=>$('name'+i).oninput=()=>{p.name=$('name'+i).value.trim()||'플레이어 '+p.id;render()});
function drawHistory(){const el=$('history');el.replaceChildren();if(!history.length){el.textContent='첫 번째 균형의 순간을 기다리고 있어요.';return}history.slice(0,12).forEach(h=>{const row=document.createElement('div');row.className='record';row.textContent=new Date(h.date).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+' · '+(h.demo?'[시연] ':'')+h.tolerance+'% / '+h.duration+'초 · '+h.results.map(p=>p.name+' '+Number(p.best).toFixed(1)+'초').join(' · ');el.append(row)})}
function render(){const now=performance.now();$('players').dataset.count=number();document.querySelector('.subtitle').textContent=number()===1?'바람의 반대 방향으로 기울여 드론을 중심에 유지하세요.':'두 드론에 동일한 바람이 불어옵니다. 반대 방향으로 기울여 중심을 지키세요.';players.forEach((p,i)=>{const ok=fresh(p,now),good=ok&&inside(p,tolerance());$('card'+i).hidden=i>=number();$('card'+i).classList.toggle('balanced',good);$('status'+i).textContent=demo?'● 가상 데이터':ok?'● 수신 중':'● 수신 대기 / 끊김';$('roll'+i).textContent='좌우 조종 '+p.roll.toFixed(0)+'°';$('pitch'+i).textContent='상하 조종 '+p.pitch.toFixed(0)+'°';const board=$('ball'+i).parentElement,w=board.clientWidth;const scale=w/100;const r=Math.hypot(p.x,p.y),factor=r>43?43/r:1;$('ball'+i).style.transform=`translate(${p.x*factor*scale}px,${p.y*factor*scale}px) rotate(${Math.max(-22,Math.min(22,p.x*.8))}deg)`;$('ball'+i).style.opacity=ok?1:.25;$('target'+i).style.width=$('target'+i).style.height=(tolerance()*2*scale)+'px';$('verdict'+i).textContent=!ok?'비행 신호를 기다려요':good?'✦ 퍼펙트 호버링!':'착륙장 중심으로 이동!';$('best'+i).textContent=p.best.toFixed(1);$('current'+i).textContent=p.current.toFixed(1)+'초';$('total'+i).textContent=p.total.toFixed(1)+'초'});const sorted=ranked(active()),el=$('ranking');el.replaceChildren();sorted.forEach((p,i)=>{const row=document.createElement('div');row.className='rankrow';let rank=sorted.findIndex(v=>tied(v,p))+1;const a=document.createElement('span');a.className='rank';a.textContent=rank;const b=document.createElement('span');b.className='person';b.textContent=p.name;const c=document.createElement('b');c.textContent=p.best.toFixed(1)+'초';const d=document.createElement('small');d.textContent='누적 '+p.total.toFixed(1)+'초';row.append(a,b,c,d);el.append(row)})}
function lock(on){['count','level','duration','demo','connect'].forEach(id=>$(id).disabled=on||id==='connect'&&connecting);players.forEach((p,i)=>$('name'+i).disabled=on)}
function reset(message=number()===1?'혼자서 바람에 도전! 기울여 드론을 중앙에 유지하세요.':'같은 바람, 두 조종사. 기울여 드론을 중앙에 유지하세요.'){game++;state='idle';players.forEach(p=>{p.current=0;p.best=0;p.total=0;p.x=0;p.y=0});$('phase').textContent='● READY';$('message').textContent=message;$('time').textContent=(+$('duration').value).toFixed(1);$('timebar').style.width='100%';$('start').textContent='▶ 게임 시작';lock(false);render()}
function advance(now){if(state!=='running')return;const end=Math.min(now,deadline);active().forEach(p=>accrue(p,last,end,tolerance()));last=end;if(now>=deadline)finish()}
function finish(){if(state!=='running')return;state='finished';const sorted=ranked(active()),winners=sorted.filter(p=>tied(p,sorted[0]));$('phase').textContent='● COMPLETE';$('message').textContent=sorted[0].best>0?'🏆 '+winners.map(p=>p.name).join(' · ')+' · 최고 '+sorted[0].best.toFixed(1)+'초':'라운드 종료 · 균형 유지 기록이 없어요';$('start').textContent='▶ 다시 도전';$('time').textContent='0.0';$('timebar').style.width='0';lock(false);history.unshift({date:new Date().toISOString(),windSeed,mission:'shared-wind',demo,tolerance:tolerance(),duration:+$('duration').value,results:active().map(p=>({id:p.id,name:p.name,best:+p.best.toFixed(1),total:+p.total.toFixed(1)}))});history=history.slice(0,50);try{localStorage.setItem('neo-city-wind-v2',JSON.stringify(history))}catch{log('브라우저 기록 저장 실패. CSV로 저장하세요.')}drawHistory();log('경기 종료 · 최장 '+sorted[0].best.toFixed(1)+'초');render()}
function accept(line){const data=parsePacket(line);if(!data){log('형식 확인: '+line.slice(0,70));return}if(!ids.includes(data.id))return;const now=performance.now();advance(now);const p=players[ids.indexOf(data.id)];p.roll=data.roll;p.pitch=data.pitch;p.seen=now;Object.assign(p,dronePosition(p.roll,p.pitch,currentWind));if(state==='running'&&!inside(p,tolerance()))p.current=0;packets++;$('packets').textContent=packets+' packets';}
$('start').onclick=()=>{if(state==='running'||state==='countdown'){reset('경기를 취소했습니다. 기록은 저장하지 않았어요.');log('운영자 경기 취소');return}if(connecting)return;if(!demo&&(!port||active().some(p=>!fresh(p,performance.now())))){$('message').textContent='참가자 전원의 수신 상태를 확인하거나 시연 모드를 켜주세요.';log('시작 대기: 참가자 수신 확인 필요');return}reset();lock(true);state='countdown';const token=game;const until=performance.now()+3000;$('phase').textContent='● GET READY';$('start').textContent='■ 경기 취소';function countdown(){if(token!==game)return;const now=performance.now(),remain=until-now;if(remain>0){$('time').textContent=Math.ceil(remain/1000);$('message').textContent='조종사 준비! 평평하게 들고 이륙을 기다리세요.';requestAnimationFrame(countdown)}else{if(!demo&&active().some(p=>!fresh(p,now))){reset('신호가 끊겨 시작하지 못했어요. 연결 후 다시 시작하세요.');return}windSeed=Math.floor(Math.random()*1000000000);state='running';started=last=now;currentWind=windAt(0,windSeed);deadline=now+(+$('duration').value)*1000;$('phase').textContent=demo?'● DEMO LIVE':'● LIVE';$('message').textContent='바람의 반대 방향으로 기울여 드론을 중앙 원에 유지하세요.';log('경기 시작 · '+number()+'인 / 반경 '+tolerance()+'% / 바람 '+windSeed)}}countdown()};
$('reset').onclick=()=>reset();['count','level','duration'].forEach(id=>$(id).onchange=()=>reset());
$('demo').onclick=()=>{demo=!demo;players.forEach(p=>p.seen=null);$('demo').textContent='시연 모드 '+(demo?'ON':'OFF');$('demoPanel').hidden=!demo;$('connection').textContent=demo?'● 가상 데이터 시연':port?'● USB 연결됨':'● 장치 연결 대기';reset();log(demo?'시연 모드: 실제 장치 기록이 아닙니다.':'실제 장치 모드')};
['roll','pitch'].forEach(axis=>$(axis+'Input').oninput=()=>{$('auto').checked=false;$(axis+'Out').textContent=$(axis+'Input').value+'°'});
setInterval(()=>{
 const now=performance.now();advance(now);
 if(state==='running')currentWind=windAt((now-started)/1000,windSeed);
 else if(state==='finished'){} else currentWind={x:0,y:0};
 if(demo){const t=(now-started)/1000;players.forEach((p,i)=>{
  const manual=i===0&&!$('auto').checked;
  p.roll=manual?+$('rollInput').value:-currentWind.x/1.1+Math.sin(t*(.9+i*.15)+i)*(2+i);
  p.pitch=manual?+$('pitchInput').value:-currentWind.y/1.1+Math.cos(t*(.7+i*.1)+i)*(2+i);
  p.seen=now;
 });}
 players.forEach(p=>{Object.assign(p,dronePosition(p.roll,p.pitch,currentWind));if(state==='running'&&(!fresh(p,now)||!inside(p,tolerance())))p.current=0;});
 if(state==='running'){
  $('time').textContent=Math.max(0,(deadline-now)/1000).toFixed(1);
  $('timebar').style.width=(100*Math.max(0,deadline-now)/(deadline-started))+'%';
 }
 $('windInfo').textContent='같은 바람이 불어요 · 좌우 '+currentWind.x.toFixed(1)+' / 상하 '+currentWind.y.toFixed(1);
 render();
},50);
async function cleanup(p){if(reader){await reader.cancel().catch(()=>{})}await p.close().catch(()=>{});if(port===p)port=null;players.forEach(x=>x.seen=null);$('connect').textContent='＋ 마이크로비트 연결';$('connection').textContent=demo?'● 가상 데이터 시연':'● 장치 연결 대기';render()}
$('connect').onclick=async()=>{if(connecting)return;if(port){const p=port;await cleanup(p);log('USB 연결 해제');return}if(!navigator.serial){$('guide').showModal();log('PC Chrome / Edge의 Web Serial 지원 브라우저가 필요합니다.');return}connecting=true;lock(false);try{const p=await navigator.serial.requestPort();await p.open({baudRate:115200});port=p;connecting=false;if(demo){demo=false;$('demo').textContent='시연 모드 OFF';$('demoPanel').hidden=true}players.forEach(x=>x.seen=null);$('connect').textContent='연결 해제';$('connection').textContent='● USB 연결됨';lock(false);log('USB 연결 완료 · 115200 baud');let buffer='',decoder=new TextDecoder();reader=p.readable.getReader();try{while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop();if(!demo)lines.forEach(accept);if(buffer.length>2048){buffer='';log('수신 버퍼 초기화 · 줄바꿈을 확인하세요.')}}}finally{reader.releaseLock();reader=null;if(state==='running'||state==='countdown')reset('USB 연결이 끊겨 경기를 취소했습니다.');await cleanup(p)}}catch(e){if(e.name!=='NotFoundError')log('연결 오류: '+e.message);if(port)await cleanup(port)}finally{connecting=false;lock(state==='running'||state==='countdown')}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='running'||state==='countdown')){reset('화면 전환으로 경기를 취소했습니다. 다시 시작하세요.');log('탭 비활성화 · 경기 취소')}});
function download(text,filename,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('export').onclick=()=>{if(!history.length){log('저장할 경기 기록이 없습니다.');return}const esc=v=>'"'+String(v).replace(/^[=+@-]/,"'").replaceAll('"','""')+'"',rows=[['일시','시연','목표 반경(%)','경기시간','ID','이름','최장연속초','누적유지초']];history.forEach(h=>h.results.forEach(p=>rows.push([h.date,h.demo,h.tolerance,h.duration,p.id,p.name,p.best,p.total])));download('\ufeff'+rows.map(r=>r.map(esc).join(',')).join('\r\n'),'balance-master-results.csv','text/csv;charset=utf-8')};
$('guideBtn').onclick=()=>$('guide').showModal();$('close').onclick=()=>$('guide').close();$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{log('이 브라우저는 전체화면을 지원하지 않습니다.')}};
function playerCode(){return `// 이 장치의 ID: ${$('codeId').value}. 무선 참가자는 서로 다른 ID를 쓰세요.
let player = "${$('codeId').value}"
radio.setGroup(43)
radio.setTransmitPower(7)
serial.redirectToUSB()
serial.setBaudRate(BaudRate.BaudRate115200)
basic.showString(player)
basic.forever(function () {
    let roll = input.rotation(Rotation.Roll)
    let pitch = input.rotation(Rotation.Pitch)
    let packet = player + "," + roll + "," + pitch
    // 1인 USB 직접 연결과 다인 무선 연결을 모두 지원
    serial.writeLine(packet)
    radio.sendString(packet)
    basic.pause(80 + randint(0, 40))
})`}
const receiverCode=`// 무선 수신기: PC에 USB로 연결하는 별도 장치
radio.setGroup(43)
serial.redirectToUSB()
serial.setBaudRate(BaudRate.BaudRate115200)
radio.onReceivedString(function (packet) {
    serial.writeLine(packet)
})
basic.showIcon(IconNames.SmallDiamond)`;
$('playerCode').textContent=playerCode();$('receiverCode').textContent=receiverCode;$('codeId').onchange=()=>$('playerCode').textContent=playerCode();$('downloadPlayer').onclick=()=>download(playerCode(),'balance-player-'+$('codeId').value+'.ts');$('downloadReceiver').onclick=()=>download(receiverCode,'balance-receiver.ts');drawHistory();reset();
