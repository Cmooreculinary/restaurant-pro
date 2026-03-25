import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ChefHat, MapPin, DollarSign, Clock, Utensils, Users, Palette,
  ChevronLeft, ChevronRight, Check, Save, Loader2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STEPS = [
  { id: 'concept', title: 'Restaurant Concept', icon: ChefHat, description: 'Define your vision' },
  { id: 'location', title: 'Location Details', icon: MapPin, description: 'Where will you operate?' },
  { id: 'financial', title: 'Financial Planning', icon: DollarSign, description: 'Budget and targets' },
  { id: 'operational', title: 'Operations', icon: Clock, description: 'How will you run?' },
  { id: 'menu', title: 'Menu Strategy', icon: Utensils, description: 'What will you serve?' },
  { id: 'team', title: 'Team & Staffing', icon: Users, description: 'Who will help?' },
  { id: 'branding', title: 'Brand Identity', icon: Palette, description: 'Your unique look' },
];

const CONCEPT_TYPES = [
  { value: 'fine_dining', label: 'Fine Dining' },
  { value: 'casual', label: 'Casual Dining' },
  { value: 'fast_casual', label: 'Fast Casual' },
  { value: 'qsr', label: 'Quick Service (QSR)' },
  { value: 'cafe', label: 'Café/Coffee Shop' },
  { value: 'bar', label: 'Bar/Lounge' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'ghost_kitchen', label: 'Ghost Kitchen' },
];

const CUISINE_TYPES = [
  'American', 'Italian', 'Mexican', 'Chinese', 'Japanese', 'Thai', 'Indian',
  'French', 'Mediterranean', 'Korean', 'Vietnamese', 'Middle Eastern',
  'BBQ', 'Seafood', 'Steakhouse', 'Pizza', 'Burgers', 'Vegetarian/Vegan', 'Fusion'
];

const SERVICE_TYPES = [
  { value: 'dine_in', label: 'Dine-In' },
  { value: 'takeout', label: 'Takeout' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'catering', label: 'Catering' },
  { value: 'drive_thru', label: 'Drive-Thru' },
];

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher', 'Keto', 'Paleo'
];

const KEY_POSITIONS = [
  'Executive Chef', 'Sous Chef', 'Line Cook', 'Prep Cook', 'General Manager',
  'Assistant Manager', 'Host/Hostess', 'Server', 'Bartender', 'Barback',
  'Dishwasher', 'Food Runner', 'Busser', 'Cashier'
];

const Onboarding = ({ user }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    concept: {
      restaurant_name: '',
      concept_type: '',
      cuisine_types: [],
      tagline: '',
      description: '',
      unique_selling_points: ['', '', '']
    },
    location: {
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'USA',
      square_footage: '',
      seating_capacity: '',
      has_patio: false,
      patio_seats: '',
      parking_spaces: ''
    },
    financial: {
      total_budget: '',
      construction_budget: '',
      equipment_budget: '',
      working_capital: '',
      funding_sources: [],
      target_revenue_monthly: '',
      target_food_cost_percent: '30',
      target_labor_cost_percent: '30'
    },
    operational: {
      target_open_date: '',
      service_types: [],
      pos_system: '',
      reservation_system: '',
      delivery_partners: []
    },
    menu: {
      price_range: '',
      dietary_options: [],
      beverage_program: ''
    },
    team: {
      owner_name: user?.name || '',
      owner_experience: '',
      key_positions_needed: [],
      total_staff_needed: '',
      management_structure: ''
    },
    branding: {
      brand_colors: [],
      brand_voice: '',
      target_demographic: '',
      target_age_range: '',
      website_url: ''
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`);
      setProfile(response.data);
      
      // Merge existing data with form defaults
      const existingData = response.data;
      setFormData(prev => ({
        concept: { ...prev.concept, ...existingData.concept },
        location: { ...prev.location, ...existingData.location },
        financial: { ...prev.financial, ...existingData.financial },
        operational: { ...prev.operational, ...existingData.operational },
        menu: { ...prev.menu, ...existingData.menu },
        team: { ...prev.team, ...existingData.team },
        branding: { ...prev.branding, ...existingData.branding }
      }));
      
      // Resume from last step
      if (existingData.onboarding_step > 0) {
        setCurrentStep(existingData.onboarding_step);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const toggleArrayItem = (section, field, item) => {
    setFormData(prev => {
      const currentArray = prev[section][field] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  const saveSection = async (section) => {
    setSaving(true);
    try {
      // Convert string numbers to actual numbers for financial fields
      let dataToSave = { ...formData[section] };
      if (section === 'financial') {
        dataToSave = {
          ...dataToSave,
          total_budget: parseFloat(dataToSave.total_budget) || 0,
          construction_budget: parseFloat(dataToSave.construction_budget) || 0,
          equipment_budget: parseFloat(dataToSave.equipment_budget) || 0,
          working_capital: parseFloat(dataToSave.working_capital) || 0,
          target_revenue_monthly: parseFloat(dataToSave.target_revenue_monthly) || 0,
          target_food_cost_percent: parseFloat(dataToSave.target_food_cost_percent) || 30,
          target_labor_cost_percent: parseFloat(dataToSave.target_labor_cost_percent) || 30
        };
      }
      if (section === 'location') {
        dataToSave = {
          ...dataToSave,
          square_footage: parseInt(dataToSave.square_footage) || 0,
          seating_capacity: parseInt(dataToSave.seating_capacity) || 0,
          patio_seats: parseInt(dataToSave.patio_seats) || 0,
          parking_spaces: parseInt(dataToSave.parking_spaces) || 0
        };
      }
      if (section === 'team') {
        dataToSave = {
          ...dataToSave,
          total_staff_needed: parseInt(dataToSave.total_staff_needed) || 0
        };
      }

      await axios.put(`${API}/profile`, { section, data: dataToSave });
      await axios.put(`${API}/profile/onboarding-step`, { step: currentStep, completed: false });
      toast.success('Progress saved');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const section = STEPS[currentStep].id;
    await saveSection(section);
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    const section = STEPS[currentStep].id;
    await saveSection(section);
    
    try {
      await axios.put(`${API}/profile/onboarding-step`, { step: STEPS.length, completed: true });
      toast.success('Setup complete! Welcome to Restaurateur Pro.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup');
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
          <p className="text-zinc-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    const step = STEPS[currentStep];
    
    switch (step.id) {
      case 'concept':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="restaurant_name">Restaurant Name *</Label>
                <Input
                  id="restaurant_name"
                  data-testid="input-restaurant-name"
                  value={formData.concept.restaurant_name}
                  onChange={(e) => updateField('concept', 'restaurant_name', e.target.value)}
                  placeholder="e.g., The Golden Fork"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="concept_type">Concept Type *</Label>
                <Select
                  value={formData.concept.concept_type}
                  onValueChange={(value) => updateField('concept', 'concept_type', value)}
                >
                  <SelectTrigger data-testid="select-concept-type" className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select concept type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    {CONCEPT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cuisine Types</Label>
              <div className="flex flex-wrap gap-2">
                {CUISINE_TYPES.map(cuisine => (
                  <Badge
                    key={cuisine}
                    data-testid={`cuisine-${cuisine}`}
                    variant={formData.concept.cuisine_types.includes(cuisine) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.concept.cuisine_types.includes(cuisine)
                        ? 'bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                    onClick={() => toggleArrayItem('concept', 'cuisine_types', cuisine)}
                  >
                    {cuisine}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                data-testid="input-tagline"
                value={formData.concept.tagline}
                onChange={(e) => updateField('concept', 'tagline', e.target.value)}
                placeholder="e.g., Farm-to-table dining reimagined"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Restaurant Description</Label>
              <Textarea
                id="description"
                data-testid="input-description"
                value={formData.concept.description}
                onChange={(e) => updateField('concept', 'description', e.target.value)}
                placeholder="Describe your restaurant concept, atmosphere, and what makes it special..."
                className="bg-zinc-900 border-zinc-800 min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Unique Selling Points (What makes you different?)</Label>
              <div className="space-y-2">
                {[0, 1, 2].map(index => (
                  <Input
                    key={index}
                    data-testid={`input-usp-${index}`}
                    value={formData.concept.unique_selling_points[index] || ''}
                    onChange={(e) => {
                      const newUSPs = [...formData.concept.unique_selling_points];
                      newUSPs[index] = e.target.value;
                      updateField('concept', 'unique_selling_points', newUSPs);
                    }}
                    placeholder={`Unique point ${index + 1}`}
                    className="bg-zinc-900 border-zinc-800"
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                data-testid="input-address"
                value={formData.location.address}
                onChange={(e) => updateField('location', 'address', e.target.value)}
                placeholder="123 Main Street"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  data-testid="input-city"
                  value={formData.location.city}
                  onChange={(e) => updateField('location', 'city', e.target.value)}
                  placeholder="New York"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  data-testid="input-state"
                  value={formData.location.state}
                  onChange={(e) => updateField('location', 'state', e.target.value)}
                  placeholder="NY"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  data-testid="input-zip"
                  value={formData.location.zip_code}
                  onChange={(e) => updateField('location', 'zip_code', e.target.value)}
                  placeholder="10001"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.location.country}
                  onChange={(e) => updateField('location', 'country', e.target.value)}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="square_footage">Square Footage</Label>
                <Input
                  id="square_footage"
                  data-testid="input-sqft"
                  type="number"
                  value={formData.location.square_footage}
                  onChange={(e) => updateField('location', 'square_footage', e.target.value)}
                  placeholder="2500"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seating_capacity">Seating Capacity</Label>
                <Input
                  id="seating_capacity"
                  data-testid="input-seats"
                  type="number"
                  value={formData.location.seating_capacity}
                  onChange={(e) => updateField('location', 'seating_capacity', e.target.value)}
                  placeholder="75"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patio_seats">Patio Seats</Label>
                <Input
                  id="patio_seats"
                  type="number"
                  value={formData.location.patio_seats}
                  onChange={(e) => updateField('location', 'patio_seats', e.target.value)}
                  placeholder="20"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking_spaces">Parking Spaces</Label>
                <Input
                  id="parking_spaces"
                  type="number"
                  value={formData.location.parking_spaces}
                  onChange={(e) => updateField('location', 'parking_spaces', e.target.value)}
                  placeholder="15"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="has_patio"
                checked={formData.location.has_patio}
                onCheckedChange={(checked) => updateField('location', 'has_patio', checked)}
              />
              <Label htmlFor="has_patio" className="cursor-pointer">Has outdoor patio/seating</Label>
            </div>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="total_budget">Total Project Budget *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <Input
                    id="total_budget"
                    data-testid="input-total-budget"
                    type="number"
                    value={formData.financial.total_budget}
                    onChange={(e) => updateField('financial', 'total_budget', e.target.value)}
                    placeholder="500000"
                    className="bg-zinc-900 border-zinc-800 pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_revenue">Target Monthly Revenue</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <Input
                    id="target_revenue"
                    data-testid="input-target-revenue"
                    type="number"
                    value={formData.financial.target_revenue_monthly}
                    onChange={(e) => updateField('financial', 'target_revenue_monthly', e.target.value)}
                    placeholder="100000"
                    className="bg-zinc-900 border-zinc-800 pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="construction_budget">Construction Budget</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <Input
                    id="construction_budget"
                    type="number"
                    value={formData.financial.construction_budget}
                    onChange={(e) => updateField('financial', 'construction_budget', e.target.value)}
                    placeholder="200000"
                    className="bg-zinc-900 border-zinc-800 pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment_budget">Equipment Budget</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <Input
                    id="equipment_budget"
                    type="number"
                    value={formData.financial.equipment_budget}
                    onChange={(e) => updateField('financial', 'equipment_budget', e.target.value)}
                    placeholder="150000"
                    className="bg-zinc-900 border-zinc-800 pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="working_capital">Working Capital</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <Input
                    id="working_capital"
                    type="number"
                    value={formData.financial.working_capital}
                    onChange={(e) => updateField('financial', 'working_capital', e.target.value)}
                    placeholder="50000"
                    className="bg-zinc-900 border-zinc-800 pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="food_cost">Target Food Cost %</Label>
                <div className="relative">
                  <Input
                    id="food_cost"
                    type="number"
                    value={formData.financial.target_food_cost_percent}
                    onChange={(e) => updateField('financial', 'target_food_cost_percent', e.target.value)}
                    placeholder="30"
                    className="bg-zinc-900 border-zinc-800 pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="labor_cost">Target Labor Cost %</Label>
                <div className="relative">
                  <Input
                    id="labor_cost"
                    type="number"
                    value={formData.financial.target_labor_cost_percent}
                    onChange={(e) => updateField('financial', 'target_labor_cost_percent', e.target.value)}
                    placeholder="30"
                    className="bg-zinc-900 border-zinc-800 pr-7"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">%</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'operational':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="target_open_date">Target Opening Date</Label>
              <Input
                id="target_open_date"
                data-testid="input-open-date"
                type="date"
                value={formData.operational.target_open_date}
                onChange={(e) => updateField('operational', 'target_open_date', e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <Label>Service Types</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map(service => (
                  <Badge
                    key={service.value}
                    data-testid={`service-${service.value}`}
                    variant={formData.operational.service_types.includes(service.value) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.operational.service_types.includes(service.value)
                        ? 'bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                    onClick={() => toggleArrayItem('operational', 'service_types', service.value)}
                  >
                    {service.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pos_system">POS System</Label>
                <Select
                  value={formData.operational.pos_system}
                  onValueChange={(value) => updateField('operational', 'pos_system', value)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select POS system" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="toast">Toast</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="clover">Clover</SelectItem>
                    <SelectItem value="lightspeed">Lightspeed</SelectItem>
                    <SelectItem value="touchbistro">TouchBistro</SelectItem>
                    <SelectItem value="undecided">Undecided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reservation_system">Reservation System</Label>
                <Select
                  value={formData.operational.reservation_system}
                  onValueChange={(value) => updateField('operational', 'reservation_system', value)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select reservation system" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="opentable">OpenTable</SelectItem>
                    <SelectItem value="resy">Resy</SelectItem>
                    <SelectItem value="yelp">Yelp Reservations</SelectItem>
                    <SelectItem value="sevenrooms">SevenRooms</SelectItem>
                    <SelectItem value="none">No Reservations</SelectItem>
                    <SelectItem value="undecided">Undecided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex gap-4">
                {[
                  { value: '$', label: '$ (Budget)', desc: 'Under $15/person' },
                  { value: '$$', label: '$$ (Moderate)', desc: '$15-30/person' },
                  { value: '$$$', label: '$$$ (Upscale)', desc: '$30-60/person' },
                  { value: '$$$$', label: '$$$$ (Fine Dining)', desc: '$60+/person' }
                ].map(range => (
                  <button
                    key={range.value}
                    data-testid={`price-${range.value}`}
                    onClick={() => updateField('menu', 'price_range', range.value)}
                    className={`flex-1 p-4 rounded-lg border transition-colors ${
                      formData.menu.price_range === range.value
                        ? 'border-[#d4af37] bg-[#d4af37]/10'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`text-xl font-bold ${formData.menu.price_range === range.value ? 'text-[#d4af37]' : 'text-zinc-100'}`}>
                      {range.value}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{range.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dietary Options Offered</Label>
              <div className="flex flex-wrap gap-2">
                {DIETARY_OPTIONS.map(option => (
                  <Badge
                    key={option}
                    variant={formData.menu.dietary_options.includes(option) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.menu.dietary_options.includes(option)
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                    onClick={() => toggleArrayItem('menu', 'dietary_options', option)}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beverage Program</Label>
              <Select
                value={formData.menu.beverage_program}
                onValueChange={(value) => updateField('menu', 'beverage_program', value)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue placeholder="Select beverage program" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="full_bar">Full Bar</SelectItem>
                  <SelectItem value="beer_wine">Beer & Wine Only</SelectItem>
                  <SelectItem value="byob">BYOB</SelectItem>
                  <SelectItem value="non_alcoholic">Non-Alcoholic Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="owner_name">Owner/Operator Name</Label>
                <Input
                  id="owner_name"
                  value={formData.team.owner_name}
                  onChange={(e) => updateField('team', 'owner_name', e.target.value)}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_staff">Estimated Total Staff Needed</Label>
                <Input
                  id="total_staff"
                  type="number"
                  value={formData.team.total_staff_needed}
                  onChange={(e) => updateField('team', 'total_staff_needed', e.target.value)}
                  placeholder="25"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner_experience">Owner Restaurant Experience</Label>
              <Textarea
                id="owner_experience"
                value={formData.team.owner_experience}
                onChange={(e) => updateField('team', 'owner_experience', e.target.value)}
                placeholder="Describe your background in the restaurant industry..."
                className="bg-zinc-900 border-zinc-800 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Key Positions Needed</Label>
              <div className="flex flex-wrap gap-2">
                {KEY_POSITIONS.map(position => (
                  <Badge
                    key={position}
                    variant={formData.team.key_positions_needed.includes(position) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      formData.team.key_positions_needed.includes(position)
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                    onClick={() => toggleArrayItem('team', 'key_positions_needed', position)}
                  >
                    {position}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Management Structure</Label>
              <Select
                value={formData.team.management_structure}
                onValueChange={(value) => updateField('team', 'management_structure', value)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue placeholder="Select structure" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="owner_operator">Owner-Operator (hands-on)</SelectItem>
                  <SelectItem value="gm_led">GM-Led (owner semi-involved)</SelectItem>
                  <SelectItem value="absentee">Absentee Owner (full management team)</SelectItem>
                  <SelectItem value="partnership">Partnership Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Brand Voice/Personality</Label>
              <Select
                value={formData.branding.brand_voice}
                onValueChange={(value) => updateField('branding', 'brand_voice', value)}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue placeholder="Select brand voice" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="sophisticated">Sophisticated & Elegant</SelectItem>
                  <SelectItem value="casual">Casual & Friendly</SelectItem>
                  <SelectItem value="playful">Fun & Playful</SelectItem>
                  <SelectItem value="authentic">Authentic & Traditional</SelectItem>
                  <SelectItem value="modern">Modern & Trendy</SelectItem>
                  <SelectItem value="rustic">Rustic & Warm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="target_demographic">Target Demographic</Label>
                <Input
                  id="target_demographic"
                  value={formData.branding.target_demographic}
                  onChange={(e) => updateField('branding', 'target_demographic', e.target.value)}
                  placeholder="e.g., Young professionals, families"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_age">Target Age Range</Label>
                <Select
                  value={formData.branding.target_age_range}
                  onValueChange={(value) => updateField('branding', 'target_age_range', value)}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select age range" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="18-24">18-24 (Gen Z)</SelectItem>
                    <SelectItem value="25-34">25-34 (Young Millennials)</SelectItem>
                    <SelectItem value="35-44">35-44 (Older Millennials)</SelectItem>
                    <SelectItem value="45-54">45-54 (Gen X)</SelectItem>
                    <SelectItem value="55+">55+ (Boomers)</SelectItem>
                    <SelectItem value="all">All Ages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL (if any)</Label>
              <Input
                id="website_url"
                value={formData.branding.website_url}
                onChange={(e) => updateField('branding', 'website_url', e.target.value)}
                placeholder="https://yourrestaurant.com"
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-[#0f0f10]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#d4af37] flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-zinc-900" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-zinc-100">Restaurateur Pro</h1>
                <p className="text-xs text-zinc-500">Setup your restaurant profile</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-100"
              onClick={() => navigate('/')}
            >
              Save & Exit
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-sm text-zinc-400">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 bg-zinc-800" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <button
                key={step.id}
                onClick={() => index <= currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={`flex flex-col items-center min-w-[80px] transition-colors ${
                  isActive ? 'text-[#d4af37]' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isActive ? 'bg-[#d4af37] text-zinc-900' :
                  isCompleted ? 'bg-zinc-800 text-emerald-500' : 'bg-zinc-900 text-zinc-600'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span className="text-xs font-medium whitespace-nowrap hidden md:block">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main Card */}
        <Card className="bg-[#18181b] border-zinc-800/50">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-zinc-100 flex items-center gap-2">
              {(() => {
                const StepIcon = STEPS[currentStep].icon;
                return <StepIcon className="w-5 h-5 text-[#d4af37]" />;
              })()}
              {STEPS[currentStep].title}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {STEPS[currentStep].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => saveSection(STEPS[currentStep].id)}
              disabled={saving}
              className="text-zinc-400 hover:text-zinc-100"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={saving}
                className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
