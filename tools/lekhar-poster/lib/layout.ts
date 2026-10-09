export function posterPosition(position:{x:number;y:number},height:number){
 return {x:Math.min(600,Math.max(200,position.x)),y:Math.min(height-200,Math.max(200,position.y))};
}
export function posterLines(text:string){return text.split('\n').slice(0,4).map(line=>line.slice(0,44));}
export function posterTextLayout(input:{y:number;height:number;size:number;lines:number}){
 const size=Math.min(input.size,(input.height-300)/(1+(input.lines-1)*1.4));
 const spread=(input.lines-1)*size*.7;
 return {size,y:Math.max(80+size+spread,Math.min(input.height-220-spread,input.y))};
}
