import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Menu, X, ArrowLeft, ChevronRight, Globe, Coffee, Palette, Shirt, ArrowRight as ArrowRightIcon, Loader2, Send, Download } from 'lucide-react';
import { Product, CartItem, Category, LanguageCode } from './types';
import ProductList from './components/ProductList';
import CartSidebar from './components/CartSidebar';
import CuratorChat from './components/CuratorChat';
import CheckoutModal from './components/CheckoutModal';
import InfoModal, { InfoModalType } from './components/InfoModal';
import OrdersModal from './components/OrdersModal';
import Button from './components/Button';
import ImageWithFallback from './components/ImageWithFallback';
import { LanguageProvider, useLanguage } from './i18n';
import AutoTranslatedText from './components/AutoTranslatedText';
import { backend } from './services/backend';
import ToastContainer, { ToastMessage } from './components/Toast';

const LANGUAGE_OPTIONS: {code: LanguageCode; label: string; flag: string}[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
    { code: 'om', label: 'Afaan Oromoo', flag: '🌳' }, 
    { code: 'ti', label: 'ትግርኛ', flag: '⛰️' }, 
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
];

const AppContent: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [currentView, setCurrentView] = useState<'home' | 'shop' | 'product'>('home');
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.ALL);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [emailInput, setEmailInput] = useState('');
  
  // Search State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
  };

  const handleSubscribe = async () => {
      if (!emailInput || !emailInput.includes('@')) {
          addToast("Please enter a valid email", "error");
          return;
      }
      await backend.addSubscriber(emailInput);
      addToast("Subscribed successfully!", "success");
      setEmailInput('');
  };

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
        try {
            const data = await backend.getProducts();
            setProducts(data);
        } catch (e) {
            console.error("Failed to load products", e);
        } finally {
            setLoadingProducts(false);
        }
    };
    loadData();
  }, [isOrdersOpen]); // Reload when admin panel closes in case products changed

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
            setIsLangMenuOpen(false);
        }
    };
    // Use mousedown for earlier capture than click to prevent race conditions
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Admin Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl + Shift + A (for Admin)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsOrdersOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getCategoryTranslation = (cat: Category) => {
      switch (cat) {
          case Category.CLOTHES: return t('nav_clothes');
          case Category.ART: return t('nav_art');
          case Category.ACCESSORIES: return t('nav_accessories');
          case Category.MISC: return t('nav_misc');
          default: return t('nav_shop'); // For 'All' usually
      }
  };

  const getCategoryKey = (category: string) => {
    if (category === 'Clothes') return 'nav_clothes';
    if (category === 'Art') return 'nav_art';
    if (category === 'Accessories') return 'nav_accessories';
    if (category.includes('Misc')) return 'nav_misc';
    return `nav_${category.toLowerCase().replace(' ', '_')}`;
  };

  // Computed
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category if not All AND not searching (search usually overrides category, or we can combine)
    if (selectedCategory !== Category.ALL) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        // Search against translated fields for the current language
        const translatedName = t(`product_${p.id}_name`).toLowerCase();
        const translatedDesc = t(`product_${p.id}_desc`).toLowerCase();
        const translatedCategory = getCategoryTranslation(p.category).toLowerCase();
        
        // Also check original English fields to support mixed searching
        const englishName = p.name.toLowerCase();
        
        return (
            translatedName.includes(q) || 
            translatedDesc.includes(q) || 
            translatedCategory.includes(q) ||
            englishName.includes(q)
        );
      });
    }
    
    return filtered;
  }, [selectedCategory, searchQuery, language, products]);

  // Handlers
  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    addToast(`${t(`product_${product.id}_name`)} added to cart`);
    // Optional: Open cart automatically
    // setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleStartCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutComplete = () => {
    setCart([]);
    addToast('Order placed successfully!', 'success');
  };

  const navigateToProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    window.scrollTo(0, 0);
  };

  const navigateToShop = (category: Category = Category.ALL) => {
    setSelectedCategory(category);
    setCurrentView('shop');
    setSearchQuery(''); // Reset search when clicking nav
    setIsSearchActive(false);
    window.scrollTo(0, 0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Automatically switch to shop view if typing
    if (currentView !== 'shop') {
      setCurrentView('shop');
      // If we are on home, maybe we want to search ALL categories by default
      if (currentView === 'home') setSelectedCategory(Category.ALL);
    }
  };

  const toggleSearch = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchQuery('');
    } else {
      setIsSearchActive(true);
      // Focus logic would ideally go here with a ref
    }
  };

  const openInfoModal = (type: InfoModalType) => {
    setInfoModalType(type);
  };

  // --- RENDER FUNCTIONS (Instead of Components to prevent remounting) ---
  
  const renderHeader = () => (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div 
            className="flex flex-col cursor-pointer group" 
            onClick={() => { setCurrentView('home'); setSearchQuery(''); setIsSearchActive(false); }}
          >
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight group-hover:text-eth-earth transition-colors">ETHIO <span className="text-eth-earth">MOSAIC</span></h1>
            <span className="text-[10px] text-stone-500 uppercase tracking-[0.2em] hidden sm:block">Addis Ababa • Paris • Berlin</span>
          </div>

          {/* Desktop Nav */}
          {!isSearchActive ? (
            <nav className="hidden md:flex gap-6 lg:gap-8">
              <button onClick={() => navigateToShop(Category.ALL)} className={`text-sm font-medium uppercase tracking-widest hover:text-eth-earth transition-colors ${currentView === 'shop' && selectedCategory === Category.ALL ? 'text-eth-earth border-b-2 border-eth-earth' : 'text-stone-600'}`}>{t('nav_shop')}</button>
              <button onClick={() => navigateToShop(Category.CLOTHES)} className="text-sm font-medium uppercase tracking-widest text-stone-600 hover:text-eth-earth transition-colors">{t('nav_clothes')}</button>
              <button onClick={() => navigateToShop(Category.ART)} className="text-sm font-medium uppercase tracking-widest text-stone-600 hover:text-eth-earth transition-colors">{t('nav_art')}</button>
              <button onClick={() => navigateToShop(Category.ACCESSORIES)} className="text-sm font-medium uppercase tracking-widest text-stone-600 hover:text-eth-earth transition-colors">{t('nav_accessories')}</button>
              <button onClick={() => navigateToShop(Category.MISC)} className="text-sm font-medium uppercase tracking-widest text-stone-600 hover:text-eth-earth transition-colors">{t('nav_misc')}</button>
            </nav>
          ) : (
            <div className="hidden md:flex flex-1 max-w-lg mx-8 animate-fade-in relative">
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                autoFocus
                className="w-full bg-stone-50 border-b-2 border-emerald-900 px-4 py-2 text-stone-900 focus:outline-none placeholder:text-stone-400 font-serif"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button onClick={toggleSearch} className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900">
                <X size={18} />
              </button>
            </div>
          )}

          {/* Icons & Language */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Language Selector Desktop */}
            <div className="relative hidden md:block" ref={langMenuRef}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsLangMenuOpen(!isLangMenuOpen); }}
                  className="flex items-center gap-1 text-stone-600 hover:text-emerald-900 font-bold uppercase text-xs p-2 rounded hover:bg-stone-50"
                >
                    <Globe size={18} />
                    <span>{language.toUpperCase()}</span>
                </button>
                {isLangMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-stone-100 py-2 z-50 overflow-hidden animate-fade-in">
                        {LANGUAGE_OPTIONS.map(opt => (
                            <button
                                key={opt.code}
                                onClick={(e) => { e.stopPropagation(); setLanguage(opt.code); setIsLangMenuOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 flex items-center gap-3 transition-colors ${language === opt.code ? 'font-bold text-emerald-900 bg-emerald-50/50' : 'text-stone-600'}`}
                            >
                                <span className="text-lg">{opt.flag}</span> {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button 
              className={`hover:text-stone-900 hidden sm:block transition-colors ${isSearchActive ? 'text-emerald-900' : 'text-stone-600'}`}
              onClick={toggleSearch}
            >
              <Search size={20} />
            </button>
            <div className="relative">
              <button 
                className="text-stone-600 hover:text-eth-earth transition-colors"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-eth-earth text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
            <button 
              className="md:hidden text-stone-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-parchment border-b border-stone-200 py-4 px-4 space-y-4 shadow-lg max-h-[80vh] overflow-y-auto z-[60] fixed top-20 w-full">
           <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input 
                type="text" 
                placeholder={t('search_placeholder')}
                className="w-full bg-white border border-stone-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-900"
                value={searchQuery}
                onChange={handleSearchChange}
              />
           </div>
           <button onClick={() => {navigateToShop(Category.ALL); setIsMobileMenuOpen(false)}} className="block w-full text-left py-2 font-serif font-medium text-stone-800 border-b border-stone-200">{t('nav_shop')}</button>
           <button onClick={() => {navigateToShop(Category.CLOTHES); setIsMobileMenuOpen(false)}} className="block w-full text-left py-2 font-serif font-medium text-stone-800 border-b border-stone-200">{t('nav_clothes')}</button>
           <button onClick={() => {navigateToShop(Category.ART); setIsMobileMenuOpen(false)}} className="block w-full text-left py-2 font-serif font-medium text-stone-800 border-b border-stone-200">{t('nav_art')}</button>
           <button onClick={() => {navigateToShop(Category.ACCESSORIES); setIsMobileMenuOpen(false)}} className="block w-full text-left py-2 font-serif font-medium text-stone-800 border-b border-stone-200">{t('nav_accessories')}</button>
           <button onClick={() => {navigateToShop(Category.MISC); setIsMobileMenuOpen(false)}} className="block w-full text-left py-2 font-serif font-medium text-stone-800 border-b border-stone-200">{t('nav_misc')}</button>
           
           {/* Mobile Language Selector */}
           <div className="pt-2">
             <h4 className="text-xs uppercase text-stone-400 font-bold mb-2">Language</h4>
             <div className="grid grid-cols-2 gap-2">
                {LANGUAGE_OPTIONS.map(opt => (
                    <button
                        key={opt.code}
                        onClick={() => { setLanguage(opt.code); setIsMobileMenuOpen(false); }}
                        className={`text-left px-3 py-2 rounded text-sm flex items-center gap-2 border ${language === opt.code ? 'bg-emerald-50 border-emerald-900 text-emerald-900' : 'bg-white border-stone-200 text-stone-600'}`}
                    >
                        <span>{opt.flag}</span> {opt.label}
                    </button>
                ))}
             </div>
           </div>
           
           {deferredPrompt && (
               <div className="pt-4 border-t border-stone-200">
                   <button 
                    onClick={() => { handleInstallClick(); setIsMobileMenuOpen(false); }}
                    className="w-full bg-emerald-900 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md"
                   >
                       <Download size={18} /> {t('install_app')}
                   </button>
               </div>
           )}
        </div>
      )}
    </header>
  );

  const renderHero = () => (
    <div className="relative bg-eth-earth text-white overflow-hidden h-[75vh] flex items-center justify-center text-center">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center">
        <div className="max-w-4xl animate-fade-in flex flex-col items-center">
            <div className="mb-6">
                <h2 className="text-gold-accent font-medium tracking-[0.3em] uppercase text-sm mb-4">{t('hero_subtitle')}</h2>
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-bold mb-8 leading-tight">
            {t('hero_title')}
            </h1>
            <p className="text-xl text-stone-200 max-w-2xl mb-12 font-light leading-relaxed">
            {t('hero_desc')}
            </p>
            <div className="flex gap-6">
            <Button size="lg" onClick={() => navigateToShop()} className="bg-gold-accent text-stone-900 hover:bg-white border-none font-bold px-8">{t('hero_btn')}</Button>
            </div>
        </div>
      </div>
    </div>
  );

  const renderCategorySection = () => (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-eth-earth uppercase tracking-widest text-xs font-bold mb-2 block">{t('discover_label')}</span>
          <h2 className="text-4xl font-serif font-bold text-stone-900 mb-6">{t('curated_collections')}</h2>
          <div className="w-24 h-px bg-eth-earth mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Shirt, label: t('nav_clothes'), cat: Category.CLOTHES, desc: t('cat_clothes_desc'), image: '/images/banners/fashion.png' },
            { icon: Palette, label: t('nav_art'), cat: Category.ART, desc: t('cat_art_desc'), image: '/images/banners/art.png' },
            { icon: Coffee, label: t('nav_misc'), cat: Category.MISC, desc: t('cat_misc_desc'), image: '/images/banners/coffee.png' },
          ].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => navigateToShop(item.cat)}
              className="relative h-96 group rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500"
            >
              <ImageWithFallback 
                src={item.image} 
                alt={item.label} 
                fallbackTerm={`ethiopian ${item.label}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 text-white border border-white/20">
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">{item.label}</h3>
                  <p className="text-stone-300 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{item.desc}</p>
                  <div className="flex items-center text-gold-accent font-medium text-sm tracking-wide uppercase">
                    {t('shop_now')} <ChevronRight size={16} className="ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProductDetail = (product: Product) => (
    <div className="bg-parchment min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button 
            onClick={() => setCurrentView('shop')}
            className="flex items-center text-stone-500 hover:text-stone-900 mb-8 transition-colors group"
        >
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> {t('back_to_shop')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Image */}
            <div className="relative bg-white rounded-sm shadow-xl p-2 rotate-1 hover:rotate-0 transition-transform duration-500 border border-stone-200">
            <div className="aspect-[4/5] overflow-hidden relative">
                <ImageWithFallback 
                  src={product.imageUrl} 
                  alt={product.name}
                  fallbackTerm={`ethiopian ${product.category} ${product.name}`}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 text-xs font-mono uppercase tracking-widest text-stone-800">
                    {t('authentic')}
                </div>
            </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center pt-8">
            <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-8 bg-eth-earth"></span>
                <AutoTranslatedText 
                 as="span"
                 className="text-eth-earth font-bold tracking-widest uppercase text-xs"
                 value={product.category}
                 translationKey={getCategoryKey(product.category)}
               />
            </div>
            
            <AutoTranslatedText 
                as="h1"
                className="text-5xl font-serif font-bold text-stone-900 mb-6 leading-tight"
                value={product.name}
                translationKey={`product_${product.id}_name`}
            />

            <p className="text-3xl text-coffee font-serif italic mb-8">{product.currency}{product.price}</p>
            
            <div className="prose prose-stone mb-10">
                <AutoTranslatedText 
                    as="p"
                    className="text-lg leading-relaxed text-stone-700"
                    value={product.description}
                    translationKey={`product_${product.id}_desc`}
                />
                
                <div className="bg-white p-6 border-l-4 border-gold-accent my-8 shadow-sm">
                    <h3 className="font-serif text-lg text-stone-900 mb-2 flex items-center gap-2">
                        <Globe size={16} className="text-stone-400" />
                        {t('heritage_craft')}
                    </h3>
                    <AutoTranslatedText 
                        as="p"
                        className="text-stone-600 text-sm leading-relaxed italic"
                        value={product.detailedHistory}
                        translationKey={`product_${product.id}_history`}
                    />
                </div>
            </div>

            <div className="flex gap-4 mb-10">
                <Button size="lg" className="flex-1 h-14 bg-eth-earth text-lg" onClick={() => handleAddToCart(product)} disabled={!product.inStock}>
                {product.inStock ? t('add_to_collection') : t('out_of_stock')}
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-6">
                <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-full text-emerald-900"><Globe size={20} /></div>
                <div>
                    <h4 className="font-bold text-stone-900 text-sm">{t('global_shipping')}</h4>
                    <p className="text-xs text-stone-600 mt-1">{t('global_shipping_desc')}</p>
                </div>
                </div>
                <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-50 rounded-full text-emerald-900"><Palette size={20} /></div>
                <div>
                    <h4 className="font-bold text-stone-900 text-sm">{t('artisan_crafted')}</h4>
                    <p className="text-xs text-stone-600 mt-1">{t('artisan_crafted_desc')}</p>
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-stone-50 text-stone-900 selection:bg-gold-accent selection:text-stone-900 relative">
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      {renderHeader()}
      
      <main>
        {loadingProducts && currentView === 'home' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-parchment">
                <div className="flex flex-col items-center">
                    <Loader2 size={48} className="animate-spin text-emerald-900 mb-4" />
                    <p className="font-serif text-stone-600">Loading Collection...</p>
                </div>
            </div>
        )}

        {currentView === 'home' && !loadingProducts && (
          <>
            {renderHero()}
            {renderCategorySection()}
            <div className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-stone-900">{t('featured_arrivals')}</h2>
                        <p className="text-stone-500 mt-2">{t('featured_arrivals_sub')}</p>
                    </div>
                    <button onClick={() => navigateToShop()} className="text-eth-earth font-bold hover:text-emerald-900 flex items-center gap-2 transition-colors">
                        {t('view_all_collection')} <ArrowRightIcon size={16} />
                    </button>
                 </div>
                 <ProductList 
                    products={products.slice(0, 3)} 
                    onProductClick={navigateToProduct}
                    onAddToCart={handleAddToCart}
                 />
              </div>
            </div>
          </>
        )}

        {currentView === 'shop' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
              <div>
                <h1 className="text-4xl font-serif font-bold mb-2">
                    {searchQuery ? `${t('search_results')} "${searchQuery}"` : (selectedCategory === Category.ALL ? t('full_collection') : getCategoryTranslation(selectedCategory))}
                </h1>
                <p className="text-stone-500">{filteredProducts.length} {filteredProducts.length === 1 ? 'item' : t('items_found')}.</p>
              </div>
              
              {!searchQuery && (
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                  {[Category.ALL, Category.CLOTHES, Category.ART, Category.ACCESSORIES, Category.MISC].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${selectedCategory === cat ? 'bg-eth-earth text-white shadow-lg transform scale-105' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-emerald-200'}`}
                    >
                      {cat === Category.ALL ? t('nav_shop') : getCategoryTranslation(cat)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {loadingProducts ? (
               <div className="py-20 text-center text-stone-500">Loading catalog...</div>
            ) : filteredProducts.length > 0 ? (
                <ProductList 
                products={filteredProducts} 
                onProductClick={navigateToProduct}
                onAddToCart={handleAddToCart}
                />
            ) : (
                <div className="text-center py-20 bg-white border border-stone-100 rounded-lg">
                    <Search className="mx-auto h-12 w-12 text-stone-300 mb-4" />
                    <h3 className="text-lg font-medium text-stone-900">{t('no_items_found')}</h3>
                    <p className="text-stone-500 mt-2">Try adjusting your search terms or browse our full collection.</p>
                    <Button 
                        className="mt-6" 
                        onClick={() => {setSearchQuery(''); setIsSearchActive(false); setSelectedCategory(Category.ALL)}}
                    >
                        {t('reset_search')}
                    </Button>
                </div>
            )}
          </div>
        )}

        {currentView === 'product' && selectedProduct && renderProductDetail(selectedProduct)}
      </main>

      <footer className="bg-stone-900 text-stone-400 py-16 mt-0 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
             <h2 className="text-white text-2xl font-serif font-bold mb-6 tracking-wide">ETHIO <span className="text-gold-accent">MOSAIC</span></h2>
             <p className="max-w-sm text-sm leading-relaxed mb-6">Connecting the Horn of Africa to the world. We specialize in ethically sourced, high-quality cultural artifacts, textiles, and coffee from Ethiopia.</p>
             <div className="flex gap-4 mb-8">
                 <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-eth-earth hover:text-white transition-colors cursor-pointer"><Globe size={18}/></div>
                 <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center hover:bg-gold-accent hover:text-stone-900 transition-colors cursor-pointer"><Coffee size={18}/></div>
             </div>
             
             {/* Newsletter Signup */}
             <div className="max-w-sm">
                 <p className="text-xs uppercase font-bold tracking-widest text-stone-500 mb-3">Subscribe to our newsletter</p>
                 <div className="flex gap-2">
                     <input 
                        type="email" 
                        placeholder="Email Address" 
                        className="bg-stone-800 border-none text-white text-sm px-4 py-2 flex-1 focus:ring-1 focus:ring-gold-accent outline-none" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                     />
                     <button onClick={handleSubscribe} className="bg-gold-accent text-stone-900 px-4 py-2 hover:bg-white transition-colors font-bold"><ArrowRightIcon size={16}/></button>
                 </div>
             </div>
          </div>
          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest text-gold-accent">{t('customer_care')}</h3>
            <ul className="space-y-3 text-sm">
              <li onClick={() => openInfoModal('shipping')} className="hover:text-white cursor-pointer transition-colors">{t('shipping_policy')}</li>
              <li onClick={() => openInfoModal('authenticity')} className="hover:text-white cursor-pointer transition-colors">{t('authenticity_guarantee')}</li>
              <li onClick={() => openInfoModal('returns')} className="hover:text-white cursor-pointer transition-colors">{t('returns_exchanges')}</li>
              <li onClick={() => openInfoModal('tracking')} className="hover:text-white cursor-pointer transition-colors font-bold text-gold-accent">{t('track_order')}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold mb-6 text-sm uppercase tracking-widest text-gold-accent">{t('contact')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-eth-earth flex-shrink-0"></span> 
                <a href="mailto:estifanosaddisuyimer@gmail.com" className="hover:text-white transition-colors break-all">estifanosaddisuyimer@gmail.com</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold-accent flex-shrink-0"></span> 
                <a href="tel:+3225550199" className="hover:text-white transition-colors">+32 2 555 0199 (Brussels HQ)</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stone-600 flex-shrink-0"></span> 
                <a href="https://maps.google.com/?q=Bole+Road,Addis+Ababa" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Bole Road, Addis Ababa</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-stone-800 text-xs text-center flex flex-col sm:flex-row justify-between items-center text-stone-500 gap-4">
          <p>© 2024 Ethio Mosaic. {t('rights_reserved')}</p>
          <div className="flex gap-4 items-center">
              <span>{t('privacy_policy')}</span>
              <span>{t('terms_service')}</span>
              {deferredPrompt && (
                  <button 
                    onClick={handleInstallClick} 
                    className="flex items-center gap-1 text-gold-accent hover:text-white transition-colors font-bold"
                  >
                      <Download size={14} /> {t('install_app')}
                  </button>
              )}
          </div>
        </div>
      </footer>

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={handleStartCheckout}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onComplete={handleCheckoutComplete}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      <InfoModal 
        isOpen={!!infoModalType}
        onClose={() => setInfoModalType(null)}
        type={infoModalType}
      />

      <CuratorChat activeProduct={currentView === 'product' ? selectedProduct : undefined} />
    </div>
  );
};

const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}

export default App;