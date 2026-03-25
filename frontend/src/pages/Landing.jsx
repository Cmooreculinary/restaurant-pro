import { useState } from "react";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Landing = () => {
  const navigate = useNavigate();
  const [showSecretLogin, setShowSecretLogin] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleSecretLogin = async () => {
    if (!secretCode.trim()) {
      toast.error("Please enter access code");
      return;
    }
    setLoggingIn(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/secret`, { code: secretCode });
      toast.success(`Welcome! Session expires in ${response.data.expires_in_days} days`);
      navigate("/dashboard");
    } catch (error) {
      toast.error("Invalid access code");
    } finally {
      setLoggingIn(false);
    }
  };

  const features = [
    "Concept to Design",
    "Build & Launch", 
    "Scale & Grow"
  ];

  // Golden dome logo SVG component
  const GoldenDomeLogo = ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5d485" />
          <stop offset="30%" stopColor="#d4af37" />
          <stop offset="70%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#996515" />
        </linearGradient>
      </defs>
      {/* Base/plate */}
      <ellipse cx="24" cy="40" rx="20" ry="4" fill="url(#goldGrad)" />
      {/* Dome */}
      <path d="M4 40C4 40 8 16 24 16C40 16 44 40 44 40" fill="url(#goldGrad)" />
      {/* Top knob */}
      <circle cx="24" cy="12" r="4" fill="url(#goldGrad)" />
      {/* Reflection lines */}
      <path d="M12 30C12 30 16 22 24 22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
    </svg>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/7518774/pexels-photo-7518774.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      />
      
      {/* Blueprint overlay effect */}
      <div 
        className="absolute inset-0 mix-blend-soft-light opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%234a90c2' stroke-width='0.5'%3E%3Cpath d='M0 50h100M50 0v100'/%3E%3Crect x='10' y='10' width='30' height='30'/%3E%3Crect x='60' y='60' width='30' height='30'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />
      
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/80 via-[#0a1628]/70 to-[#0a1628]/90" />
      
      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-5">
          <div className="w-10 h-10">
            <GoldenDomeLogo size={40} />
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button 
              data-testid="nav-pricing-btn"
              onClick={() => navigate("/pricing")}
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 text-sm"
            >
              Pricing
            </Button>
            <Button 
              data-testid="nav-login-btn"
              onClick={handleLogin}
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/10 text-sm"
            >
              Sign In
            </Button>
          </div>
        </nav>

        {/* Hero Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-20">
          {/* Logo and Brand Name */}
          <div className="flex items-center gap-2 mb-4">
            <GoldenDomeLogo size={56} />
            <h2 className="text-4xl md:text-5xl">
              <span className="font-serif italic text-white tracking-wide">Restaurateur</span>
              <span className="font-bold text-[#d4af37] ml-1">PRO</span>
            </h2>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif italic text-white mb-4 max-w-4xl leading-tight">
            Design, Build and Scale Your Concept
          </h1>

          {/* Subheadline */}
          <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] text-white/60 uppercase mb-8">
            The All-In-One Blueprint for Restaurant Success
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Button 
              data-testid="hero-get-started-btn"
              onClick={handleLogin}
              className="bg-gradient-to-b from-[#f5d485] via-[#d4af37] to-[#b8962e] text-[#1a1a2e] font-semibold px-10 py-6 text-base rounded shadow-lg hover:shadow-xl hover:brightness-110 transition-all min-w-[160px]"
            >
              Get Started
            </Button>
            <Button 
              data-testid="hero-learn-more-btn"
              onClick={() => navigate("/pricing")}
              variant="outline"
              className="border-2 border-white/40 bg-transparent text-white font-semibold px-10 py-6 text-base rounded hover:bg-white/10 hover:border-white/60 transition-all min-w-[160px]"
            >
              Learn More
            </Button>
          </div>

          {/* Feature Checkmarks */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/80">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#d4af37]" strokeWidth={3} />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          {/* Secret Login */}
          <div className="mt-8">
            {!showSecretLogin ? (
              <button
                onClick={() => setShowSecretLogin(true)}
                className="text-white/30 hover:text-white/50 transition-colors text-xs flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                Admin Access
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg p-2">
                <Input
                  type="password"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSecretLogin()}
                  placeholder="Access code"
                  className="w-40 h-8 text-sm bg-transparent border-white/20 text-white placeholder:text-white/40"
                />
                <Button
                  onClick={handleSecretLogin}
                  disabled={loggingIn}
                  size="sm"
                  className="h-8 bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
                >
                  {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
