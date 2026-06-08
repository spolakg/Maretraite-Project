import React, { useState } from 'react';
import { 
  DollarSign, Calendar, ChevronRight, Landmark, FileSpreadsheet, 
  FileText, Plus, UserCheck, AlertCircle, Sparkles, Building, 
  Search, FileDown, CheckCircle
} from 'lucide-react';
import { Payment, User, PaymentMethod } from '../types';

interface FinanceViewProps {
  currentUser: User;
  payments: Payment[];
  members: User[];
  analytics: {
    totalCollected: number;
    monthlyCollections: number;
    yearlyCollections: number;
    outstandingContributions: number;
  };
  onAddPayment: (paymentData: {
    memberId: string;
    amount: number;
    date: string;
    method: PaymentMethod;
    referenceNumber: string;
    notes?: string;
    nonMemberName?: string;
  }) => Promise<void>;
}

export default function FinanceView({
  currentUser,
  payments,
  members,
  analytics,
  onAddPayment
}: FinanceViewProps) {
  // Tabs: 'dashboard' | 'history' | 'register_payment' | 'reports'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'history' | 'register' | 'reports'>('dashboard');

  // Register payment form states
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [nonMemberName, setNonMemberName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Report Generator settings
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [reportMonth, setReportMonth] = useState('06'); // June
  const [reportYear, setReportYear] = useState('2026');
  const [reportOutput, setReportOutput] = useState<any[] | null>(null);
  const [showExportModal, setShowExportModal] = useState<string | null>(null); // 'pdf' | 'excel' | null

  // User filter
  const [paymentHistoryQuery, setPaymentHistoryQuery] = useState('');

  // Render individual member card
  const isPendingMember = currentUser.outstandingBalance > 0;

  // Handles adding payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !paymentAmount || !paymentRef) {
      alert('Fout: Vul alle vereiste betalingsvelden in.');
      return;
    }

    if (selectedMemberId === 'non_member' && !nonMemberName.trim()) {
      alert('Fout: Voer de naam van het niet-lid in.');
      return;
    }

    setIsSubmittingPayment(true);
    setSuccessMessage('');
    try {
      await onAddPayment({
        memberId: selectedMemberId,
        amount: Number(paymentAmount),
        date: paymentDate,
        method: paymentMethod,
        referenceNumber: paymentRef,
        notes: paymentNotes,
        nonMemberName: selectedMemberId === 'non_member' ? nonMemberName : undefined
      });

      // Show success
      setSuccessMessage('Betaling succesvol geregistreerd! De grootboeken zijn bijgewerkt en de melding is verzonden.');
      setSelectedMemberId('');
      setNonMemberName('');
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
      
      // Auto redirect to history after delay
      setTimeout(() => {
        setSuccessMessage('');
        setActiveSubTab('dashboard');
      }, 3000);

    } catch (err: any) {
      alert(`Error recording payment: ${err.message || 'unknown issue'}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Compile monthly or yearly tabular report data
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    
    let filtered = payments;
    if (reportType === 'monthly') {
      filtered = payments.filter((p) => {
        const pDate = new Date(p.date);
        const targetMonth = parseInt(reportMonth) - 1;
        const targetYear = parseInt(reportYear);
        return pDate.getMonth() === targetMonth && pDate.getFullYear() === targetYear;
      });
    } else {
      filtered = payments.filter((p) => {
        const pDate = new Date(p.date);
        return pDate.getFullYear() === parseInt(reportYear);
      });
    }

    setReportOutput(filtered);
  };

  const myPayments = payments.filter(p => p.memberId === currentUser.memberId);

  // Search filtered history list
  const filteredHistory = payments.filter(p => {
    if (!paymentHistoryQuery) return true;
    const q = paymentHistoryQuery.toLowerCase();
    return (
      p.memberName.toLowerCase().includes(q) ||
      p.memberId.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      p.referenceNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-grow space-y-6" id="finance-module">
      
      {/* Finance Page Header / Subnavigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
            <Landmark className="h-5 w-5 text-blue-900 dark:text-blue-400" />
            <span>Maretraite Financiële Module</span>
          </h1>
          <span className="text-xs text-slate-400">Beheer gemeenschapsbijdragen, registreer contributie en controleer rapporten</span>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeSubTab === 'dashboard' ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeSubTab === 'history' ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ontvangsten
          </button>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveSubTab('register')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeSubTab === 'register' ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Registreren
            </button>
          )}
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeSubTab === 'reports' ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Rapporten
          </button>
        </div>
      </div>

      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Key Aggregate Financial Indices Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-400">Totaal Ontvangen</p>
                  <p className="text-2xl font-black text-blue-900 dark:text-blue-400 mt-2">SRD {analytics.totalCollected.toLocaleString('nl-NL')}</p>
                </div>
                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-900">
                  <Landmark className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>Totale bijdragen van bewoners</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-400">Deze Maand Ontvangen</p>
                  <p className="text-2xl font-black text-green-600 mt-2">SRD {analytics.monthlyCollections.toLocaleString('nl-NL')}</p>
                </div>
                <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-xl text-green-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400">
                <span>Rapportageperiode juni 2026</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-400">Jaarlijkse Ontvangsten (2026)</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">SRD {analytics.yearlyCollections.toLocaleString('nl-NL')}</p>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500">
                  <Landmark className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-amber-500">
                <span>Boekjaar eindigend dec 2026</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-slate-400">Openstaande Contributies</p>
                  <p className="text-2xl font-black text-amber-550 mt-2 text-amber-500">SRD {analytics.outstandingContributions.toLocaleString('nl-NL')}</p>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-amber-500">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400">
                <span>Verwachte openstaande betalingen van bewoners</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Personal Household Financial Ledger section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
                Financiële Status uw Huishouden
              </h3>

              <div className="mt-5 space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Bewoner:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{currentUser.fullName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Contributie-ID:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{currentUser.memberId}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-2 border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Totale Bijdrage:</span>
                    <span className="font-bold text-green-600">SRD {currentUser.totalContributed.toLocaleString('nl-NL')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Openstaand Saldo:</span>
                    <span className={isPendingMember ? 'font-bold text-amber-500' : 'font-bold text-green-600'}>
                      SRD {currentUser.outstandingBalance.toLocaleString('nl-NL')} {isPendingMember ? '(Te betalen)' : '(Voldaan)'}
                    </span>
                  </div>
                </div>

                {isPendingMember ? (
                  <div className="p-3 bg-amber-50 border border-amber-250 text-amber-800 rounded-xl text-xs flex space-x-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                    <span>Regel de betaling contant of via bankoverschrijving vóór de volgende bijeenkomst.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-850 rounded-xl text-xs flex space-x-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span>Uitstekend! Uw contributie is volledig voldaan. Bedankt voor uw steun.</span>
                  </div>
                )}

                {/* Personal Payment Listing */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">Uw persoonlijk betalingsoverzicht</h4>
                  {myPayments.length === 0 ? (
                    <p className="text-[11px] text-slate-400">Nog geen betalingsgegevens opgeslagen voor uw ID.</p>
                  ) : (
                    myPayments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">SRD {p.amount.toLocaleString('nl-NL')} Contributie</p>
                          <span className="text-slate-400">{p.date} • ref: {p.referenceNumber}</span>
                        </div>
                        <span className="text-green-600 font-bold bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded uppercase text-[9px]">
                          {p.method.replace('_', ' ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>

            {/* Recent payments across community */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Recente Ontvangsten
                </h3>
                <span onClick={() => setActiveSubTab('history')} className="text-xs text-blue-900 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
                  Bekijk Alle Transacties {`>`}
                </span>
              </div>

              <div className="mt-4 divide-y divide-slate-150 dark:divide-slate-800">
                {payments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-blue-900 border border-slate-200 dark:border-slate-700">
                        {pay.memberName.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{pay.memberName}</p>
                        <p className="text-[10px] text-slate-400">{pay.memberId} • Betaald op {pay.date} via {pay.method.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-820 dark:text-green-400">+SRD {pay.amount.toLocaleString('nl-NL')}</p>
                      <span className="text-[10px] text-slate-400 font-mono">ref: {pay.referenceNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Dues Payments Log Tab */}
      {activeSubTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Contributie- en Bijdragenlogboek</h3>
              <p className="text-xs text-slate-400">Volledig archief van betalingen ter controle</p>
            </div>

            <div className="w-full sm:w-72 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={paymentHistoryQuery}
                onChange={(e) => setPaymentHistoryQuery(e.target.value)}
                placeholder="Zoek bewoner, transactie-ID of opmerkingen..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-blue-900 text-slate-850 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-750"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-150 dark:border-slate-700">
                  <th className="p-3.5">Ref / Transactie-ID</th>
                  <th className="p-3.5">Naam Bewoner</th>
                  <th className="p-3.5">Bewoners-ID</th>
                  <th className="p-3.5">Betalingsdatum</th>
                  <th className="p-3.5">Bedrag</th>
                  <th className="p-3.5">Methode</th>
                  <th className="p-3.5">Notities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-705 dark:text-slate-300">
                {filteredHistory.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono font-semibold text-slate-500">{p.referenceNumber}</td>
                    <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{p.memberName}</td>
                    <td className="p-3.5">{p.memberId}</td>
                    <td className="p-3.5">{p.date}</td>
                    <td className="p-3.5 font-bold text-green-600">SRD {p.amount.toLocaleString('nl-NL')}</td>
                    <td className="p-3.5 uppercase">{p.method.replace('_', ' ')}</td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate">{p.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'register' && currentUser.role === 'admin' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-all max-w-2xl mx-auto">
          <div className="pb-4 border-b border-slate-105 mb-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Handmatig Transactie Registreren</h3>
            <p className="text-xs text-slate-400">Registreer contante betalingen of bankoverschrijvingen die handmatig zijn ontvangen op de server</p>
          </div>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            
            {/* Member selector */}
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Selecteer Buurtbewoner *
              </label>
              <select
                required
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-202"
                id="member-select-input"
              >
                <option value="">-- Kies een Bewoner --</option>
                <option value="non_member">⚠️ GEEN LID (Gast / Externe Betaler)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberId}) - Openstaand: SRD {m.outstandingBalance.toLocaleString('nl-NL')}
                  </option>
                ))}
              </select>
            </div>

            {selectedMemberId === 'non_member' && (
              <div className="mt-3 animate-in slide-in-from-top duration-200">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Naam niet-lid / Aangepaste betaler *
                </label>
                <input
                  type="text"
                  required
                  value={nonMemberName}
                  onChange={(e) => setNonMemberName(e.target.value)}
                  placeholder="bijv. John Doe, Externe Donateur, enz."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-850 dark:text-slate-202"
                  id="non-member-name-input"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Amount */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Betaald Bedrag (SRD) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="1000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="bijv. 100"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-850 dark:text-slate-202"
                  id="amount-payment-input"
                />
              </div>

              {/* Reference ID */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Transactie Referentienummer *
                </label>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="bijv. NTX998242"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-850 dark:text-slate-202"
                  id="txn-ref-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Date */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Betalingsdatum *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-850 dark:text-slate-300"
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Betalingsmethode *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-850 dark:text-slate-202"
                >
                  <option value="bank_transfer">🏛️ Bankoverschrijving</option>
                  <option value="cash">💵 Contante Betaling</option>
                  <option value="mobile_pay">📱 Mobiele Betaling / App</option>
                  <option value="credit_card">💳 Creditcard</option>
                </select>
              </div>
            </div>

            {/* Notes content */}
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                Bemerkingen / Notities van Beheerder
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Notities over termijnen of dossier-ID..."
                rows={3}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-850 dark:text-slate-205 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingPayment}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-xs font-bold text-white py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-900/10"
              id="submit-registered-payment-btn"
            >
              {isSubmittingPayment ? 'Bezig met registreren...' : 'Registreer Ontvangen Betaling'}
            </button>

          </form>
        </div>
      )}

      {/* Generate Tabular Reports Tab */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              Rapportgenerator Gemeenschapsfinanciën
            </h3>

            <form onSubmit={handleGenerateReport} className="flex flex-wrap items-end gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Rapportageperiode *</label>
                <select
                  value={reportType}
                  onChange={(e: any) => setReportType(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="monthly">📅 Maandverslag</option>
                  <option value="yearly">🏛️ Jaarverslag</option>
                </select>
              </div>

              {reportType === 'monthly' && (
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Maand</label>
                  <select
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                  >
                    <option value="01">januari</option>
                    <option value="02">februari</option>
                    <option value="03">maart</option>
                    <option value="04">april</option>
                    <option value="05">mei</option>
                    <option value="06">juni</option>
                    <option value="07">juli</option>
                    <option value="08">augustus</option>
                    <option value="09">september</option>
                    <option value="10">oktober</option>
                    <option value="11">november</option>
                    <option value="12">december</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Jaar</label>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-xs text-white font-bold px-5 py-2 rounded-lg cursor-pointer transition-colors"
                id="generate-revenue-report-btn"
              >
                Financiële Tabel Genereren
              </button>
            </form>
          </div>

          {/* Compiled Report Display with Sim XLS and Sim PDF Export Buttons */}
          {reportOutput && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in transition-all space-y-6">
              
              {/* Report Header Block */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-blue-900 text-white font-bold rounded flex items-center justify-center text-sm">
                      M
                    </div>
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-250">BUURTVERENIGING MARETRAITE</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Officieel Financieel Auditrapport Nr: MR-AUD-2026-{(reportType === 'monthly') ? reportMonth : 'ANN'}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowExportModal('pdf')}
                    className="flex items-center space-x-1.5 bg-red-50 text-red-600 hover:bg-red-100/80 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Exporteer als PDF</span>
                  </button>

                  <button
                    onClick={() => setShowExportModal('excel')}
                    className="flex items-center space-x-1.5 bg-green-50 text-green-600 hover:bg-green-100/80 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Exporteer naar Excel</span>
                  </button>
                </div>
              </div>

              {/* simulated document canvas sheet styling */}
              <div className="p-8 bg-slate-50 dark:bg-slate-950 border rounded-2xl font-sans text-slate-800 max-w-4xl mx-auto dark:text-slate-100">
                <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-base font-black uppercase text-blue-900 dark:text-blue-400">Grootboek Overzicht van Rekeningen</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Periode: {reportType === 'monthly' ? `juni ${reportYear}` : `Boekjaar ${reportYear}`}
                  </p>
                  <span className="text-[10px] text-slate-400">Gegenereerd op {new Date().toLocaleDateString('nl-NL')} door het geautomatiseerde boekhoudsysteem</span>
                </div>

                {/* mini analytics details */}
                <div className="grid grid-cols-2 mt-6 gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-500 mb-1">Financieel Totaaloverzicht:</h4>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Totaal Overzichten Geteld: {reportOutput.length}</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Totaal Saldo Overzicht: <span className="text-green-600 font-bold">SRD {reportOutput.reduce((a, b) => a + b.amount, 0).toLocaleString('nl-NL')}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-bold text-slate-500 mb-1">Vereniging Metadata:</h4>
                    <p className="font-medium text-slate-400">Maretraite, Paramaribo, Suriname</p>
                    <p className="font-medium text-slate-400">Audit Status: In evenwicht</p>
                  </div>
                </div>

                {/* Statement Listing */}
                <div className="mt-6">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b-2 pb-2 text-slate-450 uppercase font-black text-[10px]">
                        <th className="py-2.5">Datum</th>
                        <th className="py-2.5">Referentie-ID</th>
                        <th className="py-2.5">Geregistreerde Bewoner</th>
                        <th className="py-2.5">Bedrag</th>
                        <th className="py-2.5">Methode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-105 border-b">
                      {reportOutput.map((item) => (
                        <tr key={item.id} className="py-2">
                          <td className="py-2.5">{item.date}</td>
                          <td className="py-2.5 font-mono text-slate-500">{item.referenceNumber}</td>
                          <td className="py-2.5 font-bold text-slate-700 dark:text-slate-200">{item.memberName}</td>
                          <td className="py-2.5 font-bold text-green-600">SRD {item.amount.toLocaleString('nl-NL')}</td>
                          <td className="py-2.5 uppercase">{item.method.replace('_', ' ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-4 text-[10px] text-slate-400">
                  <div className="pt-8 border-t border-dashed w-3/4">
                    <p>Samengesteld door Beheerder</p>
                  </div>
                  <div className="pt-8 border-t border-dashed w-3/4 ml-auto text-right">
                    <p>Geverifieerd door Auditcommissie</p>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* EXPORT EXCEL OR PDF MODALS SCREEN SIMULATION */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-940 rounded-2xl p-6 shadow-2xl border max-w-sm w-full dark:border-slate-800 text-center animate-in scale-in duration-150">
            <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">
              {showExportModal === 'pdf' ? 'Simulator PDF Downloaden' : 'Simulator Excel Export'}
            </h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Uw financieel overzicht wordt momenteel gegenereerd en gedownload. 
              Het systeem simuleert een bestandsoverdracht in onze gevirtualiseerde beheeromgeving.
            </p>

            <div className="my-5 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center space-x-2 text-xs">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-bold text-green-600">
                {showExportModal === 'pdf' ? 'maretraite_juni_overzicht.pdf gegenereerd!' : 'maretraite_juni_grootboeken.xlsx gedownload!'}
              </span>
            </div>

            <button
              onClick={() => setShowExportModal(null)}
              className="bg-blue-900 hover:bg-blue-800 text-xs font-bold text-white px-5 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Terug naar Rapporten
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
