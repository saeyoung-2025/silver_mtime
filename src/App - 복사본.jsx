import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { Moon, Sun, Newspaper, ChevronDown, ChevronUp, RefreshCw, ExternalLink, Lightbulb } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showGoldHint, setShowGoldHint] = useState(false);
  const [showSilverHint, setShowSilverHint] = useState(false);
  const [showStocksGuide, setShowStocksGuide] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showInvestGuide, setShowInvestGuide] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showTestHistory, setShowTestHistory] = useState(false);
  
  const [testSettings, setTestSettings] = useState({
    dollarIndex: { enabled: true, score: 10 },
    pmi: { enabled: true, score: 15 },
    rsi: { enabled: true, score: 15 },
    macd: { enabled: true, score: 15 },
    inventory: { enabled: true, score: 15 }
  });
  const [testHistory, setTestHistory] = useState([]);
  
  const [copperChartPeriod, setCopperChartPeriod] = useState('1m');
  const [silverChartPeriod, setSilverChartPeriod] = useState('1y');
  const [goldChartPeriod, setGoldChartPeriod] = useState('1y');
  const [copperChartExpanded, setCopperChartExpanded] = useState(false);
  
  const [currentData, setCurrentData] = useState({
    copperPrice: 0, dollarIndex: 0,
    prevClose: 0, todayOpen: 0, todayHigh: 0, todayLow: 0, week52High: 0, week52Low: 0, yearChangePercent: 0,
    goldPrice: 0, silverPrice: 0,
    sp500: 0, sp500Change: 0,
    nasdaq: 0, nasdaqChange: 0,
    dow: 0, dowChange: 0,
    kospi: 0, kospiChange: 0,
    kosdaq: 0, kosdaqChange: 0,
    nq100Futures: 0, nq100Change: 0
  });

  const [manualInputs, setManualInputs] = useState({
    pmi: 50.5,
    rsi: 38.4,
    macd: '전환',
    inv: -2.1
  });

  const [fullData, setFullData] = useState([]);
  const [silverData, setSilverData] = useState([]);
  const [goldData, setGoldData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [signalHistory, setSignalHistory] = useState([]);
  
  const krStocks = [
    { type: 'ETF', name: 'KODEX 구리선물(H)', code: '138910', url: 'https://finance.naver.com/item/main.nhn?code=138910' },
    { type: 'ETN', name: '삼성 구리 선물 ETN(H)', code: '530095', url: 'https://finance.naver.com/item/main.nhn?code=530095' },
    { type: '주식', name: '풍산', code: '103140', url: 'https://finance.naver.com/item/main.nhn?code=103140' },
    { type: '주식', name: 'LS', code: '006260', url: 'https://finance.naver.com/item/main.nhn?code=006260' },
    { type: '주식', name: '고려아연', code: '010130', url: 'https://finance.naver.com/item/main.nhn?code=010130' }
  ];

  const getDollarScore = (value) => {
    if (value <= 97) return 20;
    if (value <= 98) return 15;
    if (value <= 100) return 10;
    return 5;
  };

  const getPmiScore = (value) => {
    if (value > 51) return 20;
    if (value >= 50.1) return 15;
    if (value >= 49.6) return 10;
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

  const getInventoryScore = (value) => {
    if (value <= -3) return 20;
    if (value <= -1) return 15;
    if (value <= 1) return 10;
    return 5;
  };

  const calculateScore = () => {
    const scores = {
      dollarIndex: getDollarScore(parseFloat(currentData.dollarIndex) || 99),
      pmi: getPmiScore(manualInputs.pmi),
      rsi: getRsiScore(manualInputs.rsi),
      macd: getMacdScore(manualInputs.macd),
      inventory: getInventoryScore(manualInputs.inv)
    };
    const total = scores.dollarIndex + scores.pmi + scores.rsi + scores.macd + scores.inventory;
    return { score: total, maxScore: 100, scores };
  };

  const scoreData = calculateScore();

  const getRecommendation = () => { 
    if (scoreData.score >= 80) return '강력 매수';
    if (scoreData.score >= 70) return '매수';
    if (scoreData.score >= 50) return '중립';
    if (scoreData.score >= 35) return '관망';
    return '매도 고려';
  };

  const getRecommendationColor = () => {
    if (scoreData.score >= 70) return '#22c55e';
    if (scoreData.score >= 50) return '#eab308';
    return '#ef4444';
  };

  const generateReport = () => {
    const total = scoreData.score;
    let title = total >= 70 ? "[심리 개선] 구리, 펀더멘탈 회복세 뚜렷" 
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

    if (manualInputs.inv <= -1) {
      analysis += `LME 재고가 ${manualInputs.inv}% 감소하며 타이트한 수급이 가격의 하방 경직성을 확보하고 있습니다. `;
    }

    const dollarVal = parseFloat(currentData.dollarIndex) || 99;
    if (dollarVal <= 100) {
      analysis += `달러 지수(${dollarVal})의 안정세는 비철금속 전반의 매수세를 유입시키는 핵심 동력으로 작용하고 있으며, `;
    }

    if (manualInputs.pmi >= 50) {
      analysis += `주요 소비국인 중국의 제조 PMI(${manualInputs.pmi})가 확장 국면을 유지하며 실물 수요 뒷받침 가능성을 시사합니다.`;
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
    
    const saved = localStorage.getItem('copperTestHistory');
    let history = saved ? JSON.parse(saved) : [];
    
    const existingIndex = history.findIndex(h => h.date === today);
    if (existingIndex >= 0) history[existingIndex] = newEntry;
    else history.unshift(newEntry);
    
    history = history.slice(0, 7);
    localStorage.setItem('copperTestHistory', JSON.stringify(history));
    setTestHistory(history);
    
    setToastMessage('테스트 결과가 저장되었습니다');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const saveToHistory = () => {
    const today = new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
    const newEntry = { date: today, score: scoreData.score, price: currentData.copperPrice };
    
    const saved = localStorage.getItem('copperHistory');
    let history = saved ? JSON.parse(saved) : [];
    
    const existingIndex = history.findIndex(h => h.date === today);
    if (existingIndex >= 0) history[existingIndex] = newEntry;
    else history.unshift(newEntry);
    
    history = history.slice(0, 10);
    localStorage.setItem('copperHistory', JSON.stringify(history));
    setSignalHistory(history);
  };

  useEffect(() => {
    const savedManual = localStorage.getItem('copperManualInputs');
    if (savedManual) {
      try { setManualInputs(JSON.parse(savedManual)); } catch (e) {}
    }
    const historyData = localStorage.getItem('copperHistory');
    if (historyData) setSignalHistory(JSON.parse(historyData));
    
    const testHistoryData = localStorage.getItem('copperTestHistory');
    if (testHistoryData) setTestHistory(JSON.parse(testHistoryData));
    
    const savedTestSettings = localStorage.getItem('copperTestSettings');
    if (savedTestSettings) {
      try { setTestSettings(JSON.parse(savedTestSettings)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('copperManualInputs', JSON.stringify(manualInputs));
  }, [manualInputs]);

  useEffect(() => {
    localStorage.setItem('copperTestSettings', JSON.stringify(testSettings));
  }, [testSettings]);

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const proxyUrl = 'https://corsproxy.io/?';
      const [copperRes, dollarRes, goldRes, silverRes, sp500Res, nasdaqRes, dowRes, kospiRes, kosdaqRes, nq100Res] = await Promise.all([
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/HG=F?interval=1d&range=10y')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=10y')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=10y')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d&range=10y')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=1d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=1d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EDJI?interval=1d&range=1d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?interval=1d&range=1d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/%5EKQ11?interval=1d&range=1d')),
        fetch(proxyUrl + encodeURIComponent('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1d&range=1d'))
      ]);
      
      const copperData = await copperRes.json();
      const dollarData = await dollarRes.json();
      const goldDataRes = await goldRes.json();
      const silverDataRes = await silverRes.json();
      const sp500Data = await sp500Res.json();
      const nasdaqData = await nasdaqRes.json();
      const dowData = await dowRes.json();
      const kospiData = await kospiRes.json();
      const kosdaqData = await kosdaqRes.json();
      const nq100Data = await nq100Res.json();
      
      const copperMeta = copperData?.chart?.result?.[0]?.meta || {};
      const copperPrice = copperMeta.regularMarketPrice || 0;
      const dollarIndex = dollarData?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
      const goldPrice = goldDataRes?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
      const silverPrice = silverDataRes?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
      
      const sp500Meta = sp500Data?.chart?.result?.[0]?.meta || {};
      const sp500 = sp500Meta.regularMarketPrice || 0;
      const sp500Change = sp500Meta.regularMarketChangePercent || 0;
      
      const nasdaqMeta = nasdaqData?.chart?.result?.[0]?.meta || {};
      const nasdaq = nasdaqMeta.regularMarketPrice || 0;
      const nasdaqChange = nasdaqMeta.regularMarketChangePercent || 0;
      
      const dowMeta = dowData?.chart?.result?.[0]?.meta || {};
      const dow = dowMeta.regularMarketPrice || 0;
      const dowChange = dowMeta.regularMarketChangePercent || 0;
      
      const kospiMeta = kospiData?.chart?.result?.[0]?.meta || {};
      const kospi = kospiMeta.regularMarketPrice || 0;
      const kospiChange = kospiMeta.regularMarketChangePercent || 0;
      
      const kosdaqMeta = kosdaqData?.chart?.result?.[0]?.meta || {};
      const kosdaq = kosdaqMeta.regularMarketPrice || 0;
      const kosdaqChange = kosdaqMeta.regularMarketChangePercent || 0;
      
      const nq100Meta = nq100Data?.chart?.result?.[0]?.meta || {};
      const nq100Futures = nq100Meta.regularMarketPrice || 0;
      const nq100Change = nq100Meta.regularMarketChangePercent || 0;
      
      const copperQuote = copperData?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
      const copperTimestamps = copperData?.chart?.result?.[0]?.timestamp || [];
      const copperCloses = copperQuote.close || [];
      const copperHighs = copperQuote.high || [];
      const copperLows = copperQuote.low || [];
      const copperOpens = copperQuote.open || [];
      const copperVolumes = copperQuote.volume || [];
      
      const goldQuote = goldDataRes?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
      const goldTimestamps = goldDataRes?.chart?.result?.[0]?.timestamp || [];
      const goldCloses = goldQuote.close || [];
      
      const silverQuote = silverDataRes?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
      const silverTimestamps = silverDataRes?.chart?.result?.[0]?.timestamp || [];
      const silverCloses = silverQuote.close || [];

      const validCopperCloses = copperCloses.filter(c => c !== null && c !== undefined);
      const yearCloses = validCopperCloses.slice(-252);
      const week52High = yearCloses.length > 0 ? Math.max(...yearCloses).toFixed(2) : 0;
      const week52Low = yearCloses.length > 0 ? Math.min(...yearCloses).toFixed(2) : 0;
      const yearAgoPrice = yearCloses.length > 0 ? yearCloses[0] : copperPrice;
      const yearChangePercent = yearAgoPrice ? ((copperPrice - yearAgoPrice) / yearAgoPrice * 100).toFixed(1) : 0;

      const lastIndex = validCopperCloses.length - 1;
      const prevClose = lastIndex >= 1 ? validCopperCloses[lastIndex - 1] : copperPrice;
      const todayOpen = copperOpens[copperOpens.length - 1] || prevClose;
      const todayHigh = copperHighs[copperHighs.length - 1] || copperPrice;
      const todayLow = copperLows[copperLows.length - 1] || copperPrice;

      const newData = {
        copperPrice: Number(copperPrice).toFixed(2),
        dollarIndex: Number(dollarIndex).toFixed(1),
        goldPrice: Number(goldPrice).toFixed(2),
        silverPrice: Number(silverPrice).toFixed(2),
        prevClose: Number(prevClose).toFixed(2),
        todayOpen: Number(todayOpen).toFixed(2),
        todayHigh: Number(todayHigh).toFixed(2),
        todayLow: Number(todayLow).toFixed(2),
        week52High, week52Low, yearChangePercent,
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
      
      const chartData = copperTimestamps.map((ts, i) => {
        const date = new Date(ts * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return { 
          date: `${year}.${month}.${day}`,
          copper: copperCloses[i] ? Number(copperCloses[i]).toFixed(2) : null, 
          volume: copperVolumes[i] || 0 
        };
      }).filter(d => d.copper !== null);

      const calcMA = (data, period) => {
        return data.map((item, idx) => {
          if (idx < period - 1) return { ...item, ['ma' + period]: null };
          const avg = data.slice(idx - period + 1, idx + 1).reduce((sum, d) => sum + parseFloat(d.copper || 0), 0) / period;
          return { ...item, ['ma' + period]: avg.toFixed(2) };
        });
      };

      let enrichedData = calcMA(calcMA(calcMA(calcMA(chartData, 5), 20), 60), 120);
      setFullData(enrichedData);

      const silverChartData = silverTimestamps.map((ts, i) => {
        const date = new Date(ts * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return { 
          date: `${year}.${month}.${day}`,
          silver: silverCloses[i] ? Number(silverCloses[i]).toFixed(2) : null 
        };
      }).filter(d => d.silver !== null);
      setSilverData(silverChartData);

      const goldChartData = goldTimestamps.map((ts, i) => {
        const date = new Date(ts * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return { 
          date: `${year}.${month}.${day}`,
          gold: goldCloses[i] ? Number(goldCloses[i]).toFixed(2) : null 
        };
      }).filter(d => d.gold !== null);
      setGoldData(goldChartData);

      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      saveToHistory();
      
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      setToastMessage('데이터 로딩 실패');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
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
    copperBg: darkMode ? 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)' : 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    copperBorder: darkMode ? '#0ea5e9' : '#38bdf8',
    goldBg: darkMode ? 'linear-gradient(135deg, #713f12 0%, #854d0e 100%)' : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    goldBorder: darkMode ? '#fbbf24' : '#f59e0b',
    userBg: darkMode ? 'linear-gradient(135deg, #831843 0%, #9d174d 100%)' : 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    userBorder: darkMode ? '#ec4899' : '#f472b6',
    marketBg: darkMode ? 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    marketBorder: darkMode ? '#3b82f6' : '#60a5fa'
  };


// ===== App.jsx Part 2 =====
// Part 1의 colors 정의 다음부터 시작

  return (
    <div style={{ minHeight: '100vh', background: darkMode ? 'linear-gradient(to bottom, #0f172a, #1e293b)' : '#f8fafc', padding: '16px' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {showToast && <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#22c55e', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 1000 }}>✓ {toastMessage}</div>}
        
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827', marginBottom: '4px' }}>🔶 구리 매수 시점 분석</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDarkMode(!darkMode)} style={{ padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? 'white' : '#111827' }}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
              <button onClick={refreshData} style={{ padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? 'white' : '#111827', opacity: isLoading ? 0.6 : 1 }} disabled={isLoading}><RefreshCw size={18} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} /></button>
            </div>
            <p style={{ color: darkMode ? '#94a3b8' : '#6b7280', fontSize: '11px', margin: 0 }}>{lastUpdated || '로딩 중...'}</p>
          </div>
        </div>

        {/* 섹션 1: 구리 현재 현황 */}
        <div style={{ background: colors.copperBg, border: `2px solid ${colors.copperBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>🔶</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#0c4a6e' }}>구리 현재 현황</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#7dd3fc' : '#0369a1' }}>실시간 가격 정보</p>
            </div>
          </div>

          {/* 현재가 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: darkMode ? '#7dd3fc' : '#0369a1' }}>현재 구리 가격</div>
              <a href="https://finance.yahoo.com/quote/HG=F/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: darkMode ? '#38bdf8' : '#0284c7' }}>${currentData.copperPrice}</div>
              </a>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: parseFloat(currentData.yearChangePercent) >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                {parseFloat(currentData.yearChangePercent) >= 0 ? '▲' : '▼'} {currentData.yearChangePercent}%
              </div>
              <div style={{ fontSize: '11px', color: darkMode ? '#7dd3fc' : '#0369a1' }}>1년 변동</div>
            </div>
          </div>

          {/* 금일 현황 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: darkMode ? '#7dd3fc' : '#0369a1' }}>전일종가</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#0c4a6e' }}>${currentData.prevClose}</div>
            </div>
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: darkMode ? '#7dd3fc' : '#0369a1' }}>금일시가</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#0c4a6e' }}>${currentData.todayOpen}</div>
            </div>
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: darkMode ? '#7dd3fc' : '#0369a1' }}>금일 고/저</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#0c4a6e' }}>${currentData.todayLow}~${currentData.todayHigh}</div>
            </div>
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', color: darkMode ? '#7dd3fc' : '#0369a1' }}>52주 범위</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#0c4a6e' }}>${currentData.week52Low}~${currentData.week52High}</div>
            </div>
          </div>
        </div>

        {/* 섹션 2: 오늘의 시황 (NEW!) */}
        <div style={{ background: colors.marketBg, border: `2px solid ${colors.marketBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#1e3a8a' }}>오늘의 시황 & 주요 지표</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#93c5fd' : '#1e40af' }}>실시간 시장 동향</p>
            </div>
          </div>

          {/* 미국장 */}
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#93c5fd' : '#1e40af', marginBottom: '10px' }}>🇺🇸 미국장</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>S&P 500</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.sp500}</div>
                <div style={{ fontSize: '11px', color: parseFloat(currentData.sp500Change) >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                  {parseFloat(currentData.sp500Change) >= 0 ? '▲' : '▼'} {Math.abs(currentData.sp500Change)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>나스닥</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.nasdaq}</div>
                <div style={{ fontSize: '11px', color: parseFloat(currentData.nasdaqChange) >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                  {parseFloat(currentData.nasdaqChange) >= 0 ? '▲' : '▼'} {Math.abs(currentData.nasdaqChange)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>다우존스</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.dow}</div>
                <div style={{ fontSize: '11px', color: parseFloat(currentData.dowChange) >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                  {parseFloat(currentData.dowChange) >= 0 ? '▲' : '▼'} {Math.abs(currentData.dowChange)}%
                </div>
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
                <div style={{ fontSize: '11px', color: parseFloat(currentData.kospiChange) >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                  {parseFloat(currentData.kospiChange) >= 0 ? '▲' : '▼'} {Math.abs(currentData.kospiChange)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>코스닥</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.kosdaq}</div>
                <div style={{ fontSize: '11px', color: parseFloat(currentData.kosdaqChange) >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                  {parseFloat(currentData.kosdaqChange) >= 0 ? '▲' : '▼'} {Math.abs(currentData.kosdaqChange)}%
                </div>
              </div>
            </div>
          </div>

          {/* 선물 */}
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#93c5fd' : '#1e40af', marginBottom: '10px' }}>📈 선물</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>나스닥100 선물</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>{currentData.nq100Futures}</div>
                <div style={{ fontSize: '11px', color: parseFloat(currentData.nq100Change) >= 0 ? '#22c55e' : '#ef4444', fontWeight: '600' }}>
                  {parseFloat(currentData.nq100Change) >= 0 ? '▲' : '▼'} {Math.abs(currentData.nq100Change)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>금 선물</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>${currentData.goldPrice}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>은 선물</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>${currentData.silverPrice}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: darkMode ? '#93c5fd' : '#1e40af' }}>구리 선물</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: darkMode ? 'white' : '#1e3a8a' }}>${currentData.copperPrice}</div>
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
              <a href="https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/pmi/" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
            </div>
          </div>
        </div>

        {/* 구리 차트 섹션 */}
        <div style={{ background: colors.copperBg, border: `2px solid ${colors.copperBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>📈</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#0c4a6e' }}>구리 차트 분석</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#7dd3fc' : '#0369a1' }}>기술적 지표 및 추세</p>
            </div>
          </div>

          {/* 구리 차트 */}
          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? 'white' : '#0c4a6e' }}>📈 구리 차트 (이평선)</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <a href="https://kr.investing.com/commodities/copper-streaming-chart" target="_blank" rel="noopener noreferrer" style={{ padding: '4px 8px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '6px', fontSize: '10px', fontWeight: '700', textDecoration: 'none' }}>인베스팅</a>
                <a href="https://www.tradingview.com/symbols/COMEX-HG1!/" target="_blank" rel="noopener noreferrer" style={{ padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '10px', fontWeight: '700', textDecoration: 'none' }}>트레이딩뷰</a>
                <span onClick={() => setCopperChartExpanded(!copperChartExpanded)} style={{ fontSize: '11px', color: '#3b82f6', cursor: 'pointer', marginLeft: '4px' }}>{copperChartExpanded ? '축소' : '확대'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['1w', '1m', '6m', '1y', '10y'].map(p => (
                <button key={p} onClick={() => setCopperChartPeriod(p)} style={getTabStyle(copperChartPeriod === p)}>{getPeriodLabel(p)}</button>
              ))}
            </div>
            <div style={{ fontSize: '10px', color: darkMode ? '#7dd3fc' : '#0369a1', marginBottom: '8px' }}>
              <span style={{ marginRight: '8px' }}>━ 가격</span>
              <span style={{ color: '#f97316', marginRight: '8px' }}>━ 5일</span>
              <span style={{ color: '#22c55e', marginRight: '8px' }}>━ 20일</span>
              <span style={{ color: '#a855f7', marginRight: '8px' }}>━ 60일</span>
              <span style={{ color: '#ef4444' }}>━ 120일</span>
            </div>
            <ResponsiveContainer width="100%" height={copperChartExpanded ? 300 : 180}>
              <ComposedChart data={getFilteredData(copperChartPeriod)}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 9 }} />
                <YAxis yAxisId="price" stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <YAxis yAxisId="volume" orientation="right" hide />
                <Tooltip />
                <Bar yAxisId="volume" dataKey="volume" fill={darkMode ? '#334155' : '#e2e8f0'} opacity={0.3} />
                <Line yAxisId="price" type="monotone" dataKey="copper" stroke="#38bdf8" strokeWidth={2} dot={false} name="구리" />
                <Line yAxisId="price" type="monotone" dataKey="ma5" stroke="#f97316" strokeWidth={1} dot={false} name="MA5" />
                <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#22c55e" strokeWidth={1} dot={false} name="MA20" />
                <Line yAxisId="price" type="monotone" dataKey="ma60" stroke="#a855f7" strokeWidth={1} dot={false} name="MA60" />
                <Line yAxisId="price" type="monotone" dataKey="ma120" stroke="#ef4444" strokeWidth={1} dot={false} name="MA120" />
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '6px', textAlign: 'right' }}>출처: Yahoo Finance (HG=F)</div>
          </div>

// ===== App.jsx Part 3 (마지막) =====
// Part 2의 구리 차트 끝 다음부터 시작

          {/* COPPER INDEX 종합 점수 */}
          <div style={{ backgroundColor: darkMode ? '#000' : '#fff', borderRadius: '16px', overflow: 'hidden', border: '3px solid #000', marginBottom: '16px' }}>
            <div style={{ padding: '20px', backgroundColor: '#000', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>COPPER INDEX</h3>
                <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '800' }}>MARKET ANALYSIS</div>
              </div>
              <div style={{ width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '26px', border: '3px solid #000' }}>{scoreData.score}</div>
            </div>

            {/* 점수 테이블 */}
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
                  <td style={{ padding: '14px 10px', fontSize: '16px', textAlign: 'center', fontWeight: '900', color: '#007bff' }}>{currentData.dollarIndex || '99.2'}</td>
                  <td style={{ padding: '14px 10px', fontSize: '18px', textAlign: 'center', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>{scoreData.scores.dollarIndex}</td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <a href="https://www.investing.com/indices/usdollar" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
                  </td>
                </tr>
                
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '14px 10px', fontSize: '14px', textAlign: 'center', fontWeight: '800', color: darkMode ? 'white' : '#000' }}>산업PMI<br/><span style={{ fontSize: '10px', color: '#f59e0b' }}>✎ 수동</span></td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <input type="number" step="0.1" value={manualInputs.pmi} onChange={(e) => setManualInputs({...manualInputs, pmi: parseFloat(e.target.value) || 0})}
                      style={{ width: '65px', padding: '8px', textAlign: 'center', border: '2px solid #f59e0b', borderRadius: '6px', fontSize: '15px', fontWeight: '800', backgroundColor: darkMode ? '#1e293b' : 'white', color: darkMode ? '#fbbf24' : '#92400e' }} />
                  </td>
                  <td style={{ padding: '14px 10px', fontSize: '18px', textAlign: 'center', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>{scoreData.scores.pmi}</td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <a href="https://www.tradingeconomics.com/china/manufacturing-pmi" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
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
                    <a href="https://www.investing.com/commodities/copper-technical" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#22c55e', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
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
                    <a href="https://www.investing.com/commodities/copper-technical" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#eab308', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
                  </td>
                </tr>
                
                <tr>
                  <td style={{ padding: '14px 10px', fontSize: '14px', textAlign: 'center', fontWeight: '800', color: darkMode ? 'white' : '#000' }}>주간재고<br/><span style={{ fontSize: '10px', color: '#f59e0b' }}>✎ 수동</span></td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                      <input type="number" step="0.1" value={manualInputs.inv} onChange={(e) => setManualInputs({...manualInputs, inv: parseFloat(e.target.value) || 0})}
                        style={{ width: '60px', padding: '8px', textAlign: 'center', border: '2px solid #8b5cf6', borderRadius: '6px', fontSize: '15px', fontWeight: '800', backgroundColor: darkMode ? '#1e293b' : 'white', color: darkMode ? '#a78bfa' : '#5b21b6' }} />
                      <span style={{ fontSize: '14px', fontWeight: '800', color: darkMode ? '#a78bfa' : '#5b21b6' }}>%</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 10px', fontSize: '18px', textAlign: 'center', fontWeight: '900', color: darkMode ? 'white' : '#000' }}>{scoreData.scores.inventory}</td>
                  <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                    <a href="https://en.macromicro.me/collections/4513/commodities-copper/44706/lme-copper-stock" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 12px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>확인→</a>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 심층 리포트 */}
            <div style={{ padding: '16px', backgroundColor: darkMode ? '#0f172a' : '#fdfdfe', borderTop: '3px solid #000' }}>
              <div style={{ fontSize: '15px', fontWeight: '900', color: scoreData.score >= 70 ? '#22c55e' : scoreData.score >= 50 ? '#eab308' : '#dc2626', marginBottom: '8px' }}>{report.title}</div>
              <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, lineHeight: '1.7', color: darkMode ? '#cbd5e1' : '#222' }}>{report.analysis}</p>
            </div>

            {/* 안내 및 버튼 */}
            <div style={{ padding: '16px', backgroundColor: darkMode ? '#1e293b' : '#fff' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', textAlign: 'center', backgroundColor: '#fff9c4', padding: '10px', marginBottom: '12px', border: '2px solid #000', borderRadius: '5px', color: '#000' }}>
                총 합계(20×5=100점)는 5개의 변수가 이동하므로 매일 달라질 수 있습니다.
              </div>
              <button onClick={() => setShowScoreModal(true)} style={{ width: '100%', padding: '14px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>
                📊 상세 배점 기준 확인하기 (CLICK)
              </button>
            </div>
          </div>
        </div>

        {/* 섹션: 사용자 설정 테스트 */}
        <div style={{ background: darkMode ? 'linear-gradient(135deg, #14532d 0%, #166534 100%)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: `2px solid ${darkMode ? '#22c55e' : '#4ade80'}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>🧪</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#14532d' }}>사용자 설정 테스트</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#86efac' : '#166534' }}>원하는 지표만 선택하여 점수 시뮬레이션</p>
            </div>
          </div>

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
              { key: 'pmi', name: '산업PMI', scores: [{ v: 20, l: '51↑' }, { v: 15, l: '50.1~51' }, { v: 10, l: '49.6~50' }, { v: 5, l: '49.5↓' }] },
              { key: 'rsi', name: 'RSI(14)', scores: [{ v: 20, l: '30↓' }, { v: 15, l: '45↓' }, { v: 10, l: '60↓' }, { v: 5, l: '61↑' }] },
              { key: 'macd', name: 'MACD', scores: [{ v: 20, l: '강세' }, { v: 15, l: '전환' }, { v: 10, l: '보합' }, { v: 5, l: '하락' }] },
              { key: 'inventory', name: '주간재고', scores: [{ v: 20, l: '-3%↓' }, { v: 15, l: '-1~-3%' }, { v: 10, l: '±1%' }, { v: 5, l: '증가' }] }
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
        </div>

        {/* 섹션: 금/은 */}
        <div style={{ background: colors.goldBg, border: `2px solid ${colors.goldBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>🥇</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#713f12' }}>금 / 은</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#fcd34d' : '#92400e' }}>구리와의 상관관계 참고</p>
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
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💡 금-구리 관계 힌트</div>
              <div>• 금 = <b>안전자산</b>, 구리 = <b>산업금속</b></div>
              <div>• 경기 좋을 때: 구리↑ 금↓</div>
              <div>• 경기 불안할 때: 구리↓ 금↑</div>
              <div>• <b>금과 구리는 반대로 움직이는 경향</b></div>
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
              <div style={{ fontSize: '11px', color: darkMode ? '#d1d5db' : '#4b5563' }}>🥈 은 (Silver)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: darkMode ? '#d1d5db' : '#374151' }}>${currentData.silverPrice}</div>
            </div>
            <div onClick={() => setShowSilverHint(!showSilverHint)} style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', backgroundColor: darkMode ? 'rgba(209,213,219,0.2)' : 'rgba(75,85,99,0.1)' }}>
              <Lightbulb size={18} color={darkMode ? '#d1d5db' : '#4b5563'} />
            </div>
          </div>

          {showSilverHint && (
            <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)', borderRadius: '10px', padding: '14px', marginBottom: '12px', fontSize: '12px', color: darkMode ? '#e5e7eb' : '#374151', lineHeight: '1.8' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💡 은-구리 관계 힌트</div>
              <div>• 은 = 금 + 구리 <b>혼합 성격</b></div>
              <div>• 상관계수 <b>0.878</b> (매우 높음!)</div>
              <div>• 둘 다 <b>산업 수요</b>에 민감</div>
              <div>• <b>은과 구리는 거의 같이 움직인다!</b></div>
            </div>
          )}

          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: '10px', padding: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {['1w', '1m', '6m', '1y', '10y'].map(p => (
                <button key={p} onClick={() => setSilverChartPeriod(p)} style={getTabStyle(silverChartPeriod === p)}>{getPeriodLabel(p)}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={getFilteredData(silverChartPeriod, silverData)}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                <XAxis dataKey="date" stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 9 }} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} style={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Line type="monotone" dataKey="silver" stroke="#94a3b8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', textAlign: 'right' }}>출처: Yahoo Finance (SI=F)</div>
          </div>
        </div>

        {/* 섹션: 점수 히스토리 */}
        <div style={{ background: colors.userBg, border: `2px solid ${colors.userBorder}`, borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: darkMode ? 'white' : '#831843' }}>점수 히스토리</h2>
              <p style={{ margin: 0, fontSize: '12px', color: darkMode ? '#f9a8d4' : '#9d174d' }}>매일 기록되는 점수 추이</p>
            </div>
          </div>

          <div style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: '12px', padding: '14px' }}>
            <div onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? 'white' : '#831843' }}>📅 최근 10일 기록</span>
              {showHistory ? <ChevronUp size={18} color={darkMode ? '#f9a8d4' : '#9d174d'} /> : <ChevronDown size={18} color={darkMode ? '#f9a8d4' : '#9d174d'} />}
            </div>
            {showHistory && (
              <div style={{ marginTop: '12px' }}>
                {signalHistory.length > 0 ? signalHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                    <span style={{ fontSize: '13px', color: darkMode ? '#f9a8d4' : '#9d174d' }}>{h.date}</span>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: h.score >= 70 ? '#22c55e' : h.score >= 50 ? '#eab308' : '#ef4444' }}>{h.score}점</span>
                    <span style={{ fontSize: '13px', color: darkMode ? 'white' : '#831843' }}>${h.price}</span>
                  </div>
                )) : <div style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#f9a8d4' : '#9d174d', fontSize: '13px' }}>새로고침하면 기록됩니다</div>}
              </div>
            )}
          </div>
        </div>

        {/* 한국 투자 */}
        <div style={{ backgroundColor: darkMode ? '#1e293b' : 'white', border: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb'), borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>🇰🇷</span>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827' }}>한국에서 구리 투자</h3>
          </div>
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

        {/* 뉴스 */}
        <div style={{ backgroundColor: darkMode ? '#1e293b' : 'white', border: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb'), borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Newspaper size={16} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827' }}>실시간 뉴스</h3>
          </div>
          
          {[
            { emoji: '📊', title: '구리 선물 시세', sub: 'Investing.com', url: 'https://kr.investing.com/commodities/copper' },
            { emoji: '📰', title: '구리 관련 뉴스', sub: '네이버 뉴스', url: 'https://search.naver.com/search.naver?where=news&query=구리+원자재' },
            { emoji: '🇺🇸', title: '구리 뉴스 (영어)', sub: 'Yahoo Finance', url: 'https://finance.yahoo.com/quote/HG=F/news/' }
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
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827' }}>📋 구리 관련 종목</h3>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#3b82f6', marginBottom: '8px' }}>해외 ETF</div>
              {['COPX - Global X Copper Miners ETF', 'CPER - 구리 선물 추종 ETF'].map((item, i) => (
                <div key={i} style={{ padding: '8px', backgroundColor: darkMode ? '#0f172a' : '#f9fafb', borderRadius: '6px', marginBottom: '6px', fontSize: '12px', color: darkMode ? '#e2e8f0' : '#374151' }}>{item}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e', marginBottom: '8px' }}>개별 광산주</div>
              {['FCX - Freeport-McMoRan (세계 최대)', 'SCCO - Southern Copper'].map((item, i) => (
                <div key={i} style={{ padding: '8px', backgroundColor: darkMode ? '#0f172a' : '#f9fafb', borderRadius: '6px', marginBottom: '6px', fontSize: '12px', color: darkMode ? '#e2e8f0' : '#374151' }}>{item}</div>
              ))}
            </div>
          </div>
        )}

        {showPortfolio && (
          <div style={{ backgroundColor: darkMode ? '#1e293b' : 'white', borderRadius: '16px', padding: '16px', marginBottom: '16px', border: '1px solid ' + (darkMode ? '#334155' : '#e5e7eb') }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: darkMode ? 'white' : '#111827' }}>💼 분산 포트폴리오 예시</h3>
            {[
              { name: 'KODEX 구리선물(H)', pct: 25, color: '#3b82f6' },
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
                  <strong>2. 산업PMI:</strong><br/>
                  51↑ (20점) / 50.1~51 (15점) / 49.6~50 (10점) / 49.5↓ (5점)
                </p>
                <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                  <strong>3. RSI (14일):</strong><br/>
                  30↓ (20점) / 45↓ (15점) / 60↓ (10점) / 61↑ (5점)
                </p>
                <p style={{ margin: '8px 0', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                  <strong>4. MACD 추세:</strong><br/>
                  강세 (20점) / 전환 (15점) / 보합 (10점) / 하락 (5점)
                </p>
                <p style={{ margin: '8px 0' }}>
                  <strong>5. 주간재고 변동:</strong><br/>
                  -3%↓ (20점) / -1~-3% (15점) / ±1% (10점) / 증가 (5점)
                </p>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#fff9c4', borderTop: '2px solid #000', fontSize: '12px', fontWeight: '700', textAlign: 'center', color: '#000' }}>
                💡 총 합계(20×5=100점)는 5개의 변수가 이동하므로 매일 달라질 수 있습니다.
              </div>
              <button onClick={() => setShowScoreModal(false)} style={{ width: '100%', padding: '15px', backgroundColor: '#000', color: '#fff', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '16px' }}>닫기</button>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#64748b' : '#9ca3af', fontSize: '11px' }}>
          <div>⚠️ 투자의 책임은 본인에게 있습니다</div>
          <div>데이터 출처: Yahoo Finance, Investing.com</div>
        </div>
      </div>
    </div>
  );
}

export default App;

