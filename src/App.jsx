import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { Moon, Sun, Newspaper, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Lightbulb } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(true);
const [activeTab, setActiveTab] = useState('analysis');

const [silverEtfChange, setSilverEtfChange] = useState('0%');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showGoldHint, setShowGoldHint] = useState(false);
  const [showCopperHint, setShowCopperHint] = useState(false);
  const [showStocksGuide, setShowStocksGuide] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showInvestGuide, setShowInvestGuide] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showTestHistory, setShowTestHistory] = useState(false);
  const [showUserTest, setShowUserTest] = useState(true);
  
  const [testSettings, setTestSettings] = useState({
    dollarIndex: { enabled: true, score: 10 },
    goldSilverRatio: { enabled: true, score: 15 },
    rsi: { enabled: true, score: 15 },
    macd: { enabled: true, score: 15 },
    industrialDemand: { enabled: true, score: 15 }
  });
  const [testHistory, setTestHistory] = useState([]);
  
  const [silverMainChartPeriod, setSilverMainChartPeriod] = useState('1m');
  const [copperRefChartPeriod, setCopperRefChartPeriod] = useState('1y');
  const [goldChartPeriod, setGoldChartPeriod] = useState('1y');
  const [silverChartExpanded, setSilverChartExpanded] = useState(false);
  
  // ★ 모든 데이터에 Change(등락율) 포함
  const [currentData, setCurrentData] = useState({
    copperPrice: 0, copperChange: 0,
    dollarIndex: 0,
    prevClose: 0, todayOpen: 0, todayHigh: 0, todayLow: 0, 
    week52High: 0, week52Low: 0, yearChangePercent: 0,
    goldPrice: 0, goldChange: 0,
    silverPrice: 0, silverChange: 0,
    sp500: 0, sp500Change: 0,
    nasdaq: 0, nasdaqChange: 0,
    dow: 0, dowChange: 0,
    kospi: 0, kospiChange: 0,
    kosdaq: 0, kosdaqChange: 0,
    nq100Futures: 0, nq100Change: 0
  });

  const [manualInputs, setManualInputs] = useState({
    goldSilverRatio: 80,
    rsi: 38.4,
    macd: '전환',
    industrialDemand: 2.1
  });

  const [fullData, setFullData] = useState([]);
  const [copperData, setCopperData] = useState([]);
  const [goldData, setGoldData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  
  const krStocks = [
    { type: 'ETF', name: 'KODEX 은선물(H)', code: '144600', url: 'https://finance.naver.com/item/main.naver?code=144600' },


    { type: 'ETF', name: 'TIGER 골드선물(H)', code: '319640', url: 'https://finance.naver.com/item/main.nhn?code=319640' },
    { type: '해외ETF', name: 'SLV - iShares Silver Trust', code: 'SLV', url: 'https://finance.yahoo.com/quote/SLV/' },
    { type: '해외ETF', name: 'SIVR - abrdn Physical Silver', code: 'SIVR', url: 'https://finance.yahoo.com/quote/SIVR/' },
    { type: '해외주식', name: 'PAAS - Pan American Silver', code: 'PAAS', url: 'https://finance.yahoo.com/quote/PAAS/' }
  ];

  // ★ 등락율 계산 함수 (핵심!)
  const calcChange = (current, prev) => {
    if (!prev || prev === 0 || !current) return 0;
    return ((current - prev) / prev) * 100;
  };

  const getDollarScore = (value) => {
    if (value <= 97) return 20;
    if (value <= 98) return 15;
    if (value <= 100) return 10;
    return 5;
  };

  // 금은비 (Gold/Silver Ratio) - 비율이 높을수록 은이 저평가 = 매수 기회
  const getGoldSilverRatioScore = (value) => {
    if (value >= 90) return 20;
    if (value >= 80) return 15;
    if (value >= 70) return 10;
    return 5;
  };

  const getRsiScore = (value) => {
    if (value <= 30) return 20;
    if (value <= 45) return 15;
    if (value <= 60) return 10;
    return 5;
  };

  const getMacdScore = (value) => {
    if (value === '강세') return 20;
    if (value === '전환') return 15;
    if (value === '보합') return 10;
    return 5;
  };

  // 산업수요 증가율 (%) - 은의 산업수요(태양광, 전자 등)
  const getIndustrialDemandScore = (value) => {
    if (value >= 5) return 20;
    if (value >= 2) return 15;
    if (value >= 0) return 10;
    return 5;
  };

  const calculateScore = () => {
    const scores = {
      dollarIndex: getDollarScore(parseFloat(currentData.dollarIndex) || 99),
      goldSilverRatio: getGoldSilverRatioScore(manualInputs.goldSilverRatio),
      rsi: getRsiScore(manualInputs.rsi),
      macd: getMacdScore(manualInputs.macd),
      industrialDemand: getIndustrialDemandScore(manualInputs.industrialDemand)
    };
    const total = scores.dollarIndex + scores.goldSilverRatio + scores.rsi + scores.macd + scores.industrialDemand;
    return { score: total, maxScore: 100, scores };
  };

  const scoreData = calculateScore();

  const generateReport = () => {
    const total = scoreData.score;
    let title = total >= 70 ? "[심리 개선] 은, 펀더멘탈 회복세 뚜렷" 
              : total >= 50 ? "[중립] 수급 팽팽, 방향성 탐색 구간" 
              : "[경고] 수요 위축 및 기술적 하방 압력";
    
    let analysis = `현재 종합 지수는 ${total}점으로 `;
    
    if (total >= 70) {
      analysis += `시장 참여자들의 심리가 개선되고 있습니다. `;
    } else if (total >= 50) {
      analysis += `중립적인 시장 상황이 지속되고 있습니다. `;
    } else {
      analysis += `하방 압력이 존재하는 상황입니다. `;
    }

    if (manualInputs.goldSilverRatio >= 80) {
      analysis += `금은비가 ${manualInputs.goldSilverRatio}으로 은이 금 대비 저평가 구간에 있어 매수 매력이 높습니다. `;
    }

    const dollarVal = parseFloat(currentData.dollarIndex) || 99;
    if (dollarVal <= 100) {
      analysis += `달러 지수(${dollarVal})의 안정세는 귀금속 전반의 매수세를 유입시키는 핵심 동력으로 작용하고 있으며,기타여건과 병합해서 판단할 시기입니다. `;
    }

    if (manualInputs.industrialDemand >= 2) {
      analysis += `은의 산업수요 증가율(${manualInputs.industrialDemand}%)이 양호하여 태양광·전자산업 등의 실물 수요 뒷받침 가능성을 시사합니다.`;
    }

    return { title, analysis };
  };

  const report = generateReport();

  const calculateTestScore = () => {
    let total = 0;
    let maxScore = 0;
    let enabledCount = 0;
    
    Object.values(testSettings).forEach(setting => {
      if (setting.enabled) {
        total += setting.score;
        maxScore += 20;
        enabledCount++;
      }
    });
    
    const percentage = maxScore > 0 ? Math.round((total / maxScore) * 100) : 0;
    return { score: total, maxScore, percentage, enabledCount };
  };

  const testScoreData = calculateTestScore();

  const saveTestToHistory = () => {
    const today = new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    const newEntry = { 
      date: today, 
      score: testScoreData.score, 
      maxScore: testScoreData.maxScore,
      percentage: testScoreData.percentage,
      items: testScoreData.enabledCount
    };
    
    const saved = localStorage.getItem('silverTestHistory');
    let history = saved ? JSON.parse(saved) : [];
    
    const existingIndex = history.findIndex(h => h.date === today);
    if (existingIndex >= 0) history[existingIndex] = newEntry;
    else history.unshift(newEntry);
    
    history = history.slice(0, 7);
    localStorage.setItem('silverTestHistory', JSON.stringify(history));
    setTestHistory(history);
    
    setToastMessage('테스트 결과가 저장되었습니다');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const saveToHistory = (price, etfVal) => {
    const today = new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });

    const silverPriceVal = price || currentData.silverPrice;
    const etfChangeVal = etfVal || silverEtfChange;
    const newEntry = { date: today, score: scoreData.score, price: silverPriceVal, etf: etfChangeVal };
    
    const saved = localStorage.getItem('silverHistory');
    let history = saved ? JSON.parse(saved) : [];
    
    const existingIndex = history.findIndex(h => h.date === today);
    if (existingIndex >= 0) history[existingIndex] = newEntry;
    else history.unshift(newEntry);
    
    history = history.slice(0, 10);
    localStorage.setItem('silverHistory', JSON.stringify(history));
    setSignalHistory(history);
    
    setToastMessage('오늘 데이터가 저장되었습니다');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  useEffect(() => {
    const savedManual = localStorage.getItem('silverManualInputs');
    if (savedManual) {
      try { setManualInputs(JSON.parse(savedManual)); } catch (e) {}
    }
    const historyData = localStorage.getItem('silverHistory');
    if (historyData) setSignalHistory(JSON.parse(historyData));
    
    const testHistoryData = localStorage.getItem('silverTestHistory');
    if (testHistoryData) setTestHistory(JSON.parse(testHistoryData));
    
    const savedTestSettings = localStorage.getItem('silverTestSettings');
    if (savedTestSettings) {
      try { 
        const parsed = JSON.parse(savedTestSettings);
        // 이전 구리앱 키(pmi, inventory)가 남아있으면 무시하고 기본값 사용
        if (parsed.goldSilverRatio && parsed.industrialDemand) {
          setTestSettings(parsed);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('silverManualInputs', JSON.stringify(manualInputs));
  }, [manualInputs]);

  useEffect(() => {
    localStorage.setItem('silverTestSettings', JSON.stringify(testSettings));
  }, [testSettings]);

  // ★ 페이지 로드시 자동 데이터 불러오기
  useEffect(() => { 
    refreshData(); 
    
    // ★ 5분마다 자동 갱신 (선택사항 - 원하시면 주석 해제)
    // const interval = setInterval(refreshData, 5 * 60 * 1000);
    // return () => clearInterval(interval);
  }, []);

  // ★★★ 핵심: 데이터 불러오기 함수 (등락율 자동 계산) ★★★
  const refreshData = async () => {
    setIsLoading(true);
    try {
//*



// KODEX 은선물 데이터
try {
  const etfRes = await fetch('https://script.google.com/macros/s/AKfycby6o1lw_Un6lU67BmOL90dKiLclr0ZxtTk6pFGG-RLynYUa1F0M1wHK219PadIXgqJt/exec?url=' + encodeURIComponent('https://finance.naver.com/item/main.nhn?code=144600'));
  const etfHtml = await etfRes.text();
  
  // 여러 패턴으로 등락율 추출 시도
  const etfPatterns = [
    /등락률[^>]*>([^<]+)/,
    /class="rate[^"]*"[^>]*>([+-]?[\d.]+%)/,
    /변동[^>]*>([+-]?[\d.]+%)/,
    /([+-]\d{1,2}\.\d{1,2}%)/
  ];
  
  let etfChangeVal = '0%';
  for (const pattern of etfPatterns) {
    const match = etfHtml.match(pattern);
    if (match && match[1]) {
      const val = match[1].trim();
      // 등락율은 보통 ±20% 이내이므로 비정상적인 값 필터링
      const numVal = parseFloat(val);
      if (!isNaN(numVal) && Math.abs(numVal) <= 20) {
        etfChangeVal = val;
        console.log('ETF 매칭 패턴:', pattern, '값:', val);
        break;
      }
    }
  }
  
  console.log('KODEX 은선물 등락율:', etfChangeVal);
  setSilverEtfChange(etfChangeVal);
} catch (e) {
  console.log('은 ETF 에러:', e);
}


      const proxyUrl = 'https://m2-copper.vercel.app/api/proxy?url=';
      
      // 모든 API 동시 호출
      const [copperRes, dollarRes, goldRes, silverRes, sp500Res, nasdaqRes, dowRes, kospiRes, kosdaqRes, nq100Res] = await Promise.all([
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/HG=F?interval=1d&range=10y')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=10y')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=10y')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=10y')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=5d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=5d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EDJI?interval=1d&range=5d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?interval=1d&range=5d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EKQ11?interval=1d&range=5d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1d&range=5d'))
      ]);
      
      // JSON 파싱
      const copperDataJson = await copperRes.json();
      const dollarData = await dollarRes.json();
      const goldDataJson = await goldRes.json();
      const silverDataJson = await silverRes.json();
      const sp500Data = await sp500Res.json();
      const nasdaqData = await nasdaqRes.json();
      const dowData = await dowRes.json();
      const kospiData = await kospiRes.json();
      const kosdaqData = await kosdaqRes.json();
      const nq100Data = await nq100Res.json();
      
      // ★ 구리 데이터 + 등락율 (참고용)
      const copperMeta = copperDataJson?.chart?.result?.[0]?.meta || {};
      const copperPrice = copperMeta.regularMarketPrice || 0;
      const copperPrevClose = copperMeta.chartPreviousClose || copperMeta.previousClose || 0;
      const copperChange = calcChange(copperPrice, copperPrevClose);
      
      // ★ 달러 인덱스
      const dollarIndex = dollarData?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
     
// ★ 금 데이터 + 등락율
const goldMeta = goldDataJson?.chart?.result?.[0]?.meta || {};
const goldPrice = goldMeta.regularMarketPrice || 0;
const goldPrevClose = goldMeta.previousClose || goldMeta.chartPreviousClose || goldPrice;
const goldChange = calcChange(goldPrice, goldPrevClose);

      // ★ 은 데이터 + 등락율
      const silverMeta = silverDataJson?.chart?.result?.[0]?.meta || {};
      const silverPrice = silverMeta.regularMarketPrice || 0;
      const silverPrevClose = silverMeta.chartPreviousClose || silverMeta.previousClose || 0;
      const silverChange = calcChange(silverPrice, silverPrevClose);
      
      // ★ S&P 500 + 등락율
      const sp500Meta = sp500Data?.chart?.result?.[0]?.meta || {};
      const sp500 = sp500Meta.regularMarketPrice || 0;
      const sp500PrevClose = sp500Meta.chartPreviousClose || sp500Meta.previousClose || 0;
      const sp500Change = calcChange(sp500, sp500PrevClose);
      
      // ★ 나스닥 + 등락율
      const nasdaqMeta = nasdaqData?.chart?.result?.[0]?.meta || {};
      const nasdaq = nasdaqMeta.regularMarketPrice || 0;
      const nasdaqPrevClose = nasdaqMeta.chartPreviousClose || nasdaqMeta.previousClose || 0;
      const nasdaqChange = calcChange(nasdaq, nasdaqPrevClose);
      
      // ★ 다우존스 + 등락율
      const dowMeta = dowData?.chart?.result?.[0]?.meta || {};
      const dow = dowMeta.regularMarketPrice || 0;
      const dowPrevClose = dowMeta.chartPreviousClose || dowMeta.previousClose || 0;
      const dowChange = calcChange(dow, dowPrevClose);
      
      // ★ 코스피 + 등락율
      const kospiMeta = kospiData?.chart?.result?.[0]?.meta || {};
      const kospi = kospiMeta.regularMarketPrice || 0;
      const kospiPrevClose = kospiMeta.chartPreviousClose || kospiMeta.previousClose || 0;
      const kospiChange = calcChange(kospi, kospiPrevClose);
      
      // ★ 코스닥 + 등락율
      const kosdaqMeta = kosdaqData?.chart?.result?.[0]?.meta || {};
      const kosdaq = kosdaqMeta.regularMarketPrice || 0;
      const kosdaqPrevClose = kosdaqMeta.chartPreviousClose || kosdaqMeta.previousClose || 0;
      const kosdaqChange = calcChange(kosdaq, kosdaqPrevClose);
      
      // ★ 나스닥100 선물 + 등락율
      const nq100Meta = nq100Data?.chart?.result?.[0]?.meta || {};
      const nq100Futures = nq100Meta.regularMarketPrice || 0;
      const nq100PrevClose = nq100Meta.chartPreviousClose || nq100Meta.previousClose || 0;
      const nq100Change = calcChange(nq100Futures, nq100PrevClose);
      
      // 은 메인 + 구리/금 참고 차트 데이터
      const silverQuote = silverDataJson?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
      const silverTimestamps = silverDataJson?.chart?.result?.[0]?.timestamp || [];
      const silverCloses = silverQuote.close || [];
      const silverHighs = silverQuote.high || [];
      const silverLows = silverQuote.low || [];
      const silverOpens = silverQuote.open || [];
      const silverVolumes = silverQuote.volume || [];
      
      const goldQuote = goldDataJson?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
      const goldTimestamps = goldDataJson?.chart?.result?.[0]?.timestamp || [];
      const goldCloses = goldQuote.close || [];
      
      const copperQuote = copperDataJson?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
      const copperTimestamps = copperDataJson?.chart?.result?.[0]?.timestamp || [];
      const copperCloses = copperQuote.close || [];

      // 52주 고저, 1년 변동율 계산 (은 기준)
      const validSilverCloses = silverCloses.filter(c => c !== null && c !== undefined);
      const yearCloses = validSilverCloses.slice(-252);
      const week52High = yearCloses.length > 0 ? Math.max(...yearCloses).toFixed(2) : 0;
      const week52Low = yearCloses.length > 0 ? Math.min(...yearCloses).toFixed(2) : 0;
      const yearAgoPrice = yearCloses.length > 0 ? yearCloses[0] : silverPrice;
      const yearChangePercent = yearAgoPrice ? ((silverPrice - yearAgoPrice) / yearAgoPrice * 100).toFixed(1) : 0;

      const lastIndex = validSilverCloses.length - 1;
      const prevClose = lastIndex >= 1 ? validSilverCloses[lastIndex - 1] : silverPrice;
      const todayOpen = silverOpens[silverOpens.length - 1] || prevClose;
      const todayHigh = silverHighs[silverHighs.length - 1] || silverPrice;
      const todayLow = silverLows[silverLows.length - 1] || silverPrice;

      // ★★★ 최종 데이터 객체 (모든 등락율 포함) ★★★
      const newData = {
        copperPrice: Number(copperPrice).toFixed(2),
        copperChange: Number(copperChange).toFixed(2),
        dollarIndex: Number(dollarIndex).toFixed(1),
        goldPrice: Number(goldPrice).toFixed(2),
        goldChange: Number(goldChange).toFixed(2),
        silverPrice: Number(silverPrice).toFixed(2),
        silverChange: Number(silverChange).toFixed(2),
        prevClose: Number(prevClose).toFixed(2),
        todayOpen: Number(todayOpen).toFixed(2),
        todayHigh: Number(todayHigh).toFixed(2),
        todayLow: Number(todayLow).toFixed(2),
        week52High, 
        week52Low, 
        yearChangePercent,
        sp500: Number(sp500).toFixed(2),
        sp500Change: Number(sp500Change).toFixed(2),
        nasdaq: Number(nasdaq).toFixed(2),
        nasdaqChange: Number(nasdaqChange).toFixed(2),
        dow: Number(dow).toFixed(2),
        dowChange: Number(dowChange).toFixed(2),
        kospi: Number(kospi).toFixed(2),
        kospiChange: Number(kospiChange).toFixed(2),
        kosdaq: Number(kosdaq).toFixed(2),
        kosdaqChange: Number(kosdaqChange).toFixed(2),
        nq100Futures: Number(nq100Futures).toFixed(2),
        nq100Change: Number(nq100Change).toFixed(2)
      };

      setCurrentData(newData);
      
      // 차트 데이터 생성 (은이 메인)
      const chartData = silverTimestamps.map((ts, i) => {
        const date = new Date(ts * 1000);
        return { 
          date: `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`,
          silver: silverCloses[i] ? Number(silverCloses[i]).toFixed(2) : null, 
          volume: silverVolumes[i] || 0 
        };
      }).filter(d => d.silver !== null);

      const calcMA = (data, period) => {
        return data.map((item, idx) => {
          if (idx < period - 1) return { ...item, ['ma' + period]: null };
          const avg = data.slice(idx - period + 1, idx + 1).reduce((sum, d) => sum + parseFloat(d.silver || 0), 0) / period;
          return { ...item, ['ma' + period]: avg.toFixed(2) };
        });
      };

      let enrichedData = calcMA(calcMA(calcMA(calcMA(chartData, 5), 20), 60), 120);
      setFullData(enrichedData);

      const copperChartData = copperTimestamps.map((ts, i) => {
        const date = new Date(ts * 1000);
        return { 
          date: `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`,
          copper: copperCloses[i] ? Number(copperCloses[i]).toFixed(2) : null 
        };
      }).filter(d => d.copper !== null);
      setCopperData(copperChartData);

      const goldChartData = goldTimestamps.map((ts, i) => {
        const date = new Date(ts * 1000);
        return { 
          date: `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`,
          gold: goldCloses[i] ? Number(goldCloses[i]).toFixed(2) : null 
        };
      }).filter(d => d.gold !== null);
      setGoldData(goldChartData);

      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      saveToHistory(Number(silverPrice).toFixed(2));
      
      setToastMessage('데이터 동기화 완료!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      setToastMessage('데이터 로딩 실패 - 다시 시도해주세요');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
    setIsLoading(false);
  };

  const getFilteredData = (period, data = fullData) => {
    if (data.length === 0) return [];
    const days = { '1w': 7, '1m': 30, '6m': 180, '1y': 365, '10y': 3650 }[period] || 365;
    return data.slice(-days);
  };

  const getTabStyle = (isActive) => ({ 
    padding: '8px 12px', fontSize: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', 
    backgroundColor: isActive ? '#3b82f6' : (darkMode ? '#334155' : '#e5e7eb'), 
    color: isActive ? 'white' : (darkMode ? '#94a3b8' : '#6b7280'), fontWeight: isActive ? '600' : '400' 
  });

  const getPeriodLabel = (p) => ({ '1w': '1주', '1m': '1개월', '6m': '6개월', '1y': '1년', '10y': '10년' }[p] || '1년');

  const colors = {
    silverBg: darkMode ? 'linear-gradient(135deg, #1e293b 0%, #374151 100%)' : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    silverBorder: darkMode ? '#94a3b8' : '#9ca3af',
    goldBg: darkMode ? 'linear-gradient(135deg, #713f12 0%, #854d0e 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    goldBorder: darkMode ? '#fbbf24' : '#f59e0b',
    marketBg: darkMode ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    marketBorder: darkMode ? '#3b82f6' : '#60a5fa'
  };

  // ★ 등락율 표시 컴포넌트 (재사용)
  const ChangeRate = ({ value }) => {
    const num = parseFloat(value) || 0;
    const isUp = num >= 0;
    return (
      <div style={{ 
        fontSize: '11px', 
        color: isUp ? '#22c55e' : '#ef4444', 
        fontWeight: '600' 
      }}>
        {isUp ? '▲' : '▼'} {Math.abs(num).toFixed(2)}%
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? 'linear-gradient(to bottom, #0f172a, #1e293b)' : '#f8fafc', padding: '16px' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {showToast && <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#22c55e', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 1000 }}>✓ {toastMessage}</div>}
        
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>

{/* 탭 메뉴 */}


{/* 탭 메뉴 */}
<div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
  <button onClick={() => setActiveTab('analysis')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'analysis' ? '#3b82f6' : (darkMode ? 'rgba(51,65,85,0.7)' : 'rgba(229,231,235,0.7)'), color: activeTab === 'analysis' ? 'white' : (darkMode ? '#94a3b8' : '#64748b'), fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(8px)' }}>📊 분석</button>
  <button onClick={() => setActiveTab('info')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'info' ? '#3b82f6' : (darkMode ? 'rgba(51,65,85,0.7)' : 'rgba(229,231,235,0.7)'), color: activeTab === 'info' ? 'white' : (darkMode ? '#94a3b8' : '#64748b'), fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(8px)' }}>📚 은정보</button>
  <button onClick={() => setActiveTab('news')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'news' ? '#3b82f6' : (darkMode ? 'rgba(51,65,85,0.7)' : 'rgba(229,231,235,0.7)'), color: activeTab === 'news' ? 'white' : (darkMode ? '#94a3b8' : '#64748b'), fontSize: '13px', fontWeight: '600', backdropFilter: 'blur(8px)' }}>📰 뉴스</button>
</div>

            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827', marginBottom: '4px' }}>🥈 은 매수 시점 분석</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? 'white' : '#111827' }}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
              <button onClick={refreshData} style={{ padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? 'white' : '#111827', opacity: isLoading ? 0.6 : 1 }} disabled={isLoading}><RefreshCw size={18} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} /></button>
            </div>
            <p style={{ color: darkMode ? '#94a3b8' : '#6b7280', fontSize: '11px', margin: 0 }}>{lastUpdated ? `마지막 동기화: ${lastUpdated}` : '로딩 중...'}</p>
          </div>
        </div>

{activeTab === 'analysis' && (
<>
        {/* 섹션 1: 은 현재 현황 */}
        <div style={{ background: colors.silverBg, border: `2px solid ${colors.silverBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>🔶</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#374151' }}>은 현재 현황</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#d1d5db' : '#6b7280' }}>실시간 가격 정보</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: darkMode ? '#d1d5db' : '#6b7280' }}>현재 은 가격</div>
              <a href="https://finance.yahoo.com/quote/SI=F/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: darkMode ? '#9ca3af' : '#0284c7' }}>${currentData.silverPrice}</div>
              </a>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: parseFloat(currentData.yearChangePercent) >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                {parseFloat(currentData.yearChangePercent) >= 0 ? '▲' : '▼'} {currentData.yearChangePercent}%
              </div>
              <div style={{ fontSize: '11px', color: darkMode ? '#d1d5db' : '#6b7280' }}>1년 변동</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: darkMode ? '#d1d5db' : '#6b7280' }}>전일종가</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#374151' }}>${currentData.prevClose}</div>
            </div>
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: darkMode ? '#d1d5db' : '#6b7280' }}>금일시가</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#374151' }}>${currentData.todayOpen}</div>
            </div>
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: darkMode ? '#d1d5db' : '#6b7280' }}>금일 고/저</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#374151' }}>${currentData.todayLow}~${currentData.todayHigh}</div>
            </div>
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: darkMode ? '#d1d5db' : '#6b7280' }}>52주 범위</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#374151' }}>${currentData.week52Low}~${currentData.week52High}</div>
            </div>
          </div>
        </div>

        {/* ★★★ 섹션 2: 오늘의 시황 (등락율 전부 표시) ★★★ */}
        <div style={{ background: colors.marketBg, border: `2px solid ${colors.marketBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#1e3a8a' }}>오늘의 시황 & 주요 지표</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#93c5fd' : '#1e40af' }}>실시간 시장 동향 (자동 동기화)</p>
            </div>
          </div>

          {/* 미국장 */}
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#93c5fd' : '#1e40af', marginBottom: '10px' }}>🇺🇸 미국장</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>S&P 500</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.sp500}</div>
                <ChangeRate value={currentData.sp500Change} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>나스닥</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.nasdaq}</div>
                <ChangeRate value={currentData.nasdaqChange} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>다우존스</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.dow}</div>
                <ChangeRate value={currentData.dowChange} />
              </div>
            </div>
          </div>

          {/* 한국장 */}
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#93c5fd' : '#1e40af', marginBottom: '10px' }}>🇰🇷 한국장</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>코스피</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.kospi}</div>
                <ChangeRate value={currentData.kospiChange} />
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>코스닥</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.kosdaq}</div>
                <ChangeRate value={currentData.kosdaqChange} />
              </div>
            </div>
          </div>

          {/* ★★★ 선물 - 금/은/구리 등락율 추가! ★★★ */}
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#93c5fd' : '#1e40af', marginBottom: '10px' }}>📈 선물</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {/* 나스닥100 선물 */}
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>나스닥100 선물</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.nq100Futures}</div>
                <ChangeRate value={currentData.nq100Change} />
              </div>
              {/* 금 선물 */}
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>금 선물</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>${currentData.goldPrice}</div>
                

<ChangeRate value={currentData.goldChange / 100} />
              </div>
              {/* 은 선물 */}
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>은 선물</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>${currentData.silverPrice}</div>
                <ChangeRate value={currentData.silverChange / 100} />
              </div>
              {/* 구리 선물 */}
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>구리 선물</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>${currentData.copperPrice}</div>
               <ChangeRate value={currentData.copperChange / 100} />
              </div>
            </div>
          </div>

          {/* ISM 제조업 지표 */}
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#93c5fd' : '#1e40af' }}>🏭 미국 ISM 제조업 지수</div>
                <div style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>(50 이상: 확장 / 이하: 위축)</div>
              </div>
              <a href="https://kr.investing.com/economic-calendar/ism-manufacturing-pmi-173" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
            </div>
          </div>
        </div>

        {/* 구리 차트 섹션 -> 은 차트 섹션 */}
        <div style={{ background: colors.silverBg, border: `2px solid ${colors.silverBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>📈</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#374151' }}>은 차트 분석</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#d1d5db' : '#6b7280' }}>기술적 지표 및 추세</p>
            </div>
          </div>

          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? 'white' : '#374151' }}>📈 은 차트 (이평선)</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <a href="https://kr.investing.com/commodities/silver-streaming-chart" target="_blank" rel="noopener noreferrer" style={{ padding: '4px 8px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '6px', fontSize: '10px', fontWeight: '700', textDecoration: 'none' }}>인베스팅</a>
                <a href="https://www.tradingview.com/symbols/COMEX-SI1!/" target="_blank" rel="noopener noreferrer" style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '10px', fontWeight: '700', textDecoration: 'none' }}>트레이딩뷰</a>
                <span onClick={() => setSilverChartExpanded(!silverChartExpanded)} style={{ fontSize: '11px', color: '#3b82f6', cursor: 'pointer', marginLeft: '4px' }}>{silverChartExpanded ? '축소' : '확대'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['1w', '1m', '6m', '1y', '10y'].map(p => (
                <button key={p} onClick={() => setSilverMainChartPeriod(p)} style={getTabStyle(silverMainChartPeriod === p)}>{getPeriodLabel(p)}</button>
              ))}
            </div>
            <div style={{ fontSize: '10px', color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px' }}>━ 가격</span>
              <span style={{ color: '#f97316', marginRight: '8px' }}>━ 5일</span>
              <span style={{ color: '#22c55e', marginRight: '8px' }}>━ 20일</span>
              <span style={{ color: '#a855f7', marginRight: '8px' }}>━ 60일</span>
              <span style={{ color: '#ef4444' }}>━ 120일</span>
            </div>
            <ResponsiveContainer width="100%" height={silverChartExpanded ? 300 : 180}>
              <ComposedChart data={getFilteredData(silverMainChartPeriod)}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 9 }} />
                <YAxis yAxisId="price" stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <YAxis yAxisId="volume" orientation="right" hide />
                <Tooltip />
                <Bar yAxisId="volume" dataKey="volume" fill={darkMode ? '#334155' : '#e2e8f0'} opacity={0.3} />
                <Line yAxisId="price" type="monotone" dataKey="copper" stroke="#94a3b8" strokeWidth={2} dot={false} name="은" />
                <Line yAxisId="price" type="monotone" dataKey="ma5" stroke="#f97316" strokeWidth={1} dot={false} name="MA5" />
                <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#22c55e" strokeWidth={1} dot={false} name="MA20" />
                <Line yAxisId="price" type="monotone" dataKey="ma60" stroke="#a855f7" strokeWidth={1} dot={false} name="MA60" />
                <Line yAxisId="price" type="monotone" dataKey="ma120" stroke="#ef4444" strokeWidth={1} dot={false} name="MA120" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '6px', textAlign: 'right' }}>출처: Yahoo Finance (SI=F)</div>
          </div>

          {/* SILVER INDEX 종합 점수 */}
          <div style={{ backgroundColor: darkMode ? '#000' : '#fff', borderRadius: '16px', overflow: 'hidden', border: '3px solid #000', marginBottom: '16px' }}>
            <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>SILVER INDEX</h3>
                <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '800' }}>MARKET ANALYSIS</div>
              </div>
              <div style={{ width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '26px', border: '3px solid #000' }}>{scoreData.score}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: darkMode ? '#1e293b' : '#fff' }}>
              <thead>
                <tr style={{ backgroundColor: darkMode ? '#334155' : '#f8f9fa' }}>
                  <th style={{ padding: '12px', fontSize: '13px', borderBottom: '2px solid #000', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>분석 항목</th>
                  <th style={{ padding: '12px', fontSize: '13px', borderBottom: '2px solid #000', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>데이터</th>
                  <th style={{ padding: '12px', fontSize: '13px', borderBottom: '2px solid #000', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>점수</th>
                  <th style={{ padding: '12px', fontSize: '13px', borderBottom: '2px solid #000', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>확인</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px 10px', fontSize: '14px', textAlign: 'center', fontWeight: '800', color: darkMode ? 'white' : '#000' }}>달러지수<br/><span style={{ fontSize: '10px', color: '#22c55e' }}>✓ 자동</span></td>
                  <td style={{ padding: '14px 10px', fontSize: '16px', textAlign: 'center', fontWeight: '900', color: '#007bff' }}>{currentData.dollarIndex}</td>
                  <td style={{ padding: '14px 10px', fontSize: '18px', textAlign: 'center', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>{scoreData.scores.dollarIndex}</td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <a href="https://www.investing.com/indices/usdollar" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
                  </td>
                </tr>
                
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px 10px', fontSize: '14px', textAlign: 'center', fontWeight: '800', color: darkMode ? 'white' : '#000' }}>금은비<br/><span style={{ fontSize: '10px', color: '#f59e0b' }}>✎ 수동</span></td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <input type="number" step="1" value={manualInputs.goldSilverRatio} onChange={(e) => setManualInputs({...manualInputs, goldSilverRatio: parseFloat(e.target.value) || 0})}
                      style={{ width: '65px', padding: '8px', textAlign: 'center', border: '2px solid #f59e0b', borderRadius: '6px', fontSize: '15px', fontWeight: '800', backgroundColor: darkMode ? '#1e293b' : 'white', color: darkMode ? '#fbbf24' : '#92400e' }} />
                  </td>
                  <td style={{ padding: '14px 10px', fontSize: '18px', textAlign: 'center', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>{scoreData.scores.goldSilverRatio}</td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <a href="https://www.tradingview.com/symbols/TVC-GOLDSILVER/" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
                  </td>
                </tr>
                
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px 10px', fontSize: '14px', textAlign: 'center', fontWeight: '800', color: darkMode ? 'white' : '#000' }}>RSI(14)<br/><span style={{ fontSize: '10px', color: '#f59e0b' }}>✎ 수동</span></td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <input type="number" step="0.1" value={manualInputs.rsi} onChange={(e) => setManualInputs({...manualInputs, rsi: parseFloat(e.target.value) || 0})}
                      style={{ width: '65px', padding: '8px', textAlign: 'center', border: '2px solid #22c55e', borderRadius: '6px', fontSize: '15px', fontWeight: '800', backgroundColor: darkMode ? '#1e293b' : 'white', color: darkMode ? '#4ade80' : '#166534' }} />
                  </td>
                  <td style={{ padding: '14px 10px', fontSize: '18px', textAlign: 'center', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>{scoreData.scores.rsi}</td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <a href="https://www.investing.com/commodities/silver-technical" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#22c55e', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
                  </td>
                </tr>
                
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px 10px', fontSize: '14px', textAlign: 'center', fontWeight: '800', color: darkMode ? 'white' : '#000' }}>MACD<br/><span style={{ fontSize: '10px', color: '#f59e0b' }}>✎ 수동</span></td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <select value={manualInputs.macd} onChange={(e) => setManualInputs({...manualInputs, macd: e.target.value})}
                      style={{ padding: '8px 12px', border: '2px solid #eab308', borderRadius: '6px', fontSize: '14px', fontWeight: '800', backgroundColor: darkMode ? '#1e293b' : 'white', color: darkMode ? '#fbbf24' : '#92400e', cursor: 'pointer' }}>
                      <option value="강세">강세</option>
                      <option value="전환">전환</option>
                      <option value="보합">보합</option>
                      <option value="하락">하락</option>
                    </select>
                  </td>
                  <td style={{ padding: '14px 10px', fontSize: '18px', textAlign: 'center', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>{scoreData.scores.macd}</td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <a href="https://www.investing.com/commodities/silver-technical" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#eab308', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
                  </td>
                </tr>
                
                <tr>
                  <td style={{ padding: '14px 10px', fontSize: '14px', textAlign: 'center', fontWeight: '800', color: darkMode ? 'white' : '#000' }}>산업수요<br/><span style={{ fontSize: '10px', color: '#f59e0b' }}>✎ 수동</span></td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                      <input type="number" step="0.1" value={manualInputs.industrialDemand} onChange={(e) => setManualInputs({...manualInputs, industrialDemand: parseFloat(e.target.value) || 0})}
                        style={{ width: '60px', padding: '8px', textAlign: 'center', border: '2px solid #8b5cf6', borderRadius: '6px', fontSize: '15px', fontWeight: '800', backgroundColor: darkMode ? '#1e293b' : 'white', color: darkMode ? '#a78bfa' : '#5b21b6' }} />
                      <span style={{ fontSize: '14px', fontWeight: '800', color: darkMode ? '#a78bfa' : '#5b21b6' }}>%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 10px', fontSize: '18px', textAlign: 'center', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>{scoreData.scores.industrialDemand}</td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <a href="https://www.silverinstitute.org/silver-supply-demand/" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ padding: '16px', backgroundColor: darkMode ? '#0f172a' : '#fdfdfe', borderTop: '3px solid #000' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: scoreData.score >= 70 ? '#22c55e' : scoreData.score >= 50 ? '#eab308' : '#dc2626', marginBottom: '8px' }}>{report.title}</div>
              <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, lineHeight: '1.7', color: darkMode ? '#cbd5e1' : '#222' }}>{report.analysis}</p>
            </div>

            <div style={{ padding: '16px', backgroundColor: darkMode ? '#1e293b' : '#fff' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', textAlign: 'center', backgroundColor: '#fff9c4', padding: '10px', marginBottom: '12px', border: '2px solid #000', borderRadius: '5px', color: '#000' }}>
                총 합계(20×5=100점)는 5개의 변수가 이동하므로 매일 달라질 수 있습니다.
              </div>
              <button onClick={() => setShowScoreModal(true)} style={{ width: '100%', padding: '14px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>
                📊 상세 배점 기준 확인하기 (CLICK)
              </button>

              <button onClick={() => saveToHistory()} style={{ width: '100%', marginTop: '10px', padding: '14px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>
                💾 오늘 데이터 저장하기
              </button>


              <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginTop: '16px' }}>
                <div onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>

<div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
  <div style={{ fontSize: '12px', color: darkMode ? '#d1d5db' : '#6b7280', marginBottom: '4px' }}>KODEX 은선물(H) 등락율</div>
  <div style={{ fontSize: '24px', fontWeight: 'bold', color: silverEtfChange.includes('-') ? '#ef4444' : '#22c55e' }}>{silverEtfChange}</div>
</div>


                  <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? 'white' : '#374151' }}>📅 점수 히스토리 (최근 10일)</span>
                  {showHistory ? <ChevronUp size={18} color={darkMode ? '#7dd3fc' : '#0369a1'} /> : <ChevronDown size={18} color={darkMode ? '#7dd3fc' : '#0369a1'} />}
                </div>

                {showHistory && (
                  <div style={{ marginTop: '12px' }}>

<div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, marginBottom: '8px' }}>
  <span style={{ fontSize: '11px', color: darkMode ? '#d1d5db' : '#6b7280', flex: 1 }}>날짜</span>
  <span style={{ fontSize: '11px', color: darkMode ? '#d1d5db' : '#6b7280', flex: 1, textAlign: 'center' }}>점수</span>
  <span style={{ fontSize: '11px', color: darkMode ? '#d1d5db' : '#6b7280', flex: 1, textAlign: 'center' }}>은($)</span>
  <span style={{ fontSize: '11px', color: darkMode ? '#d1d5db' : '#6b7280', flex: 1, textAlign: 'right' }}>ETF(H)</span>
</div>
                    {signalHistory.length > 0 ? 

signalHistory.map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>

                        <span style={{ fontSize: '13px', color: darkMode ? '#d1d5db' : '#6b7280' }}>{h.date}</span>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: h.score >= 70 ? '#22c55e' : h.score >= 50 ? '#eab308' : '#ef4444' }}>{h.score}점</span>


                      <span style={{ fontSize: '13px', color: darkMode ? 'white' : '#374151' }}>${h.price}</span>
<span style={{ fontSize: '12px', fontWeight: '600', color: h.etf && h.etf.includes('-') ? '#ef4444' : '#22c55e' }}>{h.etf || '-'}</span>
                      </div>
                    )) : <div style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#d1d5db' : '#6b7280', fontSize: '13px' }}>새로고침하면 기록됩니다</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* 섹션: 사용자 설정 테스트 */}
        <div style={{ background: darkMode ? 'linear-gradient(135deg, #14532d 0%, #166534 100%)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: `2px solid ${darkMode ? '#22c55e' : '#4ade80'}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div onClick={() => setShowUserTest(!showUserTest)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '32px' }}>🧪</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#14532d' }}>사용자 설정 테스트</h2>
                <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#86efac' : '#166534' }}>원하는 지표만 선택하여 점수 시뮬레이션</p>
              </div>
            </div>
            {showUserTest ? <ChevronUp size={20} color={darkMode ? '#86efac' : '#166534'} /> : <ChevronDown size={20} color={darkMode ? '#86efac' : '#166534'} />}
          </div>

          {showUserTest && (
            <>
              {/* 테스트 점수 표시 */}
              <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '16px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: darkMode ? '#86efac' : '#166534', marginBottom: '4px' }}>테스트 점수</div>
                <div style={{ fontSize: '48px', fontWeight: '900', color: testScoreData.percentage >= 70 ? '#22c55e' : testScoreData.percentage >= 50 ? '#eab308' : '#ef4444' }}>
                  {testScoreData.percentage}
                </div>
                <div style={{ fontSize: '12px', color: darkMode ? '#86efac' : '#166534' }}>
                  ({testScoreData.score}점 / {testScoreData.maxScore}점 만점)
                </div>
                <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 'bold', color: testScoreData.percentage >= 70 ? '#22c55e' : testScoreData.percentage >= 50 ? '#eab308' : '#ef4444' }}>
                  {testScoreData.percentage >= 80 ? '강력 매수' : testScoreData.percentage >= 70 ? '매수' : testScoreData.percentage >= 50 ? '중립' : testScoreData.percentage >= 35 ? '관망' : '매도 고려'}
                </div>
              </div>

              {/* 5개 항목 */}
              <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                {[
                  { key: 'dollarIndex', name: '달러지수', scores: [{ v: 20, l: '97↓' }, { v: 15, l: '98↓' }, { v: 10, l: '100↓' }, { v: 5, l: '101↑' }] },
                  { key: 'goldSilverRatio', name: '금은비', scores: [{ v: 20, l: '90↑' }, { v: 15, l: '80~90' }, { v: 10, l: '70~80' }, { v: 5, l: '70↓' }] },
                  { key: 'rsi', name: 'RSI(14)', scores: [{ v: 20, l: '30↓' }, { v: 15, l: '45↓' }, { v: 10, l: '60↓' }, { v: 5, l: '61↑' }] },
                  { key: 'macd', name: 'MACD', scores: [{ v: 20, l: '강세' }, { v: 15, l: '전환' }, { v: 10, l: '보합' }, { v: 5, l: '하락' }] },
                  { key: 'industrialDemand', name: '산업수요', scores: [{ v: 20, l: '5%↑' }, { v: 15, l: '2~5%' }, { v: 10, l: '0~2%' }, { v: 5, l: '감소' }] }
                ].map((item, idx) => (
                  <div key={item.key} style={{ marginBottom: idx < 4 ? '12px' : 0, paddingBottom: idx < 4 ? '12px' : 0, borderBottom: idx < 4 ? `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none' }}>
                    <div 
                      onClick={() => setTestSettings(prev => ({ ...prev, [item.key]: { ...prev[item.key], enabled: !prev[item.key].enabled } }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '8px' }}
                    >
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `2px solid ${testSettings[item.key].enabled ? '#22c55e' : (darkMode ? '#64748b' : '#94a3b8')}`, backgroundColor: testSettings[item.key].enabled ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {testSettings[item.key].enabled && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: darkMode ? 'white' : '#14532d' }}>{item.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 'bold', color: testSettings[item.key].enabled ? '#22c55e' : (darkMode ? '#64748b' : '#94a3b8') }}>
                        +{testSettings[item.key].score}점
                      </span>
                    </div>
                    
                    {testSettings[item.key].enabled && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginLeft: '32px' }}>
                        {item.scores.map((s) => (
                          <div 
                            key={s.v}
                            onClick={() => setTestSettings(prev => ({ ...prev, [item.key]: { ...prev[item.key], score: s.v } }))}
                            style={{ 
                              padding: '6px 10px', 
                              borderRadius: '8px', 
                              border: `2px solid ${testSettings[item.key].score === s.v ? '#22c55e' : (darkMode ? '#475569' : '#cbd5e1')}`,
                              backgroundColor: testSettings[item.key].score === s.v ? (darkMode ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)') : 'transparent',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: '700', color: testSettings[item.key].score === s.v ? '#22c55e' : (darkMode ? '#94a3b8' : '#64748b') }}>{s.v}점</div>
                            <div style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8' }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 테스트 히스토리 */}
              <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '14px' }}>
                <div onClick={() => setShowTestHistory(!showTestHistory)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? 'white' : '#14532d' }}>📅 테스트 히스토리 (최근 7일)</span>
                  {showTestHistory ? <ChevronUp size={18} color={darkMode ? '#86efac' : '#166534'} /> : <ChevronDown size={18} color={darkMode ? '#86efac' : '#166534'} />}
                </div>
                {showTestHistory && (
                  <div style={{ marginTop: '12px' }}>
                    {testHistory.length > 0 ? testHistory.slice(0, 7).map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                        <span style={{ fontSize: '13px', color: darkMode ? '#86efac' : '#166534' }}>{h.date}</span>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: h.percentage >= 70 ? '#22c55e' : h.percentage >= 50 ? '#eab308' : '#ef4444' }}>{h.percentage}점</span>
                        <span style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8' }}>{h.items}개 항목</span>
                      </div>
                    )) : <div style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#86efac' : '#166534', fontSize: '13px' }}>테스트 기록이 없습니다</div>}
                  </div>
                )}
              </div>

              <button 
                onClick={saveTestToHistory}
                style={{ width: '100%', marginTop: '16px', padding: '14px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
              >
                💾 현재 테스트 결과 저장하기
              </button>
            </>
          )}
        </div>

        {/* 섹션: 금/은 */}
        <div style={{ background: colors.goldBg, border: `2px solid ${colors.goldBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>🥇</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#713f12' }}>금 / 구리</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#fcd34d' : '#92400e' }}>은과의 상관관계 참고</p>
            </div>
          </div>

          {/* 금 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: darkMode ? '#fcd34d' : '#92400e' }}>🥇 금 (Gold)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: darkMode ? '#fbbf24' : '#b45309' }}>${currentData.goldPrice}</div>
            </div>
            <div onClick={() => setShowGoldHint(!showGoldHint)} style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: darkMode ? 'rgba(251,191,36,0.2)' : 'rgba(180,83,9,0.1)' }}>
              <Lightbulb size={18} color={darkMode ? '#fbbf24' : '#b45309'} />
            </div>
          </div>

          {showGoldHint && (
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)', borderRadius: '10px', padding: '14px', marginBottom: '12px', fontSize: '12px', color: darkMode ? '#fef3c7' : '#78350f', lineHeight: '1.8' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💡 금-은 관계 힌트</div>
              <div>• 금과 은은 <b>귀금속</b>으로 같은 방향 추세</div>
              <div>• 금은비(Gold/Silver Ratio)가 핵심 지표</div>
              <div>• 금은비 80 이상: 은 저평가 → 매수 기회</div>
              <div>• <b>은은 금보다 변동성이 크고 레버리지 효과</b></div>
            </div>
          )}

          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['1w', '1m', '6m', '1y', '10y'].map(p => (
                <button key={p} onClick={() => setGoldChartPeriod(p)} style={getTabStyle(goldChartPeriod === p)}>{getPeriodLabel(p)}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={getFilteredData(goldChartPeriod, goldData)}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 9 }} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="gold" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', textAlign: 'right' }}>출처: Yahoo Finance (GC=F)</div>
          </div>

          {/* 은 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: darkMode ? '#fb923c' : '#ea580c' }}>🔶 구리 (Copper)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: darkMode ? '#fb923c' : '#c2410c' }}>${currentData.copperPrice}</div>
            </div>
            <div onClick={() => setShowCopperHint(!showCopperHint)} style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: darkMode ? 'rgba(209,213,219,0.2)' : 'rgba(75,85,99,0.1)' }}>
              <Lightbulb size={18} color={darkMode ? '#d1d5db' : '#4b5563'} />
            </div>
          </div>

          {showCopperHint && (
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)', borderRadius: '10px', padding: '14px', marginBottom: '12px', fontSize: '12px', color: darkMode ? '#e5e7eb' : '#374151', lineHeight: '1.8' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💡 구리-은 관계 힌트</div>
              <div>• 은과 구리는 둘 다 <b>산업 수요</b>에 민감</div>
              <div>• 상관계수 <b>0.878</b> (매우 높음!)</div>
              <div>• 태양광 패널에 둘 다 사용</div>
              <div>• <b>은과 구리는 거의 같이 움직인다!</b></div>
            </div>
          )}

          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['1w', '1m', '6m', '1y', '10y'].map(p => (
                <button key={p} onClick={() => setCopperRefChartPeriod(p)} style={getTabStyle(copperRefChartPeriod === p)}>{getPeriodLabel(p)}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={getFilteredData(copperRefChartPeriod, copperData)}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 9 }} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="copper" stroke="#fb923c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', textAlign: 'right' }}>출처: Yahoo Finance (HG=F)</div>
          </div>
        </div>

        {/* 한국 투자 */}
        <div style={{ background: darkMode ? 'linear-gradient(135deg, #422006 0%, #713f12 100%)' : 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', border: `2px solid ${darkMode ? '#facc15' : '#fde047'}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🇰🇷</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#422006' }}>한국에서 은 투자</h3>
          </div>
          
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb'), color: darkMode ? '#94a3b8' : '#6b7280' }}>종류</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb'), color: darkMode ? '#94a3b8' : '#6b7280' }}>종목명</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', borderBottom: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb'), color: darkMode ? '#94a3b8' : '#6b7280' }}>시세</th>
                </tr>
              </thead>
              <tbody>
                {krStocks.map((stock, i) => (
                  <tr key={i}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb'), color: darkMode ? '#e2e8f0' : '#374151' }}>{stock.type}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb'), color: darkMode ? '#e2e8f0' : '#374151', fontWeight: '500' }}>{stock.name}</td>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb') }}><a href={stock.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>확인 →</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 뉴스 */}
        <div style={{ background: darkMode ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: `2px solid ${darkMode ? '#3b82f6' : '#60a5fa'}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Newspaper size={16} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>실시간 뉴스</h3>
          </div>
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px' }}>
            {[
              { emoji: '📊', title: '은 선물 시세', sub: 'Investing.com', url: 'https://kr.investing.com/commodities/silver' },
              { emoji: '📰', title: '은 관련 뉴스', sub: '네이버 뉴스', url: 'https://search.naver.com/search.naver?where=news&query=은+실버+원자재' },
              { emoji: '🇺🇸', title: '은 뉴스 (영어)', sub: 'Yahoo Finance', url: 'https://finance.yahoo.com/quote/SI=F/news/' }
            ].map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: darkMode ? '#0f172a' : '#f9fafb', borderRadius: '10px', textDecoration: 'none', marginBottom: i < 2 ? '8px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{item.emoji}</span>
                  <div>
                    <div style={{ color: darkMode ? 'white' : '#111827', fontSize: '14px', fontWeight: '600' }}>{item.title}</div>
                    <div style={{ color: darkMode ? '#94a3b8' : '#6b7280', fontSize: '11px' }}>{item.sub}</div>
                  </div>
                </div>
                <ExternalLink size={16} color={darkMode ? '#94a3b8' : '#6b7280'} />
              </a>
            ))}
          </div>
        </div>

        {/* 추가 정보 버튼 */}
        <div style={{ backgroundColor: darkMode ? '#0f172a' : '#e2e8f0', borderRadius: '16px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => { setShowStocksGuide(!showStocksGuide); setShowPortfolio(false); setShowInvestGuide(false); }} style={{ flex: 1, padding: '14px 8px', borderRadius: '12px', border: 'none', backgroundColor: showStocksGuide ? '#3b82f6' : (darkMode ? '#1e293b' : 'white'), color: showStocksGuide ? 'white' : (darkMode ? '#94a3b8' : '#64748b'), fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>📋 종목</button>
            <button onClick={() => { setShowPortfolio(!showPortfolio); setShowStocksGuide(false); setShowInvestGuide(false); }} style={{ flex: 1, padding: '14px 8px', borderRadius: '12px', border: 'none', backgroundColor: showPortfolio ? '#3b82f6' : (darkMode ? '#1e293b' : 'white'), color: showPortfolio ? 'white' : (darkMode ? '#94a3b8' : '#64748b'), fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>💼 포폴</button>
            <button onClick={() => { setShowInvestGuide(!showInvestGuide); setShowStocksGuide(false); setShowPortfolio(false); }} style={{ flex: 1, padding: '14px 8px', borderRadius: '12px', border: 'none', backgroundColor: showInvestGuide ? '#3b82f6' : (darkMode ? '#1e293b' : 'white'), color: showInvestGuide ? 'white' : (darkMode ? '#94a3b8' : '#64748b'), fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>📚 가이드</button>
          </div>
        </div>

        {showStocksGuide && (
          <div style={{ backgroundColor: darkMode ? '#1e293b' : 'white', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb') }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827' }}>📋 은 관련 종목</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6', marginBottom: '8px' }}>해외 ETF</div>
              {['SLV - iShares Silver Trust', 'SIVR - abrdn Physical Silver Shares ETF', 'SIL - Global X Silver Miners ETF'].map((item, i) => (
                <div key={i} style={{ padding: '8px', backgroundColor: darkMode ? '#0f172a' : '#f9fafb', borderRadius: '6px', marginBottom: '6px', fontSize: '12px', color: darkMode ? '#e2e8f0' : '#374151' }}>{item}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e', marginBottom: '8px' }}>개별 광산주</div>
              {['PAAS - Pan American Silver (세계 최대 은 광산)', 'AG - First Majestic Silver', 'WPM - Wheaton Precious Metals'].map((item, i) => (
                <div key={i} style={{ padding: '8px', backgroundColor: darkMode ? '#0f172a' : '#f9fafb', borderRadius: '6px', marginBottom: '6px', fontSize: '12px', color: darkMode ? '#e2e8f0' : '#374151' }}>{item}</div>
              ))}
            </div>
          </div>
        )}

        {showPortfolio && (
          <div style={{ backgroundColor: darkMode ? '#1e293b' : 'white', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb') }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827' }}>💼 분산 포트폴리오 예시</h3>
            {[
              { name: 'KODEX 은선물(H)', pct: 25, color: '#3b82f6' },
              { name: 'COPX', pct: 20, color: '#8b5cf6' },
              { name: 'FCX', pct: 15, color: '#22c55e' },
              { name: '풍산', pct: 15, color: '#f59e0b' },
              { name: '현금/MMF', pct: 25, color: '#64748b' }
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: darkMode ? '#0f172a' : '#f9fafb', borderRadius: '8px', marginBottom: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span style={{ flex: 1, fontSize: '13px', color: darkMode ? '#e2e8f0' : '#374151' }}>{item.name}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: item.color }}>{item.pct}%</span>
              </div>
            ))}
          </div>
        )}

        {showInvestGuide && (
          <div style={{ backgroundColor: darkMode ? '#1e293b' : 'white', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb') }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827' }}>📚 투자 가이드</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '12px', backgroundColor: darkMode ? '#14532d' : '#dcfce7', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#22c55e', marginBottom: '6px' }}>🟢 매수 신호</div>
                <div style={{ fontSize: '11px', color: darkMode ? '#bbf7d0' : '#166534', lineHeight: '1.8' }}>
                  • 70점 이상<br/>• RSI 30 이하<br/>• MACD 강세/전환
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: darkMode ? '#7c2d12' : '#fee2e2', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#ef4444', marginBottom: '6px' }}>🔴 매도 신호</div>
                <div style={{ fontSize: '11px', color: darkMode ? '#fecaca' : '#b91c1c', lineHeight: '1.8' }}>
                  • 35점 미만<br/>• RSI 61 이상<br/>• MACD 하락
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상세 배점 기준표 모달 */}
        {showScoreModal && (
          <div onClick={() => setShowScoreModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', width: '100%', maxWidth: '370px', border: '4px solid #000', borderRadius: '15px', overflow: 'hidden' }}>
              <div style={{ padding: '15px', backgroundColor: '#000', color: '#fff', fontWeight: '900', textAlign: 'center', fontSize: '18px' }}>📋 상세 배점 기준표</div>
              <div style={{ padding: '25px', fontSize: '14px', fontWeight: '600', lineHeight: '2.2', color: '#000' }}>
                <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                  <strong>1. 달러지수:</strong><br/>
                  97↓ (20점) / 98↓ (15점) / 100↓ (10점) / 101↑ (5점)
                </p>
                <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                  <strong>2. 금은비:</strong><br/>
                  90↑ (20점) / 80~90 (15점) / 70~80 (10점) / 70↓ (5점)
                </p>
                <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                  <strong>3. RSI (14일):</strong><br/>
                  30↓ (20점) / 45↓ (15점) / 60↓ (10점) / 61↑ (5점)
                </p>
       <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
  <strong>4. MACD 추세:</strong><br/>
  +0.05 이상 → 강세 (20점)<br/>
  +0.01 ~ +0.05 → 약강세 (15점)<br/>
  -0.01 ~ +0.01 → 보합 (10점)<br/>
  -0.05 ~ -0.01 → 약하락 (7점)<br/>
  -0.05 이하 → 하락 (5점)
</p>


                <p style={{ margin: '8px 0' }}>
                  <strong>5. 산업수요 변동:</strong><br/>
                  5%↑ (20점) / 2~5% (15점) / 0~2% (10점) / 감소 (5점)<br/>
(태양광·전자산업 등 은 수요 변동률)



                </p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#fff9c4', borderTop: '2px solid #000', fontSize: '12px', fontWeight: '700', textAlign: 'center', color: '#000' }}>
                💡 총 합계(20×5=100점)는 5개의 변수가 이동하므로 매일 달라질 수 있습니다.
              </div>
              <button onClick={() => setShowScoreModal(false)} style={{ width: '100%', padding: '15px', backgroundColor: '#000', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '16px' }}>닫기</button>
            </div>
          </div>
        )}

</>
)}

{activeTab === 'info' && (
<div style={{ background: darkMode ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: `2px solid ${darkMode ? '#3b82f6' : '#60a5fa'}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
  <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#1e3a8a' }}>📚 은 정보</h2>
  
  <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: darkMode ? '#93c5fd' : '#1e40af' }}>🥈 은 속성과 시장동향</h3>
    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.8', color: darkMode ? '#e2e8f0' : '#374151' }}>
      • 은은 귀금속이자 산업금속의 이중 성격을 가짐<br/>
      • 태양광 패널, 전자기기, 의료기기에 필수 원자재<br/>
      • 전 세계 은 수요의 약 50%가 산업용<br/>
• 금은비(Gold/Silver Ratio)가 투자 타이밍의 핵심 지표


    </p>
  </div>

  <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: darkMode ? '#93c5fd' : '#1e40af' }}>📊 가격에 영향 미치는 변수</h3>
    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.8', color: darkMode ? '#e2e8f0' : '#374151' }}>
      • 달러 강세 → 은 가격 하락<br/>
      • 금 가격 → 은과 동행 추세<br/>
      • 태양광/전자산업 성장 → 수요 증가<br/>
      • 금리 인하 → 귀금속 투자 증가
    </p>
  </div>

  <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px' }}>
    <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: darkMode ? '#93c5fd' : '#1e40af' }}>🔗 뉴스 검색 링크</h3>
    <a href="https://www.investing.com/commodities/silver-news" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', backgroundColor: darkMode ? '#0f172a' : '#f9fafb', borderRadius: '8px', color: '#3b82f6', textDecoration: 'none', marginBottom: '8px' }}>📰 Investing.com 은 뉴스</a>

    <a href="https://search.naver.com/search.naver?where=news&query=은+실버+원자재" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', backgroundColor: darkMode ? '#0f172a' : '#f9fafb', borderRadius: '8px', color: '#3b82f6', textDecoration: 'none' }}>📰 네이버 은 뉴스</a>
  </div>
</div>
)}

{activeTab === 'news' && (
<div style={{ background: darkMode ? 'linear-gradient(135deg, #14532d 0%, #166534 100%)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: `2px solid ${darkMode ? '#22c55e' : '#4ade80'}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
  <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#14532d' }}>📰 뉴스 메모</h2>
  <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: darkMode ? '#86efac' : '#166534' }}>은 관련 뉴스를 직접 메모하세요 (로컬 저장됨)</p>
  
  <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px' }}>
    <p style={{ textAlign: 'left', color: darkMode ? '#86efac' : '#166534', fontSize: '14px' }}>🚧 은 관련 뉴스 메모 공간입니다. 직접 수정하여 사용하세요.</p>
  </div>
</div>
)}

        {/* 푸터 */}
        <div style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#64748b' : '#9ca3af', fontSize: '11px' }}>
          <div>⚠️ 투자의 책임은 본인에게 있습니다</div>
          <div>데이터 출처: Yahoo Finance API (자동 동기화)</div>
        </div>
      </div>

      {/* 상세 배점 기준표 모달 */}
      {showScoreModal && (
        <div onClick={() => setShowScoreModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', width: '100%', maxWidth: '370px', border: '4px solid #000', borderRadius: '15px', overflow: 'hidden' }}>
            <div style={{ padding: '15px', backgroundColor: '#000', color: '#fff', fontWeight: '900', textAlign: 'center', fontSize: '18px' }}>📋 상세 배점 기준표</div>
            <div style={{ padding: '25px', fontSize: '14px', fontWeight: '600', lineHeight: '2.2', color: '#000' }}>
              <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <strong>1. 달러지수:</strong><br/>
                97↓ (20점) / 98↓ (15점) / 100↓ (10점) / 101↑ (5점)
              </p>
              <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <strong>2. 금은비:</strong><br/>
                90↑ (20점) / 80~90 (15점) / 70~80 (10점) / 70↓ (5점)
              </p>
              <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                <strong>3. RSI (14일):</strong><br/>
                30↓ (20점) / 45↓ (15점) / 60↓ (10점) / 61↑ (5점)
              </p>

<p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
  <strong>4. MACD 추세:</strong><br/>
  +0.05 이상 → 강세 (20점)<br/>
  +0.01 ~ +0.05 → 약강세 (15점)<br/>
  -0.01 ~ +0.01 → 보합 (10점)<br/>
  -0.05 ~ -0.01 → 약하락 (7점)<br/>
  -0.05 이하 → 하락 (5점)
</p>
           

              <p style={{ margin: '8px 0' }}>
                <strong>5. 산업수요 변동:</strong><br/>
                5%↑ (20점) / 2~5% (15점) / 0~2% (10점) / 감소 (5점)
              </p>
            </div>
            <button onClick={() => setShowScoreModal(false)} style={{ width: '100%', padding: '15px', backgroundColor: '#000', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '16px' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
