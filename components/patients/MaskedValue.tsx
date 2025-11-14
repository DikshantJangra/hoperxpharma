import React from "react";
import { FiEye, FiEyeOff, FiCheckCircle } from "react-icons/fi";

interface MaskedValueProps {
  value: string;
  masked: string;
  verified?: boolean;
}

export default function MaskedValue({ value, masked, verified }: MaskedValueProps) {
  const [revealed, setRevealed] = React.useState(false);

  const handleReveal = () => {
    // In real app: check permission, log audit event
    setRevealed(!revealed);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-700 font-mono">
        {revealed ? value : masked}
      </span>
      {verified && <FiCheckCircle className="text-green-600" size={12} />}
      <button
        onClick={handleReveal}
        className="text-gray-400 hover:text-teal-600"
        title={revealed ? "Hide" : "Reveal phone"}
      >
        {revealed ? <FiEyeOff size={12} /> : <FiEye size={12} />}
      </button>
    </div>
  );
}
