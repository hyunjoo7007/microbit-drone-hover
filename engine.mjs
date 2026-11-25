export const FRESH_MS=500;
export function parsePacket(line){const m=/^([AB]),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(line.trim());if(!m)return null;const roll=Number(m[2]),pitch=Number(m[3]);if(Math.abs(roll)>180||Math.abs(pitch)>180)return null;return {id:m[1],roll,pitch};}
export function inside(p,tolerance){return Math.hypot(p.x ?? p.roll,p.y ?? p.pitch)<=tolerance;}
export function fresh(p,now){return p.seen!==null&&now-p.seen<=FRESH_MS;}
export function accrue(p,from,to,tolerance){if(to<=from)return;const end=p.seen===null?from:Math.min(to,p.seen+FRESH_MS);if(inside(p,tolerance)&&end>from){const dt=(end-from)/1000;p.current+=dt;p.total+=dt;p.best=Math.max(p.best,p.current);}if(!inside(p,tolerance)||p.seen===null||to>=p.seen+FRESH_MS)p.current=0;}
export function ranked(players){return [...players].sort((a,b)=>Math.round(b.best*10)-Math.round(a.best*10)||Math.round(b.total*10)-Math.round(a.total*10));}
export function tied(a,b){return Math.round(a.best*10)===Math.round(b.best*10)&&Math.round(a.total*10)===Math.round(b.total*10);}

// Both players use the same seeded, smooth disturbance at the same elapsed time.
export function windAt(seconds,seed){
 const phase=(seed%100003)/100003*Math.PI*2;
 return {x:12*Math.sin(seconds*.73+phase)+7*Math.sin(seconds*1.37+phase*2),y:10*Math.sin(seconds*.61+phase*1.7)+6*Math.sin(seconds*1.13+phase*.3)};
}
export function dronePosition(roll,pitch,wind){return {x:wind.x+roll*1.1,y:wind.y+pitch*1.1};}
