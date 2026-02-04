import { FiCheck, FiCheckCircle } from 'react-icons/fi';

interface CreditSuccessAnimationProps {
    amount: number;
    onComplete?: () => void;
}

export default function CreditSuccessAnimation({ amount, onComplete }: CreditSuccessAnimationProps) {
    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
            onAnimationEnd={() => {
                setTimeout(() => onComplete?.(), 2000);
            }}
        >
            <div className="relative">
                {/* Main checkmark circle */}
                <div className="relative z-10 w-24 h-24 bg-green-600 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300 shadow-2xl shadow-green-600/50">
                    <FiCheck className="w-14 h-14 text-white animate-in zoom-in-0 duration-500 delay-200" strokeWidth={3} />
                </div>

                {/* Ripple effect */}
                <div className="absolute inset-0 w-24 h-24 bg-green-600/30 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />

                {/* Confetti particles */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * Math.PI / 180;
                    const distance = 80;
                    const x = Math.cos(angle) * distance;
                    const y = Math.sin(angle) * distance;

                    return (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full animate-in zoom-in-0 fade-in duration-500"
                            style={{
                                transform: `translate(-50%, -50%)`,
                                animation: `confetti-${i} 1s ease-out forwards`,
                                animationDelay: `${i * 30}ms`,
                                backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][i % 4]
                            }}
                        >
                            <style jsx>{`
                @keyframes confetti-${i} {
                  0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                  }
                  50% {
                    transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1);
                    opacity: 1;
                  }
                  100% {
                    transform: translate(calc(-50% + ${x * 1.2}px), calc(-50% + ${y * 1.2}px)) scale(0);
                    opacity: 0;
                  }
                }
              `}</style>
                        </div>
                    );
                })}

                {/* Success text */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center animate-in slide-in-from-top-4 fade-in duration-500 delay-300">
                    <div className="text-white font-bold text-lg mb-1">Credit Applied!</div>
                    <div className="text-green-300 text-sm">₹{amount.toLocaleString('en-IN')} • Credit</div>
                </div>
            </div>
        </div>
    );
}
