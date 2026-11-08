/* Modul Transformasi — Bantuan & Cheatsheet Visual RKMK v6 / PMBOK 8
   Bantuan = petunjuk pemakaian aplikasi; Cheatsheet = acuan tata kelola.
   Acuan internal: Draft RKMK Peta Rencana Transformasi Digital (6), Bagian J hlm 45–52.
   Studi kasus SIPN/Sinergi BAS: visual referensi praktik, bukan ketentuan universal.
*/
(function(){
"use strict";
var styles=[
".sk-overlay{position:fixed;inset:0;z-index:250000;background:rgba(7,23,46,.71);backdrop-filter:blur(5px);padding:19px;display:flex;align-items:center;justify-content:center;animation:sk-in .18s ease both}",
"@keyframes sk-in{from{opacity:0}to{opacity:1}}",
".sk-dialog{width:min(1510px,98vw);height:min(930px,95vh);min-height:520px;border-radius:19px;background:#f8fafe;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 110px #06162e66,0 0 0 1px #dfe6f1;font:inherit;color:#153454}",
".sk-head{flex:none;position:relative;overflow:hidden;background:linear-gradient(108deg,#0a2548,#123a67 75%,#183f6c);padding:21px 26px 19px;color:white}",
".sk-head:before{content:'';position:absolute;right:-4%;bottom:-103px;width:340px;height:165px;border:2px solid #f2b94199;border-radius:50%;transform:rotate(-17deg);box-shadow:0 -13px 0 -11px #efc25c66,0 -28px 0 -26px #efc25c66;pointer-events:none}",
".sk-head:after{content:'';position:absolute;right:4%;bottom:-119px;width:330px;height:166px;border:1px solid #ffcf6e88;border-radius:50%;transform:rotate(-12deg);pointer-events:none}",
".sk-hwrap{display:flex;align-items:center;gap:13px;position:relative;z-index:1}",
".sk-hicon{flex:none;width:49px;height:49px;border:1px solid #f3cc72;background:linear-gradient(145deg,#f9c853,#bd8017);border-radius:13px;display:grid;place-items:center;color:#0b294b;font-size:25px;box-shadow:0 2px 13px #f4b23166}",
".sk-hwords{flex:1;min-width:0}.sk-overline{letter-spacing:.13em;color:#ffcf69;font-size:10px;font-weight:900;text-transform:uppercase;margin-bottom:4px}.sk-hwords h2{font-size:23px;font-weight:850;margin:0;line-height:1.2;color:#fff;letter-spacing:-.035em}.sk-hwords p{margin:5px 0 0;color:#d5e5f6;font-size:11.8px;line-height:1.45}",
".sk-close{flex:none;align-self:flex-start;border:1px solid #ffffff55;color:#fff;background:#ffffff16;font-size:23px;width:36px;height:36px;border-radius:10px;cursor:pointer;font-weight:800;z-index:2}.sk-close:hover,.sk-close:focus-visible{background:#f8be42;color:#0c2a50;border-color:#f8be42}",
".sk-tabbar{display:flex;gap:6px;background:#fff;border-bottom:1px solid #dfe7f0;padding:10px 17px 11px;flex:none;overflow-x:auto;scrollbar-width:thin}",
".sk-tab{border:1px solid #e0e7f1;background:linear-gradient(#f6f8fc,#e9eef6);border-radius:10px;min-height:41px;flex:1 0 auto;padding:9px 12px;cursor:pointer;color:#183b64;font-size:11.8px;font-weight:800;white-space:nowrap;transition:background .15s,color .15s,box-shadow .15s}",
".sk-tab:hover,.sk-tab:focus-visible{background:#12365e!important;color:#fff!important;border-color:#12365e!important;box-shadow:0 3px 11px #12365e24}",
".sk-tab[aria-selected=true]{background:linear-gradient(145deg,#efb73e,#bf8015)!important;border-color:#c59027!important;color:#0c2544!important;box-shadow:0 3px 9px #b8872544}",
".sk-tab[aria-selected=true]:hover{background:#f5c556!important;color:#0c2544!important}",
".sk-content{padding:21px 23px 26px;overflow:auto;flex:1;min-height:0;overscroll-behavior:contain;scrollbar-gutter:stable}",
".sk-view[hidden]{display:none!important}.sk-view{animation:sk-in .16s ease}",
".sk-footer{flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #dfe8f1;background:white;padding:10px 24px;font-size:10.5px;color:#657c96}.sk-footer b{color:#183d63}",
".sk-intro{display:flex;align-items:center;justify-content:space-between;gap:15px;margin-bottom:16px}",
".sk-intro h3{margin:0 0 6px;color:#10335a;font-size:20px;font-weight:900;letter-spacing:-.02em}.sk-intro p{color:#637b93;font-size:12.2px;line-height:1.6;margin:0;max-width:1020px}",
".sk-label{font-size:10px;color:#be8121;letter-spacing:.14em;font-weight:900;margin-bottom:5px;text-transform:uppercase}",
".sk-source{flex:none;border:1px solid #e5d6aa;background:#fff8e8;color:#855b16;font-size:9.5px;padding:6px 9px;border-radius:30px;font-weight:820;white-space:nowrap}",
".sk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.sk-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.sk-grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}",
".sk-card{background:white;border:1px solid #e0e7f1;border-radius:13px;padding:15px;box-shadow:0 2px 10px #193d5e08;min-width:0}",
".sk-card strong,.sk-card h4{display:block;color:#163b61;font-size:13px;font-weight:875;margin:0 0 6px}.sk-card p{margin:0;font-size:11.6px;color:#63788f;line-height:1.55}",
".sk-note{border:1px solid #c9e4e9;background:#e9f6f6;border-left:4px solid #087c83;border-radius:10px;color:#255a66;padding:11px 14px;font-size:11.6px;line-height:1.6;margin-top:14px}",
".sk-note.gold{background:#fff8e8;border-color:#f1dba9;border-left-color:#d5a12e;color:#76561b}",
".sk-cta,.sk-btn{border:1px solid #c3d3e4;border-radius:9px;padding:7px 10px;background:#f3f8ff;color:#183c68;font-weight:850;font-size:11.2px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;text-align:center;white-space:nowrap;justify-content:center}",
".sk-cta:hover,.sk-cta:focus-visible,.sk-btn:hover,.sk-btn:focus-visible{background:#103560!important;border-color:#103560!important;color:#fff!important;box-shadow:0 3px 10px #12365e22}",
".sk-cta:hover *,.sk-btn:hover *{color:#fff!important}.sk-cta:disabled{opacity:.43;cursor:not-allowed}.sk-cta:disabled:hover{background:#f3f8ff!important;color:#183c68!important;border-color:#c3d3e4!important}",
".sk-pill{border-radius:25px;background:#eaf2f9;color:#2e6684;padding:4px 9px;font-size:10px;font-weight:820;display:inline-block}.sk-pgold{background:#fff3d9;color:#855916}.sk-pteal{background:#e2f4f3;color:#087680}",
".sk-sectiontitle{font-weight:875;color:#19395d;font-size:14px;margin:19px 0 12px;display:flex;align-items:center;gap:8px}.sk-sectiontitle:before{content:'';width:5px;height:17px;border-radius:3px;background:#dea32c}",
".sk-detail{border-radius:11px;border:1px solid #dfe7f1;background:white;margin:11px 0}.sk-detail>summary{cursor:pointer;padding:12px 15px;color:#174266;font-size:12px;font-weight:880;list-style:none;display:flex;align-items:center;justify-content:space-between}.sk-detail>summary:after{content:'＋';font-weight:900;font-size:16px;color:#a87920}.sk-detail[open]>summary:after{content:'−'}.sk-detail .sk-detailBody{border-top:1px solid #e8edf3;padding:13px 15px;font-size:11.8px;color:#576e86;line-height:1.7}",
".sk-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.sk-step{min-width:0;border:1px solid #dce5f0;border-radius:13px;background:white;overflow:hidden;box-shadow:0 3px 12px #1836520c}.sk-stephead{background:#15385e;padding:12px;min-height:74px;color:#fff}.sk-step:nth-child(2) .sk-stephead{background:#087b83}.sk-step:nth-child(3) .sk-stephead{background:#c08b21}.sk-step:nth-child(4) .sk-stephead{background:#1b4d7b}.sk-step:nth-child(5) .sk-stephead{background:#0f707b}",
".sk-stephead b{display:block;color:#fff;font-size:12.3px;line-height:1.35}.sk-num{display:grid;place-items:center;background:#f7c34a;color:#122f4e;width:25px;height:25px;border-radius:50%;font-weight:900;font-size:12px;margin-bottom:6px}.sk-stepbody{padding:12px;min-height:110px}.sk-stepbody p{margin:0 0 11px;color:#60768b;font-size:11px;line-height:1.55}.sk-stepbody ul{margin:0;padding-left:15px;color:#294c6b;font-size:11.2px;display:grid;gap:7px;line-height:1.45}",
".sk-helpflow{display:grid;gap:11px}.sk-helpstage{display:grid;grid-template-columns:145px minmax(0,1fr);border:1px solid #dce5ef;border-radius:13px;overflow:hidden;background:white}.sk-helpstage-side{padding:16px;background:#13385e;color:#fff;display:flex;flex-direction:column;gap:8px;justify-content:center}.sk-helpstage-side em{font-style:normal;opacity:.7;font-size:10px;letter-spacing:.1em}.sk-helpstage-side b{font-size:12px;line-height:1.45}.sk-helpstage:nth-child(2) .sk-helpstage-side{background:#0a777f}.sk-helpstage:nth-child(3) .sk-helpstage-side{background:#be8a24}.sk-helpstage:nth-child(4) .sk-helpstage-side{background:#215080}.sk-helpstage:nth-child(5) .sk-helpstage-side{background:#126b79}.sk-helpstage:nth-child(6) .sk-helpstage-side{background:#334d70}",
".sk-helpstage-main{padding:14px 16px}.sk-helpstage-main p{font-size:11.5px;line-height:1.55;color:#5b7289;margin:0 0 11px}.sk-buttons{display:flex;gap:7px;flex-wrap:wrap}",
".sk-directory{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.sk-directoryItem{background:#fff;border:1px solid #e0e7f1;border-radius:11px;padding:13px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}.sk-directoryItem b{font-size:12px;color:#15375d}.sk-directoryItem p{font-size:10.8px;line-height:1.48;color:#718096;margin:0;flex:1}.sk-directoryItem .sk-cta{margin-top:3px}",
".sk-search{width:100%;border:1px solid #cddbe8;border-radius:10px;background:#fff;font:inherit;padding:11px 12px;color:#193b60;font-size:12px;outline:none}.sk-search:focus{border-color:#bd8a24;box-shadow:0 0 0 3px #f4be4850}.sk-filtered[hidden]{display:none!important}",
".sk-gloss{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sk-term{background:#fff;border:1px solid #dfe7ee;border-radius:11px;padding:12px 14px}.sk-term b{font-size:12px;color:#0f4369}.sk-term p{font-size:11px;color:#667b91;line-height:1.6;margin:5px 0 0}",
".sk-docrow{display:grid;grid-template-columns:28px minmax(0,1.4fr) minmax(140px,.9fr) minmax(160px,.9fr) auto;gap:11px;align-items:center;padding:12px;border-bottom:1px solid #e8eef3}.sk-docrow:last-child{border-bottom:0}.sk-docnum{display:grid;place-items:center;background:#e8f0f8;width:25px;height:25px;border-radius:8px;color:#265276;font-weight:900;font-size:11px}.sk-docrow b{font-size:11.6px;color:#173a61}.sk-docrow p,.sk-docrow span{font-size:10.8px;color:#60758d;margin:3px 0 0;line-height:1.45}",
".sk-docHead{display:grid;grid-template-columns:28px minmax(0,1.4fr) minmax(140px,.9fr) minmax(160px,.9fr) auto;gap:11px;background:#ecf2f8;color:#476382;font-size:10px;padding:10px 12px;font-weight:860;letter-spacing:.04em}",
".sk-docwrap{background:#fff;border:1px solid #e0e9f2;border-radius:12px;overflow:hidden}",
".sk-cmSlide{background:white;border:1px solid #e0e7f0;border-radius:13px;overflow:hidden;box-shadow:0 3px 13px #0d325011}",
".sk-cmSlideTitle{background:#1a285d;color:white;padding:15px 20px;text-align:center;border-bottom:3px solid #d6a12a}.sk-cmSlideTitle h3{font-size:18px;font-weight:870;margin:0 0 5px;color:#fff}.sk-cmSlideTitle p{margin:0;font-size:10.5px;color:#e9dbaa;font-style:italic}",
".sk-cmSlideBody{display:grid;grid-template-columns:183px minmax(0,1fr);gap:15px;padding:16px}",
".sk-hexGroup{padding:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}.sk-hexes{display:grid;grid-template-columns:repeat(2,79px);grid-template-rows:repeat(2,74px);gap:0;place-items:center}.sk-hex{clip-path:polygon(50% 0,100% 26%,100% 75%,50% 100%,0 75%,0 26%);width:83px;height:84px;display:grid;place-items:center;color:white;font-size:9px;font-weight:860;text-align:center;padding:6px;line-height:1.25;background:#1b2730}.sk-hex.a{background:#c92b22;grid-column:1/3;grid-row:1;z-index:1}.sk-hex.b{background:#252b33;grid-column:1;grid-row:2}.sk-hex.c{background:#e6b500;color:#123358;grid-column:2;grid-row:2}.sk-hexGroup strong{font-size:13px;color:#18375b;text-align:center}",
".sk-cmSlideRight{min-width:0}.sk-cmSlideTop{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:7px}.sk-cmSlideTop>div{min-width:0}.sk-cmBand{padding:9px;background:#fff6d9;border:1px solid #e7ad40;border-radius:9px 9px 3px 3px;text-align:center;min-height:54px}.sk-cmBand.impl{background:#edf4fa;border-color:#96b4d5}.sk-cmBand b{display:block;color:#102e54;font-size:12px}.sk-cmBand span{font-size:10px;color:#6a7890}",
".sk-planCols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:7px}.sk-planCard{min-width:0;border:1px solid #d5e1ec;border-radius:9px;background:#fbfcfe;padding:9px 8px}.sk-planCard b{display:flex;gap:5px;align-items:flex-start;min-height:47px;font-size:10.5px;color:#16395d;line-height:1.4}.sk-planCard b i{font-style:normal;background:#ffcf19;border-radius:50%;width:23px;height:23px;display:grid;place-items:center;flex:none;color:#072b56}.sk-planCard ul{margin:7px 0 0;padding-left:12px;display:grid;gap:8px;color:#425f78;line-height:1.4;font-size:9.7px}",
".sk-workstreams{display:grid;grid-template-columns:minmax(105px,.9fr) minmax(0,1.2fr);gap:6px;margin-top:7px}.sk-workLabel{display:grid;align-items:center;background:#173c69;color:#fff;border-radius:7px;padding:10px 8px;font-weight:760;font-size:10.2px;text-align:center}.sk-workLabel.yellow{background:#e8b80b;color:#15355c}.sk-workDesc{display:grid;align-items:center;border:1px solid #dee6ef;background:#fafcff;padding:8px 9px;border-radius:7px;color:#45627e;font-size:9.5px;line-height:1.4}",
".sk-cmMonitoring{margin-top:9px;background:#173c69;border-radius:8px;padding:12px;color:white;text-align:center}.sk-cmMonitoring b{color:#fff;display:block;font-size:13.5px}.sk-cmMonitoring span{color:#e6eefb;font-size:10px;line-height:1.5}.sk-cmUnder{font-size:10px;color:#a36c13;text-align:center;margin-top:7px}",
".sk-commHero{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}.sk-commPrinciple{background:#103d40;border-radius:9px;color:#fff;padding:12px;display:flex;gap:12px;align-items:center;min-height:81px}.sk-commPrinciple i{display:grid;place-items:center;flex:none;width:38px;height:38px;background:#c7662d;border-radius:50%;font-size:15px;font-weight:900;font-style:normal;color:white}.sk-commPrinciple b{color:#ffa176;font-size:11.7px;display:block}.sk-commPrinciple span{font-size:10.8px;line-height:1.5;color:#fff}",
".sk-commMain{display:grid;grid-template-columns:minmax(0,2.2fr) minmax(210px,.9fr);gap:18px;margin-top:16px}.sk-commStage{display:grid;grid-template-columns:113px minmax(0,1fr);gap:11px;margin-bottom:9px}.sk-commCode{display:grid;place-items:center;align-content:center;border-radius:9px;background:#35688d;color:#fff;padding:12px;font-weight:850;font-size:18px}.sk-commCode span{display:block;color:white;font-size:11px;font-weight:650}.sk-commCode.t1{background:#0b7d87}.sk-commCode.t2{background:#ce8a17}.sk-commCode.t3{background:#b83b39}.sk-commDesc{padding:12px 8px;min-width:0}.sk-commDesc>b{color:#13365c;font-size:12px;display:block}.sk-commDesc>span{font-size:11px;color:#60758d;display:block;margin-top:3px}.sk-commKinds{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.sk-commKind{background:#f7fafc;padding:9px;border-radius:9px}.sk-commKind b{font-size:10.7px;color:#153a62}.sk-commKind p{color:#516782;font-size:10.1px;line-height:1.5;margin:7px 0}.sk-commKind strong{color:#067c85;font-size:10.4px}",
".sk-msgTitle{font-size:15px;color:#143759;font-weight:900;margin:0 0 13px}.sk-msg{display:flex;gap:10px;align-items:center;border-bottom:1px solid #edf1f5;min-height:56px;font-size:11.6px;color:#14375c;font-weight:850}.sk-msg:last-child{border-bottom:0}.sk-msg i{font-style:normal;display:grid;place-items:center;flex:none;width:31px;height:31px;background:#107e88;color:#fff;border-radius:50%}.sk-msg:nth-child(4) i{background:#cb8a22}",
".sk-knowledgeGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sk-kcard{display:grid;grid-template-columns:43px minmax(0,1fr) auto;gap:13px;align-items:center;background:linear-gradient(110deg,#f2f6fb,#f9fbff);border:1px solid #dfe7f1;border-radius:11px;padding:13px;min-height:94px}.sk-knum{display:grid;place-items:center;width:39px;height:39px;background:#15385b;color:#fff;border-radius:50%;font-weight:900;font-size:12px}.sk-kcard:nth-child(even) .sk-knum{background:#0d858b}.sk-kbody b{color:#153a60;font-size:13px}.sk-kbody p{font-size:10.6px;color:#586f86;line-height:1.5;margin:5px 0 0}.sk-kaud{border:1px solid #accddd;background:white;border-radius:8px;color:#0f677c;padding:6px 8px;font-size:9.7px;white-space:nowrap;font-weight:820}",
".sk-bridge{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:13px}.sk-bridge>div{padding:15px;border-radius:13px;border:1px solid #dce7f0;background:white}.sk-bridge strong{display:block;color:#173c62;font-size:14px;margin-bottom:5px}.sk-bridge p{font-size:11px;color:#64788e;line-height:1.6;margin:0}",
".sk-laneFlow{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.sk-laneBox{background:white;border:1px solid #d8e4ef;border-top:5px solid #0d8588;border-radius:10px;padding:11px;min-height:100px}.sk-laneBox b{font-size:11.7px;color:#14385f;display:block}.sk-laneBox p{font-size:10.6px;color:#61758c;line-height:1.5;margin:6px 0}.sk-laneFlow.official{grid-template-columns:repeat(6,minmax(0,1fr))}.sk-laneFlow.official .sk-laneBox{border-top-color:#153f7b}",
".sk-feature{display:flex;align-items:center;gap:12px;background:#e9f5f5;border:1px solid #cfe8e8;border-radius:12px;padding:15px;margin:15px 0}.sk-featureIcon{display:grid;place-items:center;flex:none;width:43px;height:43px;border-radius:12px;background:#cfeaed;font-size:22px;color:#0d6d7a}.sk-feature b{display:block;color:#175271;font-size:12.5px;margin-bottom:3px}.sk-feature span{font-size:11.3px;line-height:1.55;color:#476b7f}",
".sk-roles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sk-rolecard{padding:15px;background:#fff;border-radius:12px;border:1px solid #dce6ef;border-left:4px solid #0d7f84}.sk-rolecard.pmo{border-left-color:#1b4f87}.sk-rolecard strong{display:block;color:#143960;font-size:13px;margin-bottom:7px}.sk-rolecard p{font-size:11.3px;line-height:1.57;color:#667990;margin:0}",
".sk-bricks{display:flex;gap:8px;flex-wrap:wrap}.sk-brick{border-radius:10px;border:1px solid #dee6ef;background:#fff;padding:12px;min-width:130px;flex:1;text-align:center;color:#224567;font-size:11.5px;font-weight:850}.sk-brick small{display:block;color:#8090a4;font-size:10px;margin-top:5px;font-weight:550}",
".sk-tree{display:flex;flex-direction:column;align-items:center;gap:8px}.sk-treenode{width:min(440px,100%);padding:11px;background:#eff5fb;border:1px solid #cbddea;text-align:center;border-radius:10px;color:#1d4672;font-size:12px;font-weight:840}.sk-treenode:nth-child(even){background:#f8f1de;border-color:#f0ddaf}.sk-treearrow{font-size:16px;color:#cb9329}",
".sk-cta-small{padding:6px 9px;font-size:10.4px}.sk-steps3{grid-template-columns:repeat(3,minmax(0,1fr))}",
".sk-coordination .ko-nav{display:flex;flex-wrap:nowrap;overflow:auto;gap:6px;margin:10px 0;padding-bottom:9px}.sk-coordination .ko-nav>.t{flex:none;padding:8px;color:#67849e;font-size:10px;font-weight:900}.sk-coordination .ko-nav button{flex:none;border:1px solid #d8e4ee;border-radius:9px;background:#eef3f8;color:#183a5b;padding:8px 10px;font-size:10.8px;font-weight:800;cursor:pointer;white-space:nowrap}.sk-coordination .ko-nav button.on,.sk-coordination .ko-nav button:hover{background:#12395f!important;color:white!important;border-color:#12395f!important}.sk-coordination .ko-nav button.on b,.sk-coordination .ko-nav button:hover b{color:white!important}.sk-coordination .ko-svg{display:block;min-width:1020px;width:100%;height:auto}.sk-coordination .ko-wrap{border:1px solid #dae5ef;border-radius:12px;overflow:auto}.sk-coordination .ko-p:not(.on){display:none}.sk-coordination .ko-over{display:grid;gap:12px}.sk-coordination .ko-ph{min-width:0}",
".hp-go:hover,.hp-go:focus-visible{background:#113966!important;color:#fff!important;border-color:#113966!important}.hp-go:hover *, .hp-go:focus-visible *{color:#fff!important}.hp-go:disabled:hover{background:#f3f8ff!important;color:#193e67!important}",
".sk-overlay *{box-sizing:border-box}.sk-overlay :focus-visible{outline:2px solid #e4a720;outline-offset:2px}",
"@media(max-width:1250px){.sk-steps{grid-template-columns:repeat(3,minmax(0,1fr))}.sk-cmSlideTop{grid-template-columns:1fr}.sk-commMain{grid-template-columns:1fr}.sk-directory{grid-template-columns:repeat(2,minmax(0,1fr))}.sk-laneFlow.official{grid-template-columns:repeat(3,minmax(0,1fr))}.sk-cmSlideBody{grid-template-columns:160px minmax(0,1fr)}}",
"@media(max-width:850px){.sk-overlay{padding:6px}.sk-dialog{width:100%;height:98vh;border-radius:12px}.sk-head{padding:17px}.sk-hwords h2{font-size:19px}.sk-content{padding:14px}.sk-tabbar{padding:7px}.sk-tab{padding:8px 11px;min-height:39px}.sk-grid,.sk-grid3,.sk-grid4,.sk-roles,.sk-gloss,.sk-knowledgeGrid,.sk-bridge{grid-template-columns:1fr}.sk-cmSlideBody{grid-template-columns:1fr}.sk-planCols{grid-template-columns:repeat(2,minmax(0,1fr))}.sk-commHero{grid-template-columns:1fr}.sk-helpstage{grid-template-columns:1fr}.sk-helpstage-side{padding:9px 12px}.sk-docrow{grid-template-columns:25px minmax(0,1fr) auto}.sk-docrow .sk-owner,.sk-docrow .sk-when,.sk-docHead{display:none}.sk-docHead{display:none}.sk-steps{grid-template-columns:1fr}.sk-laneFlow,.sk-laneFlow.official{grid-template-columns:repeat(2,minmax(0,1fr))}.sk-hexGroup{display:none}.sk-directory{grid-template-columns:1fr}.sk-footer{padding:9px 12px;font-size:9px}.sk-source{white-space:normal}}",
"@media(max-width:540px){.sk-commStage{grid-template-columns:76px 1fr}.sk-commKinds{grid-template-columns:repeat(2,minmax(0,1fr))}.sk-kcard{grid-template-columns:36px 1fr}.sk-kaud{grid-column:2;justify-self:start}.sk-laneFlow,.sk-laneFlow.official{grid-template-columns:1fr}.sk-planCols{grid-template-columns:1fr}.sk-intro{flex-direction:column;align-items:flex-start}}"
].join("");
function addStyle(){if(document.getElementById("sk-ux-style"))return;var e=document.createElement("style");e.id="sk-ux-style";e.textContent=styles;document.head.appendChild(e)}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function src(t){return '<span class="sk-source">'+t+'</span>'}
function intro(kicker,title,desc,source){return '<div class="sk-intro"><div><div class="sk-label">'+kicker+'</div><h3>'+title+'</h3><p>'+desc+'</p></div>'+(source?src(source):'')+'</div>'}
function note(t,gold){return '<div class="sk-note'+(gold?' gold':'')+'">'+t+'</div>'}
function cards(arr){return '<div class="sk-grid">'+arr.map(function(a){return '<div class="sk-card"><strong>'+a[0]+'</strong><p>'+a[1]+'</p></div>'}).join('')+'</div>'}
function jump(label,target){return '<button type="button" class="sk-cta" data-skgo="'+esc(target)+'" title="Buka menu '+esc(label)+'">↗ '+esc(label)+'</button>'}
function detail(title,body,open){return '<details class="sk-detail"'+(open?' open':'')+'><summary>'+title+'</summary><div class="sk-detailBody">'+body+'</div></details>'}
var CM=[
['Perencanaan Perubahan','Menyusun tujuh analisis dan strategi berdasarkan dampak, pemangku kepentingan serta kesiapan.','cmo-adp','ADP','cmo-rencana','Perencanaan','cmo-jaringan','Jaringan Perubahan','cmo-cra','CRA'],
['Pelaksanaan Perubahan','Mengaktifkan jaringan, memperkuat kesiapan, melaksanakan komunikasi dan pelatihan.','cmo-pelaksanaan','Pelaksanaan'],
['Pemantauan dan Evaluasi','Memantau komunikasi, pelatihan, indikator keberhasilan, serta tindak lanjut secara berkala.','cmo-monev','Monev'],
['Evaluasi Pascaimplementasi','Paling cepat satu bulan sejak implementasi; nilai adopsi, perilaku kerja, isu, dan kanal layanan.','cmo-pasca','Evaluasi Pascaimplementasi'],
['Penutupan Manajemen Perubahan','Setelah evaluasi dan masa transisi; alihkan pendampingan ke pemilik probis/unit operasional.','cmo-closing','Penutupan CM']
];
var PM=[
['Persiapan dan Perencanaan','Petakan program dan UIC, susun Dokumen Proyek (As-Is, To-Be, Charter, kriteria selesai, rencana kerja), lalu tetapkan melalui ND bersama.','pmo-portofolio','Portofolio','pmo-program','Program','pmo-perencanaan','Dokumen Proyek','pmo-wbsplan','Susun WBS'],
['Pelaksanaan','Jalankan WBS, lampirkan bukti, ajukan perubahan resmi apabila lingkup, jadwal, atau biaya berubah.','pmo-wbs','WBS & Progres','pmo-bukti','Bukti Dukung','pmo-cr','Change Request','pmo-narasi','Narasi T-Program'],
['Pemantauan dan Pengendalian','Lihat capaian, risiko, milestone, jadwal, serta progres yang dilaporkan PMO Unit kepada PMO Kemenkeu.','pmo-siklus','Overview','pmo-milestone','Milestone','pmo-risiko','Risiko & Isu','pmo-laporan','Capaian TW','pmo-oneonone','Jadwal 1-on-1'],
['Penutupan Proyek','Penutupan berdasarkan acceptance criteria, pengalihan menjadi proyek unit, atau keluar dari program transformasi.','pmo-penutupan','Penutupan Proyek'],
['Evaluasi Pascaproyek','Paling cepat tiga bulan setelah proyek ditutup; nilai efisiensi biaya, proses bisnis, dan pemenuhan layanan.','pmo-pascaproyek','Evaluasi Pascaproyek'],
['Pengelolaan Referensi','Gunakan kode program, master tahapan, dan referensi item WBS untuk konsistensi data.','pmo-referensi','Referensi Kode']
];
var menuPM=[
['Project Selection','Pemilihan program, dokumen program, unggahan, pemetaan hingga penetapan','project-selection'],
['Overview','Capaian dan ringkasan kinerja','pmo-siklus'],['Portofolio','Program dan UIC utama/pendukung','pmo-portofolio'],['Program','Proyek dan penugasan','pmo-program'],
['Dokumen Proyek','As-Is, To-Be, Charter, persetujuan','pmo-perencanaan'],['WBS Perencanaan','Penyusunan aktivitas dan bobot','pmo-wbsplan'],
['WBS & Progres','Pelaksanaan, target, realisasi','pmo-wbs'],['Bukti Dukung','Unggah dan validasi bukti','pmo-bukti'],['Change Request','Pengendalian perubahan baseline','pmo-cr'],
['Milestone','Tonggak waktu proyek','pmo-milestone'],['Risiko & Isu','Risiko dan tindak lanjut','pmo-risiko'],['Capaian Triwulanan','Laporan kinerja periodik','pmo-laporan'],
['Narasi T-Program','Uraian pelaksanaan per program','pmo-narasi'],['Jadwal 1-on-1','Rencana pertemuan koordinasi','pmo-oneonone'],
['Penutupan','Kriteria dan dokumen penyelesaian','pmo-penutupan'],['Evaluasi Pascaproyek','Evaluasi manfaat proyek','pmo-pascaproyek'],['Referensi Kode','Kamus data dan standar kode','pmo-referensi']
];
var menuPMDeep=[
 ['Project Selection › Riwayat Program','Salin program lintas tahun tanpa menimpa dokumen asal','project-selection|usulan:bank'],
 ['Project Selection › Daftar Program','Klik baris untuk detail; aksi Pemetaan, Edit, Unggah, dan Unduh kondisional','project-selection|usulan:detail'],
 ['Project Selection › Identitas Program','Tab Identitas di Detail Program','project-selection|usulan:detail:identity'],
 ['Project Selection › Business Case','Tab Business Case di Detail Program','project-selection|usulan:detail:case'],
 ['Project Selection › Manfaat','Tab Manfaat di Detail Program','project-selection|usulan:detail:benefits'],
 ['Project Selection › Stakeholder','Tab Stakeholder di Detail Program','project-selection|usulan:detail:stakeholders'],
 ['Project Selection › Risiko','Tab Risiko di Detail Program','project-selection|usulan:detail:risks'],
 ['Project Selection › Tata Kelola','Tab Tata Kelola di Detail Program','project-selection|usulan:detail:governance'],
 ['Project Selection › Buat Dokumen Program','Generator, pratinjau, ekspor dan identitas dokumen','project-selection|usulan:detail:docs'],
 ['Project Selection › Dokumen Portofolio','Generator portofolio program tahun yang dipilih','project-selection|usulan:portfolio'],
 ['Project Selection › Pemetaan Proyek','Tab Pemetaan','project-selection|mapping:mapping'],
 ['Project Selection › Usulan Proyek','Tab pengelolaan usulan proyek','project-selection|mapping:proposal'],
 ['Project Selection › Hasil Pemetaan','Tab hasil pemetaan dan relasi','project-selection|mapping:results'],
 ['Project Selection › Dokumen Usulan Proyek','Tab dokumen usulan proyek','project-selection|mapping:docs'],
 ['Project Selection › Prioritasi & Peringkat','Tab Prioritasi','project-selection|prioritasi:ranking'],
 ['Project Selection › Kriteria & Bobot','Tab kriteria prioritas','project-selection|prioritasi:criteria'],
 ['Project Selection › Manfaat & Monev','Tab manfaat dan monev','project-selection|prioritasi:monev'],
 ['Project Selection › Charter Program','Tahap charter program dan dokumen kerja','project-selection|charter'],
 ['Project Selection › Penetapan','Tahap penetapan program dan proyek','project-selection|penetapan'],
 ['Project Selection › Draft RKMK','Tahap narasi dan reviu','project-selection|rkmk'],
 ['Dokumen Proyek › As-is','Dokumen 1/7; pilih program terlebih dahulu','pmo-perencanaan|asis'],
 ['Dokumen Proyek › To-be','Dokumen 2/7; pilih program terlebih dahulu','pmo-perencanaan|tobe'],
 ['Dokumen Proyek › Perbandingan','Dokumen 3/7; pilih program terlebih dahulu','pmo-perencanaan|cs'],
 ['Dokumen Proyek › Charter','Dokumen 4/7; pilih program terlebih dahulu','pmo-perencanaan|ch'],
 ['Dokumen Proyek › Kriteria','Dokumen 5/7; pilih program terlebih dahulu','pmo-perencanaan|kp'],
 ['Dokumen Proyek › Manfaat','Dokumen 6/7; pilih program terlebih dahulu','pmo-perencanaan|mf'],
 ['Dokumen Proyek › Linimasa','Dokumen 7/7; pilih program terlebih dahulu','pmo-perencanaan|rk']
];
var menuCM=[
['Analisis Dampak (ADP)','As-Is, To-Be, POSTeR, risiko','cmo-adp'],['Perencanaan','Stakeholder, komunikasi, pelatihan','cmo-rencana'],
['Jaringan Perubahan','Peran jaringan dan penugasan','cmo-jaringan'],['CRA','Kesiapan dan rencana aksi','cmo-cra'],
['Pelaksanaan','Realisasi komunikasi dan pelatihan','cmo-pelaksanaan'],['Monev','Monitoring indikator dan tindak lanjut','cmo-monev'],
['Evaluasi Pascaimplementasi','Keberlanjutan adopsi dan kanal resmi','cmo-pasca'],['Penutupan CM','Serah terima dan pengakhiran transisi','cmo-closing']
];
var termsPM=[
['PMO','Project Management Office: fungsi koordinasi dan pengendalian proyek transformasi.'],['UIC','Unit in Charge: penanggung jawab kegiatan atau item pekerjaan.'],
['Charter','Bagian Dokumen Proyek yang merangkum dasar, tujuan, ruang lingkup, sponsor, serta kriteria.'],['WBS','Work Breakdown Structure: rincian pekerjaan/hierarki paket kerja yang diukur progresnya.'],
['Baseline','Rencana ruang lingkup, waktu, atau biaya yang sudah disetujui sebagai acuan.'],['Acceptance Criteria','Kriteria yang digunakan untuk menyatakan hasil proyek memenuhi persyaratan.'],
['Change Request','Permohonan perubahan formal terhadap lingkup, jadwal, atau biaya proyek.'],['Milestone','Tonggak pencapaian penting pada jadwal proyek.'],
['Deliverable','Hasil/keluaran yang harus disampaikan proyek.'],['Dependensi','Ketergantungan antaraktivitas atau antarproyek.'],
['Risiko','Peristiwa yang belum terjadi namun dapat memengaruhi target proyek.'],['Isu','Masalah yang sedang terjadi dan membutuhkan penanganan.'],
['Bukti Dukung','Dokumen/tautan yang menunjukkan penyelesaian aktivitas.'],['Penutupan Proyek','Pengakhiran pengelolaan proyek sesuai persyaratan dan keputusan.'],
['Evaluasi Pascaproyek','Penilaian manfaat proyek minimal tiga bulan setelah penutupan.'],['PMBOK','Kerangka pengetahuan manajemen proyek dari Project Management Institute (PMI).']
];
var termsCM=[
['CM / CMO','Change Management / Change Management Office.'],['ADP','Analisis Dampak Perubahan; membandingkan kondisi As-Is dan To-Be.'],
['POSTeR','Proses bisnis, Organisasi, SDM, Teknologi, Regulasi.'],['Stakeholder','Pihak yang terdampak atau dapat memengaruhi perubahan.'],
['Sponsor','Pimpinan yang memberikan arah, dukungan, dan legitimasi perubahan.'],['Jaringan Perubahan','Kumpulan peran pelaksana/pendukung perubahan lintas unit.'],
['T-Agent','Agen perubahan; pada aplikasi ini khusus modul program DOA.'],['Change Champion','Penggerak perubahan dari lingkungan pemilik proses bisnis.'],
['CRA','Change Readiness Assessment: pengukuran kesiapan perubahan.'],['TNA','Training Needs Analysis: analisis kebutuhan pelatihan.'],
['ADKAR','Awareness, Desire, Knowledge, Ability, Reinforcement.'],['Adopsi','Penggunaan nyata sistem atau penerapan proses kerja baru.'],
['Resistensi','Keberatan atau hambatan penerimaan perubahan.'],['Monitoring & Evaluasi','Pengukuran pelaksanaan komunikasi, pelatihan, adopsi, dan tindak lanjut.'],
['Evaluasi Pascaimplementasi','Evaluasi keberlanjutan adopsi paling cepat satu bulan setelah implementasi.'],['Masa Transisi','Periode stabilisasi sebelum dukungan dialihkan ke mekanisme operasional reguler.'],
['BAST','Berita Acara Serah Terima untuk pengalihan tanggung jawab.'],['Closing CM','Akhir pendampingan transisi, bukan sekadar penutupan proyek.']
];
var docPM=[
['Kondisi As-Is','Kondisi probis, sistem eksisting, dan teknologi','PMO Unit + pemilik probis','T−1 · Perencanaan','pmo-perencanaan'],
['Kondisi To-Be','Rancangan probis, digitalisasi, dan arsitektur baru','PMO Unit + unit teknis','T−1 · Perencanaan','pmo-perencanaan'],
['Perbandingan As-Is dan To-Be','Selisih proses/teknologi yang perlu diubah','PMO Unit','T−1 · Perencanaan','pmo-perencanaan'],
['Charter Proyek','Tujuan, lingkup, pihak terlibat, dan hasil','PMO Unit','T−1 · Perencanaan','pmo-perencanaan'],
['Kriteria Penyelesaian Proyek','Batas penerimaan hasil/acceptance criteria','PMO Unit + pemilik probis','Perencanaan','pmo-perencanaan'],
['Rencana Kerja','Jadwal, target, tahapan, dan sumber daya','PMO Unit','Perencanaan','pmo-perencanaan'],
['Nota Dinas Bersama Dokumen Proyek','Penetapan dokumen proyek','PMO Kemenkeu + PMO Unit','≤ 15 HK setelah kontrak kinerja','pmo-perencanaan'],
['Work Breakdown Structure','Rincian kegiatan, target, bobot dan PIC','PMO Kemenkeu + PMO Unit','≤ 15 HK setelah Nota Dinas bersama','pmo-wbsplan'],
['Bukti Dukung Pelaksanaan','Bukti capaian pekerjaan dalam WBS','PIC/unit teknis','Pelaksanaan','pmo-bukti'],
['Change Request','Usulan perubahan lingkup, jadwal, atau biaya','PMO Unit','Jika terdapat perubahan','pmo-cr'],
['Laporan Progres Berkala','Konsolidasi target dan realisasi','PMO Unit → PMO Kemenkeu','Pemantauan','pmo-laporan'],
['Dokumen Penutupan / Telaah','Permintaan penutupan dan hasil telaah','PMO Unit / PMO Kemenkeu','Penutupan','pmo-penutupan'],
['Hasil Evaluasi Pascaproyek','Efisiensi biaya, proses bisnis, layanan','PMO Kemenkeu','≥ 3 bulan setelah penutupan','pmo-pascaproyek']
];
var docCM=[
['Kertas Kerja CM — ADP','Perbandingan As-Is–To-Be dan dampak POSTeR','CMO Unit + pemilik probis','Perencanaan','cmo-adp'],
['Analisis Risiko Perubahan','Resistensi, operasional, ketergantungan, risiko lain','CMO Unit','Perencanaan','cmo-adp'],
['Pemetaan Stakeholder','Pengaruh, kepentingan, sikap, rencana pelibatan','CMO Unit','Perencanaan','cmo-rencana'],
['Analisis Jaringan Pengelola','Kebutuhan peran dan koordinasi jaringan','CMO Unit','Perencanaan','cmo-jaringan'],
['Analisis Kesiapan / CRA','Kesenjangan kesiapan dan rencana aksi','CMO Unit','Perencanaan / pemantauan','cmo-cra'],
['Analisis Kebutuhan Komunikasi','Pesan, sasaran, media, jadwal','CMO Unit','Perencanaan','cmo-rencana'],
['Analisis Kebutuhan Pelatihan / TNA','Kompetensi, materi, metode, jadwal','CMO Unit','Perencanaan','cmo-rencana'],
['Realisasi Komunikasi','Kegiatan, peserta, bukti, dan tindak lanjut','Tim CM / CMO Unit','Pelaksanaan','cmo-pelaksanaan'],
['Realisasi Pelatihan','Peserta, evaluasi hasil, dan bukti','Tim CM / CMO Unit','Pelaksanaan','cmo-pelaksanaan'],
['Kertas Kerja Pemantauan CM','Capaian indikator dan tindak lanjut','CMO Unit','Berkala','cmo-monev'],
['Hasil Evaluasi Pascaimplementasi','Adopsi, perilaku kerja baru, isu, kanal resmi','CMO Unit','≥ 1 bulan setelah implementasi','cmo-pasca'],
['BAST / Dokumen Sejenis','Pengalihan tanggung jawab dan kanal layanan','CMO Unit + pemilik probis / operasional','Setelah transisi dan evaluasi','cmo-closing']
];
function stepCards(ph){return '<div class="sk-steps">'+ph.map(function(a,i){return '<article class="sk-step"><div class="sk-stephead"><span class="sk-num">'+(i+1)+'</span><b>'+a[0]+'</b></div><div class="sk-stepbody"><p>'+a[1]+'</p><div class="sk-buttons">'+a.slice(2).filter(function(x,i){return i%2===0}).map(function(dst,i){return jump(a[3+i*2],dst)}).join('')+'</div></div></article>'}).join('')+'</div>'}
function helpStages(kind){var items=kind==='pmo'?PM:CM;return intro('Tahapan & shortcut','Alur '+(kind==='pmo'?'Manajemen Proyek':'Manajemen Perubahan'),'Pilih tahap, baca apa yang perlu dilakukan, lalu buka menu kerja yang terkait. Semua shortcut mengarah ke fitur aplikasi.')+
 '<div class="sk-helpflow">'+items.map(function(a,i){var buttons='';for(var k=2;k<a.length;k+=2)buttons+=jump(a[k+1],a[k]);return '<section class="sk-helpstage"><div class="sk-helpstage-side"><em>TAHAP '+String(i+1).padStart(2,'0')+'</em><b>'+a[0]+'</b></div><div class="sk-helpstage-main"><p>'+a[1]+'</p><div class="sk-buttons">'+buttons+'</div></div></section>'}).join('')+'</div>'+
 note(kind==='pmo'?'<b>Alur PMO:</b> penyusunan Dokumen Proyek → WBS → pelaksanaan & change request → pemantauan → penutupan → evaluasi manfaat paling cepat 3 bulan setelah penutupan.':'<b>Alur CMO:</b> perencanaan → pelaksanaan → pemantauan & evaluasi → evaluasi pascaimplementasi paling cepat 1 bulan → penutupan CM setelah masa transisi.');
}
function helpMenu(kind){var items=kind==='pmo'?menuPM.concat(menuPMDeep):menuCM;return intro('Navigasi aplikasi','Peta Menu '+(kind==='pmo'?'Project Management':'Change Management'),'Temukan fungsi yang ingin dikerjakan dan langsung masuk ke menunya. Gunakan pencarian untuk menyaring daftar.')+
 '<input class="sk-search" type="search" data-skfilter placeholder="Cari nama menu atau fungsi, misalnya WBS, risiko, CRA..." aria-label="Cari menu"><div class="sk-directory" style="margin-top:13px">'+items.map(function(a){return '<div class="sk-directoryItem sk-filtered" data-skitem="'+esc((a[0]+' '+a[1]).toLowerCase())+'"><b>'+a[0]+'</b><p>'+a[1]+'</p>'+jump('Buka menu',a[2])+'</div>'}).join('')+'</div>'+(kind==='pmo'?note('Untuk membuka subtab Dokumen Proyek secara langsung, pilih program terlebih dahulu di tabel Dokumen Proyek. Aksi tabel: mata untuk melihat, pensil untuk mengubah atau membuat revisi.'):'' )}
function helpGloss(kind){return intro('Istilah penting','Daftar Istilah '+(kind==='pmo'?'Project Management':'Change Management'),'Glosarium ringkas untuk memahami singkatan, label, dan istilah yang muncul dalam menu aplikasi.')+
 '<input class="sk-search" type="search" data-skfilter placeholder="Cari istilah..." aria-label="Cari istilah"><div class="sk-gloss" style="margin-top:13px">'+(kind==='pmo'?termsPM:termsCM).map(function(a){return '<div class="sk-term sk-filtered" data-skitem="'+esc(a.join(' ').toLowerCase())+'"><b>'+a[0]+'</b><p>'+a[1]+'</p></div>'}).join('')+'</div>'}
function helpDocs(kind){var docs=kind==='pmo'?docPM:docCM;return intro('Katalog artefak','Dokumentasi & Output '+(kind==='pmo'?'Manajemen Proyek':'Manajemen Perubahan'),'Daftar dokumen dan keluaran yang disebutkan atau dijabarkan dalam draft RKMK. Klik shortcut untuk menuju menu pengisian/pencatatannya.','Draft RKMK (6) · Bagian J')+
 '<input class="sk-search" type="search" data-skfilter placeholder="Cari dokumen, penanggung jawab, atau tahap..." aria-label="Cari dokumentasi"><div class="sk-docwrap" style="margin-top:12px"><div class="sk-docHead"><span>No.</span><span>Dokumen / keluaran</span><span>Penanggung jawab</span><span>Waktu / fase</span><span>Menu</span></div>'+docs.map(function(a,i){return '<div class="sk-docrow sk-filtered" data-skitem="'+esc(a.join(' ').toLowerCase())+'"><span class="sk-docnum">'+(i+1)+'</span><div><b>'+a[0]+'</b><p>'+a[1]+'</p></div><span class="sk-owner">'+a[2]+'</span><span class="sk-when">'+a[3]+'</span>'+jump('Buka',a[4])+'</div>'}).join('')+'</div>'+note('Dokumen dipakai sebagai katalog keluaran kerja. Ketersediaan tombol pembuatan atau unggah mengikuti hak akses dan kemampuan menu masing-masing, bukan tautan unduhan template yang belum tersedia.',true)}
function cmFramework(){
 var plan=[
 ['Analisis Dampak Perubahan',['As-Is → To-Be, POSTeR','Risiko perubahan & resistensi','Indikator keberhasilan CM']],
 ['Manajemen Pemangku Kepentingan',['Identifikasi & pengaruh','Matriks dan sikap','Strategi dan rencana pelibatan']],
 ['Jaringan dan Kesiapan Perubahan',['Analisis kebutuhan jaringan','Penetapan peran jaringan','Assessment kesiapan']],
 ['Analisis Komunikasi & Pelatihan',['Kebutuhan komunikasi','Kebutuhan pelatihan','Pesan, media, materi, jadwal']]
 ];
 var works=[
 ['Aktivasi Jaringan Perubahan','Menggerakkan sponsor, CMO, tim proyek dan agen perubahan.'],
 ['Penguatan Kesiapan','Rencana aksi untuk menutup gap kesiapan pengguna.'],
 ['Pelaksanaan Komunikasi','Pesan perubahan disampaikan konsisten dan terarah.'],
 ['Pelaksanaan Pelatihan','Pembekalan kompetensi dan simulasi proses kerja baru.']
 ];
 return intro('Framework · Struktur sesuai bahan paparan','Kerangka Kerja Manajemen Perubahan','Alur utama mengikuti slide kerangka kerja: perencanaan di kiri, implementasi di kanan, serta monitoring, evaluasi dan penguatan adopsi di bawah. Tambahan evaluasi pascaimplementasi dan penutupan ditampilkan terpisah agar isi slide asal tetap utuh.','PPT Kerangka Kerja CM · Draft RKMK (6)')+
 '<section class="sk-cmSlide"><div class="sk-cmSlideTitle"><h3>KERANGKA KERJA MANAJEMEN PERUBAHAN</h3><p>Tujuan · tata kelola · perencanaan analisis · implementasi · pengukuran</p></div><div class="sk-cmSlideBody">'+
 '<aside class="sk-hexGroup"><div class="sk-hexes"><div class="sk-hex a">Digitalisasi<br>Core System<br>APBN</div><div class="sk-hex b">Digitalisasi<br>Data</div><div class="sk-hex c">Digitalisasi<br>Office<br>Automation</div></div><strong>Program Transformasi</strong></aside>'+
 '<div class="sk-cmSlideRight"><div class="sk-cmSlideTop"><div><div class="sk-cmBand"><b>PERENCANAAN</b><span>Menetapkan arah, ukuran keberhasilan, dan strategi perubahan</span></div><div class="sk-planCols">'+plan.map(function(p,i){return '<div class="sk-planCard"><b><i>'+(i+1)+'</i>'+p[0]+'</b><ul>'+p[1].map(function(t){return '<li>'+t+'</li>'}).join('')+'</ul></div>'}).join('')+'</div></div>'+
 '<div><div class="sk-cmBand impl"><b>IMPLEMENTASI</b><span>Menjalankan strategi dan mendorong adopsi</span></div><div class="sk-workstreams">'+works.map(function(x,i){return '<div class="sk-workLabel'+(i>1?' yellow':'')+'">'+x[0]+'</div><div class="sk-workDesc">'+x[1]+'</div>'}).join('')+'</div></div></div>'+
 '<div class="sk-cmMonitoring"><b>Monitoring, Evaluasi & Penguatan Adopsi</b><span>Memantau indikator, mengevaluasi efektivitas, mengidentifikasi kesenjangan, dan menyesuaikan strategi secara berkelanjutan</span></div><div class="sk-cmUnder">Target adopsi menjadi acuan desain strategi dan tolok ukur keberhasilan implementasi.</div></div></div></section>'+
 '<div class="sk-sectiontitle">Tahapan lanjutan sesuai revisi draft RKMK</div>'+cards([
 ['04 · Evaluasi Pascaimplementasi Perubahan','Paling cepat satu bulan setelah implementasi: nilai keberlanjutan adopsi, perubahan perilaku kerja, penanganan isu dan kesiapan kanal layanan reguler.'],
 ['05 · Penutupan Manajemen Perubahan','Setelah evaluasi dan masa transisi: akhiri pendampingan sementara, alihkan tanggung jawab ke pemilik probis/unit operasional dan dokumentasikan BAST.']
 ])+
 detail('Tampilkan / sembunyikan penjelasan setiap komponen kerangka kerja',
 '<b>Perencanaan:</b> hasil analisis dampak, risiko, stakeholder, jaringan, kesiapan, komunikasi, dan pelatihan dituangkan dalam kertas kerja CM. <br><b>Implementasi:</b> aktivasi jaringan dan penguatan kesiapan dilakukan bersamaan dengan komunikasi dan pelatihan. <br><b>Monitoring:</b> ukur efektivitas dan tindak lanjut secara berkala. <br><b>Evaluasi Pascaimplementasi:</b> nilai keberlanjutan adopsi minimal satu bulan setelah go-live. <br><b>Penutupan:</b> pastikan operasi, kanal layanan, dan serah terima siap. '+
 '<div class="sk-buttons" style="margin-top:10px">'+jump('ADP','cmo-adp')+jump('Perencanaan','cmo-rencana')+jump('Monev','cmo-monev')+jump('Evaluasi','cmo-pasca')+jump('Closing CM','cmo-closing')+'</div>') ;
}
function cmGovernance(){return intro('Tata Kelola CM','Organisasi dan Tanggung Jawab CMO','Pembagian kewenangan serta koordinasi untuk memastikan strategi perubahan dilaksanakan, diterima, dan diadopsi secara konsisten.','Draft RKMK (6) · hlm 45–52')+
 '<div class="sk-feature"><div class="sk-featureIcon">⚑</div><div><b>CMO Kemenkeu dan CMO Unit memiliki peran yang berbeda</b><span>CMO Kemenkeu mengoordinasikan dan membina pelaksanaan manajemen perubahan lintas unit. CMO Unit memastikan rencana komunikasi dan pelatihan dijalankan sesuai kertas kerja CM.</span></div></div>'+
 '<div class="sk-roles">'+[
 ['CMO Kemenkeu · Pusmantap','Mengoordinasikan, mengelola, memfasilitasi, memantau manajemen perubahan, serta pembinaan CMO Unit.'],
 ['CMO Unit · UE I / Non Eselon','Dibentuk oleh pimpinan unit; melaksanakan strategi komunikasi dan pelatihan dan berkoordinasi dengan PMO Unit, pemilik probis, dan unit teknis.'],
 ['Pemilik Proses Bisnis','Menetapkan arah probis, memberi informasi perubahan, serta menerima tanggung jawab pendampingan pada tahap operasional.'],
 ['Unit Teknis / Tim Proyek','Mendukung uji coba, implementasi, penyelesaian isu, integrasi, serta dukungan sistem dan operasional.'],
 ['Sponsor & Jaringan Perubahan','Memberi legitimasi, menggerakkan komitmen, menguatkan kesiapan, dan membantu penyebaran pesan.'],
 ['T-Agent · Khusus DOA','Agen perubahan untuk modul pada program DOA; tidak diwajibkan pada semua modul atau program.']
 ].map(function(a){return '<div class="sk-rolecard"><strong>'+a[0]+'</strong><p>'+a[1]+'</p></div>'}).join('')+'</div>'+
 '<div class="sk-sectiontitle">Lima tahapan tata kelola CM</div>'+stepCards(CM)+note('CM tidak otomatis ditutup ketika proyek di-hosting. Evaluasi pascaimplementasi dilaksanakan paling cepat satu bulan sejak implementasi sistem; closing CM menyusul setelah kesiapan layanan resmi dan serah terima terpenuhi.')+
 detail('Rincian kriteria Penutupan CM',
 'Seluruh isu diselesaikan atau memiliki penanggung jawab tindak lanjut; kanal layanan resmi dan eskalasi siap; pengguna menerima komunikasi perpindahan kanal; hasil evaluasi terdokumentasi; penutupan disertai BAST atau dokumen sejenis.');
}
function cmCommunication(){
 var top=[
 ['Satu narasi','SIPN memperkuat, tidak menggantikan kewenangan Pemda atas NJOP dan BPHTB.'],
 ['Sponsor lebih dulu','Pesan pimpinan disampaikan sebelum penandatanganan PKS, bukan bersamaan.'],
 ['Ikuti milestone','Komunikasi pengguna dikaitkan ke uji coba 2027, bukan ditumpuk di akhir 2026.']
 ];
 var kinds=[
 ['Proses bisnis','Mapping, tagging TKD, kodefikasi, pedoman','DJKN / pemilik probis'],
 ['Teknis aplikasi','Bug, integrasi API, sinkronisasi data','Puspensi / BaTii'],
 ['Akses & akun','SSO, MFA, pengguna eksternal','Service Desk BaTii'],
 ['Teknis data','Kualitas, validasi dan pertukaran data','Pusdatin / BaTii']
 ];
 var msgs=['Mengapa','Yang berubah','Yang tidak berubah','Manfaat langsung','Bantuan tersedia'];
 return intro('Komunikasi · Studi kasus SIPN','Rekomendasi Komunikasi','Menyamakan pesan perubahan, menggerakkan sponsor lebih dini, serta memastikan pengguna tahu manfaat dan cara memperoleh dukungan. Posisi T0–T3 dan lima pesan kunci mengikuti bahan paparan.','PPT Rekomendasi Komunikasi')+
 '<div class="sk-commHero">'+top.map(function(x,i){return '<div class="sk-commPrinciple"><i>'+(i+1)+'</i><div><b>'+x[0]+'</b><span>'+x[1]+'</span></div></div>'}).join('')+'</div>'+
 '<div class="sk-commMain"><div>'+
 '<div class="sk-commStage"><div class="sk-commCode">T0<span>Swabantu</span></div><div class="sk-commDesc"><b>Portal knowledge, FAQ per fitur, video tutorial</b><span>Pengguna mencari jawaban sendiri sebelum membuat tiket.</span></div></div>'+
 '<div class="sk-commStage"><div class="sk-commCode t1">T1<span>Kanal transisi</span></div><div class="sk-commDesc"><b>Submit issue + Helpdesk</b><span>Koordinasi kelompok pengguna, pemilahan dan pencatatan tiket menurut jenis isu. SLA mengikuti kesepakatan layanan.</span></div></div>'+
 '<div class="sk-commStage"><div class="sk-commCode t2">T2<span>Penanganan</span></div><div class="sk-commDesc"><div class="sk-commKinds">'+kinds.map(function(x){return '<div class="sk-commKind"><b>'+x[0]+'</b><p>'+x[1]+'</p><strong>↗ '+x[2]+'</strong></div>'}).join('')+'</div></div></div>'+
 '<div class="sk-commStage"><div class="sk-commCode t3">T3<span>Eskalasi</span></div><div class="sk-commDesc"><b>Forum Sinergi BAS → Steering Committee</b><span>Isu kebijakan, lintas K/L–Pemda, atau perubahan pedoman.</span></div></div>'+
 '</div><aside><h4 class="sk-msgTitle">Pesan kunci sosialisasi</h4>'+msgs.map(function(x,i){return '<div class="sk-msg"><i>'+(i+1)+'</i>'+x+'</div>'}).join('')+'</aside></div>'+
 note('Contoh SIPN/Sinergi BAS pada slide digunakan sebagai <b>referensi desain komunikasi</b>. Penyebutan PIC dan SLA harus disesuaikan dengan proyek masing-masing.',true);
}
function cmTraining(){var topics=[
 ['Kebijakan','Peraturan, keputusan, pedoman serta dasar tata kelola.','Semua'],
 ['Aktivasi akses','Panduan SSO, MFA dan aktivasi akun pengguna.','Pemda · K/L'],
 ['Hak akses','Role matrix: admin, reviewer, operator, auditor.','Semua'],
 ['Probis & standar data','Mapping/tagging, konversi BAS, change request.','Pemda · Forum'],
 ['Panduan sistem','User manual per peran, video tutorial, simulasi sandbox.','Per peran'],
 ['Dukungan','FAQ per fitur, alur aduan, SLA, klinik online, helpdesk.','Semua'],
 ['Rekaman & materi','Materi dan rekaman sosialisasi, ToT dan forum.','Semua'],
 ['Jadwal & progres','Roadmap, jadwal pelatihan, gelombang dan kesiapan.','Semua']
 ];
 return intro('Pelatihan · Portal Knowledge','Portal Knowledge: Satu Pintu Panduan','Portal knowledge membantu pengguna belajar mandiri sebelum dan sesudah pelatihan penggunaan sistem baru, mengurangi pertanyaan berulang, dan memberi rujukan yang konsisten bagi helpdesk.','PPT Portal Knowledge SIPN')+
 '<div class="sk-knowledgeGrid">'+topics.map(function(x,i){return '<div class="sk-kcard"><span class="sk-knum">'+String(i+1).padStart(2,'0')+'</span><div class="sk-kbody"><b>'+x[0]+'</b><p>'+x[1]+'</p></div><span class="sk-kaud">'+x[2]+'</span></div>'}).join('')+'</div>'+
 note('<b>Kesiapan konten:</b> setiap materi perlu penanggung jawab, pembaruan berkala, sasaran pengguna, hak akses, serta tautan bantuan. Portal knowledge melengkapi pelatihan, bukan menggantikan coaching atau pendampingan.');
}
function cmTransition(){
 var trans=[['T0 · Swabantu','Pengguna memanfaatkan knowledge base, FAQ, dan video tutorial.'],['T1 · Kanal sementara','Koordinasi transisi (misalnya WAG), isu dicatat dan diklasifikasikan.'],['T2 · Penanganan','Pemilik probis, tim aplikasi, Service Desk, atau data menindaklanjuti sesuai kategori.'],['T3 · Eskalasi','Isu lintas kewenangan dan kebijakan dibahas pada forum eskalasi.']];
 var official=[['Pengguna','Membuat tiket dan memperoleh nomor aduan.'],['L1 · Agen Kemenkeu Prime','Biro KLI mengklasifikasikan tiket dan menyelesaikan isu umum.'],['L2 · Pemilik Probis / Service Desk','Menyelesaikan isu sesuai kewenangan proses bisnis atau teknis.'],['L3 · Incident Manager','Menangani insiden jaringan, infrastruktur, aplikasi, dan basis data.'],['L4 · Problem Manager','Menganalisis akar masalah untuk isu kompleks atau berulang.'],['Respon & Penutupan','Pengguna mendapat respon dan status penyelesaian.']];
 return intro('Complaint Handling · Masa transisi dan kanal resmi','Dari Pendampingan Sementara ke Layanan Operasional','Membedakan kanal koordinasi saat stabilisasi pasca-go-live dari jalur tiket resmi setelah masa transisi. Kedua alur berada dalam satu tab agar peralihannya mudah dipahami.','PPT Alur Tiket Sinergi BAS')+
 '<div class="sk-bridge"><div><span class="sk-pill sk-pgold">TAHAP STABILISASI</span><strong>Masa Transisi</strong><p>Gunakan pendampingan intensif dan kanal sementara ketika pengguna masih adaptasi. Semua isu harus tetap dicatat dan mempunyai PIC.</p></div><div><span class="sk-pill sk-pteal">OPERASIONAL REGULER</span><strong>Jalur Resmi Berbasis Tiket</strong><p>Aduan dialihkan ke Kemenkeu Prime (Agen Biro KLI) dan/atau Service Desk BaTii sesuai kategori, SLA, dan tata kelola ITSM.</p></div></div>'+
 '<div class="sk-sectiontitle">01 · Penanganan masa transisi</div><div class="sk-laneFlow">'+trans.map(function(x){return '<div class="sk-laneBox"><b>'+x[0]+'</b><p>'+x[1]+'</p></div>'}).join('')+'</div>'+
 '<div class="sk-sectiontitle">02 · Penanganan resmi melalui tiket</div><div class="sk-laneFlow official">'+official.map(function(x){return '<div class="sk-laneBox"><b>'+x[0]+'</b><p>'+x[1]+'</p></div>'}).join('')+'</div>'+
 '<div class="sk-feature"><div class="sk-featureIcon">⇄</div><div><b>Gerbang pengalihan ke kanal resmi</b><span>Pastikan knowledge base dan FAQ siap, SLA disepakati, pemilik penanganan tiap kategori jelas, tiket dapat ditelusuri, serta pengguna diberi informasi penghentian kanal sementara.</span></div></div>'+
 detail('Tampilkan pemetaan kategori aduan dan eskalasi',cards([
 ['Proses bisnis','Pemilik probis menangani perubahan pedoman, pemetaan, kodefikasi, dan tata kerja.'],
 ['Aplikasi, integrasi & akses','Service Desk atau unit teknis menangani bug, API, sinkronisasi, SSO, MFA dan akun.'],
 ['Data','Pengelola data menangani kualitas, validasi dan interoperabilitas.'],
 ['Isu lintas unit','Forum eskalasi menangani keputusan yang melibatkan banyak pihak.']
 ]))+
 note('Penting: contoh L1–L4 pada PPT adalah alur konseptual. Jalur aktual, peran, dan SLA resmi mengikuti ketentuan ITSM Kemenkeu; suatu tiket tidak harus melewati seluruh layer.',true);
}
function pmFramework(){var domains=['Governance','Scope','Schedule','Finance','Stakeholders','Resources','Risk'];var focus=['Initiating','Planning','Executing','Monitoring & Controlling','Closing'];
 return intro('PMBOK · Edisi kedelapan','Kerangka Manajemen Proyek PMBOK','Referensi praktik global dari PMI: tujuh performance domains dan lima focus areas. Kerangka profesional ini melengkapi, bukan mengganti, alur manajemen proyek pada RKMK.','PMI · PMBOK Guide 8 (2025)')+
 '<div class="sk-feature"><div class="sk-featureIcon">◎</div><div><b>Value delivery sebagai benang merah</b><span>Proyek bukan hanya menyelesaikan aktivitas, tetapi menghasilkan nilai, keluaran yang diterima, serta manfaat yang dapat dievaluasi.</span></div></div>'+
 '<div class="sk-sectiontitle">Lima focus areas sepanjang siklus proyek</div><div class="sk-bricks">'+focus.map(function(x,i){return '<div class="sk-brick"><span class="sk-num" style="margin:auto auto 6px">'+(i+1)+'</span>'+x+'<small>'+['Otorisasi awal','Rencana dan baseline','Pelaksanaan hasil kerja','Pengendalian dan perubahan','Penerimaan dan penyelesaian'][i]+'</small></div>'}).join('')+'</div>'+
 '<div class="sk-sectiontitle">Tujuh performance domains</div><div class="sk-grid4">'+domains.map(function(x,i){return '<div class="sk-card" style="text-align:center;padding:13px"><div style="font-size:22px;color:#bc8428;margin-bottom:8px">'+['♜','▣','◷','◈','♧','◎','⚑'][i]+'</div><strong>'+x+'</strong><p>'+['Tata kelola','Lingkup dan hasil','Jadwal','Keuangan','Pemangku kepentingan','Sumber daya','Ketidakpastian'][i]+'</p></div>'}).join('')+'</div>'+
 detail('Bagaimana menerapkannya pada Modul Transformasi?','Inisiasi dan perencanaan memakai Dokumen Proyek dan WBS; pelaksanaan menggunakan WBS dan bukti dukung; pengendalian menggunakan milestone, risiko, capaian dan Change Request; penutupan mengikuti kriteria RKMK; evaluasi manfaat dilakukan pascaproyek. <div class="sk-buttons" style="margin-top:9px">'+jump('Dokumen Proyek','pmo-perencanaan')+jump('WBS','pmo-wbsplan')+jump('Change Request','pmo-cr')+'</div>')+
 note('Sumber rujukan publik: PMI, <i>A Guide to the Project Management Body of Knowledge (PMBOK® Guide)—Eighth Edition</i>, diterbitkan November 2025. Model domain/area fokus ini bersifat nonpreskriptif.');
}
function pmGovernance(){return intro('Tata Kelola PM','Peran, Koordinasi, dan Tenggat Proyek','Memastikan program memiliki penanggung jawab, pengendalian berbasis WBS, dan mekanisme keputusan yang jelas.','Draft RKMK (6) · hlm 45–50')+
 '<div class="sk-roles">'+[
 ['PMO Kemenkeu · Pusmantap','Melaksanakan perencanaan, pengelolaan, pemantauan dan evaluasi Program Transformasi, serta pembinaan dan pemantauan PMO Unit.'],
 ['PMO Unit · UE I / Non Eselon','Dibentuk pimpinan unit; mengendalikan pekerjaan sesuai WBS serta mengoordinasikan pemilik probis dan unit teknis dengan PMO Kemenkeu.'],
 ['Pemilik Proses Bisnis','Memberikan kebutuhan dan rancangan proses; menyepakati kriteria penerimaan serta mengelola hasil setelah serah terima.'],
 ['Unit Teknis / Tim Proyek','Melaksanakan pembangunan, integrasi, pengujian, dukungan teknis, dan penyediaan bukti.']
 ].map(function(a){return '<div class="sk-rolecard pmo"><strong>'+a[0]+'</strong><p>'+a[1]+'</p></div>'}).join('')+'</div>'+
 '<div class="sk-sectiontitle">Ketentuan waktu dan keputusan</div><div class="sk-grid3">'+[
 ['T−1','Dokumen Proyek disusun sebelum jadwal pelaksanaan proyek.'],
 ['≤ 15 hari kerja','Penetapan Dokumen Proyek setelah kontrak kinerja Kemenkeu Wide ditetapkan.'],
 ['≤ 15 hari kerja','WBS disusun setelah Nota Dinas bersama ditetapkan.'],
 ['Change Request','Perubahan lingkup, jadwal, dan biaya diajukan PMO Unit, ditelaah PMO Kemenkeu, disetujui Ketua.'],
 ['Penutupan','Permohonan penutupan PMO Unit disertai telaah PMO Kemenkeu; berdasarkan kriteria penyelesaian.'],
 ['≥ 3 bulan','Evaluasi Pascaproyek paling cepat setelah proyek ditutup, dikoordinasikan PMO Kemenkeu.']
 ].map(function(x){return '<div class="sk-card"><strong>'+x[0]+'</strong><p>'+x[1]+'</p></div>'}).join('')+'</div>'+
 note('Draft RKMK versi (6) mengandung dua butir pelaksanaan proyek yang substansinya beririsan. Cheatsheet menyatukannya menjadi satu fase visual tanpa mengubah mekanisme persetujuan.');
}
function pmCharter(){var parts=[
 ['As-Is','Probis, aplikasi eksisting, dan teknologi yang digunakan.'],
 ['To-Be','Rancangan proses baru, aplikasi, dan peluang digitalisasi.'],
 ['Gap As-Is → To-Be','Perbandingan kondisi saat ini dan target.'],
 ['Project Charter','Ruang lingkup, tujuan, sponsor, hasil dan tanggung jawab.'],
 ['Acceptance Criteria','Parameter penyelesaian serta penerimaan hasil.'],
 ['Rencana Kerja','Jadwal, milestone, aktivitas, PIC dan sumber daya.']
 ];
 return intro('Dokumen Proyek · Charter','Enam Komponen Perencanaan Detil Proyek','Charter merupakan salah satu komponen Dokumen Proyek dalam RKMK, bukan satu-satunya dokumen. Gunakan sebagai dasar lingkup, hasil, dan kendali perubahan.','Draft RKMK (6) · hlm 48–49')+
 '<div class="sk-grid3">'+parts.map(function(a,i){return '<div class="sk-card"><span class="sk-pill sk-pgold">0'+(i+1)+'</span><strong style="margin-top:9px">'+a[0]+'</strong><p>'+a[1]+'</p></div>'}).join('')+'</div>'+
 '<div class="sk-feature"><div class="sk-featureIcon">✓</div><div><b>Penetapan dan penurunan rencana</b><span>Dokumen Proyek ditetapkan dengan Nota Dinas bersama paling lambat 15 hari kerja setelah kontrak kinerja Kemenkeu Wide. WBS disusun paling lambat 15 hari kerja setelah ND bersama.</span></div></div>'+jump('Buka Dokumen Proyek','pmo-perencanaan');
}
function pmWBS(){return intro('Work Breakdown Structure','Dari Strategi ke Paket Kerja yang Terukur','WBS mengurai rencana kerja menjadi aktivitas, keluaran, target, penanggung jawab, jadwal, dan bukti yang dapat dikendalikan.','Draft RKMK (6) · hlm 49')+
 '<div class="sk-tree">'+[
 'PROGRAM TRANSFORMASI · Tujuan dan manfaat','PROYEK / MODUL · Lingkup dan target','TAHAP / WORKSTREAM · Kelompok pekerjaan','ITEM WBS · Aktivitas / deliverable / PIC','PERIODE & BOBOT · Target, realisasi, bukti'
 ].map(function(x,i){return (i?'<div class="sk-treearrow">↓</div>':'')+'<div class="sk-treenode">'+x+'</div>'}).join('')+'</div>'+
 '<div class="sk-sectiontitle">Pengendalian pekerjaan</div>'+cards([['Rencana','Uraikan target, tanggal, bobot, serta dependensi antaritem agar baseline dapat dipantau.'],['Pelaksanaan','Pemilik pekerjaan memutakhirkan progres dan melampirkan bukti; PMO menilai capaian.']])+
 '<div class="sk-buttons" style="margin-top:12px">'+jump('Susun WBS','pmo-wbsplan')+jump('Progres & Bukti','pmo-wbs')+jump('Laporan Capaian','pmo-laporan')+'</div>';
}
function pmCR(){var stages=[
 ['PMO Unit','Mengajukan usulan perubahan lingkup, jadwal, atau biaya.'],
 ['PMO Kemenkeu','Menelaah alasan, dampak, risiko, jadwal, dan keterkaitan proyek.'],
 ['Ketua Organisasi','Memberi keputusan persetujuan sebelum perubahan dilaksanakan.'],
 ['Pelaksanaan','Jika disetujui: baseline WBS dimutakhirkan dan CMO menyesuaikan strategi.']
 ];
 return intro('Pengendalian Perubahan','Alur Change Request (CR)','Menjaga keterkendalian baseline proyek. Perubahan tidak boleh langsung dilaksanakan sebelum ditelaah dan disetujui sesuai kewenangan.','Draft RKMK (6) · hlm 49')+
 '<div class="sk-laneFlow">'+stages.map(function(x,i){return '<div class="sk-laneBox" style="border-top-color:'+(i===2?'#cc9222':'#184d80')+'"><span class="sk-pill sk-pgold">'+('0'+(i+1)).slice(-2)+'</span><b style="margin-top:7px">'+x[0]+'</b><p>'+x[1]+'</p></div>'}).join('')+'</div>'+
 '<div class="sk-grid3" style="margin-top:13px">'+[
 ['Disetujui','Perubahan diterapkan sesuai keputusan; data WBS dan jadwal dimutakhirkan.'],
 ['Dikembalikan','Lengkapi data, analisis dampak, atau bukti pendukung sebelum telaah lanjutan.'],
 ['Ditolak','Baseline semula tetap berlaku dan alasan keputusan terdokumentasi.']
 ].map(function(x){return '<div class="sk-card"><strong>'+x[0]+'</strong><p>'+x[1]+'</p></div>'}).join('')+'</div>'+
 note('<b>Hubungan PMO–CMO:</b> bila Change Request mengubah proses atau jadwal implementasi, CMO memutakhirkan rencana komunikasi, pelatihan, atau kesiapan pengguna.')+
 '<div style="margin-top:12px">'+jump('Buka Change Request','pmo-cr')+'</div>';
}
function coordination(){var diagram=(typeof window.koHtml==='function')?window.koHtml():'';return intro('Kolaborasi lintas fungsi','Alur Koordinasi PMO–CMO','Diagram koordinasi digunakan bersama oleh PMO dan CMO. Pilih fase untuk melihat peran, aliran kerja, keputusan, dan titik serah terima.','Draft RKMK (6) · visualisasi koordinasi')+
 '<div class="sk-coordination">'+(diagram||note('Diagram koordinasi tidak dapat ditampilkan. Silakan muat ulang halaman.',true))+'</div>'+
 note('Fase penutupan proyek dan penutupan CM berbeda: penutupan proyek mengikuti acceptance criteria, sedangkan penutupan CM mengikuti evaluasi adopsi, transisi, kesiapan layanan resmi, dan pengalihan tanggung jawab.');
}
function pmReference(){return typeof window.txFormulaReferenceHtml==='function'?window.txFormulaReferenceHtml():note('Referensi belum termuat. Muat ulang halaman untuk mengambil materi terbaru.',true)}
var cfg={
 help:{
 pmo:[['menu','Peta Menu',function(){return helpMenu('pmo')}],['steps','Tahapan Manajemen Proyek',function(){return helpStages('pmo')}],['terms','Daftar Istilah PM',function(){return helpGloss('pmo')}],['docs','Dokumentasi',function(){return helpDocs('pmo')}]],
 cmo:[['menu','Peta Menu',function(){return helpMenu('cmo')}],['steps','Tahapan Manajemen Perubahan',function(){return helpStages('cmo')}],['terms','Daftar Istilah CM',function(){return helpGloss('cmo')}],['docs','Dokumentasi',function(){return helpDocs('cmo')}]]
 },
 sheet:{
 pmo:[['pmbok','Framework PMBOK',pmFramework],['ref','Referensi',pmReference],['tata','Tata Kelola PM',pmGovernance],['charter','Charter',pmCharter],['wbs','WBS',pmWBS],['cr','Change Request',pmCR],['ko','Alur Koordinasi',coordination]],
 cmo:[['framework','Framework',cmFramework],['ref','Referensi',pmReference],['tata','Tata Kelola CM',cmGovernance],['kom','Komunikasi',cmCommunication],['pel','Pelatihan',cmTraining],['trans','Transisi & Tiket',cmTransition],['ko','Alur Koordinasi',coordination]]
 }
};
var active=null,lastFocus=null,modalKind=null,modalMode=null;
function close(){if(!active)return;active.remove();active=null;document.removeEventListener('keydown',keyHandler);if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function keyHandler(e){if(e.key==='Escape'){e.preventDefault();close()}}
function open(mode,kind,selected){
 addStyle();close();mode=mode==='sheet'?'sheet':'help';kind=kind==='pmo'?'pmo':'cmo';modalMode=mode;modalKind=kind;
 var all=cfg[mode][kind],cur=selected&&all.some(function(x){return x[0]===selected})?selected:all[0][0];
 var name=kind==='pmo'?'Project Management':'Change Management',help=mode==='help';
 lastFocus=document.activeElement;
 var ov=document.createElement('div');ov.className='sk-overlay';ov.setAttribute('data-skoverlay','1');
 ov.innerHTML='<section class="sk-dialog" role="dialog" aria-modal="true" aria-label="'+(help?'Bantuan':'Cheatsheet')+' '+name+'">'+
 '<div class="sk-head"><div class="sk-hwrap"><div class="sk-hicon">'+(help?'?':'▤')+'</div><div class="sk-hwords"><div class="sk-overline">'+(help?'PANDUAN PENGGUNA APLIKASI':'REFERENSI TATA KELOLA · RKMK VERSI 6')+'</div><h2>'+(help?'Bantuan':'Cheatsheet')+' '+name+'</h2><p>'+(help?'Temukan menu, ikuti tahapan, pahami istilah, serta lengkapi dokumen kerja.':'Framework, tata kelola, dan alur kerja dalam bentuk visual yang mudah dijelajahi.')+'</p></div><button class="sk-close" type="button" data-skclose aria-label="Tutup">×</button></div></div>'+
 '<nav class="sk-tabbar" role="tablist" aria-label="Tab '+(help?'Bantuan':'Cheatsheet')+'">'+all.map(function(t){return '<button class="sk-tab" type="button" role="tab" data-sktab="'+t[0]+'" aria-selected="'+(t[0]===cur?'true':'false')+'">'+t[1]+'</button>'}).join('')+'</nav>'+
 '<main class="sk-content">'+all.map(function(t){return '<section class="sk-view" role="tabpanel" data-skview="'+t[0]+'"'+(t[0]!==cur?' hidden':'')+'>'+t[2]()+'</section>'}).join('')+'</main>'+
 '<footer class="sk-footer"><span><b>'+(help?'Bantuan = cara menggunakan aplikasi.':'Cheatsheet = framework & tata kelola.')+'</b> '+(help?'Butuh ketentuan kebijakan? Buka Cheatsheet.':'Butuh petunjuk pengisian fitur? Buka Bantuan.')+'</span><span>Modul Transformasi · November 2026</span></footer></section>';
 document.body.appendChild(ov);active=ov;document.addEventListener('keydown',keyHandler);
 if(typeof window.koWire==='function')window.koWire(ov);
 ov.addEventListener('click',function(e){
  if(e.target===ov||e.target.closest('[data-skclose]')){close();return}
  var tab=e.target.closest('[data-sktab]');if(tab){var k=tab.getAttribute('data-sktab');ov.querySelectorAll('[data-sktab]').forEach(function(b){b.setAttribute('aria-selected',String(b.getAttribute('data-sktab')===k))});ov.querySelectorAll('[data-skview]').forEach(function(v){v.hidden=v.getAttribute('data-skview')!==k});ov.querySelector('.sk-content').scrollTop=0;return}
  var goto=e.target.closest('[data-skgo]');if(goto){var dest=goto.getAttribute('data-skgo'),parts=dest.split('|'),route=parts[0],sub=parts[1];close();
   if(typeof window.go==='function')window.go(route);else location.hash='#'+route;
   if(sub&&route==='project-selection')window.MT_PS_WORKFLOW?.navigate(sub);
   else if(sub&&route==='pmo-perencanaan')window.MT_DOC_EXPERIENCE?.openProjectTab(sub);
   return}
 });
 ov.addEventListener('input',function(e){var filter=e.target.closest('[data-skfilter]');if(!filter)return;var pane=filter.closest('.sk-view'),term=filter.value.trim().toLowerCase();pane.querySelectorAll('[data-skitem]').forEach(function(card){card.hidden=!!term&&!card.dataset.skitem.includes(term)})});
 ov.querySelector('.sk-close').focus();return ov
}
function currentKind(){try{return typeof VIEW==='string'&&VIEW.indexOf('pmo-')===0?'pmo':'cmo'}catch(e){return 'cmo'}}
window.openTxCheatsheet=function(mode,selected){return open('sheet',mode||currentKind(),selected==='koordinasi'?'ko':selected)};
window.showGuideHome=function(){return open('help',currentKind())};
window.showHelp=function(v){if(String(v||'')==='project-selection'||typeof VIEW==='string'&&VIEW==='project-selection'){
  return window.MT_PROJECT_SELECTION?.open?.('help')||open('help','pmo','menu');
 }
 return open('help',String(v||'').indexOf('pmo-')===0?'pmo':String(v||'').indexOf('cmo-')===0?'cmo':currentKind(),'menu')};
window.skHelpCheatsheetVersion='20261107-referensi-1';
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addStyle);else addStyle();
})();