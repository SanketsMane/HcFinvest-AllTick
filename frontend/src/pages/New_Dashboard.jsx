// New_Dashboard.jsx

import { getSafeJSON } from '../utils/safeLocalStorage';
import {
  ArrowRight,
  Wallet,
  BarChart2,
  ArrowLeft,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { Internal_Transfer } from "./Internal_Transfer";
import NavbarClient from "../components/NavbarClient";
import { useSidebar } from "../context/SidebarContext.jsx";

//Sanket v2.0 - Symbol-aware contract size lookup for PnL calculation
const _CS_MAP = { XAUUSD: 100, XAGUSD: 5000, XPTUSD: 100, XPDUSD: 100, BTCUSD: 1, ETHUSD: 1, LTCUSD: 1, XRPUSD: 1, BCHUSD: 1, BNBUSD: 1, SOLUSD: 1, ADAUSD: 1, DOGEUSD: 1, DOTUSD: 1, MATICUSD: 1, AVAXUSD: 1, LINKUSD: 1 };
const _getContractSizeBySymbol = (symbol) => _CS_MAP[String(symbol || '').toUpperCase().replace(/\\.I$/i, '')] || 100000;

const New_Dashboard = () => {
  const [banners, setBanners] = useState([]);
  const BASE_URL = API_URL.replace("/api", "");
  const { sidebarExpanded } = useSidebar();

  const [current, setCurrent] = useState(0);

  const [showTransferModal, setShowTransferModal] = useState(false);

  const [userAccounts, setUserAccounts] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [openTrades, setOpenTrades] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);

  const user = getSafeJSON("user", {});

  const navigate = useNavigate();

const defaultBanner = [
  {
    _id: "default1",
    title: "Welcome to HcFinvest",
    highlight: "Start Trading Today",
    desc: "Trade smarter with real-time insights and powerful tools.",
    image: "default-banner.jpg", // put this image in public/uploads/banners
  },
];


  const liveAccounts = userAccounts.filter(
    (acc) => !acc.isDemo && !acc.accountTypeId?.isDemo,
  );

  const demoAccounts = userAccounts.filter(
    (acc) => acc.isDemo || acc.accountTypeId?.isDemo,
  );

  const fetchWalletBalance = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet/${user._id}`);
      const data = await res.json();
      setWalletBalance(data.wallet?.balance || 0);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  useEffect(() => {
    if (user._id) {
      fetchWalletBalance();

      const fetchUserAccounts = async () => {
        try {
          const res = await fetch(
            `${API_URL}/trading-accounts/user/${user._id}`,
          );
          const data = await res.json();
          setUserAccounts(data.accounts || []);
        } catch (error) {
          console.error("Error fetching accounts:", error);
        }
      };

      fetchUserAccounts();
    }
  }, []);

  useEffect(() => {
    const user = getSafeJSON("user", {});

    const fetchUserAccounts = async () => {
      try {
        const res = await fetch(`${API_URL}/trading-accounts/user/${user._id}`);
        const data = await res.json();
        setUserAccounts(data.accounts || []);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    if (user._id) fetchUserAccounts();
  }, []);

  // ðŸ‘‰ Auto Slide
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // ðŸ‘‰ Manual Controls
  const nextSlide = () => {
    if (banners.length === 0) return;
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    if (banners.length === 0) return;
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const fetchOpenTrades = async () => {
    try {
      let allTrades = [];

      for (const acc of userAccounts) {
        const res = await fetch(`${API_URL}/trade/open/${acc._id}`);
        const data = await res.json();

        if (data.success && data.trades) {
          allTrades = [
            ...allTrades,
            ...data.trades.map((t) => ({
              ...t,
              accountName: acc.accountId,
            })),
          ];
        }
      }

      setOpenTrades(allTrades);
    } catch (error) {
      console.error("Error fetching open trades:", error);
    }
  };

  useEffect(() => {
    // console.log("Banners:", banners.length);
  }, [banners]);

  useEffect(() => {
    setCurrent(0);
  }, [banners]);

  useEffect(() => {
    // console.log("Current Slide:", current);
  }, [current]);

  useEffect(() => {
    if (userAccounts.length > 0) {
      fetchOpenTrades();
    }
  }, [userAccounts]);

  useEffect(() => {
    const fetchPrices = async () => {
      const symbols = [...new Set(openTrades.map((t) => t.symbol))];
      if (symbols.length === 0) return;

      try {
        const res = await fetch(`${API_URL}/prices/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ symbols }),
        });

        const data = await res.json();
        if (data.success) {
          setLivePrices(data.prices);
        }
      } catch (err) {
        console.error("Price fetch error:", err);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);

    return () => clearInterval(interval);
  }, [openTrades]);

  const calculatePnl = (trade) => {
    const prices = livePrices[trade.symbol];
    if (!prices) return 0;

    const currentPrice = trade.side === "BUY" ? prices.bid : prices.ask;

    if (!currentPrice) return 0;

    const contractSize = Number(trade.contractSize) > 0 ? trade.contractSize : _getContractSizeBySymbol(trade.symbol);

    const pnl =
      trade.side === "BUY"
        ? (currentPrice - trade.openPrice) * trade.quantity * contractSize
        : (trade.openPrice - currentPrice) * trade.quantity * contractSize;

    return pnl - (trade.commission || 0) - (trade.swap || 0);
  };

  const totalPnl = openTrades.reduce(
    (sum, trade) => sum + calculatePnl(trade),
    0,
  );

  const totalLiveBalance = liveAccounts.reduce(
    (sum, acc) => sum + Number(acc.balance || 0),
    0,
  );

  const totalLiveEquity = liveAccounts.reduce(
    (sum, acc) => sum + Number(acc.balance || 0) + Number(acc.credit || 0),
    0,
  );

  const colors = ["ðŸŸ¢", "ðŸ”µ", "ðŸŸ ", "ðŸŸ£", "ðŸŸ¡"];

  const getDistribution = () => {
    const map = {};

    openTrades.forEach((trade) => {
      const value = trade.quantity * trade.openPrice; // or use trade.quantity * trade.openPrice

      if (!map[trade.symbol]) {
        map[trade.symbol] = 0;
      }

      map[trade.symbol] += value;
    });

    const total = Object.values(map).reduce((a, b) => a + b, 0);

    return Object.entries(map).map(([symbol, value]) => ({
      symbol,
      percent: total ? ((value / total) * 100).toFixed(1) : 0,
    }));
  };

  const distribution = getDistribution();

  const growthPercent =
    totalLiveBalance > 0 ? ((totalPnl / totalLiveBalance) * 100).toFixed(2) : 0;

  const getInvestmentDistribution = () => {
    const map = {};
    let totalInvested = 0;

    openTrades.forEach((trade) => {
      const value = trade.quantity * trade.openPrice;

      if (!map[trade.symbol]) {
        map[trade.symbol] = 0;
      }

      map[trade.symbol] += value;
      totalInvested += value;
    });

    const result = [];

    // Symbol % calculation
    Object.entries(map).forEach(([symbol, value]) => {
      result.push({
        name: symbol,
        percent:
          totalLiveBalance > 0
            ? ((value / totalLiveBalance) * 100).toFixed(1)
            : 0,
      });
    });

    // FREE BALANCE
    const free = totalLiveBalance - totalInvested;

    if (free > 0) {
      result.push({
        name: "FREE",
        percent:
          totalLiveBalance > 0
            ? ((free / totalLiveBalance) * 100).toFixed(1)
            : 0,
      });
    }

    return result;
  };

  const investmentData = getInvestmentDistribution();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/banners/getall`);
      const data = await res.json();

      if (data.success) {
        setBanners(data.data);
      }
    } catch (err) {
      // console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
  <div
    className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${
      sidebarExpanded ? "ml-[280px]" : "ml-[64px]"
    }`}
  >
        <NavbarClient title="Dashbaord" subtitle="Welcome back to hcfinvest." />

        {/* Banner */}
        {/* Banner Wrapper */}
        {/* Banner */}
        {banners.length > 0 ? (
          <div className="relative overflow-hidden rounded-2xl mb-6">
            {/* SLIDER WRAPPER */}
            <div className="overflow-hidden w-full">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${current * 100}%)` }}
              >
                {banners.map((banner) => (
                  <div
                    key={banner._id}
                    className="min-w-full flex-shrink-0 h-80 relative"
                  >
                    {/* IMAGE */}
                    <img
                      src={`${BASE_URL}/uploads/banners/${banner.image}`}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />

                    {/* OVERLAY */}
                    <div className="absolute inset-0 bg-black/40" />

                    {/* CONTENT */}
                    <div className="absolute inset-0 flex flex-col justify-center px-6 z-10">
                      <span className="text-xs bg-white/10 px-3 py-1 rounded-full w-fit text-white">
                        Limited Time
                      </span>

                      <h2 className="text-3xl font-bold mt-2 text-white">
                        {banner.title}
                        <span className="text-green-400">
                          {" "}
                          {banner.highlight || ""}
                        </span>
                      </h2>

                      <p className="text-gray-200 mt-2 max-w-md">
                        {banner.desc || ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LEFT ARROW */}
            {banners.length > 1 && (
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-10"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            {/* RIGHT ARROW */}
            {banners.length > 1 && (
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-10"
              >
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        ) : (
  <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 h-80 flex items-center">
    
    {/* Content */}
    <div className="px-8 text-white">
      <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
        Welcome
      </span>

      <h2 className="text-3xl font-bold mt-3">
        Welcome to <span className="text-green-300">HC Finvest</span>
      </h2>

      <p className="mt-2 text-gray-200 max-w-md">
        Start trading, manage your accounts and track performance in one place.
      </p>

      <button
        onClick={() => navigate("/account")}
        className="mt-4 bg-white text-black px-5 py-2 rounded-lg font-medium hover:bg-gray-200"
      >
        Get Started →
      </button>
    </div>

    {/* Decorative Right Side */}
    <div className="absolute right-0 top-0 w-1/2 h-full opacity-20">
      <div className="w-full h-full bg-[radial-gradient(circle_at_center,_white,_transparent)]"></div>
    </div>
  </div>
)}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <div className="bg-green-100 p-2 rounded-lg w-fit">
                <CircleDollarSign className="text-green-600" />
              </div>
            </div>
            <h3 className="text-slate-500 font-bold text-sm">Total Balance</h3>
            <p className="text-2xl font-black text-slate-900">
              ${totalLiveBalance.toLocaleString()}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <div className="bg-blue-100 p-2 rounded-lg w-fit">
                <BarChart2 className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-slate-500 font-bold text-sm">Current Equity</h3>
            <p className="text-2xl font-black text-slate-900">
              ${totalLiveEquity.toLocaleString()}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <div className="bg-orange-100 p-2 rounded-lg w-fit">
                <Wallet className="text-orange-600" />
              </div>
            </div>
            <h3 className="text-slate-500 font-bold text-sm">Wallet Balance</h3>
            <p className="text-2xl font-black text-slate-900">${walletBalance}</p>
          </div>
        </div>

        {/* ===== LOWER DASHBOARD SECTION ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-gray-700 font-semibold mb-4">
                Quick Actions
              </h3>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
                {/* Deposit */}
                <div
                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center cursor-pointer transition"
                  onClick={() => navigate("/wallet?action=deposit")}
                >
                  <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg mb-2 bg-green-100 text-green-600">
                     ↓
                  </div>
                  <p className="text-sm font-bold text-slate-800">Deposit</p>
                  <p className="text-xs text-slate-500 font-medium">Add funds instantly</p>
                </div>

                {/* Withdraw */}
                <div
                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center cursor-pointer transition"
                  onClick={() => navigate("/wallet?action=withdraw")}
                >
                  <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg mb-2 bg-blue-100 text-blue-600">
                    ↑
                  </div>
                  <p className="text-sm font-bold text-slate-800">Withdraw</p>
                  <p className="text-xs text-slate-500 font-medium">Cash out your profits</p>
                </div>

                {/* Transfer */}
                <div
                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center cursor-pointer transition"
                  onClick={() => setShowTransferModal(true)}
                >
                  <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg mb-2 bg-orange-100 text-orange-600">
                    ⇄
                  </div>
                  <p className="text-sm font-bold text-slate-800">Transfer</p>
                  <p className="text-xs text-slate-500 font-medium">Between accounts</p>
                </div>

                <Internal_Transfer
                  show={showTransferModal}
                  onClose={() => setShowTransferModal(false)}
                />

                {/* Account */}
                <div
                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center cursor-pointer transition"
                  onClick={() => navigate("/account")}
                >
                  <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg mb-2 bg-purple-100 text-purple-600">
                    👤
                  </div>
                  <p className="text-sm font-bold text-slate-800">Account</p>
                  <p className="text-xs text-slate-500 font-medium">Manage your accounts</p>
                </div>
              </div>
            </div>

            {/* Account section */}
            {/* ACCOUNTS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LIVE ACCOUNTS */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Live Accounts</h3>

                  <button
                    onClick={() => navigate("/account")}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    See All →
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Live Accounts</p>
                    <p className="text-3xl font-black mt-1 text-slate-900">
                      {liveAccounts.length}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/switch-account?create=true")}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* DEMO ACCOUNTS */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Demo Accounts</h3>

                  <button
                    onClick={() => navigate("/account")}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    See All →
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Demo Accounts</p>
                    <p className="text-3xl font-black mt-1 text-slate-900">
                      {demoAccounts.length}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate("/switch-account?create=true&demo=true")
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Create Demo
                  </button>
                </div>
              </div>
            </div>

            {/* ACTIVE POSITIONS */}
            {/*               
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold">Active Positions</h3>
                  <span
                    onClick={() => navigate("/orders")}
                    className="text-blue-500 text-sm cursor-pointer"
                  >
                    View All →
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-2">
                  {openTrades.length} open trades
                </p>

                {/* Total P/L .*}
                <div className="bg-gray-100 rounded-lg p-3 mb-3 flex justify-between">
                  <span>Total P/L</span>
                  <span
                    className={`font-semibold ${
                      totalPnl >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
                  </span>
                </div>

                {/* Trades List .*}
                {openTrades.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center">
                    No active trades
                  </p>
                ) : (
                  openTrades.slice(0, 4).map((trade) => {
                    const pnl = calculatePnl(trade);

                    return (
                      <div
                        key={trade._id}
                        className="flex justify-between items-center border rounded-lg px-3 py-2 mb-2"
                      >
                        <span className="font-medium">{trade.symbol}</span>
                        <span
                          className={
                            pnl >= 0 ? "text-green-600" : "text-red-500"
                          }
                        >
                          {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div> 
*/}
          </div>

          {/* RIGHT SIDE - APP CARD .*}
          <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs bg-green-500 px-2 py-1 rounded-full">
                NEW APP
              </span>

              <h3 className="text-lg font-bold mt-3">Trade on the Go</h3>

              <p className="text-sm text-gray-300 mt-2">
                Full trading power in your pocket. Scan the QR code to download.
              </p>
            </div>

            {/* QR .*}
            <div className="flex justify-center items-center flex-1 mt-5">
              <div className="w-[90%] max-w-[300px] aspect-square bg-white rounded-2xl flex items-center justify-center text-black shadow-lg">
                QR
              </div>
            </div>

            {/* Buttons .*}
            <div className="mt-4 space-y-2">
              <button className="w-full bg-white/10 py-2 rounded-lg text-sm">
                App Store
              </button>
              <button className="w-full bg-white/10 py-2 rounded-lg text-sm">
                Google Play
              </button>
            </div>
          </div>
          */}

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Active Positions</h3>
              <span
                onClick={() => navigate("/orders")}
                className="text-blue-500 text-sm cursor-pointer"
              >
                View All →
              </span>
            </div>

            <p className="text-gray-400 text-sm mb-2">
              {openTrades.length} open trades
            </p>

            {/* Total P/L */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3 flex justify-between">
              <span className="text-slate-900 font-bold">Total P/L</span>
              <span
                className={`font-semibold ${
                  totalPnl >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
              </span>
            </div>

            {/* Trades List */}
            {openTrades.length === 0 ? (
              <p className="text-gray-400 text-sm text-center">
                No active trades
              </p>
            ) : (
              openTrades.slice(0, 4).map((trade) => {
                const pnl = calculatePnl(trade);

                return (
                  <div
                    key={trade._id}
                    className="flex justify-between items-center border rounded-lg px-3 py-2 mb-2"
                  >
                    <span className="font-bold text-slate-900">{trade.symbol}</span>
                    <span
                      className={pnl >= 0 ? "text-green-600" : "text-red-500"}
                    >
                    {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default New_Dashboard;
