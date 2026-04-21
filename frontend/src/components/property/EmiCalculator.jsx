import { useState, useMemo } from 'react';
import { TrendingDown, IndianRupee, Calendar } from 'lucide-react';

const formatINR = (amount) =>
  amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const EmiCalculator = ({ defaultAmount = '' }) => {
  const [loanAmount, setLoanAmount] = useState(String(defaultAmount));
  const [rate, setRate]             = useState('8.5');
  const [tenure, setTenure]         = useState(20);

  const result = useMemo(() => {
    const P = parseFloat(loanAmount);
    const r = parseFloat(rate) / 12 / 100;
    const n = parseInt(tenure, 10) * 12;
    if (!P || P <= 0 || !r || r <= 0 || !n || n <= 0) return null;
    const emi      = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total    = emi * n;
    const interest = total - P;
    return { emi, total, interest };
  }, [loanAmount, rate, tenure]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Loan Amount (₹)
          </label>
          <div className="relative">
            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={0}
              placeholder="e.g. 5000000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Annual Interest Rate (%)
          </label>
          <div className="relative">
            <TrendingDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={0.1}
              max={30}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E9B38F] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Tenure — <span className="font-black" style={{ color: '#E9B38F' }}>{tenure} years</span>
          </label>
          <div className="flex items-center gap-3">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={30}
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="flex-1 accent-[#E9B38F]"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-4">
            <span>1 yr</span>
            <span>30 yrs</span>
          </div>
        </div>
      </div>

      {result ? (
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly EMI</p>
            <p className="text-lg font-black tracking-tight" style={{ color: '#E9B38F' }}>{formatINR(result.emi)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payable</p>
            <p className="text-lg font-black text-slate-900 tracking-tight">{formatINR(result.total)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Interest</p>
            <p className="text-lg font-black text-slate-700 tracking-tight">{formatINR(result.interest)}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
          <p className="text-sm text-slate-400">Enter loan details above to calculate</p>
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">
        * This is an estimate. Actual EMI may vary based on your lender's terms, processing fees, and loan type.
      </p>
    </div>
  );
};

export default EmiCalculator;
