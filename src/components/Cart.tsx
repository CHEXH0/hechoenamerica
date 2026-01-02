import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeItem, clearCart, getItemCount, getTotalPrice } = useCart();
  const { user } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your purchase.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Add some items to your cart first.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open checkout in new tab
        window.open(data.url, '_blank');
        
        // Clear cart after successful checkout initiation
        clearCart();
        onClose();
        
        toast({
          title: "Redirecting to Checkout",
          description: "Opening checkout in a new tab...",
        });
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-br from-purple-900/95 via-pink-900/95 to-red-900/95 backdrop-blur-xl border-l border-purple-500/30 z-50 overflow-hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-6 w-6 text-pink-400" />
                    <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
                    {getItemCount() > 0 && (
                      <Badge className="bg-pink-500 text-white">
                        {getItemCount()}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Your cart is empty</h3>
                    <p className="text-gray-400">Add some treats to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.product_id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="bg-black/30 rounded-lg p-4 border border-purple-500/20"
                      >
                        <div className="flex gap-3">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-gray-400 text-xs capitalize">
                              {item.product.category} • {item.product.type}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-pink-400 font-bold">
                                {item.product.price}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                
                                <span className="text-white text-sm w-8 text-center">
                                  {item.quantity}
                                </span>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.product_id)}
                                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300 ml-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with total and checkout */}
              {items.length > 0 && (
                <div className="p-6 border-t border-purple-500/30 bg-black/20">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-300">Total:</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                    
                    <Button
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white border-0 py-6"
                    >
                      {isCheckingOut ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <CreditCard className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <CreditCard className="h-5 w-5 mr-2" />
                      )}
                      {isCheckingOut ? 'Processing...' : 'Checkout'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={clearCart}
                      className="w-full text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      Clear Cart
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};