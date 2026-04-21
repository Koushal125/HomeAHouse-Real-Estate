import EmiCalculator from '../../components/property/EmiCalculator';

const EmiCalculatorPage = () => (
  <div className="space-y-6 animate-slide-up">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tools</p>
      <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-[0.9]">EMI Calculator</h1>
      <p className="text-slate-400 mt-2 text-sm">
        Estimate your monthly home loan instalment based on loan amount, interest rate, and tenure.
      </p>
    </div>

    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-6">
      <EmiCalculator />
    </div>
  </div>
);

export default EmiCalculatorPage;
