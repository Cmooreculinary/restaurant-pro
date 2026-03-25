import { useState } from 'react';
import { Edit2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Inline editable field component
export const InlineEdit = ({ 
  value, 
  onSave, 
  type = 'text',
  label,
  className = '',
  displayFormat,
  placeholder = 'Click to edit'
}) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editValue);
      setEditing(false);
      toast.success(`${label || 'Field'} updated`);
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setEditing(false);
  };

  const displayValue = displayFormat ? displayFormat(value) : value;

  if (editing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="bg-zinc-900 border-zinc-700 h-8 text-sm"
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSave}
          disabled={saving}
          className="h-8 w-8 text-emerald-500 hover:text-emerald-400"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          disabled={saving}
          className="h-8 w-8 text-zinc-500 hover:text-zinc-400"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`group flex items-center gap-2 cursor-pointer hover:bg-zinc-800/50 rounded px-2 py-1 -mx-2 transition-colors ${className}`}
      onClick={() => setEditing(true)}
    >
      <span className={!displayValue ? 'text-zinc-500 italic' : ''}>
        {displayValue || placeholder}
      </span>
      <Edit2 className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

// Empty state component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionLabel = 'Get Started'
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-zinc-500" />
    </div>
    <h3 className="text-lg font-heading font-semibold text-zinc-100 mb-2">{title}</h3>
    <p className="text-sm text-zinc-500 max-w-sm mb-4">{description}</p>
    {action && (
      <Button
        onClick={action}
        className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

export default InlineEdit;
