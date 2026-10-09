export type Frame={x:number;y:number;width:number;height:number};
export type Photo={src:string;width:number;height:number;x:number;y:number;zoom:number};
export function photoFrames(count:number):Frame[]{
 const gap=16,left=40,top=55,width=720,height=580;
 if(count===2)return [0,1].map(i=>({x:left+i*(width+gap)/2,y:top,width:(width-gap)/2,height}));
 if(count===3)return [{x:left,y:top,width:352,height},...[0,1].map(i=>({x:408,y:top+i*298,width:352,height:282}))];
 return Array.from({length:4},(_,i)=>({x:left+(i%2)*368,y:top+Math.floor(i/2)*298,width:352,height:282}));
}
export function photoPlacement(photo:Photo,frame:Frame):Frame{
 const scale=Math.max(frame.width/photo.width,frame.height/photo.height)*Math.max(1,Math.min(3,photo.zoom));
 const width=photo.width*scale,height=photo.height*scale;
 return {x:frame.x-(width-frame.width)*(Math.max(-1,Math.min(1,photo.x))+1)/2,y:frame.y-(height-frame.height)*(Math.max(-1,Math.min(1,photo.y))+1)/2,width,height};
}
export async function readPhoto(file:File):Promise<Photo>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('এই ধরনের ফাইল চলবে না। জেপিজি, পিএনজি বা ওয়েবপি ছবি দাও।');
 if(file.size>8*1024*1024)throw new Error('ছবিটা ৮ মেগাবাইটের চেয়ে বড়। একটু ছোট ছবি দাও।');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>30_000_000)throw new Error('ছবিটা অনেক বড় (৩০ মেগাপিক্সেলের বেশি)। একটু ছোট ছবি দাও।');
  const ratio=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
  const context=canvas.getContext('2d');if(!context)throw new Error('এই ব্রাউজারে ছবি খোলা যাচ্ছে না। অন্য ব্রাউজারে খুলে দেখো।');
  context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  return {src:canvas.toDataURL('image/jpeg',.9),width:canvas.width,height:canvas.height,x:0,y:0,zoom:1};
 }finally{URL.revokeObjectURL(url);}
}
