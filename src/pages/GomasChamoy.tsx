import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Plus, Minus, Candy } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { Cart } from "@/components/Cart";

import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GomasChamoy = () => {
  const [searchParams] = useSearchParams();
  const { data: allProducts, isLoading } = useProducts();
  const { user } = useAuth();
  const { addItem, removeItem, updateQuantity, getItemCount, items: cartItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const candyProducts = React.useMemo(
    () => allProducts?.filter((p) => p.category === "candies") || [],
    [allProducts]
  );


  const getCartQuantity = (productId: string) =>
    cartItems.find((item) => item.product_id === productId)?.quantity || 0;

  const getAvailableStock = (product: Product) => {
    const stock = product.stock ?? 100;
    const inCart = getCartQuantity(product.id);
    return Math.max(0, stock - inCart);
  };

  const handleAddToCart = (product: Product) => {
    const available = getAvailableStock(product);
    if (available <= 0) {
      toast({ title: "Out of Stock", description: `${product.name} is out of stock.`, variant: "destructive" });
      return;
    }
    addItem(product);
    toast({ title: "Added to Cart! 🛒", description: `${product.name} has been added to your cart.` });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1.05, 1, 1.05] }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 p-6 sm:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/treats"
            className="inline-flex items-center text-pink-400 hover:text-pink-300 transition-colors duration-200 group"
          >
            <motion.div whileHover={{ x: -5 }} transition={{ duration: 0.2 }}>
              <ArrowLeft className="h-5 w-5 mr-2" />
            </motion.div>
            Back to Treats
          </Link>

          <Button
            onClick={() => setCartOpen(true)}
            variant="outline"
            className="border-pink-400/50 text-pink-400 hover:bg-pink-500/20 hover:border-pink-400 relative"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart
            {getItemCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-1.5 py-0.5">
                {getItemCount()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Hero */}
        <div className="text-center mb-12">
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="/laptop-uploads/Gomas_Chamoy.png"
              alt="Gomas Chamoy"
              className="h-32 w-32 sm:h-40 sm:w-40 object-contain drop-shadow-2xl"
            />
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Gomas Chamoy
          </motion.h1>
          <motion.p
            className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Handcrafted chamoy gummy candy with authentic Latin American flavors. Pick your favorites or request a custom order!
          </motion.p>
          <motion.p
            className="text-sm text-pink-400/70 mt-3 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            🌎 Currently shipping to Latin America only. More countries coming soon!
          </motion.p>
        </div>

        {/* Products Grid or Custom Order Fallback */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-400 rounded-full"
            />
          </div>
        ) : candyProducts.length > 0 ? (
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Product Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
              {candyProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="group"
                >
                  <Card className="bg-black/80 border-red-500/30 hover:border-pink-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/15 backdrop-blur-md overflow-hidden h-full flex flex-col">
                    {/* Product Image */}
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <motion.img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-6 bg-black/40"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <Badge className="absolute top-3 right-3 bg-pink-600/90 text-white border-0 text-sm font-bold px-3">
                        {product.price}
                      </Badge>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/30 to-red-500/30 flex items-center justify-center border border-pink-400/30">
                          <Candy className="h-5 w-5 text-pink-400" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg group-hover:text-pink-300 transition-colors duration-300">
                            {product.name}
                          </CardTitle>
                          <p className="text-xs text-pink-400/70 font-medium uppercase tracking-wider">
                            {product.type}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <CardDescription className="text-gray-300 leading-relaxed text-sm">
                        {product.description}
                      </CardDescription>
                      {product.weight && (
                        <Badge variant="outline" className="mt-3 border-pink-400/30 text-pink-300 text-xs">
                          {product.weight}
                        </Badge>
                      )}
                    </CardContent>

                    <CardFooter className="pt-2">
                      <div className="w-full space-y-2">
                        {getCartQuantity(product.id) > 0 ? (
                          <div className="flex items-center justify-between bg-pink-500/10 border border-pink-400/30 rounded-lg px-3 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const qty = getCartQuantity(product.id);
                                if (qty <= 1) {
                                  removeItem(product.id);
                                } else {
                                  updateQuantity(product.id, qty - 1);
                                }
                              }}
                              className="h-8 w-8 p-0 text-pink-400 hover:text-pink-300 hover:bg-pink-500/20"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="text-white font-bold text-lg">{getCartQuantity(product.id)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddToCart(product)}
                              disabled={getAvailableStock(product) <= 0}
                              className="h-8 w-8 p-0 text-pink-400 hover:text-pink-300 hover:bg-pink-500/20 disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            disabled={(product.stock ?? 100) <= 0}
                            className="w-full bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white border-0 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                        {product.stock !== null && product.stock !== undefined && (
                          <p className={`text-xs text-center ${(product.stock ?? 100) <= 10 ? 'text-red-400' : 'text-gray-500'}`}>
                            {(product.stock ?? 100) <= 0 ? 'Out of Stock' : `${product.stock} left in stock`}
                          </p>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Custom Order Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-400/20 mb-4">
                  <Scroll className="h-4 w-4 text-pink-400" />
                  <span className="text-pink-300 text-sm font-medium">Custom Orders</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
                  Want Something Special?
                </h2>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Request a custom chamoy gummy order tailored to your taste. We'll quote you a price and craft it just for you.
                </p>
              </div>
              <div className="max-w-2xl mx-auto">
                <ChamoyRequestCard />
              </div>
            </motion.div>
          </div>
        ) : (
          /* Fallback: No products — show custom order as primary */
          <div className="max-w-2xl mx-auto">
            <ChamoyRequestCard />
          </div>
        )}
      </div>

      <div className="relative z-10 mt-20">
        <Footer />
      </div>

      {/* Cart Panel */}
      <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default GomasChamoy;
