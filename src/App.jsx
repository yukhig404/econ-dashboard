import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart, ComposedChart, Bar, Legend
} from "recharts";

// ─── CONFIG ─────────────────────────────────────────────────────────────
const CATEGORIES = {
  employment:{name:"雇用",emoji:"👷",color:"#E8453C"},
  inflation:{name:"物価",emoji:"🔥",color:"#F5A623"},
  policy:{name:"金融政策",emoji:"🏛",color:"#4A90D9"},
  economy:{name:"景気",emoji:"📊",color:"#1ABC9C"},
  market:{name:"市場",emoji:"📈",color:"#9B59B6"},
  japan:{name:"日本",emoji:"🇯🇵",color:"#BC002D"},
  commodity:{name:"コモディティ",emoji:"🪙",color:"#DAA520"},
  eu:{name:"ユーロ圏",emoji:"🇪🇺",color:"#003399"},
  india:{name:"インド",emoji:"🇮🇳",color:"#FF9933"},
};

const INDICATORS = {
  NFP:{id:"PAYEMS",name:"雇用者数・NFP(米)",nameEn:"Nonfarm Payrolls",unit:"千人",color:"#E8453C",cat:"employment",freq:"月次",desc:"毎月第1金曜日発表。労働市場の最重要指標。",impact:"雇用増→利上げ圧力→ドル高",nextRel:"2026-03-06",relName:"雇用統計"},
  UNRATE:{id:"UNRATE",name:"失業率(米)",nameEn:"Unemployment Rate",unit:"%",color:"#FF6B6B",cat:"employment",freq:"月次",desc:"労働力人口に対する失業者の割合。",impact:"失業率低下→経済好調→株高",nextRel:"2026-03-06",relName:"雇用統計"},
  ICSA:{id:"ICSA",name:"新規失業保険申請(米)",nameEn:"Initial Claims",unit:"件",color:"#C0392B",cat:"employment",freq:"週次",desc:"毎週木曜発表。最も速報性の高い雇用指標。",impact:"申請増→雇用悪化→利下げ期待",nextRel:"2026-02-27",relName:"失業保険"},
  JOLTS:{id:"JTSJOL",name:"求人件数・JOLTS(米)",nameEn:"JOLTS Openings",unit:"千件",color:"#E74C3C",cat:"employment",freq:"月次",desc:"労働需要を示す。求人/失業者比率が重要。",impact:"求人増→労働需給タイト→賃金上昇圧力",nextRel:"2026-03-11",relName:"JOLTS"},
  CPI:{id:"CPIAUCSL",name:"CPI総合(米)",nameEn:"CPI All Items",unit:"指数",color:"#F5A623",cat:"inflation",freq:"月次",desc:"消費者物価の総合指標。エネルギー・食品含む。",impact:"CPI上昇→利上げ期待→債券安",nextRel:"2026-03-12",relName:"CPI"},
  CORECPI:{id:"CPILFESL",name:"コアCPI(米)",nameEn:"Core CPI",unit:"指数",color:"#F39C12",cat:"inflation",freq:"月次",desc:"食品・エネルギー除く。FRBが重視する物価指標。",impact:"コアCPI高止まり→利下げ遅延",nextRel:"2026-03-12",relName:"CPI"},
  FEDFUNDS:{id:"FEDFUNDS",name:"FF金利(米)",nameEn:"Fed Funds Rate",unit:"%",color:"#4A90D9",cat:"policy",freq:"月次",desc:"FOMCが決定する政策金利。全市場に影響。",impact:"利上げ→株安圧力 / 利下げ→株高",nextRel:"2026-03-18",relName:"FOMC"},
  GDP:{id:"GDP",name:"GDP(米)",nameEn:"GDP",unit:"十億$",color:"#7ED321",cat:"economy",freq:"四半期",desc:"経済成長の最も包括的な指標。",impact:"GDP成長→企業収益改善→株高",nextRel:"2026-03-26",relName:"GDP速報"},
  ISM:{id:"MANEMP",name:"ISM製造業(米)",nameEn:"ISM Manufacturing",unit:"指数",color:"#1ABC9C",cat:"economy",freq:"月次",desc:"50超で製造業拡大。景気先行指標。",impact:"50超→製造業拡大→景気回復期待",nextRel:"2026-03-02",relName:"ISM"},
  RETAIL:{id:"RSAFS",name:"小売売上高(米)",nameEn:"Retail Sales",unit:"百万$",color:"#2ECC71",cat:"economy",freq:"月次",desc:"個人消費の動向。GDPの約7割を占める消費を反映。",impact:"売上増→消費堅調→GDP押し上げ",nextRel:"2026-03-14",relName:"小売売上"},
  DGS10:{id:"DGS10",name:"10年国債利回り(米)",nameEn:"10Y Treasury",unit:"%",color:"#3498DB",cat:"market",freq:"日次",desc:"長期金利の指標。住宅ローンや企業借入に影響。",impact:"利回り上昇→株バリュエーション低下",nextRel:"-",relName:"-"},
  DGS2:{id:"DGS2",name:"2年国債利回り(米)",nameEn:"2Y Treasury",unit:"%",color:"#2980B9",cat:"market",freq:"日次",desc:"短期金利。FF金利の市場予想を反映。",impact:"2Y上昇→利上げ織り込み進行",nextRel:"-",relName:"-"},
  T10Y2Y:{id:"T10Y2Y",name:"イールドカーブ(米)",nameEn:"10Y-2Y Spread",unit:"%",color:"#8E44AD",cat:"market",freq:"日次",desc:"逆イールド（マイナス）はリセッション予兆として有名。",impact:"逆転→リセッション警告→リスクオフ",nextRel:"-",relName:"-"},
  VIX:{id:"VIXCLS",name:"VIX恐怖指数",nameEn:"VIX",unit:"指数",color:"#E74C3C",cat:"market",freq:"日次",desc:"S&P500オプションから算出。市場の恐怖度を数値化。",impact:"VIX上昇→不安増大→株安",nextRel:"-",relName:"-"},
  SP500:{id:"NASDAQCOM",name:"NASDAQ総合(米)",nameEn:"NASDAQ Composite",unit:"指数",color:"#9B59B6",cat:"market",freq:"日次",desc:"NASDAQ上場全銘柄の時価総額加重指数。テック株の動向を反映。",impact:"主要指標の結果を最も直接的に反映",nextRel:"-",relName:"-"},
  GSPC:{id:"SP500",name:"S&P500(米)",nameEn:"S&P 500",unit:"指数",color:"#7D3C98",cat:"market",freq:"日次",desc:"米国を代表する500社の株価指数。米国株市場全体の動向を最も広く反映。",impact:"上昇→リスクオン・景気楽観 / 下落→リスクオフ",nextRel:"-",relName:"-"},
  JP_UNRATE:{id:"LRUNTTTTJPM156S",name:"失業率(日)",nameEn:"Japan Unemployment",unit:"%",color:"#BC002D",cat:"japan",freq:"月次",desc:"日本の完全失業率。総務省統計局発表。",impact:"失業率低下→消費改善→景気好転",nextRel:"2026-03-28",relName:"労働力調査"},
  JP_CPI:{id:"JPNCPIALLMINMEI",name:"CPI(日)",nameEn:"Japan CPI",unit:"指数",color:"#E85555",cat:"japan",freq:"月次",desc:"日本の消費者物価指数。日銀の2%目標の達成状況を示す。",impact:"CPI上昇→日銀利上げ圧力→円高",nextRel:"2026-03-20",relName:"消費者物価"},
  JP_BOJ:{id:"IRSTCI01JPM156N",name:"日銀政策金利",nameEn:"BOJ Rate",unit:"%",color:"#4A90D9",cat:"japan",freq:"月次",desc:"日本銀行が決定する政策金利。長らくゼロ・マイナス金利を維持。",impact:"利上げ→円高・株安圧力",nextRel:"2026-03-18",relName:"日銀会合"},
  JP_INDPRO:{id:"JPNPROINDMISMEI",name:"鉱工業生産(日)",nameEn:"Japan IP",unit:"指数",color:"#1ABC9C",cat:"japan",freq:"月次",desc:"日本の製造業の生産活動。景気の先行指標。",impact:"生産増→輸出拡大→GDP押し上げ",nextRel:"2026-02-28",relName:"鉱工業生産"},
  JP_JGB10:{id:"IRLTLT01JPM156N",name:"10年JGB利回り",nameEn:"Japan 10Y JGB",unit:"%",color:"#3498DB",cat:"japan",freq:"月次",desc:"日本国債10年利回り。日銀YCC終了後に注目。",impact:"利回り上昇→円高・銀行株高",nextRel:"-",relName:"-"},
  JP_NIKKEI:{id:"NIKKEI225",name:"日経225",nameEn:"Nikkei 225",unit:"指数",color:"#9B59B6",cat:"japan",freq:"日次",desc:"東証上場の代表的な225銘柄の株価指数。",impact:"日本株市場のベンチマーク",nextRel:"-",relName:"-"},
  JP_USDJPY:{id:"DEXJPUS",name:"ドル円",nameEn:"USD/JPY",unit:"円",color:"#E8453C",cat:"japan",freq:"日次",desc:"米ドル対日本円の為替レート。日本の輸出企業業績に直結。",impact:"円安→輸出企業増益・輸入物価上昇",nextRel:"-",relName:"-"},
  JP_CORECPI:{id:"JPNCPICORMINMEI",name:"コアCPI(日)",nameEn:"Japan Core CPI",unit:"指数",color:"#FF8888",cat:"japan",freq:"月次",desc:"食品・エネルギーを除く日本のCPI。日銀の物価判断に重要。",impact:"コアCPI上昇→日銀引き締め圧力→円高",nextRel:"2026-03-20",relName:"消費者物価"},
  JP_CONF:{id:"CSCICP03JPM665S",name:"消費者信頼感(日)",nameEn:"Japan Consumer Confidence",unit:"指数",color:"#C04040",cat:"japan",freq:"月次",desc:"OECD消費者信頼感指数。100超で楽観、100未満で悲観。",impact:"上昇→消費拡大期待→景気好転",nextRel:"2026-03-10",relName:"消費動向調査"},
  JP_M2:{id:"MYAGM2JPM189N",name:"マネーサプライM2(日)",nameEn:"Japan M2",unit:"十億円",color:"#A03030",cat:"japan",freq:"月次",desc:"日本の通貨供給量。日銀の金融政策の効果と流動性を測る。",impact:"増加→流動性拡大→資産価格支持",nextRel:"-",relName:"-"},
  JP_GDP:{id:"NAEXKP01JPQ189S",name:"GDP(日)",nameEn:"Japan GDP",unit:"百万円",color:"#7ED321",cat:"japan",freq:"四半期",desc:"日本の実質GDP（2015年連鎖価格）。日本経済の規模と成長を示す最重要指標。",impact:"GDP成長→景気好転→株高・円高",nextRel:"2026-03-10",relName:"GDP速報"},
  COPPER:{id:"PCOPPUSDM",name:"銅価格",nameEn:"Copper",unit:"$/MT",color:"#B87333",cat:"commodity",freq:"月次",desc:"国際銅価格。「Dr. Copper」とも呼ばれ景気の先行指標。",impact:"上昇→世界景気拡大シグナル",nextRel:"-",relName:"-"},
  BITCOIN:{id:"CBBTCUSD",name:"ビットコイン",nameEn:"Bitcoin",unit:"$",color:"#F7931A",cat:"commodity",freq:"日次",desc:"Coinbase取引所のBTC/USD価格。リスク資産のバロメーター。",impact:"上昇→リスクオン・暗号資産市場活況",nextRel:"-",relName:"-"},
  // ── 米国追加 ──
  PCECORE:{id:"PCEPILFE",name:"コアPCE(米)",nameEn:"Core PCE",unit:"指数",color:"#E67E22",cat:"inflation",freq:"月次",desc:"食品・エネルギー除くPCE物価指数。FRBが最重視する物価指標。",impact:"上昇→利下げ遅延 / 低下→利下げ加速",nextRel:"2026-03-28",relName:"PCEデフレーター"},
  UMCSENT:{id:"UMCSENT",name:"消費者信頼感・ミシガン(米)",nameEn:"Michigan Sentiment",unit:"指数",color:"#27AE60",cat:"economy",freq:"月次",desc:"ミシガン大学消費者信頼感指数。消費・景気の先行指標。",impact:"上昇→消費拡大期待→景気好転",nextRel:"2026-03-14",relName:"ミシガン信頼感"},
  HOUST:{id:"HOUST",name:"住宅着工件数(米)",nameEn:"Housing Starts",unit:"千件",color:"#16A085",cat:"economy",freq:"月次",desc:"新規住宅着工件数。建設業・金融・雇用に波及する重要指標。",impact:"増加→建設需要旺盛→経済好調",nextRel:"2026-03-19",relName:"住宅着工"},
  CSUSHPISA:{id:"CSUSHPISA",name:"住宅価格指数CS(米)",nameEn:"Case-Shiller HPI",unit:"指数",color:"#1ABC9C",cat:"economy",freq:"月次",desc:"ケースシラー全米住宅価格指数。資産効果・消費に影響。",impact:"上昇→資産効果→消費刺激",nextRel:"2026-03-25",relName:"ケースシラー"},
  MORTGAGE30:{id:"MORTGAGE30US",name:"30年住宅ローン金利(米)",nameEn:"30Y Mortgage Rate",unit:"%",color:"#2471A3",cat:"market",freq:"週次",desc:"米国30年固定住宅ローン金利。利上げの実体経済への波及を示す。",impact:"上昇→住宅購入抑制→不動産市場冷却",nextRel:"-",relName:"-"},
  M2SL:{id:"M2SL",name:"M2マネーサプライ(米)",nameEn:"M2 Money Supply",unit:"十億$",color:"#5DADE2",cat:"policy",freq:"月次",desc:"現金・預金・MMFなどを含む広義のマネーサプライ。",impact:"急増→インフレ圧力 / 急減→信用収縮リスク",nextRel:"-",relName:"-"},
  HYSPREAD:{id:"BAMLH0A0HYM2",name:"HYスプレッド(米)",nameEn:"High Yield Spread",unit:"%",color:"#884EA0",cat:"market",freq:"日次",desc:"ハイイールド債と国債の利回り差。クレジットリスクの体温計。",impact:"拡大→信用不安→リスクオフ / 縮小→信用環境良好",nextRel:"-",relName:"-"},
  INDPRO:{id:"INDPRO",name:"鉱工業生産(米)",nameEn:"Industrial Production",unit:"指数",color:"#148F77",cat:"economy",freq:"月次",desc:"製造業・鉱業・電力の生産活動指数。GDPの先行指標。",impact:"上昇→製造業好調→景気拡大",nextRel:"2026-03-17",relName:"鉱工業生産"},
  // ── 日本追加 ──
  JP_BCONF:{id:"BSCICP03JPM665S",name:"企業景況感(日)",nameEn:"Japan Business Confidence",unit:"指数",color:"#8B0000",cat:"japan",freq:"月次",desc:"OECDビジネス信頼感指数。日銀短観の代替として利用可。",impact:"上昇→企業心理好転→設備投資・雇用増",nextRel:"-",relName:"-"},
  JP_EXPORT:{id:"XTEXVA01JPM667S",name:"輸出金額(日)",nameEn:"Japan Exports",unit:"百万$",color:"#C0392B",cat:"japan",freq:"月次",desc:"日本の輸出金額。円安・海外需要の恩恵を数値化。",impact:"増加→外需好調・円安恩恵→企業収益改善",nextRel:"2026-03-18",relName:"貿易統計"},
  JP_IMPORT:{id:"XTIMVA01JPM667S",name:"輸入金額(日)",nameEn:"Japan Imports",unit:"百万$",color:"#E74C3C",cat:"japan",freq:"月次",desc:"日本の輸入金額。エネルギー・食料の輸入コストを反映。",impact:"増加→エネルギー高・内需増 / 貿易赤字拡大→円安圧力",nextRel:"2026-03-18",relName:"貿易統計"},
  // ── ユーロ圏 ──
  EU_ECB:{id:"ECBDFR",name:"ECB政策金利",nameEn:"ECB Deposit Rate",unit:"%",color:"#003399",cat:"eu",freq:"月次",desc:"欧州中央銀行の預金ファシリティ金利。ECBの金融政策の基準。",impact:"利上げ→ユーロ高・欧州株に逆風 / 利下げ→景気刺激",nextRel:"2026-04-17",relName:"ECB会合"},
  EU_UNRATE:{id:"LRHUTTTTEZM156S",name:"ユーロ圏失業率",nameEn:"Euro Area Unemployment",unit:"%",color:"#4169E1",cat:"eu",freq:"月次",desc:"ユーロ圏の失業率。南欧など国ごとの格差が大きい。",impact:"低下→労働市場改善→消費・景気回復",nextRel:"2026-04-01",relName:"ユーロ圏雇用"},
  EURUSD:{id:"DEXUSEU",name:"EUR/USD",nameEn:"EUR/USD",unit:"ドル",color:"#1F618D",cat:"eu",freq:"日次",desc:"ユーロ対米ドルレート。ドル強弱・ECB対FRBの政策差を反映。",impact:"上昇→ドル安・欧州輸出に逆風 / 低下→ドル高",nextRel:"-",relName:"-"},
  EU_GDP:{id:"CLVMNACSCAB1GQEA19",name:"ユーロ圏GDP",nameEn:"Euro Area GDP",unit:"百万ユーロ",color:"#2E86C1",cat:"eu",freq:"四半期",desc:"ユーロ圏の実質GDP。EU経済全体の成長率を示す。",impact:"成長→欧州株高・ユーロ高 / 縮小→リセッション懸念",nextRel:"2026-04-30",relName:"ユーロ圏GDP"},
  // ── インド ──
  IN_USDINR:{id:"DEXINUS",name:"USD/INR",nameEn:"USD/INR",unit:"ルピー",color:"#FF9933",cat:"india",freq:"日次",desc:"米ドル対インドルピー。新興国通貨の代表的指標。",impact:"ルピー安→インフレ輸入・資本流出リスク",nextRel:"-",relName:"-"},
  IN_CPI:{id:"INDCPIALLMINMEI",name:"インドCPI",nameEn:"India CPI",unit:"指数",color:"#E67E22",cat:"india",freq:"月次",desc:"インドの消費者物価指数。4%±2%がRBIの目標。",impact:"上昇→RBI利上げ圧力→ルピー高",nextRel:"2026-03-12",relName:"インドCPI"},
  IN_RATE:{id:"IRSTCI01INM156N",name:"インド政策金利",nameEn:"India Policy Rate",unit:"%",color:"#CA6F1E",cat:"india",freq:"月次",desc:"インド準備銀行（RBI）の政策金利。インフレとの兼ね合いで推移。",impact:"利上げ→ルピー高・株式市場に逆風",nextRel:"2026-04-09",relName:"RBI会合"},
  // ── コモディティ追加 ──
  OIL_WTI:{id:"DCOILWTICO",name:"原油WTI",nameEn:"Crude Oil WTI",unit:"$/bbl",color:"#566573",cat:"commodity",freq:"日次",desc:"西テキサス産原油の先物価格。エネルギーコスト・インフレの根源。",impact:"上昇→インフレ圧力・エネルギー株高 / 低下→消費者恩恵",nextRel:"-",relName:"-"},
  NATGAS:{id:"MHHNGSP",name:"天然ガス",nameEn:"Natural Gas",unit:"$/MMBtu",color:"#717D7E",cat:"commodity",freq:"月次",desc:"ヘンリーハブ天然ガス価格。電力・暖房コストに直結。",impact:"上昇→光熱費増・インフレ圧力",nextRel:"-",relName:"-"},
  WHEAT:{id:"PWHEAMTUSDM",name:"小麦価格",nameEn:"Wheat",unit:"$/MT",color:"#C8A951",cat:"commodity",freq:"月次",desc:"国際小麦価格。食料インフレ・農業経済の指標。",impact:"上昇→食料インフレ・新興国への打撃",nextRel:"-",relName:"-"},
};

const TFS=[{l:"1Y",y:1},{l:"3Y",y:3},{l:"5Y",y:5},{l:"10Y",y:10},{l:"MAX",y:30}];
const VS={S:"single",M:"multi",C:"compare",T:"table"};
const SL={BULLISH:{label:"強気",emoji:"🟢",color:"#7ED321",bg:"#7ED32118"},SLIGHTLY_BULLISH:{label:"やや強気",emoji:"🟡",color:"#B8E986",bg:"#B8E98618"},NEUTRAL:{label:"中立",emoji:"⚪",color:"#888",bg:"#88888818"},SLIGHTLY_BEARISH:{label:"やや弱気",emoji:"🟠",color:"#F5A623",bg:"#F5A62318"},BEARISH:{label:"弱気",emoji:"🔴",color:"#E8453C",bg:"#E8453C18"}};
const COMPARE_COLORS=['#3D9BFF','#FF8C42'];

// ─── DEMO DATA ──────────────────────────────────────────────────────────
function genDemo(ind,years=15){const d=[];const now=new Date();const m=years*12;const isQ=["GDP","JP_GDP","EU_GDP"].includes(ind);const isD=["DGS10","DGS2","T10Y2Y","VIX","SP500","GSPC","JP_USDJPY","BITCOIN","HYSPREAD","EURUSD","IN_USDINR","OIL_WTI"].includes(ind);const isW=ind==="ICSA";const step=isQ?3:1;const total=isD?years*252:m;
for(let i=total;i>=0;i-=step){const date=isD?new Date(now.getTime()-i*864e5*1.4):new Date(now.getFullYear(),now.getMonth()-i,1);if(isD&&(date.getDay()===0||date.getDay()===6))continue;let v;const t=(total-i)/total;
switch(ind){
case"NFP":v=140000+t*18000+Math.sin(t*20)*2000+(Math.random()-.5)*1500;break;
case"UNRATE":v=3.5+Math.sin(t*8)*1.5+(t>.3&&t<.4?4:0)+(Math.random()-.5)*.2;v=Math.max(3.4,v);break;
case"ICSA":v=220000+Math.sin(t*15)*30000+(t>.3&&t<.4?80000:0)+(Math.random()-.5)*15000;break;
case"JOLTS":v=7000+t*4000+Math.sin(t*10)*800+(Math.random()-.5)*400;if(t>.7)v-=(t-.7)*6000;break;
case"CPI":v=240+t*80+Math.sin(t*8)*3+(Math.random()-.5)*2;break;
case"CORECPI":v=242+t*72+Math.sin(t*8)*2+(Math.random()-.5)*1.5;break;
case"FEDFUNDS":if(t<.2)v=2-t*8;else if(t<.4)v=.08+(t-.2)*.5;else if(t<.6)v=.2+(t-.4)*22;else if(t<.8)v=5.33;else v=5.33-(t-.8)*12;v=Math.max(.05,v+(Math.random()-.5)*.05);break;
case"GDP":v=19000+t*10000+Math.sin(t*6)*400+(Math.random()-.5)*200;if(t>.3&&t<.35)v*=.95;break;
case"ISM":v=52+Math.sin(t*12)*6+(Math.random()-.5)*2;if(t>.3&&t<.4)v-=8;break;
case"RETAIL":v=400000+t*250000+Math.sin(t*10)*15000+(Math.random()-.5)*10000;break;
case"DGS10":v=1.5+t*3+Math.sin(t*20)*.5+(Math.random()-.5)*.15;v=Math.max(.5,v);break;
case"DGS2":v=1+t*3.5+Math.sin(t*20)*.6+(Math.random()-.5)*.15;v=Math.max(.1,v);break;
case"T10Y2Y":v=1.5-t*2+Math.sin(t*15)*.4+(Math.random()-.5)*.1;break;
case"VIX":v=18+Math.sin(t*25)*6+(Math.random()-.5)*4;if(t>.3&&t<.35)v+=20;v=Math.max(10,v);break;
case"SP500":v=2800+t*3200+Math.sin(t*15)*200+(Math.random()-.5)*100;if(t>.3&&t<.35)v*=.85;break;
case"GSPC":v=1200+t*4600+Math.sin(t*15)*300+(Math.random()-.5)*120;if(t>.3&&t<.35)v*=.85;break;
case"JP_UNRATE":v=2.8+Math.sin(t*8)*.8+(t>.3&&t<.4?.8:0)+(Math.random()-.5)*.15;v=Math.max(2.2,v);break;
case"JP_CPI":v=98+t*12+Math.sin(t*8)*1+(Math.random()-.5)*.8;break;
case"JP_BOJ":if(t<.6)v=-.1+(Math.random()-.5)*.05;else if(t<.75)v=.1+(t-.6)*.5;else v=.5+(t-.75)*1.5;v=Math.round(v*100)/100;v=Math.max(-.1,v);break;
case"JP_INDPRO":v=95+t*15+Math.sin(t*12)*5+(Math.random()-.5)*3;if(t>.3&&t<.35)v*=.92;break;
case"JP_JGB10":v=.1+t*1.4+Math.sin(t*15)*.2+(Math.random()-.5)*.08;v=Math.max(.05,v);break;
case"JP_NIKKEI":v=15000+t*25000+Math.sin(t*15)*2000+(Math.random()-.5)*800;if(t>.3&&t<.35)v*=.82;break;
case"JP_USDJPY":v=80+t*70+Math.sin(t*12)*15+(Math.random()-.5)*2;v=Math.max(75,Math.min(162,v));break;
case"JP_CORECPI":v=98+t*12+Math.sin(t*8)*.5+(Math.random()-.5)*.4;break;
case"JP_CONF":v=99+t*3+Math.sin(t*10)*2+(Math.random()-.5)*.8;break;
case"JP_M2":v=700000+t*400000+Math.sin(t*5)*10000+(Math.random()-.5)*5000;break;
case"JP_GDP":v=130000000+t*8000000+Math.sin(t*6)*2000000+(Math.random()-.5)*1000000;if(t>.3&&t<.35)v*=.95;break;
case"COPPER":v=3000+t*5000+Math.sin(t*12)*1000+(Math.random()-.5)*300;break;
case"BITCOIN":v=500+Math.pow(t,2.5)*110000+Math.sin(t*30)*5000+(Math.random()-.5)*5000;v=Math.max(200,v);break;
// ── 米国追加 ──
case"PCECORE":v=108+t*18+Math.sin(t*8)*1.5+(Math.random()-.5)*1;break;
case"UMCSENT":v=75+Math.sin(t*12)*12+(t>.3&&t<.4?-18:0)+(Math.random()-.5)*3;v=Math.max(50,v);break;
case"HOUST":v=1200+t*300+Math.sin(t*12)*200+(Math.random()-.5)*80;v=Math.max(800,v);break;
case"CSUSHPISA":v=180+t*140+Math.sin(t*8)*8+(Math.random()-.5)*5;break;
case"MORTGAGE30":v=3+t*5+Math.sin(t*10)*1+(Math.random()-.5)*.15;v=Math.max(2.5,Math.min(8,v));break;
case"M2SL":v=11000+t*10000+Math.sin(t*6)*500+(Math.random()-.5)*200;break;
case"HYSPREAD":v=8-t*4+Math.sin(t*20)*2+(Math.random()-.5)*.5;v=Math.max(2.5,v);break;
case"INDPRO":v=95+t*12+Math.sin(t*12)*4+(Math.random()-.5)*2;if(t>.3&&t<.35)v*=.93;break;
// ── 日本追加 ──
case"JP_BCONF":v=99+t*3+Math.sin(t*10)*2+(Math.random()-.5)*.8;break;
case"JP_EXPORT":v=55000+t*25000+Math.sin(t*12)*5000+(Math.random()-.5)*2000;break;
case"JP_IMPORT":v=50000+t*25000+Math.sin(t*10)*6000+(Math.random()-.5)*2500;break;
// ── ユーロ圏 ──
case"EU_ECB":if(t<.5)v=-.5+(Math.random()-.5)*.05;else if(t<.7)v=(t-.5)*20;else if(t<.85)v=4;else v=4-(t-.85)*15;v=Math.round(v*100)/100;v=Math.max(-.5,v);break;
case"EU_UNRATE":v=11-t*4+Math.sin(t*10)*1.5+(Math.random()-.5)*.3;v=Math.max(6,v);break;
case"EURUSD":v=1.1+Math.sin(t*15)*.12+(Math.random()-.5)*.02;v=Math.max(1.0,Math.min(1.25,v));break;
case"EU_GDP":v=2500000+t*600000+Math.sin(t*6)*50000+(Math.random()-.5)*20000;if(t>.3&&t<.35)v*=.95;break;
// ── インド ──
case"IN_USDINR":v=65+t*20+Math.sin(t*10)*3+(Math.random()-.5)*.5;v=Math.max(60,Math.min(88,v));break;
case"IN_CPI":v=115+t*55+Math.sin(t*8)*5+(Math.random()-.5)*3;break;
case"IN_RATE":if(t<.3)v=8-(t*10);else if(t<.5)v=4+(Math.random()-.5)*.1;else if(t<.7)v=4+t*3;else v=6.5-(t-.7)*5;v=Math.round(v*100)/100;v=Math.max(4,Math.min(9,v));break;
// ── コモディティ追加 ──
case"OIL_WTI":v=40+t*60+Math.sin(t*20)*25+(Math.random()-.5)*8;if(t>.3&&t<.35)v*=.5;v=Math.max(20,v);break;
case"NATGAS":v=2+Math.sin(t*25)*2.5+(Math.random()-.5)*.5;v=Math.max(1.5,v);break;
case"WHEAT":v=180+t*100+Math.sin(t*15)*60+(Math.random()-.5)*20;if(t>.55&&t<.65)v+=120;break;
default:v=100+t*50;}
d.push({date:date.toISOString().split("T")[0],value:Math.round(v*100)/100});}
return d.sort((a,b)=>a.date.localeCompare(b.date));}

// ─── TECHNICALS ─────────────────────────────────────────────────────────
function calcSMA(data,p){return data.map((d,i)=>{if(i<p-1)return{...d,[`sma${p}`]:null};return{...d,[`sma${p}`]:Math.round(data.slice(i-p+1,i+1).reduce((a,v)=>a+v.value,0)/p*100)/100};});}
function calcBB(data,p=20,m=2){return data.map((d,i)=>{if(i<p-1)return{...d,bbU:null,bbM:null,bbL:null};const s=data.slice(i-p+1,i+1);const mean=s.reduce((a,v)=>a+v.value,0)/p;const std=Math.sqrt(s.reduce((a,v)=>a+Math.pow(v.value-mean,2),0)/p);return{...d,bbU:Math.round((mean+m*std)*100)/100,bbM:Math.round(mean*100)/100,bbL:Math.round((mean-m*std)*100)/100};});}
function calcRSI(data,p=14){return data.map((d,i)=>{if(i<p)return{...d,rsi:null};let g=0,l=0;for(let j=i-p+1;j<=i;j++){const df=data[j].value-data[j-1].value;if(df>0)g+=df;else l-=df;}const rs=l===0?100:g/l;return{...d,rsi:Math.round((100-100/(1+rs))*100)/100};});}
function calcMACD(data,f=12,s=26,sg=9){const ema=(a,p)=>{const k=2/(p+1);const r=[a[0]];for(let i=1;i<a.length;i++)r.push(a[i]*k+r[i-1]*(1-k));return r;};const v=data.map(d=>d.value);const ef=ema(v,f);const es=ema(v,s);const ml=ef.map((x,i)=>x-es[i]);const sl2=ema(ml,sg);return data.map((d,i)=>({...d,macd:i>=s?Math.round(ml[i]*100)/100:null,macdSig:i>=s+sg?Math.round(sl2[i]*100)/100:null,macdH:i>=s+sg?Math.round((ml[i]-sl2[i])*100)/100:null}));}

// ─── AI SIGNALS ─────────────────────────────────────────────────────────
function analyzeSignals(ad){const sigs={};
Object.entries(ad).forEach(([k,data])=>{if(!data||data.length<20){sigs[k]={signal:"NEUTRAL",score:50,reasons:["データ不足"]};return;}
const r=data.slice(-12);const p=data.slice(-24,-12);let sc=50;const reasons=[];
const rA=r.reduce((s,d)=>s+d.value,0)/r.length;const pA=p.length>0?p.reduce((s,d)=>s+d.value,0)/p.length:rA;const tr=((rA-pA)/pA)*100;
const lt=r[r.length-1]?.value;const lt2=r[r.length-2]?.value||lt;const mom=lt-lt2;

if(k==="NFP"||k==="JOLTS"){if(tr>1){sc+=15;reasons.push("増加トレンド ↑");}else if(tr<-1){sc-=15;reasons.push("減少トレンド ↓");}if(mom>0){sc+=8;reasons.push("直近改善");}else{sc-=8;reasons.push("直近悪化");}}
else if(k==="UNRATE"){if(lt<4){sc+=15;reasons.push(lt.toFixed(1)+"%: 低水準");}else if(lt<5){sc+=5;reasons.push(lt.toFixed(1)+"%: 正常圏");}else{sc-=20;reasons.push(lt.toFixed(1)+"%: 高水準");}if(mom>0){sc-=10;reasons.push("上昇中");}else if(mom<0){sc+=10;reasons.push("低下中");}}
else if(k==="ICSA"){if(lt<250000){sc+=15;reasons.push("申請少: 堅調");}else if(lt<300000){sc+=5;reasons.push("正常圏");}else{sc-=15;reasons.push("申請増: 懸念");}if(mom>0){sc-=8;reasons.push("増加中");}else{sc+=8;reasons.push("減少中");}}
else if(k==="CPI"||k==="CORECPI"){const yoy=data.length>12?((lt-data[data.length-13].value)/data[data.length-13].value)*100:tr;if(yoy>4){sc-=25;reasons.push("YoY "+yoy.toFixed(1)+"%: 高インフレ");}else if(yoy>2.5){sc-=10;reasons.push("YoY "+yoy.toFixed(1)+"%: やや高め");}else if(yoy>=1.5){sc+=15;reasons.push("YoY "+yoy.toFixed(1)+"%: 安定圏");}else{sc+=5;reasons.push("YoY "+yoy.toFixed(1)+"%: 低インフレ");}}
else if(k==="FEDFUNDS"){const p3=r[r.length-4]?.value||lt;if(lt<p3){sc+=20;reasons.push("利下げ局面");}else if(lt>p3){sc-=15;reasons.push("利上げ局面");}else{sc+=5;reasons.push("据え置き");}if(lt>5){sc-=8;reasons.push("高金利");}}
else if(k==="GDP"){if(tr>2){sc+=20;reasons.push("堅調成長");}else if(tr>0){sc+=10;reasons.push("緩やか成長");}else{sc-=25;reasons.push("縮小リスク");}}
else if(k==="ISM"){if(lt>55){sc+=20;reasons.push(lt.toFixed(1)+": 強い拡大");}else if(lt>50){sc+=10;reasons.push(lt.toFixed(1)+": 拡大");}else if(lt>45){sc-=10;reasons.push(lt.toFixed(1)+": 縮小");}else{sc-=20;reasons.push(lt.toFixed(1)+": 深刻縮小");}}
else if(k==="RETAIL"){if(tr>3){sc+=15;reasons.push("消費堅調");}else if(tr>0){sc+=5;reasons.push("消費微増");}else{sc-=15;reasons.push("消費減退");}}
else if(k==="DGS10"){if(lt>4.5){sc-=10;reasons.push(lt.toFixed(2)+"%: 株に逆風");}else if(lt>3){reasons.push(lt.toFixed(2)+"%: 中立");}else{sc+=10;reasons.push(lt.toFixed(2)+"%: 株に追い風");}}
else if(k==="DGS2"){if(lt>4.5){sc-=8;reasons.push("短期金利高");}else{sc+=5;reasons.push("短期金利正常");}}
else if(k==="T10Y2Y"){if(lt<0){sc-=20;reasons.push("逆イールド⚠");}else if(lt<0.5){sc-=5;reasons.push("フラット化");}else{sc+=10;reasons.push("正常カーブ");}}
else if(k==="VIX"){if(lt>30){sc-=20;reasons.push(lt.toFixed(0)+": 高恐怖");}else if(lt>20){sc-=5;reasons.push(lt.toFixed(0)+": やや不安");}else{sc+=15;reasons.push(lt.toFixed(0)+": 安定");}}
else if(k==="SP500"||k==="GSPC"){if(tr>10){sc+=15;reasons.push("強い上昇");}else if(tr>0){sc+=8;reasons.push("上昇基調");}else{sc-=15;reasons.push("下落基調");}}
else if(k==="JP_UNRATE"){if(lt<2.5){sc+=15;reasons.push(lt.toFixed(1)+"%: 低水準");}else if(lt<3){sc+=8;reasons.push(lt.toFixed(1)+"%: 正常圏");}else{sc-=15;reasons.push(lt.toFixed(1)+"%: やや高め");}if(mom>0){sc-=8;reasons.push("上昇中");}else if(mom<0){sc+=8;reasons.push("低下中");}}
else if(k==="JP_CPI"){const yoy=data.length>12?((lt-data[data.length-13].value)/data[data.length-13].value)*100:tr;if(yoy>3){sc-=15;reasons.push("YoY "+yoy.toFixed(1)+"%: 高インフレ");}else if(yoy>=1.5){sc+=15;reasons.push("YoY "+yoy.toFixed(1)+"%: 目標圏内");}else{sc-=5;reasons.push("YoY "+yoy.toFixed(1)+"%: 低インフレ");}}
else if(k==="JP_BOJ"){if(lt<0){sc+=10;reasons.push("マイナス金利");}else if(lt<0.5){sc+=5;reasons.push("超低金利");}else{sc-=10;reasons.push("利上げ局面");}if(mom>0){sc-=10;reasons.push("利上げ中");}}
else if(k==="JP_INDPRO"){if(tr>3){sc+=15;reasons.push("生産好調");}else if(tr>0){sc+=5;reasons.push("緩やか増産");}else{sc-=15;reasons.push("生産減少");}}
else if(k==="JP_JGB10"){if(lt>1.5){sc-=10;reasons.push(lt.toFixed(2)+"%: 上昇懸念");}else if(lt>0.5){sc+=5;reasons.push(lt.toFixed(2)+"%: 正常化");}else{sc+=10;reasons.push(lt.toFixed(2)+"%: 低水準");}}
else if(k==="JP_NIKKEI"){if(tr>10){sc+=15;reasons.push("強い上昇");}else if(tr>0){sc+=8;reasons.push("上昇基調");}else{sc-=15;reasons.push("下落基調");}}
else if(k==="JP_USDJPY"){if(lt>150){sc-=10;reasons.push(lt.toFixed(0)+"円: 過度な円安");}else if(lt>140){sc+=5;reasons.push(lt.toFixed(0)+"円: 輸出に有利");}else if(lt>125){sc+=10;reasons.push(lt.toFixed(0)+"円: 適正圏");}else{sc+=5;reasons.push(lt.toFixed(0)+"円: 円高");}if(mom>0){sc-=5;reasons.push("円安進行中");}else if(mom<0){sc+=5;reasons.push("円高方向");}}
else if(k==="JP_CORECPI"){const yoy=data.length>12?((lt-data[data.length-13].value)/data[data.length-13].value)*100:tr;if(yoy>3){sc-=15;reasons.push("YoY "+yoy.toFixed(1)+"%: 高インフレ");}else if(yoy>=1.5){sc+=15;reasons.push("YoY "+yoy.toFixed(1)+"%: 目標圏内");}else{sc-=5;reasons.push("YoY "+yoy.toFixed(1)+"%: 低インフレ");}}
else if(k==="JP_CONF"){if(lt>101){sc+=15;reasons.push(lt.toFixed(1)+": 楽観的");}else if(lt>=100){sc+=5;reasons.push(lt.toFixed(1)+": やや楽観");}else if(lt>=98){sc-=5;reasons.push(lt.toFixed(1)+": やや悲観");}else{sc-=15;reasons.push(lt.toFixed(1)+": 悲観的");}}
else if(k==="JP_GDP"){if(tr>2){sc+=20;reasons.push("堅調成長");}else if(tr>0){sc+=10;reasons.push("緩やか成長");}else{sc-=25;reasons.push("縮小リスク");}}
else if(k==="JP_M2"){if(tr>3){sc+=10;reasons.push("流動性拡大");}else if(tr>0){sc+=5;reasons.push("緩やか増加");}else{sc-=10;reasons.push("流動性縮小");}}
else if(k==="COPPER"){if(tr>15){sc+=20;reasons.push("銅急騰: 景気期待強");}else if(tr>5){sc+=12;reasons.push("銅上昇: 景気好調");}else if(tr>0){sc+=5;reasons.push("銅安定");}else if(tr>-5){sc-=5;reasons.push("銅軟調");}else{sc-=18;reasons.push("銅急落: 景気懸念");}}
else if(k==="BITCOIN"){if(tr>50){sc+=15;reasons.push("BTC急騰: リスクオン");}else if(tr>15){sc+=8;reasons.push("BTC上昇中");}else if(tr>0){sc+=3;reasons.push("BTC横ばい");}else if(tr>-20){sc-=5;reasons.push("BTC軟調");}else{sc-=12;reasons.push("BTC急落: リスクオフ");}}
// ── 米国追加 ──
else if(k==="PCECORE"){const yoy=data.length>12?((lt-data[data.length-13].value)/data[data.length-13].value)*100:tr;if(yoy>3){sc-=20;reasons.push("コアPCE "+yoy.toFixed(1)+"%: 高止まり");}else if(yoy>2.5){sc-=8;reasons.push("コアPCE "+yoy.toFixed(1)+"%: やや高め");}else if(yoy>=1.5){sc+=15;reasons.push("コアPCE "+yoy.toFixed(1)+"%: 目標圏内");}else{sc+=5;reasons.push("コアPCE "+yoy.toFixed(1)+"%: 低インフレ");}}
else if(k==="UMCSENT"){if(lt>90){sc+=20;reasons.push(lt.toFixed(1)+": 高楽観");}else if(lt>75){sc+=10;reasons.push(lt.toFixed(1)+": 楽観的");}else if(lt>65){sc+=0;reasons.push(lt.toFixed(1)+": 中立");}else if(lt>55){sc-=10;reasons.push(lt.toFixed(1)+": やや悲観");}else{sc-=20;reasons.push(lt.toFixed(1)+": 悲観的");}if(mom>0){sc+=5;reasons.push("改善中");}else{sc-=5;reasons.push("悪化中");}}
else if(k==="HOUST"){if(lt>1500){sc+=15;reasons.push(Math.round(lt)+"千: 住宅堅調");}else if(lt>1200){sc+=8;reasons.push(Math.round(lt)+"千: 正常圏");}else if(lt>900){sc-=8;reasons.push(Math.round(lt)+"千: 低調");}else{sc-=18;reasons.push(Math.round(lt)+"千: 低迷");}if(mom>0){sc+=5;reasons.push("着工増加中");}}
else if(k==="CSUSHPISA"){if(tr>10){sc+=12;reasons.push("住宅価格急騰");}else if(tr>5){sc+=8;reasons.push("住宅価格上昇");}else if(tr>0){sc+=3;reasons.push("住宅価格横ばい");}else{sc-=10;reasons.push("住宅価格下落");}}
else if(k==="MORTGAGE30"){if(lt>7){sc-=20;reasons.push(lt.toFixed(2)+"%: 住宅購入困難");}else if(lt>6){sc-=10;reasons.push(lt.toFixed(2)+"%: 高め");}else if(lt>5){sc-=3;reasons.push(lt.toFixed(2)+"%: やや高め");}else{sc+=12;reasons.push(lt.toFixed(2)+"%: 購入しやすい");}}
else if(k==="M2SL"){if(tr>5){sc+=10;reasons.push("M2急増: 流動性潤沢");}else if(tr>2){sc+=5;reasons.push("M2増加: 緩和的");}else if(tr>-1){sc+=0;reasons.push("M2横ばい");}else{sc-=15;reasons.push("M2減少: 信用収縮");}}
else if(k==="HYSPREAD"){if(lt>8){sc-=25;reasons.push(lt.toFixed(2)+"%: 信用危機水準");}else if(lt>5){sc-=15;reasons.push(lt.toFixed(2)+"%: 信用不安");}else if(lt>3.5){sc-=5;reasons.push(lt.toFixed(2)+"%: やや拡大");}else{sc+=15;reasons.push(lt.toFixed(2)+"%: 信用環境良好");}if(mom>0){sc-=8;reasons.push("スプレッド拡大中");}else{sc+=8;reasons.push("スプレッド縮小中");}}
else if(k==="INDPRO"){if(tr>3){sc+=15;reasons.push("生産好調");}else if(tr>0){sc+=8;reasons.push("生産増加");}else if(tr>-2){sc-=5;reasons.push("生産横ばい");}else{sc-=18;reasons.push("生産減少");}}
// ── 日本追加 ──
else if(k==="JP_BCONF"){if(lt>101){sc+=15;reasons.push(lt.toFixed(1)+": 企業楽観");}else if(lt>=100){sc+=5;reasons.push(lt.toFixed(1)+": やや楽観");}else if(lt>=98){sc-=5;reasons.push(lt.toFixed(1)+": やや悲観");}else{sc-=15;reasons.push(lt.toFixed(1)+": 企業悲観");}if(mom>0){sc+=5;reasons.push("改善中");}}
else if(k==="JP_EXPORT"){if(tr>10){sc+=15;reasons.push("輸出急増");}else if(tr>3){sc+=8;reasons.push("輸出好調");}else if(tr>0){sc+=3;reasons.push("輸出微増");}else{sc-=12;reasons.push("輸出減少");}}
else if(k==="JP_IMPORT"){if(tr>10){sc-=5;reasons.push("輸入急増: コスト増");}else if(tr>0){sc+=3;reasons.push("輸入増加: 内需あり");}else{sc-=5;reasons.push("輸入減少: 内需低下");}}
// ── ユーロ圏 ──
else if(k==="EU_ECB"){if(lt<0){sc+=10;reasons.push("マイナス金利: 緩和的");}else if(lt<1){sc+=5;reasons.push("超低金利");}else if(lt<3){sc-=5;reasons.push("利上げ局面");}else{sc-=15;reasons.push("高金利: 景気抑制");}if(mom<0){sc+=10;reasons.push("利下げ中");}}
else if(k==="EU_UNRATE"){if(lt<7){sc+=15;reasons.push(lt.toFixed(1)+"%: 低水準");}else if(lt<8.5){sc+=5;reasons.push(lt.toFixed(1)+"%: 改善");}else if(lt<10){sc-=8;reasons.push(lt.toFixed(1)+"%: 高め");}else{sc-=20;reasons.push(lt.toFixed(1)+"%: 高失業率");}if(mom<0){sc+=8;reasons.push("低下中");}}
else if(k==="EURUSD"){if(tr>5){sc+=8;reasons.push("ユーロ高進行");}else if(tr>0){sc+=4;reasons.push("ユーロ安定");}else if(tr>-5){sc-=4;reasons.push("ユーロ軟調");}else{sc-=10;reasons.push("ユーロ急落");}}
else if(k==="EU_GDP"){if(tr>2){sc+=20;reasons.push("堅調成長");}else if(tr>0){sc+=10;reasons.push("緩やか成長");}else{sc-=25;reasons.push("縮小リスク");}}
// ── インド ──
else if(k==="IN_USDINR"){if(tr>5){sc-=10;reasons.push("ルピー急落: 資本流出懸念");}else if(tr>2){sc-=5;reasons.push("ルピー下落");}else if(tr>-2){sc+=3;reasons.push("ルピー安定");}else{sc+=8;reasons.push("ルピー上昇");}}
else if(k==="IN_CPI"){const yoy=data.length>12?((lt-data[data.length-13].value)/data[data.length-13].value)*100:tr;if(yoy>6){sc-=20;reasons.push("YoY "+yoy.toFixed(1)+"%: 高インフレ");}else if(yoy>4){sc-=5;reasons.push("YoY "+yoy.toFixed(1)+"%: 目標上限付近");}else if(yoy>=2){sc+=15;reasons.push("YoY "+yoy.toFixed(1)+"%: 目標圏内");}else{sc+=3;reasons.push("YoY "+yoy.toFixed(1)+"%: 低インフレ");}}
else if(k==="IN_RATE"){if(lt<5){sc+=15;reasons.push(lt.toFixed(2)+"%: 低金利・緩和的");}else if(lt<6.5){sc+=5;reasons.push(lt.toFixed(2)+"%: 正常圏");}else{sc-=15;reasons.push(lt.toFixed(2)+"%: 高金利・引締め");}if(mom<0){sc+=10;reasons.push("利下げ中");}}
// ── コモディティ追加 ──
else if(k==="OIL_WTI"){if(lt>90){sc-=15;reasons.push(lt.toFixed(0)+"$: インフレ圧力");}else if(lt>70){sc-=5;reasons.push(lt.toFixed(0)+"$: やや高め");}else if(lt>50){sc+=5;reasons.push(lt.toFixed(0)+"$: 適正");}else{sc-=10;reasons.push(lt.toFixed(0)+"$: 低迷: 景気懸念");}if(tr>20){sc-=10;reasons.push("原油急騰");}}
else if(k==="NATGAS"){if(lt>5){sc-=15;reasons.push(lt.toFixed(2)+"$: 高騰");}else if(lt>3){sc-=5;reasons.push(lt.toFixed(2)+"$: やや高め");}else{sc+=5;reasons.push(lt.toFixed(2)+"$: 安定");}}
else if(k==="WHEAT"){if(tr>20){sc-=10;reasons.push("小麦急騰: 食料インフレ");}else if(tr>5){sc-=5;reasons.push("小麦上昇");}else if(tr>-5){sc+=3;reasons.push("小麦安定");}else{sc+=5;reasons.push("小麦下落: 食料コスト低下");}}

sc=Math.max(0,Math.min(100,sc));let sig="NEUTRAL";if(sc>=70)sig="BULLISH";else if(sc>=55)sig="SLIGHTLY_BULLISH";else if(sc<=30)sig="BEARISH";else if(sc<=45)sig="SLIGHTLY_BEARISH";
sigs[k]={signal:sig,score:sc,reasons};});

const scores=Object.values(sigs).map(v=>v.score);
const avg=scores.reduce((a,b)=>a+b,0)/scores.length;
let ov="NEUTRAL";if(avg>=65)ov="BULLISH";else if(avg>=55)ov="SLIGHTLY_BULLISH";else if(avg<=35)ov="BEARISH";else if(avg<=45)ov="SLIGHTLY_BEARISH";
const or2=[];
const empScores=["NFP","UNRATE","ICSA","JOLTS"].map(k=>sigs[k]?.score||50);
const empAvg=empScores.reduce((a,b)=>a+b,0)/empScores.length;
if(empAvg>=60)or2.push("雇用堅調");else if(empAvg<=40)or2.push("雇用に懸念");
const infAvg=((sigs.CPI?.score||50)+(sigs.CORECPI?.score||50))/2;
if(infAvg>=55)or2.push("インフレ安定");else if(infAvg<=40)or2.push("インフレ懸念");
if((sigs.FEDFUNDS?.score||50)>=60)or2.push("金融緩和期待");
const mktScores=["SP500","VIX","T10Y2Y"].map(k=>sigs[k]?.score||50);
const mktAvg=mktScores.reduce((a,b)=>a+b,0)/mktScores.length;
if(mktAvg>=55)or2.push("市場良好");else if(mktAvg<=40)or2.push("市場に警戒");
sigs._overall={signal:ov,score:Math.round(avg),reasons:or2};return sigs;}

function getEvents(){const evs=[];const now=new Date();Object.entries(INDICATORS).forEach(([k,i])=>{if(i.nextRel==="-")return;const d=Math.ceil((new Date(i.nextRel)-now)/864e5);evs.push({key:k,name:i.relName,nameEn:i.nameEn,date:i.nextRel,days:d,color:i.color,imp:["NFP","FEDFUNDS","CPI","CORECPI"].includes(k)?"高":"中"});});
evs.push({key:"PCE",name:"PCEデフレーター",nameEn:"PCE",date:"2026-02-28",days:Math.ceil((new Date("2026-02-28")-now)/864e5),color:"#9B59B6",imp:"高"});
return evs.sort((a,b)=>a.days-b.days);}

// ─── TWEET GENERATOR ────────────────────────────────────────────────────
function genTweets(ad,sigs,history){
  const get=k=>{const d=ad[k];return d?.length>0?d[d.length-1]:null;};
  const getPrev=k=>{const d=ad[k];return d?.length>1?d[d.length-2]:null;};
  const yoy=k=>{const d=ad[k];if(!d||d.length<13)return null;return((d[d.length-1].value-d[d.length-13].value)/d[d.length-13].value*100).toFixed(1);};
  const cap=t=>t.length>140?t.slice(0,139)+'…':t;
  const ts=[];
  const pick=(key,variants)=>{
    if(!history[key])history[key]=new Set();
    let avail=variants.map((_,i)=>i).filter(i=>!history[key].has(i));
    if(avail.length===0){history[key].clear();avail=variants.map((_,i)=>i);}
    const idx=avail[Math.floor(Math.random()*avail.length)];
    history[key].add(idx);return variants[idx];
  };

  // Topic 1: Macro big picture
  const ov=sigs._overall;const ur=get('UNRATE');const ff=get('FEDFUNDS');
  if(ov&&ur&&ff){
    const cy=yoy('CPI');const urV=ur.value.toFixed(1);const ffV=ff.value.toFixed(2);
    const bull=ov.signal==='BULLISH'||ov.signal==='SLIGHTLY_BULLISH';
    const bear=ov.signal==='BEARISH'||ov.signal==='SLIGHTLY_BEARISH';
    ts.push(cap(pick('macro',[
      bull?`【マクロ読解】失業率${urV}%・CPI前年比${cy||'—'}%・FF金利${ffV}%。この組み合わせが示すのは"ゴルディロックス"か"嵐の前の静けさ"か。相場が最も危ないのは全員が楽観的なときだ📡`
          :bear?`【マクロ警戒】失業率${urV}%・FF金利${ffV}%・CPI前年比${cy||'—'}%。数字は静かにリセッションの足音を刻んでいる。今こそポートフォリオを点検すべきタイミング⚠️`
          :`【マクロ中立】FF金利${ffV}%・失業率${urV}%・CPI前年比${cy||'—'}%。強くもなく弱くもないこの局面こそ方向感を掴みにくい。次の相場の引き金を引くのはどのデータか🔍`,
      `【景気サイクル診断】失業率${urV}%・FF金利${ffV}%・インフレ${cy||'—'}%。雇用・物価・金利の三角形を見れば今どのフェーズにいるかが分かる。答えを持っている人が市場で勝つ💎`,
      `【FRBの詰め将棋】FF金利${ffV}%で戦うFRBを前に失業率${urV}%は${parseFloat(urV)<4.5?'まだ底堅い':'崩れ始めた'}。インフレ${cy||'—'}%との綱引きに決着がつく日が近づいている🏛`,
    ])));
  }

  // Topic 2: Employment
  const nfp=get('NFP');const nfpP=getPrev('NFP');const urD=get('UNRATE');
  if(nfp&&urD){
    const ch=nfpP?Math.round(nfp.value-nfpP.value):null;
    const chStr=ch!=null?(ch>=0?'+':'')+ch+'千人':'';
    const jolts=get('JOLTS');
    ts.push(cap(pick('employment',[
      urD.value<4
        ?`【雇用強し】失業率${urD.value.toFixed(1)}%・NFP${chStr}。"強すぎる雇用"がFRBの利下げを阻む。株高を望む市場と戦い続けるパウエルFRB。この緊張感は当面続く🏛`
        :`【雇用軟化】失業率${urD.value.toFixed(1)}%・NFP${chStr}。雇用の亀裂が広がり始めた。FRBへの利下げ圧力が高まる一方"景気後退"の2文字が頭をよぎる⚠️`,
      `【労働市場の体温】NFP${chStr}・失業率${urD.value.toFixed(1)}%${jolts?'・求人'+Math.round(jolts.value)+'千件':''}。雇用の温度が資産価格のすべてを決める時代に我々は生きている。この数字から目を離してはいけない👁`,
      `【NFP解読】非農業部門雇用${chStr}。失業率${urD.value.toFixed(1)}%と合わせると労働市場の${urD.value<4.5?'底堅さが際立つ':'変化点が近づいている'}。次の雇用統計が相場の方向を決める🎯`,
    ])));
  }

  // Topic 3: Inflation + Fed
  const cpi=get('CPI');const ffR=get('FEDFUNDS');
  if(cpi&&ffR){
    const cy=yoy('CPI');const ccy=yoy('CORECPI');const ffV=ffR.value.toFixed(2);
    const cyN=cy?parseFloat(cy):null;
    ts.push(cap(pick('inflation',[
      cyN&&cyN>3
        ?`【インフレ警戒】CPI前年比${cy}%はFRBの2%目標を大きく上回る。FF金利${ffV}%高止まりの長期化は必至か。"利下げ期待"で動く投資家が最も痛い目を見やすい環境💡`
        :cyN&&cyN<=2.2
        ?`【利下げ接近】CPI前年比${cy}%まで鈍化。FF金利${ffV}%との組み合わせで実質金利は高水準。利下げサイクルが動き出せば恩恵を受けるアセットを今から仕込む価値がある🎯`
        :`【インフレ攻防】CPI前年比${cy||'—'}%・コアCPI${ccy||'—'}%。FRBの2%目標まであと一歩。FF金利${ffV}%の次の動きがすべての答えを持っている。次回FOMCに全集中🏛`,
      `【実質金利の罠】FF金利${ffV}%−CPI${cy||'—'}% = 実質金利${cyN?(ffR.value-cyN).toFixed(2)+'%':'—'}。この水準が続くと借入コスト増で経済に静かなダメージが蓄積する。FRBの転換点を見極めよ🔑`,
      `【コアCPIに注目】食品・エネルギー除くコアCPI前年比${ccy||'—'}%。FRBが最も注視するこの数字がFF金利${ffV}%の行方を決める。表面のCPIに惑わされず本質を見よ👁`,
    ])));
  }

  // Topic 4: Market signals
  const t10=get('T10Y2Y');const vx=get('VIX');const d10=get('DGS10');
  const sp=get('GSPC')||get('SP500');
  if(t10&&vx){
    const ycV=t10.value.toFixed(2);const vxV=vx.value.toFixed(0);const d10V=d10?d10.value.toFixed(2)+'%':'—';
    ts.push(cap(pick('market',[
      t10.value<-0.1
        ?`【逆イールド警告】10Y-2Y=${ycV}%・VIX${vxV}・10年債${d10V}。過去50年逆イールドがこれほど長引いてリセッションを回避した例はほぼない。楽観派もこの事実と一度向き合ってほしい📉`
        :parseFloat(vxV)>25
        ?`【恐怖指数警戒】VIX${vxV}が高止まり。イールドカーブ${ycV}%・10年債${d10V}と合わせると地合いは簡単には解消しない。VIXスパイクは長期投資家のチャンスでもある🌪`
        :`【市場を精読する】イールドカーブ${ycV}%・VIX${vxV}・10年債${d10V}。表面上は落ち着いているが次のショックの種は静かに育っている。"平和な相場"こそ最大のリスクだ📡`,
      `【金利市場が語る未来】10年債${d10V}・2-10年スプレッド${ycV}%。債券市場は株式市場より先に答えを知っている。金利の形状変化を見逃した者が転換点に乗り遅れる🎯`,
      sp?`【株と金利の綱引き】10年債${d10V}・VIX${vxV}。高金利環境でも株価が${sp.value>10000?'高値圏を維持している':'調整局面にある'}現実。バリュエーションと金利の均衡点はどこか💡`
        :`【リスクの温度計】VIX${vxV}が示す市場心理とイールドカーブ${ycV}%の形状。この2つを読めれば相場の大局は見えてくる🔍`,
    ])));
  }

  // Topic 5: Japan
  const bj=get('JP_BOJ');const nk=get('JP_NIKKEI');const jgb=get('JP_JGB10');const jpy=get('JP_USDJPY');
  if(bj){
    const bjV=bj.value.toFixed(2);const nkStr=nk?Math.round(nk.value).toLocaleString()+'円':'—';
    const jgbV=jgb?jgb.value.toFixed(2)+'%':'—';const jpCy=yoy('JP_CPI');const jpyV=jpy?jpy.value.toFixed(2):'—';
    ts.push(cap(pick('japan',[
      bj.value>=0.4
        ?`【日本株の死角】日銀金利${bjV}%・JGB10年${jgbV}・日経${nkStr}。利上げ局面の日本株が直面するのは円高×金利上昇×外需鈍化のトリプル逆風。この嵐を乗り越える銘柄はどこか🇯🇵`
        :`【日銀と日本株の方程式】政策金利${bjV}%・JGB${jgbV}・CPI前年比${jpCy||'—'}%。2%目標が視野に入るなかで利上げタイミングを巡る思惑が円・日経・金利を揺さぶり続ける🇯🇵`,
      jpy?`【ドル円が映す真実】ドル円${jpyV}円・日銀金利${bjV}%・日経${nkStr}。円安が続く限り輸出企業は恩恵を受けるが輸入物価上昇が家計を圧迫する。この綱引きに日本経済の行方がかかっている💴`
         :`【日本の利上げサイクル】日銀政策金利${bjV}%・JGB10年${jgbV}。デフレから抜け出した日本が直面する"普通の金融政策"への移行。金利のある世界への適応が急務だ🏯`,
      `【外国人が見る日本】日経${nkStr}・JGB${jgbV}・金利${bjV}%。外国人投資家が注目する日本市場の本質は"割安×利上げ×円安修正"のトリプルストーリー。このナラティブが続く間は注目に値する🎌`,
    ])));
  }

  return ts;}

// ─── COMPONENTS ─────────────────────────────────────────────────────────
function CTip({active,payload,label,indicator}){if(!active||!payload?.length)return null;const inf=INDICATORS[indicator];return(<div style={{background:"rgba(10,10,15,.96)",border:"1px solid "+(inf?.color||"#555")+"30",borderRadius:8,padding:"10px 14px"}}><p style={{color:"#666",fontSize:11,margin:0,fontFamily:"monospace"}}>{label}</p>{payload.filter(p=>p.value!=null).map((p,i)=>(<p key={i} style={{color:p.color||inf?.color||"#fff",fontSize:14,fontWeight:700,margin:"3px 0 0",fontFamily:"monospace"}}>{p.name}: {typeof p.value==="number"?p.value.toLocaleString(undefined,{maximumFractionDigits:2}):p.value}</p>))}</div>);}

function Gauge({score,size=110}){const a=(score/100)*180-180;const r=size/2-8;const cx=size/2;const cy=size/2+5;const nx=cx+r*.7*Math.cos(a*Math.PI/180);const ny=cy+r*.7*Math.sin(a*Math.PI/180);return(<svg width={size} height={size*.62} viewBox={`0 0 ${size} ${size*.62}`}><defs><linearGradient id="gg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#E8453C"/><stop offset="25%" stopColor="#F5A623"/><stop offset="50%" stopColor="#888"/><stop offset="75%" stopColor="#B8E986"/><stop offset="100%" stopColor="#7ED321"/></linearGradient></defs><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="url(#gg)" strokeWidth="6" strokeLinecap="round"/><line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#e8e8e8" strokeWidth="2" strokeLinecap="round"/><circle cx={cx} cy={cy} r="3" fill="#e8e8e8"/><text x={cx-r+2} y={cy+14} fill="#E8453C" fontSize="8" fontFamily="monospace">弱気</text><text x={cx+r-18} y={cy+14} fill="#7ED321" fontSize="8" fontFamily="monospace">強気</text></svg>);}

function MiniCard({ind,data,isSel,onClick,sig,accentColor,compact}){const inf=INDICATORS[ind];const ac=accentColor||inf.color;const lt=data?.[data.length-1];const pv=data?.[data.length-2];const ch=lt&&pv?((lt.value-pv.value)/pv.value*100):0;const up=ch>=0;const sl=sig?SL[sig.signal]:null;const [hov,setHov]=useState(false);const spark=data?data.slice(-40):[];const showSpark=!compact||isSel;
return(<div style={{position:"relative"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
<button onClick={onClick} style={{background:isSel?ac+"14":"rgba(255,255,255,.015)",border:"1px solid "+(isSel?ac+"55":"rgba(255,255,255,.05)"),borderRadius:10,padding:"10px 12px 6px",cursor:"pointer",textAlign:"left",transition:"all .25s",position:"relative",overflow:"hidden",width:"100%"}}>
{isSel&&<div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:ac,borderRadius:"3px 0 0 3px"}}/>}
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><p style={{color:"#aaa",fontSize:11,margin:0,fontWeight:600}}>{inf.name}</p>{sl&&<span style={{background:sl.bg,color:sl.color,padding:"1px 5px",borderRadius:4,fontSize:9,fontWeight:700,fontFamily:"monospace"}}>{sl.emoji}</span>}</div>
<div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:4}}><span style={{color:"#e4e4e4",fontSize:18,fontWeight:800,fontFamily:"monospace"}}>{lt?Number(lt.value).toLocaleString(undefined,{maximumFractionDigits:2}):"—"}</span><span style={{color:up?"#7ED321":"#E8453C",fontSize:10,fontWeight:700,fontFamily:"monospace"}}>{up?"▲":"▼"}{Math.abs(ch).toFixed(2)}%</span></div>
{showSpark&&spark.length>2&&<div style={{width:"100%",height:26,marginTop:3}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={spark} margin={{top:1,right:0,left:0,bottom:0}}><defs><linearGradient id={"sc-"+ind} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={isSel?ac:"rgba(255,255,255,.3)"} stopOpacity={isSel?.25:.06}/><stop offset="100%" stopColor={isSel?ac:"rgba(255,255,255,.3)"} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" hide/><YAxis hide domain={["auto","auto"]}/><Area type="monotone" dataKey="value" stroke={isSel?ac:"rgba(255,255,255,.15)"} strokeWidth={isSel?1.5:1} fill={"url(#sc-"+ind+")"} dot={false}/></AreaChart></ResponsiveContainer></div>}
</button>
{hov&&<div style={{position:"absolute",top:"calc(100% + 5px)",left:0,minWidth:"100%",width:"max-content",maxWidth:260,background:"rgba(8,8,13,.97)",border:"1px solid "+ac+"40",borderRadius:9,padding:"9px 11px",zIndex:300,pointerEvents:"none",boxShadow:"0 6px 24px rgba(0,0,0,.7)"}}>
  <p style={{color:"#bbb",fontSize:10,margin:0,lineHeight:1.65,fontWeight:500}}>{inf.desc}</p>
  <p style={{color:ac+"dd",fontSize:9,margin:"6px 0 0",fontFamily:"monospace",lineHeight:1.5}}>↗ {inf.impact}</p>
  <p style={{color:"#444",fontSize:8,margin:"5px 0 0",fontFamily:"monospace"}}>{inf.freq} · {inf.unit} · {inf.id}</p>
</div>}
</div>);}

// ─── MATRIX LAYOUT ───────────────────────────────────────────────────────
const MATRIX_COLS=[
  {id:'employment',label:'👷 雇用'},
  {id:'inflation',label:'🔥 物価'},
  {id:'policy',label:'🏛 金融政策'},
  {id:'economy',label:'📊 景気'},
  {id:'market',label:'📈 市場'},
  {id:'commodity',label:'🪙 コモディティ'},
];
const MATRIX_ROWS=[
  {id:'us',label:'🇺🇸 米国',keys:{
    employment:['NFP','UNRATE','ICSA','JOLTS'],
    inflation:['CPI','CORECPI','PCECORE'],
    policy:['FEDFUNDS','M2SL'],
    economy:['GDP','ISM','RETAIL','UMCSENT','HOUST','CSUSHPISA','INDPRO'],
    market:['DGS10','DGS2','T10Y2Y','VIX','SP500','GSPC','MORTGAGE30','HYSPREAD'],
    commodity:['COPPER','BITCOIN','OIL_WTI','NATGAS','WHEAT'],
  }},
  {id:'jp',label:'🇯🇵 日本',keys:{
    employment:['JP_UNRATE'],
    inflation:['JP_CPI','JP_CORECPI'],
    policy:['JP_BOJ','JP_M2'],
    economy:['JP_GDP','JP_INDPRO','JP_CONF','JP_BCONF','JP_EXPORT','JP_IMPORT'],
    market:['JP_JGB10','JP_NIKKEI','JP_USDJPY'],
    commodity:[],
  }},
  {id:'other',label:'🌍 その他',keys:{
    employment:['EU_UNRATE'],
    inflation:['IN_CPI'],
    policy:['EU_ECB','IN_RATE'],
    economy:['EU_GDP'],
    market:['EURUSD','IN_USDINR'],
    commodity:[],
  }},
];

// ─── APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [sel,setSel]=useState("NFP");
  const [tf,setTf]=useState(5);
  const [ad,setAd]=useState({});
  const [vw,setVw]=useState(VS.S);
  const [sma,setSma]=useState(true);
  const [bbol,setBb]=useState(false);
  const [rsiOn,setRsi]=useState(false);
  const [macdOn,setMacd]=useState(false);
  const [ci,setCi]=useState(["NFP","SP500","FEDFUNDS"]);
  const [ak,setAk]=useState(()=>localStorage.getItem("fred_key")||"");
  const [ki,setKi]=useState("");
  const [demo,setDemo]=useState(true);
  const [ld,setLd]=useState(false);
  const [err,setErr]=useState(null);
  const [catFilter,setCatFilter]=useState("all");
  const [fetchProgress,setFetchProgress]=useState("");
  const [tweetEdits,setTweetEdits]=useState({});
  const [tweetSeed,setTweetSeed]=useState(0);
  const tweetHistory=useRef({});
  const [newsItems,setNewsItems]=useState([]);
  const [newsLoading,setNewsLoading]=useState(false);
  const [newsUpdated,setNewsUpdated]=useState(null);
  const [forceDual,setForceDual]=useState(false);
  useEffect(()=>setForceDual(false),[ci]);
  useEffect(()=>setTweetSeed(s=>s+1),[sel]);

  const fetchAllNews=useCallback(async()=>{
    setNewsLoading(true);
    try{
      const r=await fetch('/api/news',{signal:AbortSignal.timeout(15000)});
      const j=await r.json();
      setNewsItems(j.items||[]);
      setNewsUpdated(new Date());
    }catch(e){console.error('news fetch error',e);}
    finally{setNewsLoading(false);}
  },[]);
  useEffect(()=>{fetchAllNews();const t=setInterval(fetchAllNews,10*60*1000);return()=>clearInterval(t);},[fetchAllNews]);

  // Load demo data
  useEffect(()=>{const d={};Object.keys(INDICATORS).forEach(k=>{d[k]=genDemo(k,15);});setAd(d);
    // Auto-connect if key saved
    const saved=localStorage.getItem("fred_key");
    if(saved)fetchFred(saved);
  },[]);

  const fetchFred=useCallback(async(key)=>{
    setLd(true);setErr(null);const res={};
    const st=new Date();st.setFullYear(st.getFullYear()-30);
    const entries=Object.entries(INDICATORS);
    try{
      const errors=[];
      for(let idx=0;idx<entries.length;idx++){
        const [ind,inf]=entries[idx];
        setFetchProgress(`${ind} を取得中... (${idx+1}/${entries.length})`);
        try{
          const url=`/api/fred/series/observations?series_id=${inf.id}&api_key=${key}&file_type=json&observation_start=${st.toISOString().split("T")[0]}&sort_order=asc`;
          const r=await fetch(url);
          if(!r.ok){errors.push(`${inf.name}(${r.status})`);continue;}
          const j=await r.json();
          if(j.error_code){if(idx===0)throw new Error(j.error_message||"Invalid key");errors.push(inf.name);continue;}
          res[ind]=(j.observations||[]).filter(o=>o.value!==".").map(o=>({date:o.date,value:parseFloat(o.value)}));
        }catch(e){if(idx===0)throw e;errors.push(inf.name);}
        if(idx<entries.length-1)await new Promise(r=>setTimeout(r,100));
      }
      if(errors.length>0)setErr(`取得失敗: ${errors.join(", ")}`);
      setAd(res);setDemo(false);setAk(key);
      localStorage.setItem("fred_key",key);
      setFetchProgress("");
    }catch(e){setErr(e.message);setFetchProgress("");}finally{setLd(false);}
  },[]);

  const gf=useCallback((ind)=>{const raw=ad[ind]||[];const c=new Date();c.setFullYear(c.getFullYear()-tf);return raw.filter(d=>d.date>=c.toISOString().split("T")[0]);},[ad,tf]);
  const sigs=useMemo(()=>analyzeSignals(ad),[ad]);
  const evts=useMemo(()=>getEvents(),[]);
  const tweets=useMemo(()=>genTweets(ad,sigs,tweetHistory.current),[ad,sigs,tweetSeed]);// eslint-disable-line
  useEffect(()=>setTweetEdits({}),[tweets]);
  const inf=INDICATORS[sel];
  const cd=gf(sel);

  const ed=useMemo(()=>{let d=[...cd];if(sma){d=calcSMA(d,20);d=calcSMA(d,50);}if(bbol)d=calcBB(d);if(rsiOn)d=calcRSI(d);if(macdOn)d=calcMACD(d);return d;},[cd,sma,bbol,rsiOn,macdOn]);

  const cpd=useMemo(()=>{if(vw!==VS.C)return[];const arrs=ci.map(k=>gf(k));const dates=arrs.reduce((l,a)=>a.length>l.length?a:l,[]).map(d=>d.date);return dates.map(date=>{const pt={date};ci.forEach((k,ki)=>{const arr=arrs[ki];let match=null;for(let j=arr.length-1;j>=0;j--){if(arr[j].date<=date){match=arr[j];break;}}pt[k]=match?match.value:null;});return pt;});},[vw,ci,gf]);
  const sharedAxis=useMemo(()=>{if(ci.length<2)return false;const d0=gf(ci[0]),d1=gf(ci[1]);if(!d0.length||!d1.length)return false;const m0=Math.max(...d0.map(d=>Math.abs(d.value)));const m1=Math.max(...d1.map(d=>Math.abs(d.value)));if(!m0||!m1)return false;return Math.max(m0,m1)/Math.min(m0,m1)<5;},[ci,gf]);
  const effectiveShared=sharedAxis&&!forceDual;

  const filteredInds=useMemo(()=>{if(catFilter==="all")return Object.keys(INDICATORS);return Object.entries(INDICATORS).filter(([k,v])=>v.cat===catFilter).map(([k])=>k);},[catFilter]);

  const fa=d=>{const dt=new Date(d);return dt.getFullYear()+"/"+String(dt.getMonth()+1).padStart(2,"0");};
  const fv=v=>v>=100000?(v/1000).toFixed(0)+"K":v>=1000?v.toFixed(0):v.toFixed(2);
  const os=sigs._overall?SL[sigs._overall.signal]:SL.NEUTRAL;
  const B=({a,c,children,onClick,s})=>(<button onClick={onClick} style={{background:a?(c?c+"18":"rgba(255,255,255,.08)"):"rgba(255,255,255,.02)",border:"1px solid "+(a?(c?c+"40":"rgba(255,255,255,.2)"):"rgba(255,255,255,.06)"),borderRadius:5,padding:"4px 10px",color:a?(c||"#e8e8e8"):"#555",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"monospace",transition:"all .2s",...(s||{})}}>{children}</button>);

  return(<div style={{background:"#08080D",minHeight:"100vh",color:"#e0e0e0",fontFamily:"-apple-system,'Noto Sans JP','Helvetica Neue',sans-serif",WebkitTapHighlightColor:"transparent"}}>
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    body{margin:0;background:#08080D;overscroll-behavior:none}
    button:active{transform:scale(.97)}
    input::placeholder{color:#444}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:3px}
  `}</style>
  <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)",backgroundSize:"50px 50px",pointerEvents:"none"}}/>
  <div style={{position:"relative",zIndex:1,maxWidth:1400,margin:"0 auto",padding:"env(safe-area-inset-top,12px) 12px 12px"}}>

  {/* HEADER */}
  <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8,padding:"8px 0"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:7,height:7,borderRadius:"50%",background:demo?"#F5A623":"#7ED321",boxShadow:"0 0 10px "+(demo?"#F5A623":"#7ED321")+"80",animation:"pulse 2s infinite"}}/>
      <h1 style={{fontSize:19,fontWeight:700,margin:0,color:"#e8e8e8"}}>ECON DASHBOARD <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:demo?"#F5A62318":"#7ED32118",color:demo?"#F5A623":"#7ED321",fontFamily:"monospace",fontWeight:700,verticalAlign:"middle",marginLeft:4}}>{demo?"DEMO":"LIVE"}</span></h1>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:6,width:"100%",maxWidth:360}}>
      {!ak?(<><input type="password" placeholder="FRED API Key" value={ki} onChange={e=>setKi(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ki.length>=20&&fetchFred(ki.trim())} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:7,padding:"8px 11px",color:"#e8e8e8",fontSize:13,fontFamily:"monospace",flex:1,outline:"none",minWidth:0}}/><button onClick={()=>ki.length>=20&&fetchFred(ki.trim())} disabled={ld} style={{background:"linear-gradient(135deg,#4A90D9,#357ABD)",border:"none",borderRadius:7,padding:"8px 16px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",opacity:ld?.5:1,fontFamily:"monospace",whiteSpace:"nowrap"}}>{ld?"...":"接続"}</button></>):
      (<div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}><span style={{color:"#7ED321",fontSize:11,fontFamily:"monospace"}}>● LIVE</span><button onClick={()=>fetchFred(ak)} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:5,padding:"6px 12px",color:"#888",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>↻ 更新</button><button onClick={()=>{localStorage.removeItem("fred_key");setAk("");setDemo(true);const d={};Object.keys(INDICATORS).forEach(k=>{d[k]=genDemo(k,15);});setAd(d);}} style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:5,padding:"6px 10px",color:"#555",fontSize:11,cursor:"pointer",fontFamily:"monospace"}}>切断</button></div>)}
    </div>
  </header>

  {err&&<div style={{background:"#E8453C15",border:"1px solid #E8453C30",borderRadius:8,padding:"8px 14px",marginBottom:10,color:"#E8453C",fontSize:12,fontFamily:"monospace"}}>⚠ {err}</div>}
  {fetchProgress&&<div style={{background:"#4A90D915",border:"1px solid #4A90D930",borderRadius:8,padding:"8px 14px",marginBottom:10,color:"#4A90D9",fontSize:12,fontFamily:"monospace"}}>{fetchProgress}</div>}

  {/* AI SIGNAL */}
  <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:14,padding:"14px 16px",marginBottom:12,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
    <div style={{textAlign:"center",minWidth:100}}>
      <p style={{color:"#555",fontSize:9,margin:"0 0 2px",fontFamily:"monospace",letterSpacing:".1em"}}>OVERALL</p>
      <Gauge score={sigs._overall?.score||50} size={100}/>
      <p style={{color:os.color,fontSize:16,fontWeight:800,margin:"2px 0 0",fontFamily:"monospace"}}>{os.emoji} {os.label}</p>
      <p style={{color:"#555",fontSize:10,margin:0,fontFamily:"monospace"}}>{sigs._overall?.score}/100</p>
    </div>
    <div style={{flex:1,minWidth:200}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
        {Object.entries(CATEGORIES).map(([ck,cat])=>{
          const inds=Object.entries(INDICATORS).filter(([k,v])=>v.cat===ck);
          const catAvg=Math.round(inds.reduce((s,[k])=>s+(sigs[k]?.score||50),0)/inds.length);
          const catSig=catAvg>=65?"BULLISH":catAvg>=55?"SLIGHTLY_BULLISH":catAvg<=35?"BEARISH":catAvg<=45?"SLIGHTLY_BEARISH":"NEUTRAL";
          const sl=SL[catSig];
          return(<div key={ck} style={{background:sl.bg,borderRadius:8,padding:"5px 10px",minWidth:100,flex:"1 1 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:11,fontWeight:600,color:"#aaa"}}>{cat.emoji} {cat.name}</span><span style={{color:sl.color,fontSize:10,fontWeight:700,fontFamily:"monospace"}}>{sl.emoji}{catAvg}</span></div>
          </div>);
        })}
      </div>
      {sigs._overall?.reasons?.length>0&&<p style={{color:"#666",fontSize:10,margin:"5px 0 0",fontFamily:"monospace"}}>{sigs._overall.reasons.join(" | ")}</p>}
    </div>
  </div>

  {/* MATRIX / FLAT CARDS */}
  {vw===VS.M ? (
    <>
      <div style={{display:"flex",gap:3,marginBottom:8,flexWrap:"wrap",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <B a={catFilter==="all"} onClick={()=>setCatFilter("all")}>全て</B>
        {Object.entries(CATEGORIES).map(([ck,cat])=><B key={ck} a={catFilter===ck} c={cat.color} onClick={()=>setCatFilter(ck)}>{cat.emoji}{cat.name}</B>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6,marginBottom:10}}>
        {filteredInds.map(k=>{const ciIdx=ci.indexOf(k);const ac=ciIdx>=0?COMPARE_COLORS[ciIdx]:undefined;return(<MiniCard key={k} ind={k} data={gf(k)} isSel={sel===k} onClick={()=>setSel(k)} sig={sigs[k]} accentColor={ac} compact/>);})}
      </div>
    </>
  ) : (
    <div style={{overflowX:"auto",marginBottom:10,WebkitOverflowScrolling:"touch"}}>
      {vw===VS.C&&<p style={{color:"#555",fontSize:9,fontFamily:"monospace",margin:"0 0 5px"}}>カードを2つ選択 · 選択中: {ci.length}/2</p>}
      <div style={{minWidth:860}}>
        <div style={{display:"grid",gridTemplateColumns:"56px repeat(6,1fr)",gap:3,marginBottom:3}}>
          <div/>
          {MATRIX_COLS.map(col=><div key={col.id} style={{textAlign:"center",padding:"5px 4px",background:"rgba(255,255,255,.03)",borderRadius:6,fontSize:9,fontWeight:700,color:"#777",letterSpacing:".04em",whiteSpace:"nowrap"}}>{col.label}</div>)}
        </div>
        {MATRIX_ROWS.map(row=>(
          <div key={row.id} style={{display:"grid",gridTemplateColumns:"56px repeat(6,1fr)",gap:3,marginBottom:3,alignItems:"stretch"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,.025)",borderRadius:8,padding:"4px 2px",fontSize:9,fontWeight:700,color:"#999",textAlign:"center",writingMode:"vertical-rl",transform:"rotate(180deg)",letterSpacing:".06em"}}>
              {row.label}
            </div>
            {MATRIX_COLS.map(col=>{const keys=row.keys[col.id]||[];return(
              <div key={col.id} style={{background:"rgba(255,255,255,.012)",border:"1px solid rgba(255,255,255,.04)",borderRadius:8,padding:3,display:"flex",flexDirection:"column",gap:2,minHeight:44,maxHeight:440,overflowY:"auto"}}>
                {keys.map(k=>{const ciIdx=ci.indexOf(k);const ac=vw===VS.C&&ciIdx>=0?COMPARE_COLORS[ciIdx]:undefined;return(
                  <MiniCard key={k} ind={k} data={gf(k)}
                    isSel={vw===VS.C?ci.includes(k):sel===k}
                    onClick={vw===VS.C?()=>setCi(p=>p.includes(k)?p.filter(x=>x!==k):p.length>=2?p:[...p,k]):()=>setSel(k)}
                    sig={sigs[k]} accentColor={ac} compact/>
                );})}
                {keys.length===0&&<div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"rgba(255,255,255,.06)",fontSize:11}}>—</span></div>}
              </div>
            );})}
          </div>
        ))}
      </div>
    </div>
  )}

  {/* TABS + TIMEFRAME */}
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
    <div style={{display:"flex",gap:2,background:"rgba(255,255,255,.02)",borderRadius:8,padding:2,overflowX:"auto"}}>
      {[{v:VS.S,l:"📈シングル"},{v:VS.M,l:"📊マルチ"},{v:VS.C,l:"⚖比較"},{v:VS.T,l:"📋テーブル"}].map(t=>(<button key={t.v} onClick={()=>setVw(t.v)} style={{background:vw===t.v?"rgba(255,255,255,.08)":"transparent",border:"none",borderRadius:6,padding:"5px 10px",color:vw===t.v?"#e8e8e8":"#666",fontSize:11,fontWeight:vw===t.v?700:400,cursor:"pointer",whiteSpace:"nowrap"}}>{t.l}</button>))}
    </div>
    <div style={{display:"flex",gap:2}}>{TFS.map(t=><B key={t.l} a={tf===t.y} c={inf.color} onClick={()=>setTf(t.y)}>{t.l}</B>)}</div>
  </div>

  {/* SINGLE */}
  {vw===VS.S&&(<div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:14,padding:"14px 10px",marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:6}}>
      <div><h2 style={{fontSize:15,fontWeight:700,margin:0,color:inf.color}}>{inf.name} <span style={{color:"#555",fontSize:10,fontFamily:"monospace"}}>{inf.id}</span></h2><p style={{color:"#555",fontSize:10,margin:"2px 0 0"}}>{inf.desc}</p></div>
      <div style={{display:"flex",gap:3}}>{[["SMA",sma,setSma],["BB",bbol,setBb],["RSI",rsiOn,setRsi],["MACD",macdOn,setMacd]].map(([l,s,set])=><B key={l} a={s} onClick={()=>set(!s)}>{l}</B>)}</div>
    </div>
    <div style={{width:"100%",height:280}}><ResponsiveContainer><ComposedChart data={ed} margin={{top:5,right:4,left:0,bottom:0}}>
      <defs><linearGradient id={"g-"+sel} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={inf.color} stopOpacity={.15}/><stop offset="100%" stopColor={inf.color} stopOpacity={0}/></linearGradient></defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.03)"/><XAxis dataKey="date" tick={{fill:"#888",fontSize:9,fontFamily:"monospace"}} tickFormatter={fa} stroke="rgba(255,255,255,.04)" interval="preserveStartEnd" minTickGap={40}/><YAxis tick={{fill:"#888",fontSize:9,fontFamily:"monospace"}} stroke="rgba(255,255,255,.04)" tickFormatter={fv} width={45} domain={["auto","auto"]}/><Tooltip content={<CTip indicator={sel}/>}/>
      {bbol&&<><Line type="monotone" dataKey="bbU" stroke={inf.color+"40"} strokeWidth={1} dot={false} strokeDasharray="3 3" name="BB上"/><Line type="monotone" dataKey="bbL" stroke={inf.color+"40"} strokeWidth={1} dot={false} strokeDasharray="3 3" name="BB下"/></>}
      <Area type="monotone" dataKey="value" stroke={inf.color} strokeWidth={2} fill={"url(#g-"+sel+")"} dot={false} activeDot={{r:4,fill:inf.color,stroke:"#08080D",strokeWidth:2}} name={inf.name}/>
      {sma&&<Line type="monotone" dataKey="sma20" stroke="#F5A623" strokeWidth={1} dot={false} name="SMA20"/>}
      {sma&&<Line type="monotone" dataKey="sma50" stroke="#9B59B6" strokeWidth={1} dot={false} name="SMA50"/>}
    </ComposedChart></ResponsiveContainer></div>
    {rsiOn&&<div style={{marginTop:8}}><p style={{color:"#555",fontSize:9,margin:"0 0 2px",fontFamily:"monospace"}}>RSI(14)</p><div style={{width:"100%",height:70}}><ResponsiveContainer><LineChart data={ed} margin={{top:3,right:4,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.03)"/><XAxis dataKey="date" tick={false} stroke="rgba(255,255,255,.04)"/><YAxis domain={[0,100]} ticks={[30,70]} tick={{fill:"#888",fontSize:9,fontFamily:"monospace"}} stroke="rgba(255,255,255,.04)" width={45}/><ReferenceLine y={70} stroke="#E8453C40" strokeDasharray="3 3"/><ReferenceLine y={30} stroke="#7ED32140" strokeDasharray="3 3"/><Line type="monotone" dataKey="rsi" stroke="#1ABC9C" strokeWidth={1.5} dot={false}/></LineChart></ResponsiveContainer></div></div>}
    {macdOn&&<div style={{marginTop:8}}><p style={{color:"#555",fontSize:9,margin:"0 0 2px",fontFamily:"monospace"}}>MACD(12,26,9)</p><div style={{width:"100%",height:70}}><ResponsiveContainer><ComposedChart data={ed} margin={{top:3,right:4,left:0,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.03)"/><XAxis dataKey="date" tick={false} stroke="rgba(255,255,255,.04)"/><YAxis tick={{fill:"#888",fontSize:9,fontFamily:"monospace"}} stroke="rgba(255,255,255,.04)" width={45}/><ReferenceLine y={0} stroke="rgba(255,255,255,.1)"/><Bar dataKey="macdH" fill={inf.color+"40"} name="Hist"/><Line type="monotone" dataKey="macd" stroke={inf.color} strokeWidth={1.5} dot={false} name="MACD"/><Line type="monotone" dataKey="macdSig" stroke="#F5A623" strokeWidth={1} dot={false} name="Sig"/></ComposedChart></ResponsiveContainer></div></div>}
    <div style={{marginTop:10,padding:"8px 10px",background:SL[sigs[sel]?.signal||"NEUTRAL"].bg,borderRadius:8}}><p style={{color:SL[sigs[sel]?.signal||"NEUTRAL"].color,fontSize:11,fontWeight:700,margin:0}}>{SL[sigs[sel]?.signal||"NEUTRAL"].emoji} AI: {SL[sigs[sel]?.signal||"NEUTRAL"].label} ({sigs[sel]?.score}/100)</p><p style={{color:"#666",fontSize:10,margin:"2px 0 0"}}>{inf.impact}</p>{sigs[sel]?.reasons?.map((r,i)=><p key={i} style={{color:"#777",fontSize:9,margin:"2px 0 0",fontFamily:"monospace"}}>• {r}</p>)}</div>
  </div>)}

  {/* MULTI */}
  {vw===VS.M&&(<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:8,marginBottom:10}}>
    {filteredInds.map(k=>{const i2=INDICATORS[k];const d=gf(k);return(<div key={k} style={{background:"rgba(255,255,255,.02)",border:"1px solid "+(sel===k?i2.color+"40":"rgba(255,255,255,.05)"),borderRadius:10,padding:"10px 8px",cursor:"pointer"}} onClick={()=>{setSel(k);setVw(VS.S);}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{color:i2.color,fontSize:11,fontWeight:700}}>{i2.name}</span>{sigs[k]&&<span style={{color:SL[sigs[k].signal].color,fontSize:9,fontFamily:"monospace"}}>{SL[sigs[k].signal].emoji}{SL[sigs[k].signal].label}</span>}</div>
      <div style={{width:"100%",height:80}}><ResponsiveContainer><AreaChart data={d} margin={{top:3,right:2,left:0,bottom:0}}><defs><linearGradient id={"mg-"+k} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={i2.color} stopOpacity={.2}/><stop offset="100%" stopColor={i2.color} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date" tick={false} stroke="transparent"/><YAxis tick={false} stroke="transparent" domain={["auto","auto"]} width={0}/><Area type="monotone" dataKey="value" stroke={i2.color} strokeWidth={1.5} fill={"url(#mg-"+k+")"} dot={false}/></AreaChart></ResponsiveContainer></div>
      <p style={{color:"#888",fontSize:9,fontFamily:"monospace",margin:"3px 0 0"}}>最新: {d[d.length-1]?.value.toLocaleString(undefined,{maximumFractionDigits:2})} {i2.unit}</p>
    </div>);})}
  </div>)}

  {/* COMPARE */}
  {vw===VS.C&&(<div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:14,padding:"14px 10px",marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
      <h3 style={{fontSize:13,fontWeight:700,margin:0,color:"#ccc"}}>オーバーレイ比較 <span style={{color:"#555",fontSize:10,fontWeight:400}}>（実値・左右軸）</span></h3>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        {ci.length===2&&sharedAxis&&<button onClick={()=>setForceDual(p=>!p)} style={{background:forceDual?"rgba(255,200,50,.08)":"transparent",border:"1px solid "+(forceDual?"rgba(255,200,50,.3)":"rgba(255,255,255,.08)"),borderRadius:5,padding:"3px 8px",color:forceDual?"#F5C842":"#555",fontSize:9,cursor:"pointer",fontFamily:"monospace"}}>{forceDual?"自動に戻す":"右軸に分離"}</button>}
        {ci.length>0&&<button onClick={()=>setCi([])} style={{background:"transparent",border:"1px solid rgba(255,255,255,.08)",borderRadius:5,padding:"3px 8px",color:"#555",fontSize:9,cursor:"pointer",fontFamily:"monospace"}}>クリア</button>}
      </div>
    </div>
    <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap",minHeight:24,alignItems:"center"}}>
      {ci.length===0
        ? <span style={{color:"#444",fontSize:9,fontFamily:"monospace"}}>↑ 上のカードから2つ選択してください</span>
        : <>
          {ci.map((k,idx)=>{const i2=INDICATORS[k];const cc=COMPARE_COLORS[idx]||i2.color;const axisLabel=ci.length<2?"":effectiveShared?"共通軸":idx===0?"左軸":"右軸";return(<span key={k} style={{display:"inline-flex",alignItems:"center",gap:4,background:cc+"18",border:"1px solid "+cc+"50",borderRadius:20,padding:"2px 8px 2px 10px",fontSize:10,color:cc,fontWeight:600}}>
              <span style={{color:cc,fontSize:12,fontWeight:800,fontFamily:"monospace"}}>{idx===0?"①":"②"}</span>
              {axisLabel&&<span style={{color:cc+"99",fontSize:8}}>{axisLabel}</span>} {i2.name}
              <button onClick={()=>setCi(p=>p.filter(x=>x!==k))} style={{background:"transparent",border:"none",color:cc+"99",fontSize:11,cursor:"pointer",padding:0,lineHeight:1,fontWeight:700}}>×</button>
            </span>);})}
          {ci.length===2&&<span style={{color:"#444",fontSize:9,fontFamily:"monospace",marginLeft:4}}>{effectiveShared?"· 同スケールのため共通軸":forceDual?"· 右軸に分離中（手動）":"· スケール差大のため左右軸"}</span>}
        </>}
    </div>
    <div style={{width:"100%",height:300}}><ResponsiveContainer><LineChart data={cpd} margin={{top:5,right:(!effectiveShared&&ci.length>1)?55:10,left:0,bottom:0}}>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.03)"/>
      <XAxis dataKey="date" tick={{fill:"#888",fontSize:9,fontFamily:"monospace"}} tickFormatter={fa} stroke="rgba(255,255,255,.04)" interval="preserveStartEnd" minTickGap={40}/>
      <YAxis yAxisId="left" orientation="left" tick={{fill:ci[0]?(effectiveShared?"#888":COMPARE_COLORS[0]+"cc"):"#888",fontSize:9,fontFamily:"monospace"}} stroke="rgba(255,255,255,.04)" tickFormatter={fv} width={50} domain={["auto","auto"]}/>
      {ci.length>1&&!effectiveShared&&<YAxis yAxisId="right" orientation="right" tick={{fill:COMPARE_COLORS[1]+"cc",fontSize:9,fontFamily:"monospace"}} stroke="rgba(255,255,255,.04)" tickFormatter={fv} width={50} domain={["auto","auto"]}/>}
      <Tooltip content={({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div style={{background:"rgba(10,10,15,.96)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"8px 12px"}}><p style={{color:"#666",fontSize:10,margin:0,fontFamily:"monospace"}}>{label}</p>{payload.map((p,i)=>{const ind=INDICATORS[p.dataKey];const cc=COMPARE_COLORS[i]||p.color;return(<p key={i} style={{color:cc,fontSize:11,fontWeight:700,margin:"2px 0 0",fontFamily:"monospace"}}><span style={{fontWeight:800}}>{i===0?"①":"②"}</span> {ind?.name}: {p.value?.toLocaleString(undefined,{maximumFractionDigits:2})} <span style={{color:"#555",fontWeight:400}}>{ind?.unit}</span></p>);})}</div>);}}/>
      {ci[0]&&<Line yAxisId="left" type="monotone" dataKey={ci[0]} stroke={COMPARE_COLORS[0]} strokeWidth={2.5} dot={false} name={INDICATORS[ci[0]].name}/>}
      {ci[1]&&<Line yAxisId={effectiveShared?"left":"right"} type="monotone" dataKey={ci[1]} stroke={COMPARE_COLORS[1]} strokeWidth={2.5} dot={false} name={INDICATORS[ci[1]].name}/>}
      <Legend formatter={v=>INDICATORS[v]?.name||v} wrapperStyle={{fontSize:9,fontFamily:"monospace"}}/>
    </LineChart></ResponsiveContainer></div>
  </div>)}

  {/* TABLE */}
  {vw===VS.T&&(<div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:14,padding:"12px",marginBottom:10,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
    <h3 style={{fontSize:13,fontWeight:700,margin:"0 0 8px",color:"#ccc"}}>{inf.name}</h3>
    <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:11,minWidth:400}}><thead><tr style={{borderBottom:"1px solid rgba(255,255,255,.08)"}}>
      {["日付","値","前期比","変化%","YoY%"].map(h=><th key={h} style={{padding:"5px 6px",textAlign:"right",color:"#666",fontWeight:600,fontSize:9}}>{h}</th>)}
    </tr></thead><tbody>
      {[...cd].reverse().slice(0,40).map((d,i)=>{const full=ad[sel]||[];const idx=full.findIndex(f=>f.date===d.date);const pv=idx>0?full[idx-1]:null;const ya=full[idx-12]||null;const mm=pv?d.value-pv.value:null;const mp=pv?((d.value-pv.value)/pv.value*100):null;const yy=ya?((d.value-ya.value)/ya.value*100):null;
      return(<tr key={d.date} style={{borderBottom:"1px solid rgba(255,255,255,.03)",background:i%2===0?"transparent":"rgba(255,255,255,.01)"}}>
        <td style={{padding:"4px 6px",textAlign:"right",color:"#888"}}>{d.date}</td>
        <td style={{padding:"4px 6px",textAlign:"right",color:inf.color,fontWeight:700}}>{d.value.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
        <td style={{padding:"4px 6px",textAlign:"right",color:mm!=null?(mm>=0?"#7ED321":"#E8453C"):"#444"}}>{mm!=null?(mm>=0?"+":"")+mm.toLocaleString(undefined,{maximumFractionDigits:1}):"—"}</td>
        <td style={{padding:"4px 6px",textAlign:"right",color:mp!=null?(mp>=0?"#7ED321":"#E8453C"):"#444"}}>{mp!=null?(mp>=0?"+":"")+mp.toFixed(2)+"%":"—"}</td>
        <td style={{padding:"4px 6px",textAlign:"right",color:yy!=null?(yy>=0?"#7ED321":"#E8453C"):"#444"}}>{yy!=null?(yy>=0?"+":"")+yy.toFixed(2)+"%":"—"}</td>
      </tr>);})}
    </tbody></table>
  </div>)}

  {/* CALENDAR */}
  <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:14,padding:"12px 14px",marginBottom:10}}>
    <h3 style={{fontSize:13,fontWeight:700,margin:"0 0 8px",color:"#ccc"}}>📅 経済カレンダー</h3>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:5}}>
      {evts.map((ev,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:ev.days<=3?"rgba(232,69,60,.08)":ev.days<=7?"rgba(245,166,35,.06)":"rgba(255,255,255,.01)",borderRadius:7,borderLeft:"3px solid "+ev.color}}>
        <div style={{minWidth:35,textAlign:"center"}}><p style={{color:ev.days<=3?"#E8453C":ev.days<=7?"#F5A623":"#888",fontSize:14,fontWeight:800,margin:0,fontFamily:"monospace"}}>{ev.days<=0?"NOW":ev.days+"d"}</p></div>
        <div style={{flex:1}}><p style={{color:"#ccc",fontSize:11,fontWeight:600,margin:0}}>{ev.name}</p><p style={{color:"#555",fontSize:8,margin:"1px 0 0",fontFamily:"monospace"}}>{ev.date}</p></div>
        <span style={{padding:"1px 5px",borderRadius:3,fontSize:8,fontWeight:700,fontFamily:"monospace",background:ev.imp==="高"?"#E8453C18":"#F5A62318",color:ev.imp==="高"?"#E8453C":"#F5A623"}}>{ev.imp}</span>
      </div>))}
    </div>
  </div>

  {/* NEWS */}
  <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:14,padding:"12px 14px",marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <h3 style={{fontSize:13,fontWeight:700,margin:0,color:"#ccc"}}>📰 経済ニュース
        <span style={{color:"#444",fontSize:9,fontWeight:400,fontFamily:"monospace",marginLeft:8}}>10分ごとに自動更新</span>
      </h3>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {newsUpdated&&<span style={{color:"#444",fontSize:8,fontFamily:"monospace"}}>{newsUpdated.toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})} 更新</span>}
        <button onClick={fetchAllNews} disabled={newsLoading} style={{background:"transparent",border:"1px solid rgba(255,255,255,.08)",borderRadius:5,padding:"3px 8px",color:newsLoading?"#444":"#888",fontSize:9,cursor:"pointer",fontFamily:"monospace"}}>{newsLoading?"読込中…":"↻ 更新"}</button>
      </div>
    </div>
    {newsItems.length===0&&!newsLoading&&<p style={{color:"#444",fontSize:10,fontFamily:"monospace",margin:0}}>ニュースを読み込み中... (CORS プロキシ経由)</p>}
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {newsItems.map((item,i)=>(
        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 10px",background:"rgba(255,255,255,.015)",borderRadius:8,borderLeft:"3px solid "+item.sourceColor}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
              <span style={{background:item.sourceColor+"20",color:item.sourceColor,fontSize:10,fontWeight:700,fontFamily:"monospace",padding:"1px 5px",borderRadius:3,whiteSpace:"nowrap"}}>{item.source}</span>
              {item.pubDate&&<span style={{color:"#444",fontSize:10,fontFamily:"monospace",whiteSpace:"nowrap"}}>{(()=>{try{const d=new Date(item.pubDate);return d.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return '';}})()}</span>}
            </div>
            <a href={item.link||'#'} target="_blank" rel="noopener noreferrer" style={{color:"#ccc",fontSize:14,fontWeight:500,textDecoration:"none",lineHeight:1.5,display:"block"}}
              onMouseEnter={e=>e.target.style.color='#e8e8e8'} onMouseLeave={e=>e.target.style.color='#ccc'}>
              {item.title}
            </a>
          </div>
          <button onClick={()=>window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(item.title+(item.link?' '+item.link:'')),'_blank')}
            style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:5,padding:"4px 7px",color:"#888",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,fontFamily:"monospace"}}>
            𝕏 ポスト
          </button>
        </div>
      ))}
    </div>
  </div>

  {/* TWEETS */}
  {tweets.length>0&&(<div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",borderRadius:14,padding:"12px 14px",marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <h3 style={{fontSize:13,fontWeight:700,margin:0,color:"#ccc"}}>📢 マーケットツイート</h3>
      <span style={{color:"#555",fontSize:9,fontFamily:"monospace"}}>クリックして編集 · そのままポスト</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:8}}>
      {tweets.map((tweet,i)=>{
        const val=tweetEdits[i]??tweet;
        const isEdited=tweetEdits[i]!==undefined&&tweetEdits[i]!==tweet;
        const over=val.length>140;
        return(
          <div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid "+(over?"#E8453C40":"rgba(255,255,255,.07)"),borderRadius:10,padding:"12px",display:"flex",flexDirection:"column",gap:8}}>
            <textarea value={val} onChange={e=>setTweetEdits(p=>({...p,[i]:e.target.value}))} rows={5} style={{color:"#ccc",fontSize:11,lineHeight:1.7,margin:0,background:"transparent",border:"none",outline:"none",resize:"none",width:"100%",fontFamily:"inherit",flex:1}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{color:over?"#E8453C":"#444",fontSize:9,fontFamily:"monospace"}}>{val.length}/140文字</span>
                {isEdited&&<button onClick={()=>setTweetEdits(p=>{const n={...p};delete n[i];return n;})} style={{background:"transparent",border:"none",color:"#555",fontSize:9,cursor:"pointer",fontFamily:"monospace",padding:0}}>↺ リセット</button>}
              </div>
              <button onClick={()=>!over&&window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(val)}`,'_blank','width=550,height=420,noopener')} style={{background:"#000",border:"1px solid rgba(255,255,255,.2)",borderRadius:6,padding:"5px 14px",color:over?"#555":"#fff",fontSize:11,fontWeight:700,cursor:over?"default":"pointer",fontFamily:"monospace",letterSpacing:".03em",opacity:over?.5:1}}>𝕏 ポスト</button>
            </div>
          </div>
        );
      })}
    </div>
  </div>)}

  <footer style={{borderTop:"1px solid rgba(255,255,255,.04)",paddingTop:10,display:"flex",justifyContent:"space-between",color:"#333",fontSize:8,fontFamily:"monospace",flexWrap:"wrap",gap:4,paddingBottom:"env(safe-area-inset-bottom,12px)"}}>
    <span>FRED | Federal Reserve Bank of St. Louis {demo&&"(DEMO)"}</span>
    <span>※ 投資判断は自己責任</span>
  </footer>

  </div>
  </div>);
}
