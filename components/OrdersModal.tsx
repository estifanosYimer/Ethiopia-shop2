
import React, { useEffect, useState } from 'react';
import { X, RefreshCw, Archive, MapPin, ShoppingBag, Package, Lock, Mail, Phone, Globe, LayoutGrid, Plus, Edit, Trash2, Save, Loader2, Image as ImageIcon, Users } from 'lucide-react';
import { backend } from '../services/backend';
import { Order, Product, Category } from '../types';
import Button from './Button';
import ImageWithFallback from './ImageWithFallback';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'orders' | 'inventory' | 'subscribers';

const OrdersModal: React.FC<OrdersModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  
  // Data
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribers, setSubscribers] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Authorization State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  // Edit/Add Product State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({});
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthorized) {
      refreshData();
    }
  }, [isOpen, isAuthorized, activeTab]);

  const refreshData = async () => {
    setLoading(true);
    if (activeTab === 'orders') {
        const data = await backend.getOrders();
        setOrders(data);
    } else if (activeTab === 'inventory') {
        const data = await backend.getProducts();
        setProducts(data);
    } else if (activeTab === 'subscribers') {
        const data = await backend.getSubscribers();
        setSubscribers(data);
    }
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setCheckingAuth(true);
      const valid = await backend.verifyAdminPin(pin);
      setCheckingAuth(false);
      
      if (valid) {
          setIsAuthorized(true);
          setAuthError(false);
      } else {
          setAuthError(true);
          setPin('');
      }
  };

  // --- INVENTORY HANDLERS ---
  const handleEditProduct = (p: Product) => {
      setEditingProduct({ ...p });
      setIsEditingProduct(true);
  };

  const handleAddProduct = () => {
      setEditingProduct({
          name: '',
          price: 0,
          currency: '€',
          category: Category.CLOTHES,
          description: '',
          detailedHistory: '',
          imageUrl: '',
          inStock: true
      });
      setIsEditingProduct(true);
  };

  const handleDeleteProduct = async (id: string) => {
      if(window.confirm('Delete this product? This action cannot be undone.')) {
          setLoading(true);
          await backend.deleteProduct(id);
          refreshData();
      }
  };

  const processImageUrl = (url?: string): string => {
      if (!url) return '';
      let cleanUrl = url.trim();

      // 1. Fix GitHub Blob URLs to Raw URLs
      // From: https://github.com/user/repo/blob/main/image.png
      // To:   https://raw.githubusercontent.com/user/repo/main/image.png
      if (cleanUrl.includes('github.com') && cleanUrl.includes('/blob/')) {
          cleanUrl = cleanUrl.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }

      // 2. Fallback for testing if user types "test"
      if (cleanUrl === 'test') {
          return 'https://placehold.co/600x800/EEE/31343C?text=New+Product';
      }

      return cleanUrl;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      setSavingProduct(true);
      
      try {
          // Process the image URL to fix GitHub links automatically
          const finalProductData = {
              ...editingProduct,
              imageUrl: processImageUrl(editingProduct.imageUrl)
          };

          if (finalProductData.id) {
              await backend.updateProduct(finalProductData.id, finalProductData);
          } else {
              // Create new (cast to remove ID from type if needed, backend handles ID gen)
              await backend.addProduct(finalProductData as any);
          }
          setIsEditingProduct(false);
          refreshData();
      } catch (error) {
          console.error(error);
          alert("Failed to save product.");
      } finally {
          setSavingProduct(false);
      }
  };

  const handleClearOrders = async () => {
      if(window.confirm('Are you sure you want to delete all order history?')) {
          await backend.clearOrders();
          refreshData();
      }
  };

  if (!isOpen) return null;

  // --- UNAUTHORIZED VIEW ---
  if (!isAuthorized) {
      return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center animate-fade-in">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-6 text-stone-600">
                    <Lock size={32} />
                </div>
                <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">Restricted Access</h2>
                <p className="text-sm text-stone-500 mb-6 text-center">Please enter your merchant PIN to access the backend.</p>
                
                <form onSubmit={handleAuth} className="w-full space-y-4">
                    <input 
                        type="password" 
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter PIN (1234)"
                        autoFocus
                        disabled={checkingAuth}
                        className="w-full text-center tracking-[0.5em] text-2xl p-3 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-900 outline-none"
                    />
                    {authError && <p className="text-red-600 text-xs text-center font-bold">Incorrect PIN</p>}
                    <Button type="submit" className="w-full" disabled={checkingAuth}>
                        {checkingAuth ? <Loader2 className="animate-spin"/> : "Unlock Dashboard"}
                    </Button>
                </form>
                <button onClick={onClose} className="mt-4 text-stone-400 hover:text-stone-600 text-sm">Cancel</button>
            </div>
        </div>
      );
  }

  // --- AUTHORIZED DASHBOARD ---
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-6xl bg-stone-50 rounded-xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-900 text-white rounded">
                    <Archive size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-serif font-bold text-stone-900">Admin Dashboard</h2>
                    <p className="text-sm text-stone-500">Ethio Mosaic Backend</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={refreshData} className="p-2 hover:bg-stone-100 rounded-full text-stone-600" title="Refresh">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full text-stone-600">
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Tabs */}
        <div className="bg-white px-6 flex gap-6 border-b border-stone-200 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('orders')}
                className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'border-emerald-900 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
            >
                <ShoppingBag size={18}/> Orders
            </button>
            <button 
                onClick={() => setActiveTab('inventory')}
                className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'inventory' ? 'border-emerald-900 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
            >
                <LayoutGrid size={18}/> Inventory
            </button>
            <button 
                onClick={() => setActiveTab('subscribers')}
                className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'subscribers' ? 'border-emerald-900 text-emerald-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}
            >
                <Users size={18}/> Subscribers
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
            
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
                <div className="h-full overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-20 text-stone-400">Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20 text-stone-400 flex flex-col items-center">
                             <Package size={48} className="mb-4 opacity-50" />
                             <p>No orders yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center font-bold font-mono text-xs">
                                                {order.id.split('-')[1]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-stone-900">{order.shippingDetails.firstName} {order.shippingDetails.lastName}</h3>
                                                <p className="text-xs text-stone-500">{new Date(order.date).toLocaleString()}</p>
                                            </div>
                                            <div className="hidden sm:block">
                                                <span className="flex items-center gap-1 text-xs text-stone-400 border border-stone-200 px-2 py-1 rounded">
                                                    <Globe size={10} /> {order.language?.toUpperCase() || 'EN'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-serif font-bold text-lg">€{order.total.toFixed(2)}</span>
                                            <span className="text-stone-400 text-sm">{expandedOrderId === order.id ? 'Collapse' : 'Details'}</span>
                                        </div>
                                    </div>

                                    {expandedOrderId === order.id && (
                                        <div className="p-6 border-t border-stone-100 bg-stone-50 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
                                                    <MapPin size={16} /> Shipping Details
                                                </h4>
                                                <div className="bg-white p-4 rounded border border-stone-200 text-sm space-y-2 text-stone-600">
                                                    <p><span className="font-bold">Name:</span> {order.shippingDetails.firstName} {order.shippingDetails.lastName}</p>
                                                    <p className="flex items-center gap-2"><Mail size={12} className="text-stone-400"/> {order.shippingDetails.email}</p>
                                                    <p className="flex items-center gap-2"><Phone size={12} className="text-stone-400"/> {order.shippingDetails.phone}</p>
                                                    <div className="h-px bg-stone-100 my-2"></div>
                                                    <p><span className="font-bold">Address:</span> {order.shippingDetails.address}</p>
                                                    <p><span className="font-bold">Location:</span> {order.shippingDetails.city}, {order.shippingDetails.postalCode}</p>
                                                    <p><span className="font-bold">Country:</span> {order.shippingDetails.country}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
                                                    <ShoppingBag size={16} /> Items ({order.items.length})
                                                </h4>
                                                <div className="bg-white p-4 rounded border border-stone-200 text-sm space-y-3">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center border-b border-stone-100 last:border-0 pb-2 last:pb-0">
                                                            <div className="flex gap-2 items-center">
                                                                <span className="font-bold text-stone-400">{item.quantity}x</span>
                                                                <span className="text-stone-700">{item.name}</span>
                                                            </div>
                                                            <span className="text-stone-900 font-medium">€{(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="pt-2 flex justify-between font-bold text-stone-900">
                                                        <span>Total Paid</span>
                                                        <span>€{order.total.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="pt-8">
                                <button onClick={handleClearOrders} className="text-red-600 text-xs hover:underline">Clear Order History</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
                <div className="h-full flex flex-col">
                    <div className="p-4 bg-stone-100 border-b border-stone-200 flex justify-end">
                        <Button size="sm" onClick={handleAddProduct} className="flex items-center gap-2">
                            <Plus size={16}/> Add Product
                        </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="text-center py-20 text-stone-400">Loading inventory...</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {products.map(p => (
                                    <div key={p.id} className="bg-white p-4 rounded-lg shadow-sm border border-stone-200 flex gap-4 items-center">
                                        <div className="w-16 h-16 bg-stone-100 rounded overflow-hidden flex-shrink-0">
                                            <ImageWithFallback src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-stone-900 truncate">{p.name}</h3>
                                                <span className="text-[10px] uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded">{p.category}</span>
                                            </div>
                                            <p className="text-xs text-stone-500 truncate">{p.description}</p>
                                            <p className="text-sm font-medium text-emerald-800 mt-1">€{p.price}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditProduct(p)} className="p-2 text-stone-400 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"><Edit size={18}/></button>
                                            <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SUBSCRIBERS TAB */}
            {activeTab === 'subscribers' && (
                <div className="h-full overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-20 text-stone-400">Loading subscribers...</div>
                    ) : subscribers.length === 0 ? (
                        <div className="text-center py-20 text-stone-400 flex flex-col items-center">
                             <Users size={48} className="mb-4 opacity-50" />
                             <p>No newsletter subscribers yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider border-b border-stone-200">
                                        <th className="p-4">#</th>
                                        <th className="p-4">Email Address</th>
                                        <th className="p-4">Date Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-stone-700">
                                    {subscribers.map((email, idx) => (
                                        <tr key={idx} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                                            <td className="p-4 font-mono text-stone-400">{idx + 1}</td>
                                            <td className="p-4 font-medium">{email}</td>
                                            <td className="p-4 text-stone-500">Recently</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 bg-stone-50 border-t border-stone-200 text-xs text-stone-500 text-right">
                                Total Subscribers: {subscribers.length}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PRODUCT EDIT OVERLAY */}
            {isEditingProduct && (
                <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full md:w-[500px] bg-white h-full shadow-2xl flex flex-col animate-fade-in">
                        <div className="p-4 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                            <h3 className="font-bold text-lg">{editingProduct.id ? 'Edit Product' : 'New Product'}</h3>
                            <button onClick={() => setIsEditingProduct(false)}><X size={20} className="text-stone-500"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <form id="productForm" onSubmit={handleSaveProduct} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Product Name</label>
                                    <input required className="w-full border p-2 rounded" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Price (€)</label>
                                        <input required type="number" step="0.01" className="w-full border p-2 rounded" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Category</label>
                                        <select className="w-full border p-2 rounded" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value as Category})}>
                                            {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Description (Short)</label>
                                    <textarea required className="w-full border p-2 rounded" rows={2} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1">History / Details</label>
                                    <textarea required className="w-full border p-2 rounded" rows={4} value={editingProduct.detailedHistory} onChange={e => setEditingProduct({...editingProduct, detailedHistory: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-stone-500 mb-1 flex items-center gap-1">
                                        <ImageIcon size={12}/> Image URL
                                    </label>
                                    <input 
                                        required 
                                        className="w-full border p-2 rounded text-xs" 
                                        placeholder="Paste GitHub 'blob' or 'raw' link here" 
                                        value={editingProduct.imageUrl} 
                                        onChange={e => setEditingProduct({...editingProduct, imageUrl: e.target.value})} 
                                    />
                                    <p className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1">
                                        ✨ Auto-fixes GitHub 'blob' links to 'raw' automatically!
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={editingProduct.inStock} onChange={e => setEditingProduct({...editingProduct, inStock: e.target.checked})} />
                                    <label className="text-sm">In Stock</label>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsEditingProduct(false)} type="button">Cancel</Button>
                            <Button form="productForm" type="submit" disabled={savingProduct}>
                                {savingProduct ? 'Saving...' : <><Save size={16} className="mr-2"/> Save Product</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default OrdersModal;
