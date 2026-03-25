import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ChefHat, MapPin, DollarSign, Clock, Utensils, Users, Palette,
  Edit2, Save, X, Plus, Trash2, Search, Building2, FileText,
  Package, Truck, UserPlus, Loader2, ChevronRight, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'concept', label: 'Concept', icon: ChefHat },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'operational', label: 'Operations', icon: Clock },
  { id: 'menu', label: 'Menu', icon: Utensils },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'equipment', label: 'Equipment', icon: Package },
  { id: 'vendors', label: 'Vendors', icon: Truck },
  { id: 'permits', label: 'Permits', icon: FileText },
];

const BusinessProfile = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists
  const [team, setTeam] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [permits, setPermits] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [budget, setBudget] = useState([]);
  
  // Edit states
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState('');
  const [newItemData, setNewItemData] = useState({});

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, summaryRes, teamRes, equipmentRes, vendorsRes, permitsRes, menuRes, budgetRes] = await Promise.all([
        axios.get(`${API}/profile`),
        axios.get(`${API}/profile/summary`),
        axios.get(`${API}/team`),
        axios.get(`${API}/equipment`),
        axios.get(`${API}/vendors`),
        axios.get(`${API}/permits`),
        axios.get(`${API}/menu-items`),
        axios.get(`${API}/budget`)
      ]);
      
      setProfile(profileRes.data);
      setSummary(summaryRes.data);
      setTeam(teamRes.data);
      setEquipment(equipmentRes.data);
      setVendors(vendorsRes.data);
      setPermits(permitsRes.data);
      setMenuItems(menuRes.data);
      setBudget(budgetRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (section) => {
    setEditingSection(section);
    setEditData(profile[section] || {});
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditData({});
  };

  const saveSection = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/profile`, {
        section: editingSection,
        data: editData
      });
      
      setProfile(prev => ({
        ...prev,
        [editingSection]: editData
      }));
      
      // Refresh summary
      const summaryRes = await axios.get(`${API}/profile/summary`);
      setSummary(summaryRes.data);
      
      toast.success('Changes saved');
      setEditingSection(null);
      setEditData({});
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const openAddDialog = (type) => {
    setAddDialogType(type);
    setNewItemData({});
    setShowAddDialog(true);
  };

  const handleAddItem = async () => {
    setSaving(true);
    try {
      let endpoint = '';
      switch (addDialogType) {
        case 'team':
          endpoint = '/team';
          break;
        case 'equipment':
          endpoint = '/equipment';
          break;
        case 'vendor':
          endpoint = '/vendors';
          break;
        case 'permit':
          endpoint = '/permits';
          break;
        case 'menu':
          endpoint = '/menu-items';
          break;
        case 'budget':
          endpoint = '/budget';
          break;
        default:
          return;
      }
      
      await axios.post(`${API}${endpoint}`, newItemData);
      toast.success('Item added');
      setShowAddDialog(false);
      setNewItemData({});
      loadAllData();
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      let endpoint = '';
      switch (type) {
        case 'team':
          endpoint = `/team/${id}`;
          break;
        case 'equipment':
          endpoint = `/equipment/${id}`;
          break;
        case 'vendor':
          endpoint = `/vendors/${id}`;
          break;
        case 'permit':
          endpoint = `/permits/${id}`;
          break;
        case 'menu':
          endpoint = `/menu-items/${id}`;
          break;
        case 'budget':
          endpoint = `/budget/${id}`;
          break;
        default:
          return;
      }
      
      await axios.delete(`${API}${endpoint}`);
      toast.success('Item deleted');
      loadAllData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#d4af37] animate-spin" />
          <p className="text-zinc-400">Loading business profile...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Budget</p>
            <p className="text-2xl font-heading font-bold text-zinc-100">
              ${(summary?.total_budget || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Team Size</p>
            <p className="text-2xl font-heading font-bold text-zinc-100">{summary?.team_count || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Menu Items</p>
            <p className="text-2xl font-heading font-bold text-zinc-100">{summary?.menu_count || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800/50">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Target Open</p>
            <p className="text-lg font-heading font-bold text-zinc-100">
              {summary?.target_open_date || 'TBD'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Info Card */}
      <Card className="bg-[#18181b] border-zinc-800/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-heading text-zinc-100">
              {profile?.concept?.restaurant_name || 'Your Restaurant'}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {profile?.concept?.concept_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Restaurant Concept'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('concept');
              startEditing('concept');
            }}
            className="border-zinc-700 text-zinc-400 hover:text-zinc-100"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile?.concept?.tagline && (
            <p className="text-zinc-400 italic">"{profile.concept.tagline}"</p>
          )}
          {profile?.concept?.description && (
            <p className="text-zinc-300">{profile.concept.description}</p>
          )}
          {profile?.concept?.cuisine_types?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.concept.cuisine_types.map(cuisine => (
                <Badge key={cuisine} className="badge-gold">{cuisine}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Summary */}
      <Card className="bg-[#18181b] border-zinc-800/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#d4af37]" />
            Location
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveTab('location');
              startEditing('location');
            }}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-zinc-500">Address</p>
              <p className="text-sm text-zinc-100">{profile?.location?.address || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">City, State</p>
              <p className="text-sm text-zinc-100">
                {profile?.location?.city && profile?.location?.state 
                  ? `${profile.location.city}, ${profile.location.state}`
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Square Footage</p>
              <p className="text-sm text-zinc-100">{profile?.location?.square_footage || 0} sq ft</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Seating</p>
              <p className="text-sm text-zinc-100">{profile?.location?.seating_capacity || 0} seats</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Team', count: team.length, tab: 'team', icon: Users },
          { label: 'Equipment', count: equipment.length, tab: 'equipment', icon: Package },
          { label: 'Vendors', count: vendors.length, tab: 'vendors', icon: Truck },
          { label: 'Permits', count: permits.length, tab: 'permits', icon: FileText },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <item.icon className="w-5 h-5 text-zinc-500 group-hover:text-[#d4af37] transition-colors" />
              <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
            </div>
            <p className="text-2xl font-bold text-zinc-100">{item.count}</p>
            <p className="text-xs text-zinc-500">{item.label}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderEditableSection = (sectionId, fields) => {
    const isEditing = editingSection === sectionId;
    const data = isEditing ? editData : (profile?.[sectionId] || {});

    return (
      <Card className="bg-[#18181b] border-zinc-800/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-heading text-zinc-100">
            {SECTIONS.find(s => s.id === sectionId)?.label} Details
          </CardTitle>
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={saving}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveSection}
                disabled={saving}
                className="bg-emerald-500 text-white hover:bg-emerald-600"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEditing(sectionId)}
              className="border-zinc-700 text-zinc-400 hover:text-zinc-100"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => (
              <div key={field.key} className={field.fullWidth ? 'md:col-span-2' : ''}>
                <Label className="text-xs text-zinc-500">{field.label}</Label>
                {isEditing ? (
                  field.type === 'textarea' ? (
                    <Textarea
                      value={data[field.key] || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="bg-zinc-900 border-zinc-800 mt-1"
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={data[field.key] || ''}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, [field.key]: value }))}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 mt-1">
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {field.options.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type || 'text'}
                      value={data[field.key] || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="bg-zinc-900 border-zinc-800 mt-1"
                    />
                  )
                ) : (
                  <p className="text-sm text-zinc-100 mt-1">
                    {field.format 
                      ? field.format(data[field.key])
                      : (data[field.key] || 'Not set')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderListSection = (type, items, columns) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading text-zinc-100">{type.charAt(0).toUpperCase() + type.slice(1)} ({items.length})</h3>
        <Button
          size="sm"
          onClick={() => openAddDialog(type)}
          className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add {type.slice(0, -1) || type}
        </Button>
      </div>
      
      {items.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <p className="text-zinc-500">No {type} added yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAddDialog(type)}
            className="mt-4 border-zinc-700 text-zinc-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add your first {type.slice(0, -1) || type}
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item[columns.id]} className="bg-zinc-900/50 border-zinc-800/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-zinc-100">{item[columns.name]}</p>
                    {columns.subtitle && (
                      <p className="text-sm text-zinc-500">{item[columns.subtitle]}</p>
                    )}
                  </div>
                  {columns.status && (
                    <Badge className={
                      item[columns.status] === 'active' || item[columns.status] === 'approved' || item[columns.status] === 'installed'
                        ? 'badge-green'
                        : item[columns.status] === 'pending'
                        ? 'badge-amber'
                        : 'badge-blue'
                    }>
                      {item[columns.status]}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(type, item[columns.id])}
                    className="ml-2 text-zinc-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAddDialog = () => {
    let fields = [];
    let title = '';
    
    switch (addDialogType) {
      case 'team':
        title = 'Add Team Member';
        fields = [
          { key: 'name', label: 'Name', required: true },
          { key: 'role', label: 'Role', required: true },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
        ];
        break;
      case 'equipment':
        title = 'Add Equipment';
        fields = [
          { key: 'name', label: 'Equipment Name', required: true },
          { key: 'category', label: 'Category' },
          { key: 'specs', label: 'Specifications', required: true },
          { key: 'vendor', label: 'Vendor' },
          { key: 'cost', label: 'Cost', type: 'number' },
        ];
        break;
      case 'vendor':
        title = 'Add Vendor';
        fields = [
          { key: 'name', label: 'Vendor Name', required: true },
          { key: 'category', label: 'Category', required: true },
          { key: 'contact_name', label: 'Contact Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
        ];
        break;
      case 'permit':
        title = 'Add Permit';
        fields = [
          { key: 'name', label: 'Permit Name', required: true },
          { key: 'issuing_authority', label: 'Issuing Authority' },
          { key: 'cost', label: 'Cost', type: 'number' },
          { key: 'notes', label: 'Notes' },
        ];
        break;
      case 'menu':
        title = 'Add Menu Item';
        fields = [
          { key: 'name', label: 'Item Name', required: true },
          { key: 'category', label: 'Category', required: true },
          { key: 'cost', label: 'Cost', type: 'number', required: true },
          { key: 'price', label: 'Price', type: 'number', required: true },
          { key: 'description', label: 'Description' },
        ];
        break;
      case 'budget':
        title = 'Add Budget Item';
        fields = [
          { key: 'category', label: 'Category', required: true },
          { key: 'subcategory', label: 'Subcategory' },
          { key: 'planned', label: 'Planned Amount', type: 'number', required: true },
          { key: 'spent', label: 'Spent', type: 'number' },
        ];
        break;
    }

    return (
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {fields.map(field => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label} {field.required && '*'}</Label>
                <Input
                  type={field.type || 'text'}
                  value={newItemData[field.key] || ''}
                  onChange={(e) => setNewItemData(prev => ({ 
                    ...prev, 
                    [field.key]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value 
                  }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="border-zinc-700 text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={saving}
              className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f10]">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-[#0f0f10]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
                Back
              </Button>
              <div className="w-px h-6 bg-zinc-800" />
              <div>
                <h1 className="font-heading font-bold text-zinc-100">Business Profile</h1>
                <p className="text-xs text-zinc-500">Manage all your restaurant data</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9 bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <nav className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              {SECTIONS.map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeTab === section.id
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Mobile Tabs */}
          <div className="lg:hidden w-full mb-4 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {SECTIONS.map(section => (
                <Button
                  key={section.id}
                  variant={activeTab === section.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(section.id)}
                  className={activeTab === section.id ? 'bg-zinc-800' : 'border-zinc-800'}
                >
                  {section.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'overview' && renderOverview()}
            
            {activeTab === 'concept' && renderEditableSection('concept', [
              { key: 'restaurant_name', label: 'Restaurant Name' },
              { key: 'concept_type', label: 'Concept Type' },
              { key: 'tagline', label: 'Tagline' },
              { key: 'description', label: 'Description', type: 'textarea', fullWidth: true },
            ])}
            
            {activeTab === 'location' && renderEditableSection('location', [
              { key: 'address', label: 'Address', fullWidth: true },
              { key: 'city', label: 'City' },
              { key: 'state', label: 'State' },
              { key: 'zip_code', label: 'ZIP Code' },
              { key: 'country', label: 'Country' },
              { key: 'square_footage', label: 'Square Footage', type: 'number' },
              { key: 'seating_capacity', label: 'Seating Capacity', type: 'number' },
              { key: 'patio_seats', label: 'Patio Seats', type: 'number' },
              { key: 'parking_spaces', label: 'Parking Spaces', type: 'number' },
            ])}
            
            {activeTab === 'financial' && renderEditableSection('financial', [
              { key: 'total_budget', label: 'Total Budget', type: 'number', format: v => v ? `$${Number(v).toLocaleString()}` : 'Not set' },
              { key: 'construction_budget', label: 'Construction Budget', type: 'number', format: v => v ? `$${Number(v).toLocaleString()}` : 'Not set' },
              { key: 'equipment_budget', label: 'Equipment Budget', type: 'number', format: v => v ? `$${Number(v).toLocaleString()}` : 'Not set' },
              { key: 'working_capital', label: 'Working Capital', type: 'number', format: v => v ? `$${Number(v).toLocaleString()}` : 'Not set' },
              { key: 'target_revenue_monthly', label: 'Target Monthly Revenue', type: 'number', format: v => v ? `$${Number(v).toLocaleString()}` : 'Not set' },
              { key: 'target_food_cost_percent', label: 'Target Food Cost %', type: 'number', format: v => v ? `${v}%` : 'Not set' },
              { key: 'target_labor_cost_percent', label: 'Target Labor Cost %', type: 'number', format: v => v ? `${v}%` : 'Not set' },
            ])}
            
            {activeTab === 'operational' && renderEditableSection('operational', [
              { key: 'target_open_date', label: 'Target Open Date', type: 'date' },
              { key: 'pos_system', label: 'POS System' },
              { key: 'reservation_system', label: 'Reservation System' },
            ])}
            
            {activeTab === 'menu' && (
              <div className="space-y-6">
                {renderEditableSection('menu', [
                  { key: 'price_range', label: 'Price Range' },
                  { key: 'beverage_program', label: 'Beverage Program' },
                ])}
                {renderListSection('menu', menuItems, {
                  id: 'menu_item_id',
                  name: 'name',
                  subtitle: 'category',
                })}
              </div>
            )}
            
            {activeTab === 'team' && renderListSection('team', team, {
              id: 'member_id',
              name: 'name',
              subtitle: 'role',
              status: 'status',
            })}
            
            {activeTab === 'branding' && renderEditableSection('branding', [
              { key: 'brand_voice', label: 'Brand Voice' },
              { key: 'target_demographic', label: 'Target Demographic' },
              { key: 'target_age_range', label: 'Target Age Range' },
              { key: 'website_url', label: 'Website URL' },
            ])}
            
            {activeTab === 'equipment' && renderListSection('equipment', equipment, {
              id: 'equipment_id',
              name: 'name',
              subtitle: 'specs',
              status: 'status',
            })}
            
            {activeTab === 'vendors' && renderListSection('vendor', vendors, {
              id: 'vendor_id',
              name: 'name',
              subtitle: 'category',
              status: 'status',
            })}
            
            {activeTab === 'permits' && renderListSection('permit', permits, {
              id: 'permit_id',
              name: 'name',
              subtitle: 'issuing_authority',
              status: 'status',
            })}
          </main>
        </div>
      </div>

      {renderAddDialog()}
    </div>
  );
};

export default BusinessProfile;
