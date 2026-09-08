import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductSearch } from '../components/pos/ProductSearch';
import { CartTable } from '../components/pos/CartTable';
import { CustomerLookup } from '../components/pos/CustomerLookup';
import { BillingFooter } from '../components/pos/BillingFooter';
import { CheckoutModal } from '../components/pos/CheckoutModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { usePosStore } from '../store/usePosStore';
import { Product, Order } from '../types';

export const BillingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { addToCart, cart } = usePosStore();

  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [receiptOpen, setReceiptOpen] = useState<boolean>(false);

  const handleSelectProduct = (product: Product) => {
    addToCart(product);
  };

  const handleCheckoutSuccess = (order: Order) => {
    setCompletedOrder(order);
    setReceiptOpen(true);
  };

  // Keyboard shortcut listener for Billing page specifically (F12 or Space to open checkout if cart is not empty)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'F12' || (e.code === 'Space' && (e.ctrlKey || e.altKey))) &&
        cart.length > 0 &&
        !checkoutOpen &&
        !receiptOpen
      ) {
        e.preventDefault();
        setCheckoutOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, checkoutOpen, receiptOpen]);

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Left Column: Product Search, Catalog, Scanner */}
      <div className="flex-1 h-full min-w-0 flex flex-col">
        <ProductSearch
          onSelectProduct={handleSelectProduct}
          initialSearch={initialSearch}
        />
      </div>

      {/* Right Column: Customer Bar, Cart Table & Billing Footer */}
      <div className="w-full lg:w-[560px] xl:w-[660px] 2xl:w-[740px] h-full flex flex-col gap-3 flex-shrink-0">
        {/* Customer Loyalty Tag */}
        <CustomerLookup />

        {/* Cart Line Items */}
        <CartTable />

        {/* Total Summary & Checkout Button */}
        <BillingFooter onOpenCheckout={() => setCheckoutOpen(true)} />
      </div>

      {/* Checkout & Tender Settlement Dialog */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Post-Checkout Thermal Receipt Modal */}
      <ReceiptModal
        order={completedOrder}
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
    </div>
  );
};
