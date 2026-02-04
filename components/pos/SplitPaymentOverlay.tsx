'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiDollarSign, FiCreditCard, FiSmartphone, FiPlus, FiClock } from 'react-icons/fi';
import { BsWallet2 } from 'react-icons/bs';
import ProcessingLoader from './animations/ProcessingLoader';

interface SplitPaymentOverlayProps {
    total: number;
    walletBalance?: number;
    onConfirm: (splits: any) => Promise<void>;
    onClose: () => void;
}

export default function SplitPaymentOverlay({ total = 0, walletBalance = 0, onConfirm, onClose }: SplitPaymentOverlayProps) {
    const [cash, setCash] = useState('');
    const [card, setCard] = useState('');
    const [upi, setUpi] = useState('');
    const [wallet, setWallet] = useState('');
    const [credit, setCredit] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const safeParse = (val: string) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    };

    useEffect(() => {
        const otherPayments = safeParse(cash) + safeParse(card) + safeParse(upi) + safeParse(wallet);
        const remaining = Math.max(0, total - otherPayments);
        setCredit(remaining > 0 ? remaining.toFixed(2).replace(/\.00$/, '') : '');
    }, [cash, card, upi, wallet, total]);

    const collected = safeParse(cash) + safeParse(card) + safeParse(upi) + safeParse(wallet);
    const balance = total - collected;
    const totalAllocated = collected + safeParse(credit);
    const isBalanced = Math.abs(total - totalAllocated) < 0.01;

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            await onConfirm({
                cash: safeParse(cash),
                card: safeParse(card),
                upi: safeParse(upi),
                wallet: safeParse(wallet),
                credit: safeParse(credit)
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const inputFields = [
        { label: 'Cash', value: cash, setter: setCash, icon: <FiDollarSign />, accent: 'emerald' },
        { label: 'Card', value: card, setter: setCard, icon: <FiCreditCard />, accent: 'blue' },
        { label: 'UPI', value: upi, setter: setUpi, icon: <FiSmartphone />, accent: 'purple' },
        {
            label: 'Wallet',
            value: wallet,
            setter: (val: string) => {
                const num = safeParse(val);
                if (num > walletBalance) {
                    setWallet(walletBalance.toString());
                } else {
                    setWallet(val);
                }
            },
            icon: <BsWallet2 />,
            accent: 'amber',
            balance: walletBalance,
            isDisabled: walletBalance <= 0
        },
    ];

    return (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white/50">
                <div>
                    <h3 className="text-base font-bold text-gray-900">Split Payment</h3>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Allocate amounts precisely</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all"
                >
                    <FiX className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 mb-6">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 text-center">Total Payable</div>
                    <div className="text-3xl font-black text-indigo-600 text-center">₹{total.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {inputFields.map((field) => {
                        const isWallet = field.label === 'Wallet';
                        const balance = (field as any).balance || 0;

                        if (isWallet) {
                            console.log(`[SplitOverlay] Wallet Balance available: ₹${balance}`);
                        }

                        return (
                            <div key={field.label} className={`group flex flex-col gap-1 ${(field as any).isDisabled ? 'opacity-60 grayscale' : ''}`}>
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                        {field.icon}
                                        {field.label}
                                        {isWallet && (
                                            <span className={balance > 0 ? "text-teal-600" : "text-gray-400"}>
                                                | ₹{balance}
                                            </span>
                                        )}
                                    </label>
                                    {safeParse(field.value) > 0 && (
                                        <span className={`text-[10px] font-bold text-${field.accent}-600 bg-${field.accent}-50 px-1.5 rounded-full`}>
                                            Active
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={field.value}
                                        disabled={(field as any).isDisabled}
                                        onChange={(e) => field.setter(e.target.value)}
                                        className={`w-full bg-gray-50/50 border-2 border-transparent ${(field as any).isDisabled ? 'cursor-not-allowed' : 'group-hover:bg-white group-hover:border-indigo-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} rounded-xl px-4 py-2.5 text-sm font-bold transition-all outline-none`}
                                        placeholder="0.00"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold group-hover:text-indigo-200">₹</div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
                                <FiClock />
                                Credit (Pay Later)
                            </label>
                            <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 rounded-full">Auto-filled</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                value={credit}
                                readOnly
                                className="w-full bg-orange-50/50 border-2 border-orange-100/50 rounded-xl px-4 py-2.5 text-sm font-bold text-orange-700 outline-none"
                                placeholder="0.00"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-200 font-bold">₹</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="bg-gray-50 p-3 rounded-xl mb-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 font-medium">Allocated Amount</span>
                        <span className="text-xs font-bold text-gray-900 font-mono">₹{collected.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                        <span className="text-xs text-gray-700 font-bold">Remaining for Credit</span>
                        <span className={`text-sm font-black font-mono ${balance > 0.01 ? 'text-orange-500' : 'text-gray-400'}`}>
                            ₹{balance.toFixed(2)}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!isBalanced || isProcessing}
                    className={`w-full py-4 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${isBalanced
                        ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-600/30'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                        }`}
                >
                    {isProcessing ? (
                        <>
                            <ProcessingLoader size="sm" color="white" />
                            <span>Finalizing Payments...</span>
                        </>
                    ) : (
                        <>
                            <FiCheck className={`w-5 h-5 ${isBalanced ? 'opacity-100 animate-bounce' : 'opacity-20'}`} />
                            <span>Confirm Split Sale</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
