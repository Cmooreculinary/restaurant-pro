import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Sparkles, ChefHat, Loader2, CheckCircle, Utensils, Users, 
  DollarSign, Package, FileText, Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sample data templates based on concept type
const CONCEPT_TEMPLATES = {
  fine_dining: {
    team: [
      { name: 'Executive Chef', role: 'Executive Chef', status: 'active' },
      { name: 'Sous Chef', role: 'Sous Chef', status: 'active' },
      { name: 'Sommelier', role: 'Sommelier', status: 'pending' },
      { name: 'Maitre D', role: 'Front of House Manager', status: 'pending' },
    ],
    equipment: [
      { name: 'Combi Oven', specs: 'Rational SCC 101 - 10 tray', category: 'Cooking', status: 'pending' },
      { name: 'Sous Vide Station', specs: 'Polyscience 28L', category: 'Cooking', status: 'pending' },
      { name: 'Wine Cooler', specs: '300 bottle dual-zone', category: 'Storage', status: 'pending' },
      { name: 'Espresso Machine', specs: 'La Marzocco Linea', category: 'Beverage', status: 'pending' },
    ],
    vendors: [
      { name: 'Premium Produce Co', category: 'Fresh Produce', status: 'active' },
      { name: 'Heritage Meats', category: 'Proteins', status: 'active' },
      { name: 'Artisan Cheese Shop', category: 'Dairy', status: 'pending' },
      { name: 'Fine Wine Distributors', category: 'Beverages', status: 'pending' },
    ],
    permits: [
      { name: 'Liquor License - Full Bar', issuing_authority: 'State ABC', status: 'pending' },
      { name: 'Health Permit', issuing_authority: 'Health Dept', status: 'pending' },
      { name: 'Fire Safety Certificate', issuing_authority: 'Fire Marshal', status: 'pending' },
      { name: 'Food Handler Certification', issuing_authority: 'Health Dept', status: 'pending' },
    ],
    menuItems: [
      { name: 'Tasting Menu', category: 'Prix Fixe', cost: 45, price: 185 },
      { name: 'Wagyu Beef', category: 'Entrees', cost: 38, price: 95 },
      { name: 'Lobster Thermidor', category: 'Entrees', cost: 28, price: 72 },
      { name: 'Truffle Risotto', category: 'Entrees', cost: 12, price: 38 },
    ],
    budget: [
      { category: 'Construction', subcategory: 'Build-out', planned: 350000 },
      { category: 'Equipment', subcategory: 'Kitchen', planned: 200000 },
      { category: 'Equipment', subcategory: 'Front of House', planned: 75000 },
      { category: 'Permits & Licenses', subcategory: 'All', planned: 25000 },
      { category: 'Initial Inventory', subcategory: 'Food & Beverage', planned: 30000 },
    ]
  },
  casual: {
    team: [
      { name: 'Head Chef', role: 'Head Chef', status: 'active' },
      { name: 'Line Cook', role: 'Line Cook', status: 'pending' },
      { name: 'General Manager', role: 'General Manager', status: 'pending' },
      { name: 'Server Team Lead', role: 'Server', status: 'pending' },
    ],
    equipment: [
      { name: '6-Burner Range', specs: '36" Commercial Gas', category: 'Cooking', status: 'pending' },
      { name: 'Walk-in Cooler', specs: '8x10 - 35°F', category: 'Storage', status: 'pending' },
      { name: 'POS System', specs: 'Toast - 3 terminals', category: 'Technology', status: 'pending' },
      { name: 'Dish Machine', specs: 'High-temp commercial', category: 'Cleaning', status: 'pending' },
    ],
    vendors: [
      { name: 'Sysco Foods', category: 'Broad Line', status: 'active' },
      { name: 'Local Farms Co-op', category: 'Produce', status: 'pending' },
      { name: 'Premium Meats Inc', category: 'Proteins', status: 'pending' },
      { name: 'Beverage Distributors', category: 'Beverages', status: 'pending' },
    ],
    permits: [
      { name: 'Business License', issuing_authority: 'City', status: 'pending' },
      { name: 'Health Permit', issuing_authority: 'Health Dept', status: 'pending' },
      { name: 'Beer & Wine License', issuing_authority: 'State ABC', status: 'pending' },
      { name: 'Sign Permit', issuing_authority: 'City Planning', status: 'pending' },
    ],
    menuItems: [
      { name: 'Signature Burger', category: 'Entrees', cost: 4.5, price: 16 },
      { name: 'Grilled Salmon', category: 'Entrees', cost: 8, price: 24 },
      { name: 'Caesar Salad', category: 'Salads', cost: 2.5, price: 12 },
      { name: 'Craft Beer Flight', category: 'Beverages', cost: 4, price: 14 },
    ],
    budget: [
      { category: 'Construction', subcategory: 'Build-out', planned: 150000 },
      { category: 'Equipment', subcategory: 'Kitchen', planned: 80000 },
      { category: 'Equipment', subcategory: 'Front of House', planned: 30000 },
      { category: 'Permits & Licenses', subcategory: 'All', planned: 10000 },
      { category: 'Initial Inventory', subcategory: 'Food & Beverage', planned: 15000 },
    ]
  },
  fast_casual: {
    team: [
      { name: 'Kitchen Manager', role: 'Kitchen Manager', status: 'pending' },
      { name: 'Shift Lead', role: 'Shift Lead', status: 'pending' },
      { name: 'Prep Cook', role: 'Prep Cook', status: 'pending' },
      { name: 'Cashier', role: 'Cashier', status: 'pending' },
    ],
    equipment: [
      { name: 'Flat Top Grill', specs: '48" Chrome', category: 'Cooking', status: 'pending' },
      { name: 'Steam Table', specs: '4-well electric', category: 'Holding', status: 'pending' },
      { name: 'Speed Oven', specs: 'TurboChef', category: 'Cooking', status: 'pending' },
      { name: 'POS Kiosk', specs: 'Self-order x2', category: 'Technology', status: 'pending' },
    ],
    vendors: [
      { name: 'US Foods', category: 'Broad Line', status: 'pending' },
      { name: 'Packaging Plus', category: 'Supplies', status: 'pending' },
      { name: 'Fresh Direct', category: 'Produce', status: 'pending' },
    ],
    permits: [
      { name: 'Business License', issuing_authority: 'City', status: 'pending' },
      { name: 'Health Permit', issuing_authority: 'Health Dept', status: 'pending' },
      { name: 'Food Handler Cards', issuing_authority: 'Health Dept', status: 'pending' },
    ],
    menuItems: [
      { name: 'Build Your Bowl', category: 'Bowls', cost: 3, price: 12 },
      { name: 'Signature Wrap', category: 'Wraps', cost: 2.5, price: 10 },
      { name: 'Side Salad', category: 'Sides', cost: 1, price: 4 },
      { name: 'Fresh Juice', category: 'Beverages', cost: 1.5, price: 5 },
    ],
    budget: [
      { category: 'Construction', subcategory: 'Build-out', planned: 100000 },
      { category: 'Equipment', subcategory: 'Kitchen', planned: 50000 },
      { category: 'Equipment', subcategory: 'Front of House', planned: 20000 },
      { category: 'Permits & Licenses', subcategory: 'All', planned: 5000 },
      { category: 'Initial Inventory', subcategory: 'Food', planned: 8000 },
    ]
  }
};

// Default template for other concept types
const DEFAULT_TEMPLATE = CONCEPT_TEMPLATES.casual;

const QuickSetupWizard = ({ profile, onComplete, open, onOpenChange }) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [completed, setCompleted] = useState(false);

  const conceptType = profile?.concept?.concept_type || 'casual';
  const template = CONCEPT_TEMPLATES[conceptType] || DEFAULT_TEMPLATE;

  const steps = [
    { id: 'team', label: 'Team Members', icon: Users, count: template.team.length },
    { id: 'equipment', label: 'Equipment', icon: Package, count: template.equipment.length },
    { id: 'vendors', label: 'Vendors', icon: Truck, count: template.vendors.length },
    { id: 'permits', label: 'Permits', icon: FileText, count: template.permits.length },
    { id: 'menu', label: 'Menu Items', icon: Utensils, count: template.menuItems.length },
    { id: 'budget', label: 'Budget Items', icon: DollarSign, count: template.budget.length },
  ];

  const generateSampleData = async () => {
    setGenerating(true);
    setProgress(0);
    
    const totalSteps = steps.length;
    
    try {
      // Generate team members
      setCurrentStep('Creating team members...');
      for (const member of template.team) {
        await axios.post(`${API}/team`, member);
      }
      setProgress(Math.round((1 / totalSteps) * 100));
      
      // Generate equipment
      setCurrentStep('Adding equipment...');
      for (const item of template.equipment) {
        await axios.post(`${API}/equipment`, item);
      }
      setProgress(Math.round((2 / totalSteps) * 100));
      
      // Generate vendors
      setCurrentStep('Setting up vendors...');
      for (const vendor of template.vendors) {
        await axios.post(`${API}/vendors`, vendor);
      }
      setProgress(Math.round((3 / totalSteps) * 100));
      
      // Generate permits
      setCurrentStep('Adding permits...');
      for (const permit of template.permits) {
        await axios.post(`${API}/permits`, permit);
      }
      setProgress(Math.round((4 / totalSteps) * 100));
      
      // Generate menu items
      setCurrentStep('Creating menu items...');
      for (const item of template.menuItems) {
        await axios.post(`${API}/menu-items`, item);
      }
      setProgress(Math.round((5 / totalSteps) * 100));
      
      // Generate budget items
      setCurrentStep('Setting up budget...');
      for (const item of template.budget) {
        await axios.post(`${API}/budget`, item);
      }
      setProgress(100);
      
      setCompleted(true);
      toast.success('Sample data generated successfully!');
      
      setTimeout(() => {
        onComplete?.();
        onOpenChange?.(false);
        setCompleted(false);
        setProgress(0);
      }, 1500);
      
    } catch (error) {
      console.error('Error generating data:', error);
      toast.error('Failed to generate sample data');
    } finally {
      setGenerating(false);
    }
  };

  const getConceptLabel = (type) => {
    const labels = {
      fine_dining: 'Fine Dining',
      casual: 'Casual Dining',
      fast_casual: 'Fast Casual',
      qsr: 'Quick Service',
      cafe: 'Café',
      bar: 'Bar/Lounge',
      food_truck: 'Food Truck',
      ghost_kitchen: 'Ghost Kitchen'
    };
    return labels[type] || 'Restaurant';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            Quick Setup Wizard
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Generate realistic sample data tailored for your {getConceptLabel(conceptType)} concept
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Preview */}
          <div className="grid grid-cols-2 gap-3">
            {steps.map(step => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{step.count}</p>
                    <p className="text-xs text-zinc-500">{step.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Progress */}
          {generating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2 bg-zinc-800" />
              <p className="text-sm text-zinc-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {currentStep}
              </p>
            </div>
          )}
          
          {completed && (
            <div className="flex items-center justify-center gap-2 py-4 text-emerald-500">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Setup Complete!</span>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange?.(false)}
            disabled={generating}
            className="border-zinc-700 text-zinc-400"
          >
            Cancel
          </Button>
          <Button
            onClick={generateSampleData}
            disabled={generating || completed}
            className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Sample Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSetupWizard;
