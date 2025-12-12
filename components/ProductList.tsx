import React from 'react';
import { Product } from '../types';
import Button from './Button';
import ImageWithFallback from './ImageWithFallback';
import { useLanguage } from '../i18n';
import AutoTranslatedText from './AutoTranslatedText';

interface ProductListProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onProductClick, onAddToCart }) => {
  const { t } = useLanguage();

  const getCategoryKey = (category: string) => {
    // Helper to generate consistent keys for categories
    if (category === 'Clothes') return 'nav_clothes';
    if (category === 'Art') return 'nav_art';
    if (category === 'Accessories') return 'nav_accessories';
    if (category.includes('Misc')) return 'nav_misc';
    return `nav_${category.toLowerCase().replace(' ', '_')}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="group bg-white rounded-none shadow-sm hover:shadow-2xl transition-all duration-500 border border-stone-100 flex flex-col relative"
        >
          {/* Decorative Corner */}
          <div className="absolute top-0 left-0 w-0 h-0 border-t-[30px] border-l-[30px] border-t-emerald-900 border-l-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div 
            className="relative aspect-[4/5] overflow-hidden cursor-pointer bg-stone-100"
            onClick={() => onProductClick(product)}
          >
            <ImageWithFallback 
              src={product.imageUrl} 
              alt={product.name}
              fallbackTerm={`ethiopian ${product.category} ${product.name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {!product.inStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <span className="bg-stone-900 text-white px-4 py-2 text-sm font-medium uppercase tracking-widest border border-stone-900">{t('sold_out')}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <span className="text-white text-xs font-bold uppercase tracking-widest border-b border-eth-yellow pb-1">{t('view_details')}</span>
            </div>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            <div onClick={() => onProductClick(product)} className="cursor-pointer mb-3">
               <AutoTranslatedText 
                 as="div"
                 className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold mb-1"
                 value={product.category}
                 translationKey={getCategoryKey(product.category)}
               />
               <AutoTranslatedText 
                 as="h3" 
                 className="font-serif text-xl font-bold text-stone-900 group-hover:text-emerald-800 transition-colors"
                 value={product.name}
                 translationKey={`product_${product.id}_name`}
               />
               <AutoTranslatedText 
                 as="p"
                 className="text-stone-500 text-sm line-clamp-2 mt-2 font-light leading-relaxed"
                 value={product.description}
                 translationKey={`product_${product.id}_desc`}
               />
            </div>
            
            <div className="mt-auto flex items-center justify-between pt-5 border-t border-stone-100">
              <span className="font-serif text-lg text-stone-900 font-medium">{product.currency}{product.price}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onAddToCart(product)}
                disabled={!product.inStock}
                className="hover:bg-emerald-900 hover:text-white hover:border-emerald-900 transition-colors"
              >
                {t('add_to_cart')}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;