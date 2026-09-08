export function score(secret, guess) {
  if (!/^[a-z]{5}$/.test(secret) || !/^[a-z]{5}$/.test(guess)) throw Error('Use five lowercase letters.');
  const out = Array(5).fill('0'), counts = {};
  for (let i=0;i<5;i++) { if(secret[i]===guess[i]) out[i]='2'; else counts[secret[i]]=(counts[secret[i]]||0)+1; }
  for (let i=0;i<5;i++) if(out[i]!=='2' && counts[guess[i]]>0) {out[i]='1';counts[guess[i]]--;}
  return out.join('');
}
export function candidates(words, clues) { return words.filter(w=>clues.every(([g,p])=>score(w,g)===p)); }
export function parseCSV(text) {
  const rows=[];let row=[],field='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++) {const c=text[i]; if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(quoted)throw Error('Unclosed quote in CSV.');
  row.push(field);if(row.some(v=>v.trim()))rows.push(row);
  if(!rows.length||rows.some(r=>r.length!==rows[0].length))throw Error('CSV rows must have the same number of columns.');
  return rows;
}
export function matrix(text) {
  const rows=parseCSV(text),header=rows.shift();
  if(header.length<2||!rows.length)throw Error('Include a header, row labels, and at least one numeric column.');
  if(rows.length>100||header.length>31)throw Error('Use at most 100 rows and 30 numeric columns.');
  const values=rows.map(r=>r.slice(1).map(v=>{if(!v.trim()||!Number.isFinite(Number(v)))throw Error('Every data cell must contain a number.');return Number(v);}));
  return {columns:header.slice(1),labels:rows.map(r=>r[0]),values};
}
export function search(grid, astar=false) {
  const rows=grid.length, cols=grid[0].length,goal=rows*cols-1;
  const dist=new Map([[0,0]]), prev=new Map(), visited=[],closed=new Set(),queue=[{id:0,p:0}];
  while(queue.length){queue.sort((a,b)=>a.p-b.p||a.id-b.id);const {id}=queue.shift();if(closed.has(id))continue;closed.add(id);visited.push(id);if(id===goal)break;
    const r=Math.floor(id/cols),c=id%cols;
    for(const [nr,nc] of [[r+1,c],[r-1,c],[r,c+1],[r,c-1]]){if(nr<0||nc<0||nr>=rows||nc>=cols||grid[nr][nc]===0)continue;
      const next=nr*cols+nc,cost=dist.get(id)+grid[nr][nc];
      if(cost<(dist.get(next)??Infinity)){dist.set(next,cost);prev.set(next,id);queue.push({id:next,p:cost+(astar?rows-1-nr+cols-1-nc:0)});}
    }
  }
  const path=[];if(dist.has(goal)){let id=goal;while(id!==undefined){path.unshift(id);id=prev.get(id);}}
  return {cost:dist.get(goal)??null,path,visited};
}
export function makeGrid(seed,rows=12,cols=18){let s=seed>>>0;const rand=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
  const grid=Array.from({length:rows},()=>Array.from({length:cols},()=>rand()<.23?0:1+Math.floor(rand()*9)));
  for(let r=0;r<rows;r++)grid[r][0]=1;for(let c=0;c<cols;c++)grid[rows-1][c]=1;grid[0][0]=1;return grid;
}
export function summary(values){if(!values.length)return {count:0,mean:null,median:null,min:null,max:null};const a=[...values].sort((a,b)=>a-b),n=a.length;return {count:n,mean:a.reduce((s,v)=>s+v,0)/n,median:n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2,min:a[0],max:a[n-1]};}
export function maxSubarray(a){if(!a.length)throw Error('Enter at least one number.');let total=a[0],best=a[0],start=0,left=0,right=0;for(let i=1;i<a.length;i++){if(a[i]>total+a[i]){total=a[i];start=i;}else total+=a[i];if(total>best){best=total;left=start;right=i;}}return {sum:best,start:left,end:right,values:a.slice(left,right+1)};}
