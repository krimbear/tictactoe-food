'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('game.js','utf8').split("for(let i=0;i<9;i++){const b=document.createElement('button');")[0];
const elements=new Map();
function el(){return {textContent:'',innerHTML:'',hidden:false,disabled:false,value:'',classList:{add(){},remove(){},toggle(){}},focus(){},setAttribute(){},replaceChildren(){},querySelectorAll(){return []}};}
const cells=Array.from({length:9},()=>({...el(),dataset:{token:''}}));
const sandbox={window:{},console,Math,setTimeout:()=>1,clearTimeout(){},document:{getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);},querySelectorAll(){return cells;},querySelector(){return el();},addEventListener(){}},matchMedia:()=>({matches:true})};
vm.createContext(sandbox);vm.runInContext(source+'\nthis.api={WORDS,LINES,shuffle,scramble,winner,computerChoice,state,newGame,choose,check,computerTurn,checkEnd,score};',sandbox);
const a=sandbox.api;
for(const [word] of a.WORDS)for(let n=0;n<200;n++){const mixed=a.scramble(word);assert.notEqual(mixed,word);assert.equal([...mixed].sort().join(''),[...word].sort().join(''));}
for(const line of a.LINES)for(const token of ['X','O']){const b=Array(9).fill(null);line.forEach(i=>b[i]=token);assert.equal(a.winner(b).token,token);}
assert.equal(a.winner(['X','O','X','X','O','O','O','X','X']),null);
a.newGame();assert.equal(a.state.deck.length,10);assert.equal(new Set(a.state.deck.map(x=>x[0])).size,10);assert.equal(a.state.phase,'player');
a.choose(4);assert.equal(a.state.phase,'task');assert.equal(a.state.deck.length,9);
elements.get('answer').value=' ';a.check({preventDefault(){}});assert.equal(a.state.moves,0);assert.equal(a.state.phase,'task');
elements.get('answer').value=' '+a.state.active[0].toUpperCase()+' ';a.check({preventDefault(){}});assert.equal(a.state.moves,1);assert.equal(a.state.board[4],a.state.player);a.check({preventDefault(){}});assert.equal(a.state.moves,1);
a.newGame();a.choose(0);elements.get('answer').value='wrong';a.check({preventDefault(){}});assert.equal(a.state.errors,1);assert.equal(a.state.board[0],null);
// Model a perfect-answer player who searches the game tree, against the actual easy computer.
const memo=new Map();
function minimax(b,turn,p,c){const key=b.map(x=>x||'-').join('')+turn+p;if(memo.has(key))return memo.get(key);const w=a.winner(b);if(w)return w.token===p?10:-10;if(b.every(Boolean))return 0;const values=[];b.forEach((v,i)=>{if(!v){const copy=[...b];copy[i]=turn;values.push(minimax(copy,turn===p?c:p,p,c));}});const result=turn===p?Math.max(...values):Math.min(...values);memo.set(key,result);return result;}
const counts={wins:0,losses:0,draws:0};
for(let n=0;n<400;n++){const p=n%2?'X':'O',c=p==='X'?'O':'X';let b=Array(9).fill(null);for(;;){let choice=-1,best=-Infinity;for(let i=0;i<9;i++)if(!b[i]){const copy=[...b];copy[i]=p;const value=minimax(copy,c,p,c);if(value>best){best=value;choice=i;}}b[choice]=p;if(a.winner(b)){counts.wins++;break;}if(b.every(Boolean)){counts.draws++;break;}const i=a.computerChoice(b,c,p);assert.equal(b[i],null);b[i]=c;if(a.winner(b)){counts.losses++;break;}if(b.every(Boolean)){counts.draws++;break;}}}
assert.ok(counts.wins>counts.losses);console.log('PASS: scrambling, 8 winning lines, draw, unique words, empty/correct/wrong answers, duplicate submission guard.');console.log('400 simulated games with correct answers:',counts);
for(const file of ['index.html','styles.css','game.js','desk.png','cross.png','null.png'])assert.ok(fs.statSync(file).size>0);


