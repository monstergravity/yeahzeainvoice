import React, { useState } from 'react';
import { X, Check, CreditCard, Mail } from 'lucide-react';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuy: (credits: number, price: number) => void;
}

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose, onBuy }) => {
  const [clickedPackageIndex, setClickedPackageIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const packages = [
    { credits: 20, price: 2.90, label: 'Starter', popular: false },
    { credits: 100, price: 9.90, label: 'Pro', popular: true },
    { credits: 300, price: 19.90, label: 'Business', popular: false },
  ];

  const handlePackageClick = (index: number) => {
    setClickedPackageIndex(index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 relative overflow-hidden">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Top up your credits</h2>
          <p className="text-gray-500">Choose a package that suits your processing needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg, index) => (
            <div 
              key={index}
              className={`relative border rounded-xl p-6 flex flex-col hover:shadow-lg transition-shadow ${pkg.popular ? 'border-brand-green ring-1 ring-brand-green bg-green-50/30' : 'border-gray-200 bg-white'}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </div>
              )}
              
              <h3 className="text-lg font-bold text-gray-700 mb-2">{pkg.label}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-gray-900">${pkg.price.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-6 text-gray-600">
                <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold">
                  {pkg.credits}
                </div>
                <span className="font-medium">Invoices</span>
              </div>

              {clickedPackageIndex === index ? (
                <div className="w-full py-2 px-3 bg-brand-dark text-white rounded-lg text-xs text-center animate-in fade-in duration-300">
                    <p className="font-bold mb-1">Contact Support</p>
                    <p className="mb-2">We currently process payments manually.</p>
                    <a href="mailto:bryan@whatown.com" className="flex items-center justify-center gap-1 text-brand-green font-bold hover:underline">
                        <Mail size={12} />
                        bryan@whatown.com
                    </a>
                </div>
              ) : (
                <button 
                    onClick={() => handlePackageClick(index)}
                    className={`w-full py-2.5 rounded-lg font-medium transition-colors ${pkg.popular ? 'bg-brand-green text-white hover:bg-green-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                    Buy Now
                </button>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
                ${(pkg.price / pkg.credits).toFixed(2)} / invoice
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <CreditCard size={14} />
            <span>Secure payment processing</span>
        </div>
      </div>
    </div>
  );
};

export default BuyCreditsModal;