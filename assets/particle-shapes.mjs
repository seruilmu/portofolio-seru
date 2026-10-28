// Each point keeps its identity as the scroll scene changes.
export const SHAPE_NAMES = ['sphere','torus','cube','helix','infinity'];
export const clamp01 = value => Math.max(0,Math.min(1,value));
export const smoothstep = value => {const t=clamp01(value);return t*t*(3-2*t);};

export function createShapeTargets(count) {
  const targets=SHAPE_NAMES.map(()=>new Float32Array(count*3));
  const golden=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<count;i++){
    const t=(i+.5)/count;
    const y=1-2*t;
    const r=Math.sqrt(Math.max(0,1-y*y));
    const angle=i*golden;
    const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    const offset=i*3;
    targets[0].set([x,y,z],offset);
    const u=t*Math.PI*2,v=angle;
    const ring=.72+.24*Math.cos(v);
    const ringY=ring*Math.sin(u),ringZ=.24*Math.sin(v);
    targets[1].set([ring*Math.cos(u),ringY*.85-ringZ*.53,ringY*.53+ringZ*.85],offset);
    const edge=Math.max(Math.abs(x),Math.abs(y),Math.abs(z));
    targets[2].set([x/edge*.72,y/edge*.72,z/edge*.72],offset);
    const strand=i%2;
    const helixAngle=t*Math.PI*4+strand*Math.PI;
    const tube=.12*Math.cos(v);
    targets[3].set([( .54+tube)*Math.cos(helixAngle),(t-.5)*1.85+.12*Math.sin(v),(.54+tube)*Math.sin(helixAngle)],offset);
    const a=Math.cos(u),b=Math.sin(u);
    targets[4].set([a*(.98+.13*a)+.10*Math.cos(v)*a,.57*Math.sin(2*u)+.1*Math.sin(v),.13*b+.11*Math.cos(v)],offset);
  }
  return targets;
}

export function sceneAt(scroll,anchors) {
  if(!anchors.length)return {a:0,b:0,t:0};
  let a=0;
  for(let i=1;i<anchors.length;i++){if(scroll>=anchors[i])a=i;else break;}
  const b=Math.min(a+1,anchors.length-1);
  const distance=anchors[b]-anchors[a];
  return {a,b,t:a===b||distance<=0?0:smoothstep((scroll-anchors[a])/distance)};
}

export function blendPoint(targets,from,to,index,progress,out) {
  const offset=index*3,source=targets[from],destination=targets[to];
  const burst=progress<=0||progress>=1?0:Math.sin(progress*Math.PI)*.16;
  const seed=targets[0];
  for(let axis=0;axis<3;axis++)out[axis]=source[offset+axis]+(destination[offset+axis]-source[offset+axis])*progress+seed[offset+axis]*burst;
  return out;
}
