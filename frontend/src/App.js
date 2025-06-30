"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
} from "recharts";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Progress } from "./components/ui/progress";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { Switch } from "./components/ui/switch";
import {
  Search,
  Moon,
  Sun,
  DollarSign,
  Activity,
  Target,
  Calculator,
  Eye,
  Star,
  Bell,
  Plus,
  Download,
  Newspaper,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const stockSuggestions = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA"];

function StockDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [recommendation, setRecommendation] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [duration, setDuration] = useState(10);
  const [rsi, setRsi] = useState(0);
  const [ma20, setMa20] = useState(0);
  const [ma50, setMa50] = useState(0);
  const [bollingerUpper, setBollingerUpper] = useState(0);
  const [bollingerLower, setBollingerLower] = useState(0);
  const [volumeSpike, setVolumeSpike] = useState(0);
  const [support, setSupport] = useState(0);
  const [resistance, setResistance] = useState(0);
  const [atr, setAtr] = useState(0);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [tradeStatus, setTradeStatus] = useState("");
  const [volatility, setVolatility] = useState("Medium");
  const [sentiment, setSentiment] = useState("Neutral");
  const [timeRange, setTimeRange] = useState("1D");
  const [activePoint, setActivePoint] = useState(null);
  const [portfolio, setPortfolio] = useState([{ ticker: "GOOGL", quantity: 10, buyPrice: 160 }]);
  const [alertPrice, setAlertPrice] = useState(170);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lineThickness, setLineThickness] = useState(2);
  const [showGrid, setShowGrid] = useState(true);
  const [menuOpen, setMenuOpen] = useState({ analysis: false, portfolio: false, settings: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("analysis");
  const [chartType, setChartType] = useState("line"); // Added missing state

  const handleAnalyze = useCallback(async () => {
    if (!ticker || !/^[A-Z]{1,5}$/.test(ticker)) {
      alert("Please enter a valid stock ticker (e.g., AAPL).");
      return;
    }
    setIsLoading(true);

    try {
      const response = await axios.get(`https://stock-analysis-l6x2.onrender.com/analyze?ticker=${ticker}`);
      const result = response.data;

      if (result.error) {
        alert(result.error || "Error fetching data for the ticker.");
        return;
      }

      if (!result.data || result.data.length === 0) {
        alert("No data available for the selected ticker.");
        setData([{ Date: "No data", Close: 0 }]);
        return;
      }

      setData(result.data);

      const today = new Date("2025-06-30T05:37:00Z").toISOString().split("T")[0];
      const latestData = result.data.find(
        (d) => new Date(d.Date).toISOString().split("T")[0] === today
      ) || result.data[result.data.length - 1];
      setCurrentPrice(latestData.Close);

      if (alertPrice && latestData.Close >= alertPrice) {
        setAlertTriggered(true);
        setTimeout(() => setAlertTriggered(false), 5000);
      }

      const avgScore = result.data.slice(-5).reduce((sum, d) => sum + (d.Score || 0), 0) / 5 || 0;
      setRecommendation(avgScore >= 3 ? "BUY" : "DO NOT BUY");

      setRsi(latestData.RSI || 0);
      setMa20(latestData.MA20 || 0);
      setMa50(latestData.MA50 || 0);
      setBollingerUpper(latestData.BB_upper || 0);
      setBollingerLower(latestData.BB_lower || 0);
      setVolumeSpike(latestData.Volume_Spike || 0);
      setSupport(latestData.Support || 0);
      setResistance(latestData.Resistance || 0);
      setAtr(latestData.ATR || 0);
      setScore(latestData.Score || 0);
      setAccuracy(result.accuracy || 0);
      setPrediction(result.prediction?.toFixed(2) || null);
      setTradeStatus(result.trade_action || "");
      setSentiment(result.sentiment > 0 ? "Positive" : result.sentiment < 0 ? "Negative" : "Neutral");

      setVolatility(latestData.ATR > 5 ? "High" : latestData.ATR > 2 ? "Medium" : "Low");
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Error fetching data. Please try again.";
      alert(errorMessage);
      console.error("API Error:", error);
      setData([{ Date: "No data", Close: 0 }]);
    } finally {
      setIsLoading(false);
    }
  }, [ticker, alertPrice]);

  const handleTickerChange = (e) => {
    const value = e.target.value.toUpperCase();
    setTicker(value);
    if (value) {
      const filteredSuggestions = stockSuggestions.filter((s) => s.startsWith(value));
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    setTicker(suggestion);
    setSuggestions([]);
  };

  const projectedReturn = monthlyInvestment * duration * 12 * (1 + 0.12);

  const volatilityColor =
    volatility === "High" ? "bg-red-500" : volatility === "Medium" ? "bg-yellow-500" : "bg-green-500";
  const volatilityProgress = volatility === "High" ? 85 : volatility === "Medium" ? 50 : 25;

  const portfolioValue = portfolio.reduce((sum, stock) => sum + stock.quantity * (currentPrice || 0), 0);
  const portfolioTrend = [
    { date: "2025-06-20", value: 1500 },
    { date: "2025-06-21", value: 1520 },
    { date: "2025-06-22", value: 1480 },
    { date: "2025-06-23", value: 1550 },
    { date: "2025-06-24", value: portfolioValue },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (ticker) handleAnalyze();
    }, 30000);
    return () => clearInterval(interval);
  }, [ticker, alertPrice, handleAnalyze]);

  const getChartData = () => {
    if (!data || data.length === 0) {
      if (timeRange === "1D") {
        const today = new Date("2025-06-30T05:37:00Z");
        return [
          {
            Date: today.toLocaleDateString("en-US", {
              timeZone: "Asia/Kolkata",
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            Close: currentPrice || 0,
            Volume: 0,
          },
        ];
      }
      return [{ Date: "No data available", Close: 0, Volume: 0 }];
    }

    const today = new Date("2025-06-30T05:37:00Z");
    let filteredData = [...data];

    switch (timeRange) {
      case "1D":
        filteredData = data.filter((d) => {
          const date = new Date(d.Date);
          return date.toDateString() === today.toDateString();
        }).map((d) => ({
          ...d,
          Date: new Date(d.Date).toLocaleTimeString("en-US", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
          }),
          Close: d.Close,
          Volume: d.Volume || 0,
        }));
        if (filteredData.length === 0 && currentPrice) {
          filteredData = [
            {
              Date: today.toLocaleTimeString("en-US", {
                timeZone: "Asia/Kolkata",
                hour: "2-digit",
                minute: "2-digit",
              }),
              Close: currentPrice,
              Volume: 0,
            },
          ];
        }
        break;
      case "5D":
        const fiveDaysAgo = new Date(today);
        fiveDaysAgo.setDate(today.getDate() - 5);
        filteredData = data.filter((d) => {
          const date = new Date(d.Date);
          return date >= fiveDaysAgo && date <= today;
        }).map((d) => ({
          ...d,
          Date: new Date(d.Date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          Close: d.Close,
          Volume: d.Volume || 0,
        }));
        break;
      case "1M":
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        filteredData = data.filter((d) => {
          const date = new Date(d.Date);
          return date >= oneMonthAgo && date <= today;
        }).map((d) => ({
          ...d,
          Date: new Date(d.Date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          Close: d.Close,
          Volume: d.Volume || 0,
        }));
        break;
      case "6M":
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        filteredData = data.filter((d) => {
          const date = new Date(d.Date);
          return date >= sixMonthsAgo && date <= today;
        }).map((d) => ({
          ...d,
          Date: new Date(d.Date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          Close: d.Close,
          Volume: d.Volume || 0,
        }));
        break;
      case "YTD":
        const yearStart = new Date(today.getFullYear(), 0, 1);
        filteredData = data.filter((d) => {
          const date = new Date(d.Date);
          return date >= yearStart && date <= today;
        }).map((d) => ({
          ...d,
          Date: new Date(d.Date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          Close: d.Close,
          Volume: d.Volume || 0,
        }));
        break;
      case "1Y":
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        filteredData = data.filter((d) => {
          const date = new Date(d.Date);
          return date >= oneYearAgo && date <= today;
        }).map((d) => ({
          ...d,
          Date: new Date(d.Date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          Close: d.Close,
          Volume: d.Volume || 0,
        }));
        break;
      case "5Y":
        const fiveYearsAgo = new Date(today);
        fiveYearsAgo.setFullYear(today.getFullYear() - 5);
        filteredData = data.filter((d) => {
          const date = new Date(d.Date);
          return date >= fiveYearsAgo && date <= today;
        }).map((d) => ({
          ...d,
          Date: new Date(d.Date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          Close: d.Close,
          Volume: d.Volume || 0,
        }));
        break;
      case "Max":
        filteredData = data.map((d) => ({
          ...d,
          Date: new Date(d.Date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          Close: d.Close,
          Volume: d.Volume || 0,
        }));
        break;
      default:
        break;
    }

    if (filteredData.length === 0) {
      return [{ Date: "No data available", Close: 0, Volume: 0 }];
    }

    return filteredData;
  };

  const getChangeChartData = () => {
    const chartData = getChartData();
    return chartData.map((d, index) => {
      if (index === 0) return { ...d, PositiveChange: 0, NegativeChange: 0 };
      const prevClose = chartData[index - 1].Close;
      const change = d.Close - prevClose;
      return {
        ...d,
        PositiveChange: change > 0 ? change : 0,
        NegativeChange: change < 0 ? Math.abs(change) : 0,
      };
    });
  };

  const formatTooltipDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getChartComponent = () => {
    const chartData = getChartData();
    switch (chartType) {
      case "line":
        return (
          <LineChart
            data={chartData}
            onMouseMove={(e) => {
              if (e.activePayload) {
                setActivePoint(e.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />}
            <XAxis
              dataKey="Date"
              stroke={darkMode ? "#D1D5DB" : "#374151"}
              interval="preserveStartEnd"
              textAnchor="middle"
              tick={{ fill: darkMode ? "#D1D5DB" : "#374151", fontSize: 12 }}
            />
            <YAxis
              domain={["dataMin", "dataMax"]}
              stroke={darkMode ? "#D1D5DB" : "#374151"}
              tick={{ fill: darkMode ? "#D1D5DB" : "#374151", fontSize: 12 }}
              tickCount={6}
            />
            <Tooltip
              contentStyle={{ backgroundColor: darkMode ? "#1F2937" : "#FFFFFF", color: darkMode ? "#D1D5DB" : "#374151" }}
              labelFormatter={formatTooltipDate}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
            />
            <Line
              type="monotone"
              dataKey="Close"
              stroke={darkMode ? "#00FFCC" : "#00C4B4"}
              strokeWidth={lineThickness}
              dot={false}
              isAnimationActive={true}
              animationDuration={500}
            />
            {activePoint && (
              <Scatter
                data={[activePoint]}
                fill={darkMode ? "#FF4444" : "#FF4136"}
                shape="circle"
                isAnimationActive={false}
                fillOpacity={0.9}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            )}
            {chartData[0]?.Date.startsWith("No data") && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={darkMode ? "#D1D5DB" : "#374151"} fontSize={24} fontWeight="bold">
                No data available
              </text>
            )}
          </LineChart>
        );
      case "movement":
        const movementData = getChangeChartData();
        return (
          <LineChart data={movementData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4B5563" : "#E5E7EB"} />}
            <XAxis
              dataKey="Date"
              stroke={darkMode ? "#D1D5DB" : "#374151"}
              interval="preserveStartEnd"
              textAnchor="middle"
              tick={{ fill: darkMode ? "#D1D5DB" : "#374151", fontSize: 12 }}
            />
            <YAxis
              domain={["dataMin", "dataMax + 5"]}
              stroke={darkMode ? "#D1D5DB" : "#374151"}
              tick={{ fill: darkMode ? "#D1D5DB" : "#374151", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: darkMode ? "#1F2937" : "#FFFFFF", color: darkMode ? "#D1D5DB" : "#374151" }}
              labelFormatter={formatTooltipDate}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, value > 0 ? "Increase" : "Decrease"]}
            />
            <Line
              type="monotone"
              dataKey="PositiveChange"
              stroke={darkMode ? "#00FF99" : "#27AE60"}
              strokeWidth={lineThickness}
              dot={false}
              isAnimationActive={true}
              animationDuration={500}
              name="Increase"
            />
            <Line
              type="monotone"
              dataKey="NegativeChange"
              stroke={darkMode ? "#FF5555" : "#E74C3C"}
              strokeWidth={lineThickness}
              dot={false}
              isAnimationActive={true}
              animationDuration={500}
              name="Decrease"
            />
            {movementData[0]?.Date.startsWith("No data") && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill={darkMode ? "#D1D5DB" : "#374151"} fontSize={24} fontWeight="bold">
                No data available
              </text>
            )}
          </LineChart>
        );
      default:
        return null;
    }
  };

  const getRecommendationDetails = () => {
    const details = [];
    if (rsi > 70) details.push("RSI > 70: Overbought, consider SELL.");
    else if (rsi < 30) details.push("RSI < 30: Oversold, consider BUY.");
    else details.push("RSI neutral.");

    if (currentPrice > bollingerUpper) details.push("Price above Bollinger Upper: SELL signal.");
    else if (currentPrice < bollingerLower) details.push("Price below Bollinger Lower: BUY signal.");
    else details.push("Price within Bollinger Bands: HOLD.");

    if (ma20 > ma50 && currentPrice > ma20) details.push("MA20 > MA50 & Price > MA20: BUY signal.");
    else if (ma20 < ma50 && currentPrice < ma20) details.push("MA20 < MA50 & Price < MA20: SELL signal.");
    else details.push("Moving averages neutral: HOLD.");

    return details.length > 0 ? details : ["No strong signals detected."];
  };

  const addToPortfolio = () => {
    if (!ticker || !currentPrice) {
      alert("Please analyze a valid stock before adding to portfolio.");
      return;
    }
    const newStock = { ticker, quantity: 10, buyPrice: currentPrice };
    setPortfolio([...portfolio, newStock]);
  };

  const setAlert = () => {
    if (!currentPrice || !alertPrice || alertPrice <= currentPrice) {
      alert("Please set a valid alert price above the current price.");
      return;
    }
    alert(`Alert set! Notify when ${ticker} reaches $${alertPrice}.`);
  };

  const exportData = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
    let filteredData = [...getChartData()];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredData = filteredData.filter((d) => {
        const date = new Date(d.Date);
        return date >= start && date <= end;
      });
    }
    if (filteredData.length === 0 || filteredData[0].Date.startsWith("No data")) {
      alert("No data available for the selected date range.");
      return;
    }
    const csv = [
      "Date,Close,RSI,MA20,MA50,BB_upper,BB_lower,Volume_Spike,Support,Resistance,ATR,Score",
      ...filteredData.map((d) => `${d.Date},${d.Close},${d.RSI},${d.MA20},${d.MA50},${d.BB_upper},${d.BB_lower},${d.Volume_Spike},${d.Support},${d.Resistance},${d.ATR},${d.Score}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticker}_data_${startDate || "start"}_to_${endDate || "end"}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getMockNews = () => [
    { title: `${ticker} Sees 5% Gain`, date: "2025-06-25", summary: "Analysts predict continued growth." },
    { title: `${ticker} Faces Market Pressure`, date: "2025-06-24", summary: "Recent sell-off reported." },
  ];

  const getPerformanceData = () => ({
    "52-week High": data.length ? Math.max(...data.map((d) => d.Close)) : 0,
    "52-week Low": data.length ? Math.min(...data.map((d) => d.Close)) : 0,
    "Avg Volume": data.length ? (data.reduce((sum, d) => sum + (d.Volume || 0), 0) / data.length).toFixed(0) : 0,
  });

  const filteredMenuItems = [
    { id: "analysis", title: "Analysis", icon: Search, subItems: [
      { id: "current", title: "Current Analysis", icon: DollarSign },
      { id: "recommendation", title: "Recommendation", icon: Target },
      { id: "prediction", title: "Prediction", icon: Eye },
      { id: "analysis-details", title: "Analysis Details", icon: Star },
    ]},
    { id: "charts", title: "Charts", icon: Activity, subItems: [] },
    { id: "portfolio", title: "Portfolio", icon: Star, subItems: [
      { id: "sip", title: "SIP Calculator", icon: Calculator },
      { id: "portfolio-tracker", title: "Portfolio Tracker", icon: Eye },
    ]},
    { id: "news", title: "News", icon: Newspaper, subItems: [] },
    { id: "performance", title: "Performance", icon: DollarSign, subItems: [] },
    { id: "alerts", title: "Alerts", icon: Bell, subItems: [] },
    { id: "settings", title: "Settings", icon: Target, subItems: [
      { id: "chart-settings", title: "Chart Settings", icon: Activity },
    ]},
  ].filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subItems.some((sub) => sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderSection = () => {
    switch (activeSection) {
      case "analysis":
        return (
          <>
            <section id="analysis" className="mb-8">
              <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                    <Search className="h-8 w-8" /> Stock Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="relative w-full">
                      <Input
                        placeholder="Enter stock ticker (e.g., AAPL)"
                        value={ticker}
                        onChange={handleTickerChange}
                        className="w-full p-4 text-xl border-2 border-gray-300 dark:border-neon-blue rounded-xl focus:border-indigo-600 dark:bg-gray-700/50 dark:text-neon-cyan"
                      />
                      {suggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-neon-purple rounded-xl mt-1 shadow-lg">
                          {suggestions.map((suggestion, index) => (
                            <li
                              key={index}
                              onClick={() => handleSuggestionSelect(suggestion)}
                              className="p-3 text-lg hover:bg-indigo-100 dark:hover:bg-neon-blue/20 cursor-pointer text-gray-800 dark:text-neon-cyan"
                            >
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="bg-indigo-600 dark:bg-neon-purple text-white hover:bg-indigo-700 dark:hover:bg-neon-blue p-4 text-xl rounded-xl"
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <span className="animate-pulse">Loading...</span>
                        </span>
                      ) : (
                        <>
                          <Search className="h-6 w-6 mr-2" /> Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
            {menuOpen.analysis && (
              <>
                <section id="current" className="mb-8">
                  <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                        <DollarSign className="h-8 w-8" /> Current Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-5xl font-extrabold text-gray-800 dark:text-neon-cyan">
                          ${currentPrice?.toFixed(2) || "N/A"}
                        </div>
                        {currentPrice && data.length >= 2 && (
                          <div
                            className={`text-2xl ${
                              currentPrice >= data[data.length - 2]?.Close ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {currentPrice >= data[data.length - 2]?.Close ? "+" : ""}
                            {(currentPrice - data[data.length - 2]?.Close).toFixed(2)} (
                            {(
                              ((currentPrice - data[data.length - 2]?.Close) / data[data.length - 2]?.Close) *
                              100
                            ).toFixed(2)}
                            %)
                          </div>
                        )}
                      </div>
                      <Separator className={darkMode ? "bg-neon-blue" : "bg-gray-300"} />
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">RSI</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            {rsi.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">MA20</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            ${ma20.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">MA50</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            ${ma50.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Bollinger Upper</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            ${bollingerUpper.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Bollinger Lower</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            ${bollingerLower.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Volume Spike</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            {volumeSpike}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Support</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            ${support.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Resistance</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            ${resistance.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">ATR</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            ${atr.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Score</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            {score.toFixed(2)}/5
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Accuracy</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            {accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Prediction (Up Probability)</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            {prediction !== null ? `${(prediction * 100).toFixed(1)}%` : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xl text-gray-600 dark:text-neon-cyan">Trade Status</span>
                          <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                            {tradeStatus || "No trade"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
                <section id="recommendation" className="mb-8">
                  <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
                    <CardContent>
                      <div
                        className={`p-6 rounded-xl ${
                          recommendation === "BUY"
                            ? "bg-green-100 dark:bg-green-400/20 text-green-700 dark:text-neon-green"
                            : "bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-neon-red"
                        }`}
                      >
                        <div className="text-3xl font-bold">{recommendation || "N/A"}</div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
                <section id="prediction" className="mb-8">
                  <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                        <Target className="h-8 w-8" /> Tomorrow's Prediction
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-800 dark:text-neon-cyan">
                          ${(currentPrice * (1 + (prediction || 0))).toFixed(2) || "N/A"}
                        </div>
                        <div className="text-xl text-gray-600 dark:text-neon-cyan mt-2">
                          Expected price for next trading day (based on prediction)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
                <section id="analysis-details" className="mb-8">
                  <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                        <Star className="h-8 w-8" /> Buy/Hold/Sell Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg text-gray-600 dark:text-neon-cyan">
                        Detailed recommendation based on technical indicators:
                      </div>
                      <ul className="list-disc pl-5 space-y-2">
                        {getRecommendationDetails().map((detail, index) => (
                          <li key={index} className="text-xl text-gray-800 dark:text-neon-green">
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}
          </>
        );
      case "charts":
        return (
          <section id="charts" className="mb-8">
            <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-3xl font-bold flex items-center justify-between text-gray-800 dark:text-neon-green">
                  <span>{ticker || "Stock"} - Price Chart</span>
                  <div className="space-x-2">
                    {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"].map((range) => (
                      <Button
                        key={range}
                        variant={timeRange === range ? "default" : "outline"}
                        onClick={() => setTimeRange(range)}
                        className={`text-lg p-3 rounded-xl ${
                          timeRange === range
                            ? "bg-green-500 dark:bg-neon-green text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-neon-cyan hover:bg-gray-300 dark:hover:bg-neon-blue/50"
                        }`}
                      >
                        {range}
                      </Button>
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-row gap-4">
                <div className="w-2/3">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      {getChartComponent()}
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="w-1/3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-lg text-gray-600 dark:text-neon-cyan">Open</span>
                      <span className="font-semibold text-lg text-gray-800 dark:text-neon-green">
                        ${data.length ? data[0]?.Close.toFixed(2) : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg text-gray-600 dark:text-neon-cyan">High</span>
                      <span className="font-semibold text-lg text-gray-800 dark:text-neon-green">
                        ${Math.max(...data.map(d => d.Close)).toFixed(2) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg text-gray-600 dark:text-neon-cyan">Low</span>
                      <span className="font-semibold text-lg text-gray-800 dark:text-neon-green">
                        ${Math.min(...data.map(d => d.Close)).toFixed(2) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg text-gray-600 dark:text-neon-cyan">Mkt Cap</span>
                      <span className="font-semibold text-lg text-gray-800 dark:text-neon-green">2.37Cr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg text-gray-600 dark:text-neon-cyan">P/E Ratio</span>
                      <span className="font-semibold text-lg text-gray-800 dark:text-neon-green">36.42</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg text-gray-600 dark:text-neon-cyan">52-wk High</span>
                      <span className="font-semibold text-lg text-gray-800 dark:text-neon-green">242.52</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-lg text-gray-600 dark:text-neon-cyan">52-wk Low</span>
                      <span className="font-semibold text-lg text-gray-800 dark:text-neon-green">151.61</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardContent>
                <div className="flex items-center gap-4 mt-4 text-lg">
                  <div className="flex space-x-4">
                    <div>
                      <Label className="text-gray-600 dark:text-neon-cyan">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-neon-blue rounded"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-600 dark:text-neon-cyan">End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-neon-blue rounded"
                      />
                    </div>
                    <Button onClick={exportData} className="bg-gray-200 dark:bg-neon-blue text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-neon-purple p-2 rounded-xl">
                      <Download className="h-5 w-5 mr-2" /> Export CSV
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className={darkMode ? "text-neon-green" : "text-gray-700"}>Buy Signals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className={darkMode ? "text-neon-green" : "text-gray-700"}>Sell Signals</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        );
      case "portfolio":
        return (
          <>
            {menuOpen.portfolio && (
              <>
                <section id="sip" className="mb-8">
                  <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                        <Calculator className="h-8 w-8" /> SIP Calculator
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-neon-cyan">
                        Calculate your systematic investment plan returns
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-xl text-gray-600 dark:text-neon-cyan">Monthly Investment ($)</Label>
                          <Input
                            type="number"
                            value={monthlyInvestment}
                            onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                            className="w-full p-4 text-xl border-2 border-gray-300 dark:border-neon-blue rounded-xl focus:border-indigo-600 dark:bg-gray-700/50 dark:text-neon-cyan"
                          />
                        </div>
                        <div>
                          <Label className="text-xl text-gray-600 dark:text-neon-cyan">Duration (Years)</Label>
                          <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            className="w-full p-4 text-xl border-2 border-gray-300 dark:border-neon-blue rounded-xl focus:border-indigo-600 dark:bg-gray-700/50 dark:text-neon-cyan"
                          />
                        </div>
                      </div>
                      <div className="p-6 bg-indigo-50 dark:bg-neon-blue/10 rounded-xl">
                        <div className="text-lg text-gray-600 dark:text-neon-cyan">Projected Return</div>
                        <div className="text-4xl font-bold text-indigo-600 dark:text-neon-green">
                          ${projectedReturn.toLocaleString()}
                        </div>
                        <div className="text-lg text-gray-500 dark:text-neon-cyan">
                          Total Investment: ${(monthlyInvestment * duration * 12).toLocaleString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
                <section id="portfolio-tracker" className="mb-8">
                  <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                        <Star className="h-8 w-8" /> Portfolio Tracker
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={portfolioTrend}>
                            <XAxis dataKey="date" stroke={darkMode ? "#D1D5DB" : "#374151"} />
                            <YAxis stroke={darkMode ? "#D1D5DB" : "#374151"} />
                            <Tooltip
                              contentStyle={{ backgroundColor: darkMode ? "#1F2937" : "#FFFFFF", color: darkMode ? "#D1D5DB" : "#374151" }}
                              formatter={(value) => [`$${Number(value).toFixed(2)}`, "Value"]}
                            />
                            <Line type="monotone" dataKey="value" stroke={darkMode ? "#00FFCC" : "#00C4B4"} strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <ul className="space-y-4 mt-4">
                        {portfolio.map((stock, index) => (
                          <li key={index} className="flex justify-between items-center p-4 bg-gray-100 dark:bg-neon-blue/10 rounded-xl">
                            <span className="text-xl">{stock.ticker}</span>
                            <span className="text-xl">
                              Qty: {stock.quantity}, Value: ${(stock.quantity * (currentPrice || 0)).toFixed(2)},
                              Gain/Loss: ${(stock.quantity * ((currentPrice || 0) - stock.buyPrice)).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={addToPortfolio}
                        className="mt-4 bg-green-500 dark:bg-neon-green text-white hover:bg-green-600 dark:hover:bg-neon-cyan p-4 text-xl rounded-xl w-full"
                      >
                        <Plus className="h-6 w-6 mr-2" /> Add Stock
                      </Button>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}
          </>
        );
      case "news":
        return (
          <section id="news" className="mb-8">
            <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                  <Newspaper className="h-8 w-8" /> News Feed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {getMockNews().map((news, index) => (
                    <li key={index} className="p-4 bg-gray-100 dark:bg-neon-blue/10 rounded-xl">
                      <div className="font-semibold text-lg text-gray-800 dark:text-neon-cyan">{news.title}</div>
                      <div className="text-sm text-gray-600 dark:text-neon-green">{news.date}</div>
                      <div className="text-sm text-gray-600 dark:text-neon-cyan">{news.summary}</div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        );
      case "performance":
        return (
          <section id="performance" className="mb-8">
            <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                  <DollarSign className="h-8 w-8" /> Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(getPerformanceData()).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-xl text-gray-600 dark:text-neon-cyan">{key}</span>
                    <span className="font-semibold text-xl text-gray-800 dark:text-neon-green">
                      {key.includes("Volume") ? value : `$${value.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        );
      case "alerts":
        return (
          <section id="alerts" className="mb-8">
            <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                  <Bell className="h-8 w-8" /> Custom Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-xl text-gray-600 dark:text-neon-cyan">Alert Price ($)</Label>
                    <Input
                      type="number"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(Number(e.target.value))}
                      className="w-full p-4 text-xl border-2 border-gray-300 dark:border-neon-blue rounded-xl focus:border-indigo-600 dark:bg-gray-700/50 dark:text-neon-cyan"
                    />
                  </div>
                  <Button
                    onClick={setAlert}
                    className="bg-yellow-500 dark:bg-neon-yellow text-white hover:bg-yellow-600 dark:hover:bg-neon-orange p-4 text-xl rounded-xl w-full"
                  >
                    <Bell className="h-6 w-6 mr-2" /> Set Alert
                  </Button>
                  {alertTriggered && (
                    <div className="p-4 bg-red-100 dark:bg-red-400/20 text-red-700 dark:text-neon-red rounded-xl text-center animate-pulse">
                      Alert! {ticker} reached ${alertPrice}!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        );
      case "settings":
        return (
          <>
            {menuOpen.settings && (
              <section id="chart-settings" className="mb-8">
                <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                      <Target className="h-8 w-8" /> Chart Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xl text-gray-600 dark:text-neon-cyan">Line Thickness</Label>
                        <Input
                          type="number"
                          value={lineThickness}
                          onChange={(e) => setLineThickness(Math.max(1, Number(e.target.value)))}
                          className="w-20 p-2 border border-gray-300 dark:border-neon-blue rounded"
                          min="1"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xl text-gray-600 dark:text-neon-cyan">Show Grid</Label>
                        <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </>
        );
      default:
        return null;
    }
  };

  const toggleMenu = (menu) => {
    setMenuOpen((prev) => ({ ...prev, [menu]: !prev[menu] }));
    if (menu === activeSection && menuOpen[menu]) {
      setActiveSection("");
    } else {
      setActiveSection(menu);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "dark bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
          : "bg-gradient-to-br from-blue-50 via-indigo-100 to-white text-gray-900"
      } font-sans flex flex-col`}
    >
      <main className="p-6 w-full flex-grow">
        <header className="border-b border-gray-200 dark:border-neon-blue shadow-md mb-6">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-4xl font-extrabold text-indigo-600 dark:text-neon-cyan">StockMaster</h1>
          </div>
        </header>

        {renderSection()}

        <section id="volatility" className="mb-8">
          <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                <Activity className="h-8 w-8" /> Volatility Meter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl text-gray-600 dark:text-neon-cyan">Risk Level</span>
                  <Badge className={`text-xl ${volatilityColor} p-2`}>{volatility}</Badge>
                </div>
                <Progress value={volatilityProgress} className="h-6 bg-gray-200 dark:bg-neon-blue/20" />
                <div className="flex justify-between text-lg text-gray-500 dark:text-neon-cyan">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="sentiment" className="mb-8">
          <Card className="bg-white/90 dark:bg-gray-800/80 shadow-lg rounded-xl border border-gray-200 dark:border-neon-purple hover:shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-3xl font-bold flex items-center gap-2 text-gray-800 dark:text-neon-green">
                <Eye className="h-8 w-8" /> Market Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge
                  variant={
                    sentiment === "Positive"
                      ? "default"
                      : sentiment === "Neutral"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-2xl px-8 py-4 bg-gray-200 dark:bg-neon-blue/30"
                >
                  {sentiment}
                </Badge>
                <div className="text-xl text-gray-600 dark:text-neon-cyan mt-2">
                  Based on news analysis
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-900 p-4 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-neon-blue"
            />
            <nav className="flex space-x-4">
              {filteredMenuItems.map((item) => (
                <div key={item.id} className="relative">
                  <Button
                    variant="ghost"
                    className={`text-lg font-semibold text-gray-700 dark:text-neon-cyan hover:bg-gray-200 dark:hover:bg-neon-blue/20 rounded-lg transition-colors duration-200 ${
                      activeSection === item.id ? "bg-gray-300 dark:bg-neon-blue/30" : ""
                    }`}
                    onClick={() => toggleMenu(item.id)}
                  >
                    <span className="flex items-center">
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.title}
                    </span>
                    {item.subItems.length > 0 && (
                      <span>{menuOpen[item.id] ? <ChevronDown /> : <ChevronRight />}</span>
                    )}
                  </Button>
                  {item.subItems.length > 0 && menuOpen[item.id] && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-neon-purple rounded-lg shadow-lg z-10">
                      {item.subItems.map((sub) => (
                        <Button
                          key={sub.id}
                          variant="ghost"
                          className="w-full justify-start text-md text-gray-600 dark:text-neon-green hover:bg-gray-200 dark:hover:bg-neon-blue/20 rounded-lg transition-colors duration-200"
                          onClick={() => {
                            setActiveSection(sub.id);
                            setMenuOpen((prev) => ({ ...prev, [item.id]: false }));
                          }}
                        >
                          <sub.icon className="h-4 w-4 mr-2" />
                          {sub.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-sm text-gray-700 dark:text-neon-cyan hover:bg-gray-300 dark:hover:bg-neon-blue/30"
                onClick={() => setDarkMode(false)}
              >
                <Sun className="h-5 w-5 mr-2 text-yellow-500" />
                Light
              </Button>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} className="mx-2" />
              <Button
                variant="ghost"
                className="text-sm text-gray-700 dark:text-neon-cyan hover:bg-gray-300 dark:hover:bg-neon-blue/30"
                onClick={() => setDarkMode(true)}
              >
                <Moon className="h-5 w-5 mr-2 text-purple-500" />
                Dark
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default StockDashboard;