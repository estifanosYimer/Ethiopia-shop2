
import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle, CreditCard, ShieldCheck, ArrowRight, ArrowLeft, Building, Copy, Loader2, Mail, Phone, ExternalLink, AlertCircle } from 'lucide-react';
import Button from './Button';
import { CartItem, ShippingDetails, Order, PaymentMethod, CardProvider } from '../types';
import ImageWithFallback from './ImageWithFallback';
import { saveOrder } from '../services/orderService';
import { useLanguage } from '../i18n';
import AutoTranslatedText from './AutoTranslatedText';

// --- MERCHANT BANK DETAILS ---
const MERCHANT_BANK_DETAILS = {
    bankName: "Commercial Bank of Ethiopia",
    accountName: "Ethio Mosaic Exports",
    accountNumber: "1000012345678", 
    swiftCode: "CBETETAA", 
    iban: "ET00CBET1000012345678"
};

const EU_COUNTRIES = [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", 
    "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", 
    "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", 
    "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onComplete: () => void;
}

type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

// Helper: Simple Luhn Algorithm for basic card validation
const isValidCreditCard = (value: string) => {
  if (/[^0-9-\s]+/.test(value)) return false;
  let nCheck = 0, nDigit = 0, bEven = false;
  const newValue = value.replace(/\D/g, "");
  if(newValue.length < 13 || newValue.length > 19) return false;

  for (let n = newValue.length - 1; n >= 0; n--) {
    const cDigit = newValue.charAt(n);
    nDigit = parseInt(cDigit, 10);
    if (bEven) {
      if ((nDigit *= 2) > 9) nDigit -= 9;
    }
    nCheck += nDigit;
    bEven = !bEven;
  }
  return (nCheck % 10) === 0;
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cart, onComplete }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [cardProvider, setCardProvider] = useState<CardProvider>('visa');
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>(''); // For UX feedback
  
  const [shippingData, setShippingData] = useState<ShippingDetails | null>(null);
  const [orderRef, setOrderRef] = useState('');
  
  // Validation Error State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setStep('shipping');
      setPaymentMethod('credit_card');
      setIsProcessing(false);
      setErrors({});
      setProcessingStatus('');
    } else {
        setOrderRef(`ETH-${Math.floor(Math.random() * 100000)}`);
    }
  }, [isOpen]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = 25.00;
  const importDuties = 12.50;
  const total = subtotal + shippingCost + importDuties;

  if (!isOpen) return null;

  const handleShippingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setShippingData({
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        postalCode: formData.get('postalCode') as string,
        country: formData.get('country') as string,
    });
    
    setStep('payment');
  };

  const handlePayPalFlow = async () => {
      setIsProcessing(true);
      setProcessingStatus('Connecting to PayPal Secure Gateway...');
      
      // 1. Simulate opening the provider
      setTimeout(() => {
          // Open PayPal in new tab
          window.open('https://www.paypal.com/signin', '_blank');
          setProcessingStatus('Waiting for payment confirmation...');
          
          // 2. Simulate User completing payment in other tab and webhook arriving
          setTimeout(() => {
              completeOrder();
          }, 5000); // 5 seconds "wait" time
      }, 1500);
  };

  const handleCreditCardFlow = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const cardNum = formData.get('cardNumber') as string;
      const expiry = formData.get('expiry') as string;
      const cvc = formData.get('cvc') as string;

      // Reset Errors
      setErrors({});
      const newErrors: Record<string, string> = {};

      // 1. Validate Card Number (Luhn)
      if (!isValidCreditCard(cardNum)) {
          newErrors.cardNumber = "Invalid card number. Please check digits.";
      }

      // 2. Validate Expiry (MM/YY)
      if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(expiry)) {
          newErrors.expiry = "Invalid format (MM/YY).";
      }

      // 3. Validate CVC
      if (!/^[0-9]{3,4}$/.test(cvc)) {
          newErrors.cvc = "Invalid CVC.";
      }

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }

      // 4. Simulate Processing
      setIsProcessing(true);
      setProcessingStatus('Encrypting data...');
      await new Promise(r => setTimeout(r, 1000));
      setProcessingStatus('Contacting issuing bank...');
      await new Promise(r => setTimeout(r, 1500));
      setProcessingStatus('Verifying transaction...');
      await new Promise(r => setTimeout(r, 1000));
      
      completeOrder();
  };

  const completeOrder = async () => {
    if (!shippingData) return;

    const newOrder: Order = {
        id: orderRef,
        date: new Date().toISOString(),
        items: cart,
        subtotal,
        shippingCost,
        duties: importDuties,
        total,
        shippingDetails: shippingData,
        paymentMethod: paymentMethod,
        cardProvider: paymentMethod === 'credit_card' ? cardProvider : null,
        language: language,
        status: 'pending'
    };

    try {
        await saveOrder(newOrder);
        setIsProcessing(false);
        setProcessingStatus('');
        setStep('confirmation');
        onComplete(); 
    } catch (error) {
        console.error("Payment failed", error);
        setIsProcessing(false);
        setProcessingStatus('');
        alert("Payment Gateway Error: Unable to process. Please try again.");
    }
  };

  // Helper handler that delegates to specific flows
  const handleGeneralSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (paymentMethod === 'bank_transfer') {
          // Bank transfer is manual confirmation
          setIsProcessing(true);
          setProcessingStatus('Registering order...');
          setTimeout(completeOrder, 1500);
      }
      // Credit card is handled by the form onSubmit directly
  };

  const Steps = () => (
    <div className="flex items-center justify-center mb-8 text-sm">
      <div className={`flex items-center ${step === 'shipping' ? 'text-emerald-900 font-bold' : 'text-emerald-900'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step === 'shipping' ? 'bg-emerald-900 text-white' : 'bg-emerald-100 text-emerald-900'}`}>1</div>
        {t('step_shipping')}
      </div>
      <div className="w-12 h-px bg-stone-300 mx-4"></div>
      <div className={`flex items-center ${step === 'payment' ? 'text-emerald-900 font-bold' : step === 'confirmation' ? 'text-emerald-900' : 'text-stone-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step === 'payment' ? 'bg-emerald-900 text-white' : step === 'confirmation' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-100 text-stone-400'}`}>2</div>
        {t('step_payment')}
      </div>
      <div className="w-12 h-px bg-stone-300 mx-4"></div>
      <div className={`flex items-center ${step === 'confirmation' ? 'text-emerald-900 font-bold' : 'text-stone-400'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step === 'confirmation' ? 'bg-emerald-900 text-white' : 'bg-stone-100 text-stone-400'}`}>3</div>
        {t('step_done')}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/70 backdrop-blur-sm" onClick={() => !isProcessing && onClose()}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-parchment rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:h-auto">
        
        {/* Left Panel: Summary */}
        <div className="w-full md:w-1/3 bg-stone-100 p-6 md:p-8 border-r border-stone-200 overflow-y-auto">
          <h3 className="font-serif font-bold text-xl text-stone-900 mb-6">{t('cart_title')}</h3>
          <div className="space-y-4 mb-6">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative w-16 h-16 rounded bg-white border border-stone-200 overflow-hidden flex-shrink-0">
                  <ImageWithFallback 
                    src={item.imageUrl} 
                    alt={item.name}
                    fallbackTerm={item.name}
                    className="w-full h-full object-cover" 
                  />
                  <span className="absolute top-0 right-0 bg-stone-600 text-white text-[10px] px-1.5 py-0.5 rounded-bl">{item.quantity}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <AutoTranslatedText 
                    as="p"
                    className="font-medium text-sm text-stone-900 truncate"
                    value={item.name}
                    translationKey={`product_${item.id}_name`}
                  />
                  <p className="text-stone-500 text-sm">€{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span>€{shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Duties</span>
              <span>€{importDuties.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-stone-200 pt-4 mt-4 flex justify-between items-center">
            <span className="font-serif font-bold text-lg text-stone-900">{t('total')}</span>
            <span className="font-serif font-bold text-xl text-emerald-900">€{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Right Panel: Checkout Form */}
        <div className="w-full md:w-2/3 p-6 md:p-8 bg-white flex flex-col h-full overflow-y-auto relative">
           {!isProcessing && (
               <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-800">
                 <X size={24} />
               </button>
           )}

           <div className="mb-6 flex items-center gap-2 text-emerald-800">
             <Lock size={16} />
             <span className="text-xs font-bold uppercase tracking-wider">{t('secure_ssl')}</span>
           </div>

           <Steps />

           {step === 'shipping' && (
             <div className="animate-fade-in">
               <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">{t('step_shipping')}</h2>
               <form className="space-y-4" onSubmit={handleShippingSubmit}>
                 {/* Contact Info */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><Mail size={12}/> {t('form_email')}</label>
                     <input required name="email" defaultValue={shippingData?.email} type="email" placeholder="you@example.com" className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1"><Phone size={12}/> {t('form_phone')}</label>
                     <input required name="phone" defaultValue={shippingData?.phone} type="tel" placeholder="+32 ..." className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all" />
                   </div>
                 </div>

                 {/* Name */}
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-stone-500 uppercase">{t('form_fname')}</label>
                     <input required name="firstName" defaultValue={shippingData?.firstName} type="text" className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-stone-500 uppercase">{t('form_lname')}</label>
                     <input required name="lastName" defaultValue={shippingData?.lastName} type="text" className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all" />
                   </div>
                 </div>

                 {/* Address */}
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-stone-500 uppercase">{t('form_address')}</label>
                   <input required name="address" defaultValue={shippingData?.address} type="text" className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-stone-500 uppercase">{t('form_city')}</label>
                     <input required name="city" defaultValue={shippingData?.city} type="text" className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-xs font-bold text-stone-500 uppercase">Postal Code</label>
                     <input required name="postalCode" defaultValue={shippingData?.postalCode} type="text" className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all" />
                   </div>
                 </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-stone-500 uppercase">{t('form_country')} (EU)</label>
                   <select name="country" defaultValue={shippingData?.country || 'Germany'} className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none bg-white">
                     {EU_COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                     ))}
                   </select>
                 </div>
                 <div className="pt-6 flex justify-end">
                   <Button type="submit" className="flex items-center gap-2">
                     {t('next')} <ArrowRight size={18} />
                   </Button>
                 </div>
               </form>
             </div>
           )}

           {step === 'payment' && (
             <div className="animate-fade-in relative">
                {isProcessing && (
                    <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center text-center">
                        <Loader2 size={48} className="animate-spin text-emerald-900 mb-4" />
                        <h3 className="font-serif text-xl font-bold text-stone-900">{t('processing')}</h3>
                        <p className="text-stone-500 text-sm mt-2">{processingStatus}</p>
                    </div>
                )}

                <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">{t('step_payment')}</h2>
                
                {/* Method Selection Tabs */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  {/* Card Option */}
                  <div 
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`flex-1 border-2 rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${paymentMethod === 'credit_card' ? 'border-emerald-900 bg-emerald-50' : 'border-stone-200 hover:border-emerald-200'}`}
                  >
                    <CreditCard size={24} className={paymentMethod === 'credit_card' ? "text-emerald-900" : "text-stone-500"} />
                    <span className={`font-bold text-sm text-center ${paymentMethod === 'credit_card' ? "text-emerald-900" : "text-stone-600"}`}>{t('pay_card')}</span>
                  </div>

                  {/* PayPal Option */}
                  <div 
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex-1 border-2 rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${paymentMethod === 'paypal' ? 'border-emerald-900 bg-emerald-50' : 'border-stone-200 hover:border-emerald-200'}`}
                  >
                     <span className={`text-xl font-bold italic ${paymentMethod === 'paypal' ? "text-emerald-900" : "text-stone-600"}`}>Pay<span className="text-sky-600">Pal</span></span>
                     <span className={`font-bold text-sm text-center ${paymentMethod === 'paypal' ? "text-emerald-900" : "text-stone-600"}`}>{t('pay_paypal')}</span>
                  </div>

                  {/* Bank Option */}
                  <div 
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`flex-1 border-2 rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-emerald-900 bg-emerald-50' : 'border-stone-200 hover:border-emerald-200'}`}
                  >
                     <Building size={24} className={paymentMethod === 'bank_transfer' ? "text-emerald-900" : "text-stone-500"} />
                     <span className={`font-bold text-sm text-center ${paymentMethod === 'bank_transfer' ? "text-emerald-900" : "text-stone-600"}`}>{t('pay_bank')}</span>
                  </div>
                </div>

                {/* --- CREDIT CARD FORM --- */}
                {paymentMethod === 'credit_card' && (
                    <form className="space-y-4" onSubmit={handleCreditCardFlow}>
                      <div className="animate-fade-in space-y-4">
                        <div className="flex gap-2 mb-4">
                            {['visa', 'mastercard', 'amex'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setCardProvider(p as CardProvider)}
                                    className={`px-3 py-1 border rounded text-xs font-bold uppercase transition-colors ${cardProvider === p ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">{t('card_number')}</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                                <input name="cardNumber" required type="text" placeholder="0000 0000 0000 0000" className={`w-full border rounded px-3 py-2 pl-10 focus:ring-2 focus:ring-emerald-800 outline-none transition-all font-mono ${errors.cardNumber ? 'border-red-500 bg-red-50' : 'border-stone-300'}`} />
                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600" size={14} />
                            </div>
                            {errors.cardNumber && <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.cardNumber}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-500 uppercase">{t('expiry')}</label>
                                <input name="expiry" required type="text" placeholder="MM/YY" className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all text-center ${errors.expiry ? 'border-red-500 bg-red-50' : 'border-stone-300'}`} />
                                {errors.expiry && <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.expiry}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-stone-500 uppercase">{t('cvc')}</label>
                                <input name="cvc" required type="text" placeholder="123" className={`w-full border rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all text-center ${errors.cvc ? 'border-red-500 bg-red-50' : 'border-stone-300'}`} />
                                {errors.cvc && <p className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertCircle size={10} /> {errors.cvc}</p>}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-500 uppercase">{t('cardholder_name')}</label>
                            <input name="cardHolder" required type="text" className="w-full border border-stone-300 rounded px-3 py-2 focus:ring-2 focus:ring-emerald-800 outline-none transition-all" />
                        </div>
                        
                        <div className="pt-6 flex justify-between items-center">
                            <button type="button" onClick={() => setStep('shipping')} className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-sm font-medium">
                            <ArrowLeft size={16} /> {t('back')}
                            </button>
                            <Button type="submit" disabled={isProcessing} className="w-2/3 flex items-center justify-center gap-2">
                            {isProcessing ? <><Loader2 size={16} className="animate-spin"/> {t('processing')}</> : `${t('pay_order_btn')} €${total.toFixed(2)}`}
                            </Button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* --- PAYPAL FLOW --- */}
                  {paymentMethod === 'paypal' && (
                      <div className="animate-fade-in bg-stone-50 border border-stone-200 rounded-lg p-6 flex flex-col items-center text-center space-y-4">
                          <p className="text-stone-600 text-sm">{t('redirect_paypal')}</p>
                          <button 
                            type="button" 
                            onClick={handlePayPalFlow}
                            className="bg-[#0070BA] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#005ea6] transition-colors w-full justify-center max-w-xs shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                              Pay with <span className="italic font-extrabold">PayPal</span> <ExternalLink size={16}/>
                          </button>
                          <div className="text-xs text-stone-400 mt-2">
                             A new tab will open to complete your secure transaction.
                          </div>
                          
                          <div className="pt-6 w-full flex justify-start">
                            <button type="button" onClick={() => setStep('shipping')} className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-sm font-medium">
                                <ArrowLeft size={16} /> {t('back')}
                            </button>
                          </div>
                      </div>
                  )}

                  {/* --- BANK TRANSFER FLOW --- */}
                  {paymentMethod === 'bank_transfer' && (
                      <form onSubmit={handleGeneralSubmit}>
                        <div className="animate-fade-in bg-stone-50 border border-stone-200 rounded-lg p-5 space-y-4">
                            <p className="text-sm text-stone-600 mb-2">{t('bank_transfer_intro')}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-xs font-bold text-stone-400 uppercase">{t('bank_name')}</span>
                                    <span className="font-medium text-stone-900">{MERCHANT_BANK_DETAILS.bankName}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-stone-400 uppercase">{t('account_name')}</span>
                                    <span className="font-medium text-stone-900">{MERCHANT_BANK_DETAILS.accountName}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-stone-400 uppercase">{t('account_number')}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-stone-900 bg-white px-2 py-1 rounded border border-stone-200">{MERCHANT_BANK_DETAILS.iban}</span>
                                        <Copy size={14} className="text-stone-400 cursor-pointer hover:text-emerald-800" />
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-stone-400 uppercase">{t('swift')}</span>
                                    <span className="font-mono text-stone-900 bg-white px-2 py-1 rounded border border-stone-200 inline-block">{MERCHANT_BANK_DETAILS.swiftCode}</span>
                                </div>
                            </div>
                            
                            <div className="bg-emerald-50 text-emerald-900 text-xs p-3 rounded mt-2 font-medium">
                                {t('ref_message')}: <span className="font-mono font-bold select-all">ORDER {orderRef}</span>
                            </div>
                        </div>
                        
                        <div className="pt-6 flex justify-between items-center">
                            <button type="button" onClick={() => setStep('shipping')} className="text-stone-500 hover:text-stone-900 flex items-center gap-1 text-sm font-medium">
                            <ArrowLeft size={16} /> {t('back')}
                            </button>
                            <Button type="submit" disabled={isProcessing} className="w-2/3 flex items-center justify-center gap-2">
                            {isProcessing ? <><Loader2 size={16} className="animate-spin"/> {t('processing')}</> : `${t('pay_order_btn')} €${total.toFixed(2)}`}
                            </Button>
                        </div>
                      </form>
                  )}

                  <div className="bg-stone-50 p-4 rounded text-xs text-stone-500 flex gap-2 items-start mt-4">
                    <ShieldCheck size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                    <p>Payments are securely processed by MosaicPay. Your financial data is encrypted using 256-bit SSL technology and never stored on our servers.</p>
                  </div>
             </div>
           )}

           {step === 'confirmation' && (
             <div className="animate-fade-in text-center flex flex-col items-center justify-center h-full py-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-800">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">{t('thank_you')}</h2>
                <p className="text-lg text-stone-600 mb-8">{t('thank_you_sub')}</p>
                
                <div className="bg-stone-50 p-6 rounded-lg max-w-sm w-full mb-8 text-left border border-stone-100">
                  <p className="text-sm text-stone-500 mb-2">{t('order_ref')}: <span className="text-stone-900 font-mono">#{orderRef}</span></p>
                  <p className="text-sm text-stone-500">
                    {paymentMethod === 'bank_transfer' 
                        ? "Please complete your bank transfer using the reference number above. We will ship your items as soon as the funds clear."
                        : "A confirmation email has been sent to you. Your package will depart Addis Ababa within 24 hours."
                    }
                  </p>
                </div>

                <Button onClick={onClose}>{t('return_shop')}</Button>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
