#!/usr/bin/env node
/** Offline dry-run by default. Production execution belongs to the release owner. */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, openSync, writeFileSync, fsyncSync, closeSync } from 'node:fs';
import { BANKS, RELEASE_KEY, ACTOR, COLUMNS, digest, loadPackage, verifyStored, projectStored } from './lib/floridaDistributionRelease.mjs';
const sqlColumns = COLUMNS.map(k=>'`'+k+'`').join(',');
const keys = BANKS.map(b=>b.key), placeholders = keys.map(()=>'?').join(',');
const assert = (ok,message) => { if (!ok) throw new Error(message); };
export function privateWrite(file, payload) {
  mkdirSync(dirname(file),{recursive:true,mode:0o700});
  const fd=openSync(file,'wx',0o600);
  try { writeFileSync(fd,JSON.stringify(payload,null,2)+'\n');fsyncSync(fd); } finally {closeSync(fd);}
}
async function cohort(connection,bank,lock=false) {
  const [rows]=await connection.execute(`SELECT id,${sqlColumns},reviewStatus,reviewedBy,reviewedAt FROM questions WHERE bankKey = ? ORDER BY questionNum${lock?' FOR UPDATE':''}`,[bank.key]);return rows;
}
async function outside(connection) {
  const [rows]=await connection.execute(`SELECT bankKey,reviewStatus,COUNT(*) AS n FROM questions WHERE bankKey NOT IN (${placeholders}) GROUP BY bankKey,reviewStatus ORDER BY bankKey,reviewStatus`,keys);return digest(rows);
}
async function snapshots(connection) {
  const [rows]=await connection.execute('SELECT questionId,bankKey,questionNum,contentHash,payload FROM question_content_snapshots WHERE releaseKey = ? ORDER BY questionId FOR UPDATE',[RELEASE_KEY]);return rows;
}
function verifySnapshots(pkg,stored,receipts) {
  assert(receipts.length===150,'Missing immutable insertion snapshots');
  const all=pkg.banks.flatMap(b=>stored.get(b.key));
  for (const row of all) {
    const receipt=receipts.find(r=>r.questionId===row.id);
    assert(receipt && receipt.bankKey===row.bankKey && receipt.questionNum===row.questionNum,'Snapshot identity mismatch');
    const payload=JSON.parse(receipt.payload);
    assert(receipt.contentHash===digest(payload) && payload.kind==='additive-insert' && payload.before===null && payload.packageSha256===pkg.packageSha256 && digest(payload.inserted)===digest({id:row.id,...projectStored(row),reviewStatus:'in_review'}),'Snapshot payload mismatch');
  }
}
/** No learner data is read. Rollback hides exact inserted rows instead of unsafe deletes. */
export async function transact(connection,pkg,mode,{beforeCommit=()=>{}}={}) {
  assert(['preflight','stage','publish','hide'].includes(mode),'Unknown transaction mode');
  // Validate all in-memory payloads again, even for callers bypassing the CLI.
  const canonical=loadPackage(resolve(dirname(fileURLToPath(import.meta.url)),'..'));
  assert(digest(pkg)===digest(canonical),'Package mutated after validation');
  await connection.beginTransaction();let committed=false;
  try {
    const outsideBefore=await outside(connection),stored=new Map();
    for (const bank of pkg.banks) stored.set(bank.key,await cohort(connection,bank,true));
    const [metadata]=await connection.execute(`SELECT * FROM question_bank_meta WHERE bankKey IN (${placeholders}) FOR UPDATE`,keys);
    const receipts=await snapshots(connection);
    if (mode==='preflight' || mode==='stage') {
      assert([...stored.values()].every(rows=>rows.length===0) && metadata.length===0 && receipts.length===0,'Target banks, metadata or release snapshots already exist; reconcile, never overwrite');
      if (mode==='preflight') { await connection.rollback();return {mode:'read-only-preflight',empty:true,packageSha256:pkg.packageSha256}; }
      // Persist a private empty-target baseline BEFORE inserts; failure prevents writes.
      await beforeCommit({phase:'empty-target-baseline',packageSha256:pkg.packageSha256,outsideQuestionStatusHash:outsideBefore,banks:keys,questions:[],metadata:[]});
      for (const bank of pkg.banks) {
        for (const row of bank.rows) {
          const [result]=await connection.execute(`INSERT INTO questions (${sqlColumns},reviewStatus) VALUES (${COLUMNS.map(()=>'?').join(',')},'in_review')`,COLUMNS.map(k=>row[k]));
          assert(Number.isSafeInteger(result.insertId) && result.insertId>0 && result.affectedRows===1,'Insert identity failure');
          const payload={kind:'additive-insert',before:null,packageSha256:pkg.packageSha256,inserted:{id:result.insertId,...row,reviewStatus:'in_review'}};
          await connection.execute('INSERT INTO question_content_snapshots (releaseKey,bankKey,questionId,questionNum,sourceContentVersion,contentHash,payload) VALUES (?,?,?,?,0,?,?)',[RELEASE_KEY,bank.key,result.insertId,row.questionNum,digest(payload),JSON.stringify(payload)]);
        }
        // No official weights, recall quota or calculation minimum are invented.
        await connection.execute('INSERT INTO question_bank_meta (bankKey,modules,moduleTargets,formulaLinks,totalQuestions,contentVersion,blueprintVersion,minCalcPerMock,recallTargetPct) VALUES (?,?,NULL,NULL,?,1,1,NULL,NULL)',[bank.key,JSON.stringify(bank.modules),bank.count]);
        stored.set(bank.key,verifyStored(bank,await cohort(connection,bank,true),'in_review'));
      }
      verifySnapshots(pkg,stored,await snapshots(connection));
    } else {
      assert(metadata.length===1,'Missing Florida metadata');
      for (const bank of pkg.banks) {
        const meta=metadata.find(m=>m.bankKey===bank.key);
        assert(meta && meta.totalQuestions===bank.count && meta.modules===JSON.stringify(bank.modules) && meta.moduleTargets===null && meta.formulaLinks===null && meta.minCalcPerMock===null && meta.recallTargetPct===null && meta.blueprintVersion===1 && Number.isSafeInteger(meta.contentVersion) && meta.contentVersion>=1,'Metadata mismatch');
        verifyStored(bank,stored.get(bank.key),mode==='publish'?'in_review':undefined);
        if (mode==='hide') assert(stored.get(bank.key).every(row=>['in_review','approved','rejected'].includes(row.reviewStatus)),'Unexpected rollback status');
      }
      verifySnapshots(pkg,stored,receipts);
      for (const bank of pkg.banks) for (const row of stored.get(bank.key)) {
        if (mode==='hide' && row.reviewStatus==='rejected') continue;
        const [result]=await connection.execute('UPDATE questions SET reviewStatus = ?, reviewedBy = ?, reviewedAt = ? WHERE id = ? AND bankKey = ? AND questionNum = ? AND reviewStatus = ?',[mode==='publish'?'approved':'rejected',ACTOR,new Date(),row.id,bank.key,row.questionNum,row.reviewStatus]);
        assert(result.affectedRows===1,'Exact cohort update failed');
      }
      for (const bank of pkg.banks) verifyStored(bank,await cohort(connection,bank,true),mode==='publish'?'approved':'rejected');
      // Invalidate client metadata after visibility changes without changing allocations.
      for (const key of keys) await connection.execute('UPDATE question_bank_meta SET contentVersion = contentVersion + 1 WHERE bankKey = ?',[key]);
    }
    assert(await outside(connection)===outsideBefore,'Outside-bank question/status inventory changed');
    const crosswalk=[];
    for (const bank of pkg.banks) {
      const rows=await cohort(connection,bank,true);
      verifyStored(bank,rows,mode==='stage'?'in_review':mode==='publish'?'approved':'rejected');
      crosswalk.push(...bank.crosswalk.map(item=>({...item,databaseId:rows.find(row=>row.questionNum===item.questionNum).id})));
    }
    const result={mode,packageSha256:pkg.packageSha256,rows:150,crosswalk,outsideQuestionStatusHash:outsideBefore,reviewAttribution:ACTOR,rollbackPolicy:'Exact cohort status rejected; never delete/reuse IDs or learner history'};
    await beforeCommit({phase:'verified-before-commit',...result});
    await connection.commit();committed=true;return result;
  } catch(error) {if(!committed) await connection.rollback();throw error;}
}
async function main() {
  const args=new Map(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');return i<0?[arg,'true']:[arg.slice(0,i),arg.slice(i+1)];}));
  assert([...args.keys()].every(k=>['--mode','--out','--confirm','--target-sha256'].includes(k)),'Unknown argument');
  const mode=args.get('--mode')??'dry-run';assert(['dry-run','preflight','stage','publish','hide'].includes(mode),'Unknown mode');
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const pkg=loadPackage(root),out=resolve(args.get('--out')??'/home/ubuntu/outputs/activate-claude-courses-20261117/florida');
  assert(out!==root && !out.startsWith(root+'/'),'Private artifacts must be outside repository');
  if(mode==='dry-run') {
    privateWrite(resolve(out,'payload.json'),pkg);
    privateWrite(resolve(out,'dry-run.json'),{mode,sourceCommit:pkg.sourceCommit,packageSha256:pkg.packageSha256,rows:150,dbConnected:false,banks:pkg.banks.map(({rows,crosswalk,...bank})=>bank),commercialStatus:'No Florida product/price or grant exists; preview-only publication possible. Full paid access pending owner decision and dual money review.'});
    console.log(JSON.stringify({mode,rows:150,packageSha256:pkg.packageSha256,dbConnected:false}));return;
  }
  assert(args.get('--confirm')===pkg.packageSha256,'Exact package confirmation required');
  const {activeScriptConnection}=await import('./lib/activeScriptConnection.mjs');const target=activeScriptConnection();
  assert(target.external && typeof target.options==='object','Authoritative external target required');
  const targetIdentity={host:target.options.host,port:target.options.port,database:target.options.database};
  assert(args.get('--target-sha256')===digest(targetIdentity),'Exact target identity hash required (host, port, database; no credentials)');
  const {default:mysql}=await import('mysql2/promise');
  const connection=await mysql.createConnection(target.options);
  const operation=`${Date.now()}-${process.pid}`;
  try {
    privateWrite(resolve(out,`${operation}-${mode}-prepared.json`),{mode,packageSha256:pkg.packageSha256,targetIdentity});
    const result=await transact(connection,pkg,mode,{beforeCommit:payload=>privateWrite(resolve(out,`${operation}-${mode}-${payload.phase}.json`),payload)});
    privateWrite(resolve(out,`${operation}-${mode}-receipt.json`),result);
    console.log(JSON.stringify({mode,rows:result.rows??0,packageSha256:pkg.packageSha256}));
  } finally {await connection.end();}
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) main().catch(error=>{console.error('Florida distribution release failed:',error.message);process.exitCode=1;});
