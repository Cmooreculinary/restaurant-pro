import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  Check, ChefHat, Sparkles, Building2, Crown, ArrowRight, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Pricing = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user]);

  // Check for return from Stripe
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [searchParams]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API}/subscriptions/plans`);
      setPlans(response.data.plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      // Fallback to default plans
      setPlans([
        {
          id: "single_unit",
          name: "Single Unit",
          price: 14.00,
          features: [
            "1 Restaurant Project",
            "Command Center Access",
            "Site Strategist",
            "Ground Up Module",
            "Ops Launchpad",
            "Email Support"
          ]
        },
        {
          id: "multi_unit",
          name: "Multi-Unit",
          price: 18.00,
          features: [
            "Unlimited Restaurant Projects",
            "All Single Unit Features",
            "Expansion Toolkit",
            "Lease Negotiation Module",
            "AI-Powered Analysis",
            "Priority Support",
            "Franchise Readiness Tools"
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await axios.get(`${API}/subscriptions/my-subscription`);
      setCurrentSubscription(response.data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      toast.error("Payment status check timed out. Please check your email for confirmation.");
      return;
    }

    try {
      const response = await axios.get(`${API}/subscriptions/status/${sessionId}`);
      const data = response.data;

      if (data.payment_status === "paid") {
        toast.success("Payment successful! Welcome to Restaurateur Pro!");
        fetchCurrentSubscription();
        // Clear the URL params
        navigate("/pricing", { replace: true });
        return;
      } else if (data.status === "expired") {
        toast.error("Payment session expired. Please try again.");
        navigate("/pricing", { replace: true });
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error("Error checking payment status:", error);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
      }
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      // Redirect to login
      const redirectUrl = window.location.origin + '/pricing';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      return;
    }

    setCheckoutLoading(planId);

    try {
      const response = await axios.post(`${API}/subscriptions/checkout`, {
        plan_id: planId,
        origin_url: window.location.origin
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.detail || "Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/pricing';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
          <p className="text-zinc-400 text-sm">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 rounded-lg bg-[#d4af37] flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-zinc-900" />
          </div>
          <span className="text-xl font-heading font-bold text-zinc-100">Restaurateur Pro</span>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{user.email}</span>
            <Button 
              onClick={() => navigate("/dashboard")}
              className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            >
              Dashboard
            </Button>
          </div>
        ) : (
          <Button 
            data-testid="pricing-login-btn"
            onClick={handleLogin}
            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium"
          >
            Sign In
          </Button>
        )}
      </nav>

      {/* Header */}
      <div className="text-center py-16 px-8">
        <Badge className="badge-gold mb-4">
          <Sparkles className="w-3 h-3 mr-1" />
          Simple Pricing
        </Badge>
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-zinc-100 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Start building your restaurant empire today. All plans include a 14-day free trial.
        </p>
      </div>

      {/* Current Subscription Banner */}
      {currentSubscription?.status === "active" && (
        <div className="max-w-4xl mx-auto px-8 mb-8">
          <div className="p-4 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald" />
              <span className="text-emerald font-medium">
                You're subscribed to the {currentSubscription.plan === "single_unit" ? "Single Unit" : "Multi-Unit"} plan
              </span>
            </div>
            <Button 
              variant="outline" 
              className="border-emerald/30 text-emerald hover:bg-emerald/10"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan, index) => {
            const isPopular = plan.id === "multi_unit";
            const isCurrentPlan = currentSubscription?.plan === plan.id && currentSubscription?.status === "active";
            
            return (
              <Card 
                key={plan.id}
                data-testid={`plan-card-${plan.id}`}
                className={`relative bg-[#18181b] border-zinc-800/50 overflow-hidden transition-all hover:border-zinc-700/50 ${
                  isPopular ? "ring-2 ring-[#d4af37]/50" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-[#d4af37] text-zinc-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    {isPopular ? (
                      <Crown className="w-6 h-6 text-[#d4af37]" />
                    ) : (
                      <Building2 className="w-6 h-6 text-zinc-400" />
                    )}
                    <CardTitle className="text-xl font-heading text-zinc-100">
                      {plan.name}
                    </CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-heading font-bold text-zinc-100">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-zinc-500">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          isPopular ? "text-[#d4af37]" : "text-emerald"
                        }`} />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    data-testid={`subscribe-${plan.id}`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={checkoutLoading === plan.id || isCurrentPlan}
                    className={`w-full ${
                      isPopular 
                        ? "bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]" 
                        : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                    } font-medium`}
                  >
                    {checkoutLoading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-zinc-500 text-sm">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            Questions? Contact us at support@restaurateurpro.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
