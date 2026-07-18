import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle, Loader2, ChefHat, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SubscriptionSuccess = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking"); // checking, success, error
  const [paymentDetails, setPaymentDetails] = useState(null);

  const pollPaymentStatus = useCallback(async function checkPaymentStatus(sessionId, attempts = 0) {
    const maxAttempts = 15;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus("error");
      toast.error("Payment verification timed out. Please contact support.");
      return;
    }

    try {
      const response = await axios.get(`${API}/subscriptions/status/${sessionId}`);
      const data = response.data;

      if (data.payment_status === "paid") {
        setStatus("success");
        setPaymentDetails(data);
        toast.success("Welcome to Restaurateur Pro!");
        return;
      } else if (data.status === "expired" || data.status === "canceled") {
        setStatus("error");
        toast.error("Payment was not completed.");
        return;
      }

      // Continue polling
      setTimeout(() => checkPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error("Error checking payment status:", error);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => checkPaymentStatus(sessionId, attempts + 1), pollInterval);
      } else {
        setStatus("error");
      }
    }
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus("error");
    }
  }, [pollPaymentStatus, searchParams]);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#d4af37] animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-heading font-bold text-zinc-100 mb-2">
            Verifying Payment...
          </h1>
          <p className="text-zinc-400">Please wait while we confirm your subscription.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-8">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-zinc-100 mb-2">
            Payment Not Completed
          </h1>
          <p className="text-zinc-400 mb-8">
            We couldn't verify your payment. If you believe this is an error, please contact support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/pricing")}
              className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-8">
        <div className="w-20 h-20 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-6 animate-fade-in">
          <CheckCircle className="w-12 h-12 text-emerald" />
        </div>
        
        <h1 className="text-3xl font-heading font-bold text-zinc-100 mb-2 animate-fade-in">
          Welcome to Restaurateur Pro!
        </h1>
        
        <p className="text-zinc-400 mb-8 animate-fade-in">
          Your subscription is now active. You have full access to all features.
        </p>

        {paymentDetails && (
          <div className="bg-zinc-900/50 rounded-lg p-4 mb-8 text-left animate-fade-in">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Payment Details</p>
            <div className="space-y-1">
              <p className="text-sm text-zinc-300">
                Amount: <span className="text-zinc-100 font-medium">
                  ${(paymentDetails.amount_total / 100).toFixed(2)} {paymentDetails.currency?.toUpperCase()}
                </span>
              </p>
              <p className="text-sm text-zinc-300">
                Status: <span className="text-emerald font-medium">Paid</span>
              </p>
            </div>
          </div>
        )}

        <Button 
          data-testid="go-to-dashboard"
          onClick={() => navigate("/dashboard")}
          className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030] font-medium px-8 py-6 text-lg animate-fade-in"
        >
          Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500 animate-fade-in">
          <ChefHat className="w-4 h-4" />
          <span className="text-sm">Start building your restaurant empire</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
