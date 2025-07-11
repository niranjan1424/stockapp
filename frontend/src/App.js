"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Star,
  Zap,
  BarChart3,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";

// Enhanced UI Components
const AnimatedCard = ({ children, className = "", gradient = "from-purple-400 to-pink-400", ...props }) => (
  <div
    className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-1 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 group ${className}`}
    {...props}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-6 h-full">{children}</div>
  </div>
);

const GlowButton = ({ children, onClick, className = "", glowColor = "purple", disabled = false, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative px-8 py-4 rounded-2xl font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    style={{
      background: `linear-gradient(135deg, ${glowColor === "purple" ? "#8B5CF6, #A855F7" : glowColor === "blue" ? "#3B82F6, #1D4ED8" : "#10B981, #059669"})`,
      boxShadow: `0 0 30px ${glowColor === "purple" ? "#8B5CF6" : glowColor === "blue" ? "#3B82F6" : "#10B981"}40`,
    }}
    {...props}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
  </button>
);

const AnimatedInput = ({ className = "", ...props }) => (
  <div className="relative">
    <input
      className={`w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/20 text-white placeholder-white/60 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/30 transition-all duration-300 text-lg ${className}`}
      {...props}
    />
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
  </div>
);

const MetricCard = ({ title, value, change, icon: Icon, gradient, trend }) => (
  <AnimatedCard gradient={gradient} className="h-40">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${trend === "up" ? "bg-green-400/30 text-green-100" : "bg-red-400/30 text-red-100"}`}
      >
        {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {change}
      </div>
    </div>
    <div className="text-white/80 text-sm font-medium mb-2">{title}</div>
    <div className="text-3xl font-bold text-white">{value}</div>
  </AnimatedCard>
);

const ColorfulChart = ({ data, type = "line", colors = ["#FF6B6B", "#4ECDC4", "#45B7D1"] }) => {
  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "none",
                borderRadius: "15px",
                color: "white",
              }}
            />
            <Area type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={3} fill="url(#colorGradient)" />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "none",
                borderRadius: "15px",
                color: "white",
              }}
            />
            <Bar dataKey="value" fill={colors[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        );
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" />
            <YAxis stroke="rgba(255,255,255,0.7)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "none",
                borderRadius: "15px",
                color: "white",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={4}
              dot={{ fill: colors[0], strokeWidth: 2, r: 8 }}
              activeDot={{ r: 12, stroke: colors[0], strokeWidth: 3, fill: "#fff" }}
            />
          </LineChart>
        );
    }
  };

  return <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>;
};

function StockDashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [ticker, setTicker] = useState("AAPL");
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [rsiData, setRsiData] = useState([]);
  const [error, setError] = useState(null);

  // Fetch stock data from backend
  const fetchStockData = useCallback(async (symbol) => {
    setIsLoading(true);
    setError(null);

    try {
      const priceResponse = await axios.get(`https://stock-analysis-l6x2.onrender.com/latest?ticker=${symbol}`);
      const { latest_price, latest_time } = priceResponse.data;

      const analyzeResponse = await axios.get(
        `https://stock-analysis-l6x2.onrender.com/analyze?ticker=${symbol}&days=90`
      );
      const result = analyzeResponse.data;

      if (result.error) throw new Error(result.error);

      const latestData = result.data[result.data.length - 1];
      setStockData({
        price: latest_price,
        change: latest_price - latestData.Close || 0,
        changePercent: ((latest_price - latestData.Close) / latestData.Close) * 100 || 0,
        volume: latestData.Volume || 0,
        marketCap: 0, // Not available from current API, to be added if needed
        rsi: latestData.RSI || 0,
        ma20: latestData.MA20 || 0,
        ma50: latestData.MA50 || 0,
        support: latestData.Support || 0,
        resistance: latestData.Resistance || 0,
        score: latestData.Score || 0,
        accuracy: 0, // Placeholder, to be calculated if ML model provides it
      });

      // Prepare chart data
      setChartData(
        result.data.map((d) => ({
          name: new Date(d.Date).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }),
          value: d.Close,
          volume: d.Volume,
          price: d.Close,
        }))
      );

      // Prepare RSI data (simplified for now)
      setRsiData(
        result.data.slice(-5).map((d) => ({
          name: new Date(d.Date).toLocaleDateString("en-US", { weekday: "short" }),
          value: d.RSI || 0,
        }))
      );
    } catch (err) {
      setError(err.message || "Error fetching data.");
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle analyze button click
  const handleAnalyze = useCallback(() => {
    if (ticker && /^[A-Z]{1,5}$/.test(ticker)) {
      fetchStockData(ticker);
    } else {
      alert("Please enter a valid stock ticker (e.g., AAPL).");
    }
  }, [ticker, fetchStockData]);

  // Initial load and polling
  useEffect(() => {
    fetchStockData(ticker);

    const interval = setInterval(() => {
      if (ticker) fetchStockData(ticker);
    }, 60000); // Poll every minute

    return () => clearInterval(interval);
  }, [ticker, fetchStockData]);

  return (
    <div
      className={`min-h-screen transition-all duration-1000 ${
        darkMode ? "bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900" : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"
      }`}
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                StockVision
              </h1>
              <p className="text-white/60">Real-Time Stock Analysis</p>
            </div>
          </div>
          <GlowButton onClick={() => setDarkMode(!darkMode)} glowColor="purple" className="p-3">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </GlowButton>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <AnimatedInput
              placeholder="Enter stock ticker (e.g., AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="pr-16"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-6 h-6 text-white/60" />
            </div>
          </div>
          <GlowButton onClick={handleAnalyze} disabled={isLoading} glowColor="blue" className="px-12">
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>Analyze</>
            )}
          </GlowButton>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 pb-6">
        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}
        {stockData && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Current Price"
                value={`$${stockData.price.toFixed(2)}`}
                change={`${stockData.changePercent > 0 ? "+" : ""}${stockData.changePercent.toFixed(2)}%`}
                icon={DollarSign}
                gradient="from-emerald-400 to-cyan-400"
                trend={stockData.changePercent > 0 ? "up" : "down"}
              />
              <MetricCard
                title="Volume"
                value={`${(stockData.volume / 1000000).toFixed(1)}M`}
                change="+12.5%" // Placeholder, update if API provides
                icon={Activity}
                gradient="from-purple-400 to-pink-400"
                trend="up"
              />
              <MetricCard
                title="AI Score"
                value={`${stockData.score.toFixed(1)}/5`}
                change="+0.3" // Placeholder, update if API provides
                icon={Star}
                gradient="from-yellow-400 to-orange-400"
                trend="up"
              />
            </div>

            {/* Main Chart */}
            <AnimatedCard gradient="from-indigo-500 to-purple-500" className="h-96">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Flame className="w-6 h-6" />
                  {ticker} Price Movement
                </h2>
                <div className="px-4 py-2 rounded-xl bg-green-400/30 text-green-100 text-sm font-semibold">
                  {stockData.changePercent.toFixed(2)}%
                </div>
              </div>
              <div className="h-72">
                <ColorfulChart data={chartData} type="area" colors={["#00D4FF", "#FF6B6B"]} />
              </div>
            </AnimatedCard>

            {/* RSI Chart */}
            <AnimatedCard gradient="from-pink-400 to-rose-400" className="h-80">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                RSI Indicator
              </h3>
              <div className="h-60">
                <ColorfulChart data={rsiData} type="line" colors={["#FFD93D"]} />
              </div>
            </AnimatedCard>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}

export default StockDashboard;