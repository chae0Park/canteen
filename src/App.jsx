import { useState, useEffect } from "react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const TODAY_MENU = [
  { name: "돈까스 정식", price: 5500, tag: "인기" },
  { name: "된장찌개 정식", price: 4500, tag: "" },
  { name: "비빔밥", price: 5000, tag: "오늘의 추천" },
  { name: "순두부찌개", price: 4500, tag: "" },
];

const WEEKLY_MENUS = {
  "2026-03-09": [{ name: "제육볶음 정식", price: 5500 }, { name: "미역국 정식", price: 4500 }],
  "2026-03-10": [{ name: "갈비탕", price: 6000 }, { name: "김치찌개 정식", price: 4500 }],
  "2026-03-11": [{ name: "닭볶음탕 정식", price: 5500 }, { name: "순두부찌개", price: 4500 }],
  "2026-03-12": TODAY_MENU,
  "2026-03-13": [{ name: "돼지불고기 정식", price: 5500 }, { name: "된장찌개 정식", price: 4500 }],
  "2026-03-16": [{ name: "삼겹살 정식", price: 6000 }, { name: "콩나물국밥", price: 4500 }],
  "2026-03-17": [{ name: "오징어볶음 정식", price: 5500 }, { name: "미소된장국 정식", price: 4500 }],
  "2026-03-18": [{ name: "부대찌개 정식", price: 5500 }, { name: "비빔밥", price: 5000 }],
  "2026-03-19": [{ name: "닭갈비 정식", price: 6000 }, { name: "순두부찌개", price: 4500 }],
  "2026-03-20": [{ name: "생선구이 정식", price: 5500 }, { name: "된장찌개 정식", price: 4500 }],
};

const TODAY_STR = "2026-03-12";

// ─── Barcode SVG Component ─────────────────────────────────────────────────
function BarcodeDisplay({ value }) {
  const bars = [];
  let x = 10;
  const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 60; i++) {
    const w = ((seed * (i + 7) * 13) % 3) + 1;
    const isBlack = (seed * (i + 3)) % 5 !== 0;
    if (isBlack) bars.push({ x, w });
    x += w + 1;
  }
  return (
    <svg viewBox="0 0 300 100" className="w-full max-w-xs mx-auto">
      <rect width="300" height="100" fill="white" rx="4" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="10" width={b.w} height="70" fill="#1a1a1a" />
      ))}
      <text x="150" y="95" textAnchor="middle" fontSize="9" fill="#555" fontFamily="monospace">
        {value}
      </text>
    </svg>
  );
}

// ─── QR Code Component ────────────────────────────────────────────────────
function QRDisplay({ value }) {
  const size = 21;
  const seed = value.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => {
      if ((r < 7 && c < 7) || (r < 7 && c >= 14) || (r >= 14 && c < 7)) {
        const inOuter = (r === 0 || r === 6 || c === 0 || c === 6) ||
          (r >= 14 && (r === 14 || r === 20 || c === 0 || c === 6)) ||
          (c >= 14 && r < 7 && (r === 0 || r === 6 || c === 14 || c === 20));
        const inInner = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r >= 16 && r <= 18 && c >= 2 && c <= 4) ||
          (r >= 2 && r <= 4 && c >= 16 && c <= 18);
        return inOuter || inInner ? 1 : 0;
      }
      return ((seed * (r * size + c + 1) * 37) % 3 === 0) ? 1 : 0;
    })
  );
  const cellSize = 10;
  return (
    <svg viewBox={`0 0 ${size * cellSize + 20} ${size * cellSize + 20}`} className="w-48 h-48 mx-auto">
      <rect width={size * cellSize + 20} height={size * cellSize + 20} fill="white" />
      {cells.map((row, r) =>
        row.map((cell, c) =>
          cell ? <rect key={`${r}-${c}`} x={c * cellSize + 10} y={r * cellSize + 10} width={cellSize} height={cellSize} fill="#1a1a1a" /> : null
        )
      )}
    </svg>
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────
function formatMoney(n) {
  return "₩ " + n.toLocaleString("ko-KR");
}
function formatDate(str) {
  if (!str) return "";
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
function getDayName(str) {
  return ["일", "월", "화", "수", "목", "금", "토"][new Date(str).getDay()];
}
function getYearMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  const startDay = first.getDay();
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    days.push(`${year}-${mm}-${dd}`);
  }
  return days;
}

// ─── Toast ────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="bg-gray-800 text-white px-5 py-3 rounded-2xl text-sm font-medium shadow-xl whitespace-nowrap">
        {msg}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function HomeScreen({ balance, setScreen }) {
  const menus = [
    { id: "canteen", icon: "🍱", label: "구내 식당", desc: "오늘 메뉴 확인 & 식권 발급", color: "from-blue-500 to-blue-600" },
    { id: "cafe", icon: "☕", label: "구청 카페", desc: "음료 주문 & 바코드 결제", color: "from-emerald-500 to-emerald-600" },
    { id: "prepurchase", icon: "📅", label: "사전 구매", desc: "식권 미리 구매하기", color: "from-violet-500 to-violet-600" },
  ];
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-6 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">청사 식음료 서비스</span>
          <span className="text-xs text-gray-400">{formatDate(TODAY_STR)} ({getDayName(TODAY_STR)})</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
          안녕하세요 👋
        </h1>
      </div>

      {/* Balance Card */}
      <div className="mx-4 mt-5">
        <div className="rounded-3xl p-6 text-white shadow-lg relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2F80ED 0%, #1a5fc8 100%)" }}>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 bg-white" />
          <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full opacity-10 bg-white" />
          <p className="text-sm font-medium opacity-80 mb-1">현재 충전금액</p>
          <p className="text-4xl font-black tracking-tight">{formatMoney(balance)}</p>
          <div className="mt-4 flex items-center gap-2">
            <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-semibold">
              충전하기 +
            </div>
          </div>
        </div>
      </div>

      {/* Menu Buttons */}
      <div className="px-4 mt-6 flex flex-col gap-3 flex-1">
        {menus.map((m) => (
          <button
            key={m.id}
            onClick={() => setScreen(m.id)}
            className="w-full bg-white rounded-3xl p-5 flex items-center gap-4 shadow-sm active:scale-98 transition-transform hover:shadow-md text-left"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>
              {m.icon}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{m.label}</p>
              <p className="text-sm text-gray-400 mt-0.5">{m.desc}</p>
            </div>
            <div className="ml-auto text-gray-300">›</div>
          </button>
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CANTEEN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function CanteenScreen({ balance, setScreen }) {
  const barcodeVal = "CTN-" + Date.now().toString().slice(-8);
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => setScreen("home")} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg">‹</button>
        <h2 className="text-lg font-black text-gray-900">구내 식당</h2>
      </div>

      <div className="flex flex-col gap-4 px-4 mt-5 pb-10">
        {/* Balance */}
        <div className="bg-white rounded-3xl px-5 py-4 shadow-sm flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">현재 충전금액</span>
          <span className="text-xl font-black" style={{ color: "#27AE60" }}>{formatMoney(balance)}</span>
        </div>

        {/* Barcode Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-gray-900">식권 바코드</p>
            <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-semibold">오늘만 유효</span>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <BarcodeDisplay value={barcodeVal} />
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">계산대 바코드 리더기에 스캔하세요</p>
        </div>

        {/* Today Menu */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🍽️</span>
            <p className="font-bold text-gray-900">오늘의 메뉴</p>
            <span className="text-xs text-gray-400 ml-auto">{formatDate(TODAY_STR)}</span>
          </div>
          <div className="flex flex-col gap-2">
            {TODAY_MENU.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#F5F7FA" }}>
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 font-medium text-sm">{item.name}</span>
                  {item.tag && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#EBF5FB", color: "#2F80ED" }}>
                      {item.tag}
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm" style={{ color: "#27AE60" }}>
                  {item.price.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CAFE SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function CafeScreen({ balance, setScreen }) {
  const barcodeVal = "CAF-" + Date.now().toString().slice(-8);
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => setScreen("home")} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg">‹</button>
        <h2 className="text-lg font-black text-gray-900">구청 카페</h2>
      </div>

      <div className="flex flex-col gap-4 px-4 mt-5 pb-10">
        {/* Balance */}
        <div className="bg-white rounded-3xl px-5 py-4 shadow-sm flex items-center justify-between">
          <span className="text-sm text-gray-500 font-medium">현재 충전금액</span>
          <span className="text-xl font-black" style={{ color: "#27AE60" }}>{formatMoney(balance)}</span>
        </div>

        {/* Payment Barcode */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="text-center mb-5">
            <p className="font-black text-gray-900 text-lg">결제 바코드</p>
            <p className="text-sm text-gray-400 mt-1">카페 기기에 스캔하세요</p>
          </div>

          <div className="rounded-2xl p-5 border-2 border-dashed border-gray-200">
            <BarcodeDisplay value={barcodeVal} />
          </div>

          <div className="mt-5 flex items-center gap-3 bg-emerald-50 rounded-2xl px-4 py-3">
            <span className="text-2xl">☕</span>
            <div>
              <p className="text-sm font-bold text-emerald-700">구청 카페 결제</p>
              <p className="text-xs text-emerald-600">충전금액에서 자동 차감됩니다</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <p className="font-bold text-gray-900 mb-3 text-sm">이용 안내</p>
          {["카페 주문 후 결제 단계에서 바코드를 사용하세요.", "충전금액이 부족할 경우 카드로 차액 결제가 가능합니다.", "바코드는 1회 사용 후 자동으로 갱신됩니다."].map((t, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className="text-xs font-bold text-blue-500 mt-0.5">{i + 1}</span>
              <p className="text-xs text-gray-500">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PRE-PURCHASE SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function PrePurchaseScreen({ balance, setBalance, purchasedTickets, setPurchasedTickets, setScreen }) {
  const now = new Date(TODAY_STR);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showList, setShowList] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [toast, setToast] = useState("");
  const [showPayConfirm, setShowPayConfirm] = useState(false);

  const days = getYearMonth(viewYear, viewMonth);
  const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];

  const isPurchased = (d) => purchasedTickets.some((t) => t.date === d);
  const isWeekend = (d) => { if (!d) return false; const day = new Date(d).getDay(); return day === 0 || day === 6; };
  const isToday = (d) => d === TODAY_STR;
  const isPast = (d) => d && d < TODAY_STR;
  const hasMenu = (d) => d && WEEKLY_MENUS[d];

  const selectedMenu = selectedDate ? WEEKLY_MENUS[selectedDate] : null;

  const handleBuy = () => {
    if (!selectedDate || !selectedMenu) return;
    const price = selectedMenu[0].price;
    if (balance >= price) {
      setBalance(b => b - price);
      setPurchasedTickets(prev => [...prev, { date: selectedDate, menu: selectedMenu[0], qr: "QR-" + selectedDate + "-" + Math.random().toString(36).slice(2, 8) }]);
      setToast("식권이 구매되었습니다! 🎉");
      setSelectedDate(null);
    } else {
      setShowPayConfirm(true);
    }
  };

  const handleQRClick = (ticket) => {
    if (ticket.date !== TODAY_STR) {
      setToast(`⚠️ 사용 일자가 다릅니다. (사용가능: ${formatDate(ticket.date)})`);
      return;
    }
    setShowQR(ticket);
  };

  if (showQR) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
        <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => setShowQR(null)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg">‹</button>
          <h2 className="text-lg font-black text-gray-900">식권 QR</h2>
        </div>
        <div className="px-4 mt-5 flex flex-col gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm text-center">
            <div className="bg-gray-50 rounded-2xl p-4 mb-4 inline-block w-full">
              <QRDisplay value={showQR.qr} />
            </div>
            <p className="font-black text-xl text-gray-900 mt-2">{formatDate(showQR.date)} ({getDayName(showQR.date)})</p>
            <p className="text-sm text-gray-400 mt-1">계산대 QR 리더기에 스캔하세요</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">구매 메뉴</p>
            <p className="font-bold text-gray-900">{showQR.menu.name}</p>
            <p className="font-black text-lg mt-1" style={{ color: "#27AE60" }}>{showQR.menu.price.toLocaleString()}원</p>
          </div>
        </div>
        {toast && <Toast msg={toast} onClose={() => setToast("")} />}
      </div>
    );
  }

  if (showList) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
        <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => setShowList(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg">‹</button>
          <h2 className="text-lg font-black text-gray-900">구매 목록</h2>
        </div>
        <div className="px-4 mt-5 flex flex-col gap-3 pb-10">
          {purchasedTickets.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🎫</p>
              <p className="font-medium">구매한 식권이 없습니다</p>
            </div>
          ) : (
            purchasedTickets.sort((a, b) => a.date.localeCompare(b.date)).map((t, i) => (
              <button key={i} onClick={() => { setShowList(false); handleQRClick(t); }}
                className="bg-white rounded-3xl p-5 shadow-sm text-left active:scale-98 transition-transform w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-900">{formatDate(t.date)} ({getDayName(t.date)})</p>
                    <p className="text-sm text-gray-500 mt-1">{t.menu.name}</p>
                    <p className="font-bold text-sm mt-1" style={{ color: "#27AE60" }}>{t.menu.price.toLocaleString()}원</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${t.date === TODAY_STR ? "bg-blue-100 text-blue-600" : t.date < TODAY_STR ? "bg-gray-100 text-gray-400" : "bg-emerald-50 text-emerald-600"}`}>
                    {t.date === TODAY_STR ? "오늘 사용" : t.date < TODAY_STR ? "기간 만료" : "미사용"}
                  </div>
                </div>
                <p className="text-xs text-blue-400 mt-2 font-medium">탭하여 QR 보기 →</p>
              </button>
            ))
          )}
        </div>
        {toast && <Toast msg={toast} onClose={() => setToast("")} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#F5F7FA" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={() => setScreen("home")} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg">‹</button>
        <h2 className="text-lg font-black text-gray-900 flex-1">사전 구매</h2>
        <button onClick={() => setShowList(true)}
          className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold">
          🎫 구매 목록 {purchasedTickets.length > 0 && <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">{purchasedTickets.length}</span>}
        </button>
      </div>

      <div className="px-4 mt-4 flex flex-col gap-4 pb-10">
        {/* Calendar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          {/* Month Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">‹</button>
            <p className="font-black text-gray-900">{viewYear}년 {viewMonth + 1}월</p>
            <button onClick={() => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">›</button>
          </div>

          {/* Week labels */}
          <div className="grid grid-cols-7 mb-2">
            {weekLabels.map((w, i) => (
              <div key={w} className={`text-center text-xs font-bold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>{w}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const purchased = isPurchased(d);
              const today = isToday(d);
              const past = isPast(d);
              const weekend = isWeekend(d);
              const selected = selectedDate === d;
              const menu = hasMenu(d);

              let cellClass = "flex flex-col items-center justify-center rounded-xl py-1.5 cursor-pointer transition-all ";
              let numClass = "text-sm font-bold ";

              if (past && !purchased) { cellClass += "opacity-40 cursor-default "; numClass += "text-gray-400 "; }
              else if (selected) { cellClass += "bg-blue-500 shadow-md scale-105 "; numClass += "text-white "; }
              else if (purchased) { cellClass += "bg-blue-100 "; numClass += "text-blue-600 "; }
              else if (today) { cellClass += "bg-emerald-50 ring-2 ring-emerald-400 "; numClass += "text-emerald-600 "; }
              else if (weekend) { cellClass += "hover:bg-gray-50 "; numClass += i % 7 === 0 ? "text-red-400 " : "text-blue-400 "; }
              else { cellClass += "hover:bg-blue-50 "; numClass += "text-gray-700 "; }

              return (
                <div key={d} className={cellClass}
                  onClick={() => { if (!past || purchased) setSelectedDate(selected ? null : d); }}>
                  <span className={numClass}>{new Date(d).getDate()}</span>
                  {purchased && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />}
                  {today && !purchased && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />}
                  {menu && !purchased && !past && <span className="w-1 h-1 rounded-full bg-gray-300 mt-0.5" />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 justify-center">
            {[["bg-blue-400", "구매완료"], ["bg-emerald-400", "오늘"], ["bg-gray-300", "메뉴있음"]].map(([bg, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${bg}`} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Menu */}
        {selectedDate && (
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <p className="font-black text-gray-900 mb-1">{formatDate(selectedDate)} ({getDayName(selectedDate)})</p>
            {isPurchased(selectedDate) ? (
              <div className="bg-blue-50 rounded-2xl p-4 text-center">
                <p className="text-blue-600 font-bold text-sm">이미 구매한 식권입니다 ✓</p>
              </div>
            ) : selectedMenu ? (
              <>
                <p className="text-xs text-gray-400 mb-3">구내식당 메뉴</p>
                <div className="flex flex-col gap-2 mb-4">
                  {selectedMenu.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#F5F7FA" }}>
                      <span className="font-medium text-sm text-gray-800">{item.name}</span>
                      <span className="font-bold text-sm" style={{ color: "#27AE60" }}>{item.price.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
                <button onClick={handleBuy}
                  className="w-full py-4 rounded-2xl font-black text-white text-base transition-transform active:scale-98"
                  style={{ background: "linear-gradient(135deg, #2F80ED, #1a5fc8)" }}>
                  식권 구매 — {selectedMenu[0].price.toLocaleString()}원
                </button>
              </>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-gray-400 text-sm">해당 날짜는 메뉴 정보가 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end z-50" onClick={() => setShowPayConfirm(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-lg text-gray-900 mb-2">잔액이 부족합니다</h3>
            <p className="text-gray-500 text-sm mb-5">현재 충전금액: <strong>{formatMoney(balance)}</strong><br />결제 금액: <strong>{selectedMenu ? selectedMenu[0].price.toLocaleString() + "원" : ""}</strong></p>
            <button className="w-full py-4 rounded-2xl font-black text-white text-base mb-3"
              style={{ background: "linear-gradient(135deg, #27AE60, #219653)" }}
              onClick={() => { setBalance(b => b + 10000); setShowPayConfirm(false); setToast("10,000원이 충전되었습니다"); }}>
              충전하고 결제하기
            </button>
            <button className="w-full py-3 rounded-2xl font-bold text-gray-500 bg-gray-100 text-sm"
              onClick={() => setShowPayConfirm(false)}>취소</button>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast("")} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("home");
  const [balance, setBalance] = useState(15000);
  const [purchasedTickets, setPurchasedTickets] = useState([
    { date: "2026-03-09", menu: { name: "제육볶음 정식", price: 5500 }, qr: "QR-2026-03-09-abc123" },
    { date: "2026-03-12", menu: { name: "돈까스 정식", price: 5500 }, qr: "QR-2026-03-12-ghi789" },
    { date: "2026-03-16", menu: { name: "삼겹살 정식", price: 6000 }, qr: "QR-2026-03-16-def456" },
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#e2e8f0" }}>
      {/* Phone frame */}
      <div className="w-full max-w-sm min-h-screen relative overflow-hidden shadow-2xl rounded-none md:rounded-3xl md:min-h-0 md:h-auto"
        style={{ background: "#F5F7FA" }}>
        {screen === "home" && <HomeScreen balance={balance} setScreen={setScreen} />}
        {screen === "canteen" && <CanteenScreen balance={balance} setScreen={setScreen} />}
        {screen === "cafe" && <CafeScreen balance={balance} setScreen={setScreen} />}
        {screen === "prepurchase" && (
          <PrePurchaseScreen
            balance={balance} setBalance={setBalance}
            purchasedTickets={purchasedTickets} setPurchasedTickets={setPurchasedTickets}
            setScreen={setScreen}
          />
        )}

        {/* Bottom Nav */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-2 py-2 grid grid-cols-3 gap-1">
          {[
            { id: "home", icon: "🏠", label: "홈" },
            { id: "canteen", icon: "🍱", label: "구내식당" },
            { id: "prepurchase", icon: "📅", label: "사전구매" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setScreen(tab.id)}
              className={`flex flex-col items-center py-2 rounded-2xl transition-colors ${screen === tab.id ? "bg-blue-50" : ""}`}>
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-xs font-bold mt-0.5 ${screen === tab.id ? "text-blue-600" : "text-gray-400"}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        * { font-family: 'Noto Sans KR', sans-serif; }
        .active\\:scale-98:active { transform: scale(0.98); }
        @keyframes bounce-in { 0% { opacity:0; transform: translate(-50%, 20px); } 100% { opacity:1; transform: translate(-50%, 0); } }
        .animate-bounce-in { animation: bounce-in 0.3s ease; }
      `}</style>
    </div>
  );
}