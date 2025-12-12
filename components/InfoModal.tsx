
import React, { useState } from 'react';
import { X, Truck, ShieldCheck, RefreshCw, Search } from 'lucide-react';
import Button from './Button';
import { useLanguage } from '../i18n';

export type InfoModalType = 'shipping' | 'authenticity' | 'returns' | 'tracking' | null;

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: InfoModalType;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, type }) => {
  const { t } = useLanguage();
  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen || !type) return null;

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    setIsSearching(true);
    setTrackingResult(null);

    // Simulate API lookup
    setTimeout(() => {
        setIsSearching(false);
        setTrackingResult({
        status: 'In Transit',
        location: 'Frankfurt, Germany',
        carrier: 'Ethiopian Airlines Cargo',
        estimatedDelivery: '2 days'
        });
    }, 1500);
  };

  const renderContent = () => {
    switch (type) {
      case 'shipping':
        return (
          <>
            <div className="flex items-center gap-3 mb-6 text-emerald-900 border-b border-stone-200 pb-4">
               <Truck size={28} />
               <h2 className="text-2xl font-serif font-bold">{t('shipping_policy')}</h2>
            </div>
            <div className="prose prose-stone text-sm leading-relaxed text-stone-600">
               <p className="mb-4">{t('policy_shipping_intro')}</p>
               
               <h3 className="font-bold text-stone-900 text-base mt-4 mb-2">{t('policy_shipping_times_title')}</h3>
               <ul className="list-disc pl-5 space-y-2 mb-4">
                 <li>{t('policy_shipping_express')}</li>
                 <li>{t('policy_shipping_standard')}</li>
               </ul>

               <h3 className="font-bold text-stone-900 text-base mt-4 mb-2">{t('policy_shipping_customs_title')}</h3>
               <p>{t('policy_shipping_customs')}</p>
            </div>
          </>
        );
      case 'authenticity':
        return (
          <>
            <div className="flex items-center gap-3 mb-6 text-emerald-900 border-b border-stone-200 pb-4">
               <ShieldCheck size={28} />
               <h2 className="text-2xl font-serif font-bold">{t('authenticity_guarantee')}</h2>
            </div>
             <div className="prose prose-stone text-sm leading-relaxed text-stone-600">
               <p className="mb-4">{t('policy_auth_intro')}</p>
               
               <h3 className="font-bold text-stone-900 text-base mt-4 mb-2">{t('policy_auth_promise_title')}</h3>
               <ul className="list-disc pl-5 space-y-2 mb-4">
                 <li>{t('policy_auth_handmade')}</li>
                 <li>{t('policy_auth_materials')}</li>
                 <li>{t('policy_auth_provenance')}</li>
               </ul>
            </div>
          </>
        );
      case 'returns':
         return (
          <>
            <div className="flex items-center gap-3 mb-6 text-emerald-900 border-b border-stone-200 pb-4">
               <RefreshCw size={28} />
               <h2 className="text-2xl font-serif font-bold">{t('returns_exchanges')}</h2>
            </div>
             <div className="prose prose-stone text-sm leading-relaxed text-stone-600">
               <p className="mb-4">{t('policy_return_intro')}</p>
               
               <h3 className="font-bold text-stone-900 text-base mt-4 mb-2">{t('policy_return_policy_title')}</h3>
               <ul className="list-disc pl-5 space-y-2 mb-4">
                 <li>{t('policy_return_14days')}</li>
                 <li>{t('policy_return_unused')}</li>
                 <li>{t('policy_return_hygiene')}</li>
               </ul>

               <h3 className="font-bold text-stone-900 text-base mt-4 mb-2">{t('policy_return_process_title')}</h3>
               <p>{t('policy_return_process')}</p>
            </div>
          </>
        );
      case 'tracking':
         return (
          <>
            <div className="flex items-center gap-3 mb-6 text-emerald-900 border-b border-stone-200 pb-4">
               <Search size={28} />
               <h2 className="text-2xl font-serif font-bold">{t('track_order')}</h2>
            </div>
             <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
               <form onSubmit={handleTrack} className="flex gap-2 mb-4">
                 <input 
                    type="text" 
                    placeholder="Enter Order # (e.g., ETH-1234)" 
                    className="flex-1 p-3 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-900 outline-none"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                 />
                 <Button type="submit" disabled={isSearching}>
                    {isSearching ? '...' : 'Track'}
                 </Button>
               </form>

               {trackingResult && (
                 <div className="mt-6 animate-fade-in bg-white p-4 rounded border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-bold text-stone-900 text-lg">{trackingResult.status}</span>
                    </div>
                    <div className="space-y-1 text-sm text-stone-600">
                        <p><span className="font-bold text-stone-800">Carrier:</span> {trackingResult.carrier}</p>
                        <p><span className="font-bold text-stone-800">Current Location:</span> {trackingResult.location}</p>
                        <p><span className="font-bold text-stone-800">Est. Delivery:</span> {trackingResult.estimatedDelivery}</p>
                    </div>
                 </div>
               )}
             </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 transition-colors">
             <X size={24} />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default InfoModal;
