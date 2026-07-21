import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
const url = 'http://127.0.0.1:5173'; let server; let browser;
const wait = async () => { for (let i=0;i<40;i+=1) { try { if ((await fetch(url)).ok) return; } catch {} await new Promise(r=>setTimeout(r,500)); } throw new Error('Vite did not start'); };
const home = async (page) => { await page.reload({ waitUntil: 'domcontentloaded' }); if (!(await page.getByTestId('practice-center-entry').count())) throw new Error('home failed'); };
try {
 server=spawn('cmd.exe',['/c','npm.cmd run dev -- --host 127.0.0.1 --port 5173'],{stdio:'ignore'}); await wait(); browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}); const page=await browser.newPage(); await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>localStorage.clear()); await home(page); if(!(await page.getByTestId('recent-activity-empty').count())) throw new Error('empty fallback failed');
 await page.evaluate(()=>localStorage.setItem('ifa-study-progress-v1','bad')); await home(page);
 await page.evaluate(()=>localStorage.setItem('ifa-study-progress-v1',JSON.stringify({sessions:[{id:'old',date:'2026-07-11',weekId:'week-1'}]}))); await home(page); if(!(await page.getByTestId('recent-activity-list').count())) throw new Error('legacy session missing');
 await page.evaluate(()=>localStorage.setItem('ifa-wrong-answers-v1','bad')); await home(page); await page.getByTestId('practice-center-entry').click(); await page.getByTestId('practice-wrong-book-card').getByRole('button').click(); if(!(await page.getByTestId('wrong-book-page').count())) throw new Error('wrong book failed');
 await page.goto(url,{waitUntil:'domcontentloaded'}); await page.evaluate(()=>localStorage.setItem('ifa-wrong-answers-v1',JSON.stringify([{questionId:1,wrongCount:1},{questionId:'bad',wrongCount:1}]))); await home(page); await page.getByTestId('open-wrong-book-button').click(); if(!(await page.getByTestId('wrong-book-list').count())) throw new Error('legacy wrong record missing');
 await page.goto(url,{waitUntil:'domcontentloaded'}); await page.evaluate(()=>localStorage.setItem('ifa-week1-exam-draft-v1','bad')); await home(page); if(await page.getByText('繼續未完成測驗').count()) throw new Error('bad draft resumed');
 const result=await page.evaluate(()=>{ const today=new Date().toISOString(); const yesterday=new Date(Date.now()-86400000).toISOString(); localStorage.setItem('ifa-wrong-answers-v1',JSON.stringify([{questionId:1,status:'improving',lastReviewedAt:today},{questionId:2,status:'improving',lastReviewedAt:yesterday}])); return true; }); if(!result) throw new Error('date seed failed'); await home(page); console.log('SPRINT 18 VERIFY PASSED');
} finally { await browser?.close(); server?.kill('SIGTERM'); }
