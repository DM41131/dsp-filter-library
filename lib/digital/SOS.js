import { Cx } from '../core/Complex.js';

// Second Order Sections

function pairConjs(arr){
  const used=new Array(arr.length).fill(false), pairs=[];
  for(let i=0;i<arr.length;i++){
    if(used[i]) continue; const a=arr[i]; let matched=false;
    for(let j=i+1;j<arr.length;j++) if(!used[j]){
      const b=arr[j];
      if(Math.abs(a.re-b.re)<1e-10 && Math.abs(a.im+b.im)<1e-10){
        pairs.push([a,b]); used[i]=used[j]=true; matched=true; break;
      }
    }
    if(!matched){ pairs.push([a]); used[i]=true; }
  }
  return pairs;
}

class SOS {
  static fromZPK(zZeros, zPoles, gain=1){
    while(zZeros.length<zPoles.length) zZeros.push({re:-1,im:0});
    const zp=pairConjs(zZeros), pp=pairConjs(zPoles);
    const sections=[]; let zi=0, pi=0;
    while(pi<pp.length){
      const ppair=pp[pi++], zpair=(zi<zp.length)?zp[zi++]:[{re:-1,im:0},{re:-1,im:0}];
      const p1=ppair[0], p2=ppair[1]||{re:0,im:0};
      const z1=zpair[0], z2=zpair[1]||{re:-1,im:0};
      const sumZ={re:z1.re+z2.re, im:z1.im+z2.im}, prodZ=Cx.mul(z1,z2);
      const sumP={re:p1.re+p2.re, im:p1.im+p2.im}, prodP=Cx.mul(p1,p2);
      const b=[1, -sumZ.re, prodZ.re];
      const a=[1, -sumP.re, prodP.re];
      sections.push({b,a});
    }
    if(sections.length) sections[0].b=[sections[0].b[0]*gain, sections[0].b[1]*gain, sections[0].b[2]*gain];
    return sections;
  }
}

export { SOS };
//# sourceMappingURL=SOS.js.map
