import test from 'node:test';
import assert from 'node:assert/strict';
import {score,candidates,parseCSV,matrix,search,makeGrid,summary,maxSubarray} from '../shared/core.mjs';
test('Wordle reserves green matches before allocating repeated yellows',()=>{
 assert.equal(score('apple','allee'),'21002');assert.equal(score('apple','apple'),'22222');assert.equal(score('cigar','rebut'),'10000');
 assert.deepEqual(candidates(['apple','ample','angle'],[['apple','20222']]),['ample']);
 assert.throws(()=>score('abc','apple'));
});
test('CSV supports quoted commas, escaped quotes and CRLF; rejects malformed matrices',()=>{
 assert.deepEqual(parseCSV('Name,A\r\n"Alpha, beta",2\r\n"a""b",3'),[['Name','A'],['Alpha, beta','2'],['a"b','3']]);
 assert.throws(()=>parseCSV('a,b\n1'));assert.throws(()=>parseCSV('a,b\n"x,2'));
 assert.deepEqual(matrix('Row,A,B\nX,-1,2.5').values,[[-1,2.5]]);
 assert.throws(()=>matrix('Row,A\nX,hello'));assert.throws(()=>matrix('Row,A\nX,'));
});
test('Pathfinding chooses cheapest path, not fewest steps, and handles disconnection',()=>{
 const grid=[[1,9,1],[1,0,1],[1,1,1]];
 for(const astar of [false,true]){assert.equal(search(grid,astar).cost,4);assert.equal(search([[1,0],[0,1]],astar).cost,null);}
 for(let seed=0;seed<40;seed++){const g=makeGrid(seed);assert.equal(search(g).cost,search(g,true).cost);}
});
test('A* and Dijkstra agree with independent repeated relaxation on small boards',()=>{
 for(let seed=0;seed<20;seed++){const g=makeGrid(seed,5,6),n=30,d=Array(n).fill(Infinity);d[0]=0;
 for(let k=0;k<n;k++)for(let i=0;i<n;i++)for(const j of [i-6,i+6,...(i%6?[i-1]:[]),...(i%6<5?[i+1]:[])])if(j>=0&&j<n&&g[Math.floor(j/6)][j%6])d[j]=Math.min(d[j],d[i]+g[Math.floor(j/6)][j%6]);
 assert.equal(search(g,true).cost,d[n-1]);}
});
test('Summary handles empty, odd and even samples',()=>{assert.equal(summary([]).mean,null);assert.equal(summary([9,1,3]).median,3);assert.equal(summary([2,4]).median,3);assert.equal(summary([2,4]).mean,3);});
test('Maximum subarray handles negatives and matches exhaustive oracle',()=>{
 assert.deepEqual(maxSubarray([-2,1,-3,4,-1,2,1,-5,4]),{sum:6,start:3,end:6,values:[4,-1,2,1]});assert.equal(maxSubarray([-8,-2,-5]).sum,-2);
 for(let seed=1;seed<=25;seed++){const a=Array.from({length:9},(_,i)=>((seed*(i+3)*7)%19)-9);let best=-Infinity;for(let i=0;i<a.length;i++)for(let j=i+1;j<=a.length;j++)best=Math.max(best,a.slice(i,j).reduce((s,v)=>s+v,0));assert.equal(maxSubarray(a).sum,best);}
});
