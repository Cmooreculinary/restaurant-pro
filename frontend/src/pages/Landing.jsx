import { useState } from "react";
import { Check, Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Landing = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("home"); // home, login, register
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: ""
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 12) {
      newErrors.password = "Password must be at least 12 characters";
    }
    
    if (view === "register" && !formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const isLogin = view === "login";
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin 
        ? { email: formData.email.toLowerCase().trim(), password: formData.password }
        : { email: formData.email.toLowerCase().trim(), password: formData.password, name: formData.name.trim() };
      
      const response = await axios.post(`${BACKEND_URL}${endpoint}`, payload, {
        withCredentials: true,
        timeout: 10000
      });
      
      if (response.data && response.data.user_id) {
        toast.success(isLogin ? "Welcome back!" : "Account created!");
        // Hard redirect to ensure fresh auth state
        window.location.replace("/dashboard");
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      const message = error.response?.data?.detail || error.message || "Something went wrong";
      setErrors({ form: message });
      toast.error(message);
      setLoading(false);
    }
  };

  const features = [
    "Concept to Design",
    "Build & Launch", 
    "Scale & Grow"
  ];

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
      <ellipse cx="24" cy="40" rx="20" ry="4" fill="url(#goldGrad)" />
      <path d="M4 40C4 40 8 16 24 16C40 16 44 40 44 40" fill="url(#goldGrad)" />
      <circle cx="24" cy="12" r="4" fill="url(#goldGrad)" />
      <path d="M12 30C12 30 16 22 24 22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
    </svg>
  );

  // Auth Form Component
  const AuthForm = () => (
    <div className="w-full max-w-md bg-[#0f1419]/95 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
      <div className="flex items-center justify-center gap-2 mb-2">
        <GoldenDomeLogo size={36} />
        <h2 className="text-xl">
          <span className="font-serif italic text-white">Restaurateur</span>
          <span className="font-bold text-[#d4af37] ml-1">PRO</span>
        </h2>
      </div>
      
      <h3 className="text-2xl font-semibold text-white mb-6 text-center">
        {view === "login" ? "Welcome Back" : "Create Account"}
      </h3>
      
      {errors.form && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {view === "register" && (
          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
                disabled={loading}
                className={`pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4af37] focus:ring-[#d4af37]/20 ${errors.name ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
          </div>
        )}
        
        <div className="space-y-2">
          <Label className="text-white/80 text-sm">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com"
              disabled={loading}
              autoComplete="email"
              className={`pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4af37] focus:ring-[#d4af37]/20 ${errors.email ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label className="text-white/80 text-sm">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={view === "login" ? "Enter password" : "Minimum 12 characters"}
              disabled={loading}
              autoComplete={view === "login" ? "current-password" : "new-password"}
              className={`pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#d4af37] focus:ring-[#d4af37]/20 ${errors.password ? 'border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-gradient-to-b from-[#f5d485] via-[#d4af37] to-[#b8962e] text-[#1a1a2e] font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="flex items-center justify-center gap-2">
              {view === "login" ? "Sign In" : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>
      
      <div className="mt-6 text-center space-y-3">
        <button
          onClick={() => {
            setView(view === "login" ? "register" : "login");
            setErrors({});
            setFormData({ email: "", password: "", name: "" });
          }}
          disabled={loading}
          className="text-white/60 hover:text-white text-sm transition-colors disabled:opacity-50"
        >
          {view === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
        
        <div className="pt-2">
          <button
            onClick={() => { setView("home"); setErrors({}); }}
            disabled={loading}
            className="text-white/40 hover:text-white/60 text-sm transition-colors disabled:opacity-50"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );

  // Home View
  const HomeView = () => (
    <>
      {/* Logo and Brand */}
      <div className="flex items-center gap-3 mb-6">
        <GoldenDomeLogo size={64} />
        <h2 className="text-4xl md:text-5xl">
          <span className="font-serif italic text-white tracking-wide">Restaurateur</span>
          <span className="font-bold text-[#d4af37] ml-2">PRO</span>
        </h2>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif italic text-white mb-4 max-w-4xl leading-tight">
        Design, Build and Scale Your Concept
      </h1>

      <p className="text-xs md:text-sm tracking-[0.25em] text-white/50 uppercase mb-10">
        The All-In-One Blueprint for Restaurant Success
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <Button 
          onClick={() => setView("register")}
          disabled={loading}
          className="bg-gradient-to-b from-[#f5d485] via-[#d4af37] to-[#b8962e] text-[#1a1a2e] font-semibold px-10 py-6 text-base rounded-lg shadow-lg hover:shadow-xl hover:brightness-110 transition-all min-w-[180px]"
        >
          Get Started Free
        </Button>
        <Button 
          onClick={() => setView("login")}
          disabled={loading}
          variant="outline"
          className="border-2 border-white/30 bg-white/5 text-white font-semibold px-10 py-6 text-base rounded-lg hover:bg-white/10 hover:border-white/50 transition-all min-w-[180px]"
        >
          Sign In
        </Button>
      </div>

      {/* Feature Checkmarks */}
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-white/70 mb-12">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-[#d4af37]" strokeWidth={3} />
            </div>
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

    </>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/7518774/pexels-photo-7518774.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/85 via-[#0a1628]/80 to-[#0a1628]/95" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-5">
          <button onClick={() => setView("home")} className="w-10 h-10">
            <GoldenDomeLogo size={40} />
          </button>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate("/pricing")}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 text-sm"
            >
              Pricing
            </Button>
            {view === "home" && (
              <Button 
                onClick={() => setView("login")}
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 text-sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-16">
          {view === "home" ? <HomeView /> : <AuthForm />}
        </div>
      </div>
    </div>
  );
};

export default Landing;
