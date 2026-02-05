import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, Home, User, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/treats');
      return;
    }

    const verifyPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { session_id: sessionId }
        });

        if (error) {
          throw error;
        }

        if (data?.purchases) {
          setPurchases(data.purchases);
          setVerificationComplete(true);
          
          toast({
            title: "Payment Successful! 🎉",
            description: "Your purchase has been completed and recorded.",
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast({
          title: "Verification Error",
          description: "There was an issue verifying your payment. Please check your purchase history.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-pink-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-400 rounded-full mx-auto mb-6"
          />
          <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
          <p className="text-gray-400">Please wait while we confirm your purchase...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-pink-950 relative overflow-hidden">
      {/* Background Effects */}
      <motion.div 
        className="absolute top-20 left-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-6">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              Thank you for your purchase! Your treats are now available in your account.
            </p>
          </motion.div>

          {/* Purchase Summary */}
          {verificationComplete && purchases.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <Card className="bg-gradient-to-br from-purple-900/50 via-pink-900/50 to-red-900/50 border-green-500/30 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-400" />
                    Your Purchase Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {purchases.map((purchase, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-purple-500/20 last:border-b-0">
                        <div className="text-left">
                          <div className="font-semibold text-white">{purchase.product_name}</div>
                          <div className="text-sm text-gray-400 capitalize">
                            {purchase.product_category} • {purchase.product_type}
                          </div>
                        </div>
                        <div className="font-bold text-green-400">{purchase.price}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              asChild
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-0 px-8 py-6"
            >
              <Link to="/purchases">
                <Download className="h-5 w-5 mr-2" />
                View My Downloads
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-purple-400/50 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 px-8 py-6"
            >
              <Link to="/treats">
                <Package className="h-5 w-5 mr-2" />
                Browse More Treats
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-white/10 px-8 py-6"
            >
              <Link to="/">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </Button>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-12 p-6 bg-black/30 rounded-lg border border-purple-500/20"
          >
            <h3 className="text-lg font-semibold text-white mb-2">What's Next?</h3>
            <p className="text-gray-400 text-sm">
              Your purchases are now available in your account. You can access them anytime from your downloads page.
              Need help? Contact our support team.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;