export const GRID_SIZE = 12;
export type Mirror = 'none'|'horizontal'|'four';
export function mirrorCells(index:number,mirror:Mirror):number[]{
 if(!Number.isInteger(index)||index<0||index>=GRID_SIZE*GRID_SIZE)return [];
 const row=Math.floor(index/GRID_SIZE),column=index%GRID_SIZE;
 const cells=[index];
 if(mirror!=='none')cells.push(row*GRID_SIZE+GRID_SIZE-1-column);
 if(mirror==='four')cells.push((GRID_SIZE-1-row)*GRID_SIZE+column,(GRID_SIZE-1-row)*GRID_SIZE+GRID_SIZE-1-column);
 return [...new Set(cells)];
}
export function paintCells(cells:string[],index:number,paint:{color:string;mirror:Mirror}) {
 const next=[...cells]; for(const cell of mirrorCells(index,paint.mirror))next[cell]=paint.color; return next;
}
export function cellsBetween(from:number,to:number):number[]{
 if(from<0)return [to];
 let x=from%GRID_SIZE,y=Math.floor(from/GRID_SIZE);
 const endX=to%GRID_SIZE,endY=Math.floor(to/GRID_SIZE),dx=Math.abs(endX-x),dy=-Math.abs(endY-y),sx=x<endX?1:-1,sy=y<endY?1:-1;
 let error=dx+dy;const cells:number[]=[];
 while(true){cells.push(y*GRID_SIZE+x);if(x===endX&&y===endY)break;const twice=2*error;if(twice>=dy){error+=dy;x+=sx;}if(twice<=dx){error+=dx;y+=sy;}}
 return cells;
}
