/** Private, offline cartoon-style portrait effect.
 * No raw photo is saved, no AI API is implied, and no bytes leave the device.
 * A future consented AI-illustration backend must be a separate integration.
 */
export type CartoonPhotoError="format"|"size"|"decode"|"storage"|"processing";
const types=new Set(["image/jpeg","image/png","image/webp","image/avif","image/heic","image/heif"]);
export function validateCartoonPhoto(file:Pick<File,"type"|"size">):CartoonPhotoError|null{
 if(!types.has(file.type.toLowerCase()))return "format";
 if(file.size<=0||file.size>8*1024*1024)return "size";
 return null;
}
export async function makeLocalCartoonPortrait(file:File):Promise<string>{
 const problem=validateCartoonPhoto(file);
 if(problem)throw new Error(problem);
 const url=URL.createObjectURL(file);
 const image=new Image();
 try{
  await new Promise<void>((resolve,reject)=>{
   image.onload=()=>resolve();
   image.onerror=()=>reject(new Error("decode"));
   image.src=url;
  });
  if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>90_000_000)
   throw new Error("decode");
  const side=448;
  const canvas=document.createElement("canvas");canvas.width=side;canvas.height=side;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx)throw new Error("processing");
  const scale=Math.max(side/image.naturalWidth,side/image.naturalHeight);
  const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
  // Portrait-friendly crop favors the upper half of vertical photographs.
  const x=(side-w)/2,y=Math.min(0,Math.max(side-h,(side-h)*0.38));
  ctx.filter="saturate(1.38) contrast(1.14) brightness(1.045)";
  ctx.drawImage(image,x,y,w,h);ctx.filter="none";
  const frame=ctx.getImageData(0,0,side,side),p=frame.data;
  const luminance=new Uint8Array(side*side);
  for(let i=0;i<luminance.length;i++){
   const k=i*4;const r=p[k]!,g=p[k+1]!,b=p[k+2]!;
   luminance[i]=Math.round(.2126*r+.7152*g+.0722*b);
   // Posterize while preserving facial details and soft skin gradients.
   p[k]=Math.min(255,Math.round(r/28)*28);
   p[k+1]=Math.min(255,Math.round(g/28)*28);
   p[k+2]=Math.min(255,Math.round(b/28)*28);
  }
  // Subtle dark ink lines on major contrast edges (not a literal AI portrait).
  for(let y=1;y<side-1;y++){
   for(let x=1;x<side-1;x++){
    const i=y*side+x,k=i*4;
    const edge=Math.abs(luminance[i-1]!-luminance[i+1]!)+
     Math.abs(luminance[i-side]!-luminance[i+side]!);
    if(edge>116){
     const strength=Math.min(.48,(edge-110)/340);
     p[k]=Math.round(p[k]!*(1-strength)+45*strength);
     p[k+1]=Math.round(p[k+1]!*(1-strength)+48*strength);
     p[k+2]=Math.round(p[k+2]!*(1-strength)+70*strength);
    }
   }
  }
  ctx.putImageData(frame,0,0);
  const output=canvas.toDataURL("image/webp",.78);
  if(!/^data:image\/(webp|png);base64,/.test(output)||output.length>900_000)
   throw new Error("processing");
  return output;
 }finally{URL.revokeObjectURL(url);}
}
