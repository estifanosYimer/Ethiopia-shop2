
import React from 'react';
import { X, Minus, Plus, ShoppingBag, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';
import Button from './Button';
import ImageWithFallback from './ImageWithFallback';
import { useLanguage } from '../i18n';
import AutoTranslatedText from './AutoTranslatedText';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, items, onUpdateQuantity, onRemove, onCheckout }) => {
  const { t } = useLanguage();
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-parchment shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'} border-l-4 border-emerald-900`}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-white">
            <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <ShoppingBag size={20} className="text-emerald-800" />
              {t('cart_title')}
            </h2>
            <button onClick={onClose} className="text-stone-500 hover:text-stone-800 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-parchment">
            {items.length === 0 ? (
              <div className="text-center text-stone-500 mt-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mb-4 text-stone-400">
                    <ShoppingBag size={32} />
                </div>
                <p className="font-serif text-lg">Your cart is empty.</p>
                <p className="text-sm mt-2 text-stone-400">Discover the treasures of Ethiopia.</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-white rounded-lg shadow-sm border border-stone-100">
                  <div className="w-20 h-20 bg-stone-100 rounded-md overflow-hidden flex-shrink-0 border border-stone-200">
                    <ImageWithFallback 
                      src={item.imageUrl} 
                      alt={item.name}
                      fallbackTerm={item.name}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <AutoTranslatedText 
                      as="h3"
                      className="font-serif font-medium text-stone-900"
                      value={item.name}
                      translationKey={`product_${item.id}_name`}
                    />
                    <p className="text-emerald-800 font-bold text-sm">{item.currency}{item.price}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-1 rounded-full hover:bg-stone-100 text-stone-600 border border-stone-200"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-1 rounded-full hover:bg-stone-100 text-stone-600 border border-stone-200"
                      >
                        <Plus size={12} />
                      </button>
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="ml-auto text-red-500 text-xs hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-stone-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-stone-600">Subtotal</span>
              <span className="font-serif text-2xl font-bold text-stone-900">€{total.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-6 bg-stone-50 p-2 rounded">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>{t('secure_ssl')}</span>
            </div>
            <Button className="w-full bg-stone-900 hover:bg-stone-800" disabled={items.length === 0} onClick={onCheckout}>
              {t('checkout_btn')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
