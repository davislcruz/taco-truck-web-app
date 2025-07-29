import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, ChevronDown, Eye, ChevronUp, EyeOff, Trash2, Check, X } from "lucide-react";
import { MenuItem } from "@shared/schema";
// Removed FormField imports - using native Input/Textarea for now

interface MenuItemCardProps {
  item: MenuItem;
  isExpanded: boolean;
  isEditMode: boolean;
  inlineEditing: Record<string, boolean>;
  tempValues: Record<string, any>;
  pendingChanges: Record<string, any>;
  onToggleExpanded: () => void;
  onStartInlineEditing: (key: string, value: any) => void;
  onStopInlineEditing: (key: string, save: boolean) => void;
  onUpdatePendingChange: (field: string, value: any) => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  onEdit: () => void;
  onDelete: () => void;
  setTempValues: (updater: (prev: Record<string, any>) => Record<string, any>) => void;
  isNewItem?: boolean;
  hasBeenSaved?: boolean;
}

export function MenuItemCard({
  item,
  isExpanded,
  isEditMode,
  inlineEditing,
  tempValues,
  pendingChanges,
  onToggleExpanded,
  onStartInlineEditing,
  onStopInlineEditing,
  onUpdatePendingChange,
  onSaveChanges,
  onCancelChanges,
  onEdit,
  onDelete,
  setTempValues,
  isNewItem = false,
  hasBeenSaved = true,
}: MenuItemCardProps) {
  const getDisplayValue = (field: string) => {
    if (pendingChanges[field] !== undefined) {
      return pendingChanges[field];
    }
    return item[field as keyof MenuItem];
  };

  // Validation for required fields
  const validateRequiredFields = () => {
    const name = getDisplayValue('name');
    const price = getDisplayValue('price');
    return name && name.trim() !== '' && price && price.toString().trim() !== '';
  };

  const isValidForSave = validateRequiredFields();
  
  
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);
  
  const handleSaveClick = () => {
    if (!isValidForSave) {
      setShowSaveMessage(true);
      setTimeout(() => setShowSaveMessage(false), 3000);
      return;
    }
    onSaveChanges();
  };
  
  const handleCancelClick = () => {
    if (isNewItem && !hasBeenSaved) {
      setShowCancelMessage(true);
      setTimeout(() => setShowCancelMessage(false), 3000);
      return;
    }
    onCancelChanges();
  };

  const handleInlineEdit = (field: string, currentValue: any) => {
    if (!isEditMode) return;
    const key = `${item.id}-${field}`;
    onStartInlineEditing(key, currentValue);
  };

  const handleInlineKeyDown = (e: React.KeyboardEvent, field: string) => {
    const key = `${item.id}-${field}`;
    if (e.key === 'Enter') {
      e.preventDefault();
      onStopInlineEditing(key, true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onStopInlineEditing(key, false);
    }
  };

  const handleInlineBlur = (field: string) => {
    const key = `${item.id}-${field}`;
    onStopInlineEditing(key, true);
  };

  // Helper to get editable field styling - easy to change globally
  const getEditableFieldStyles = (options: { isBlock?: boolean; textSize?: string } = {}) => {
    const baseClasses = "px-1 py-0.5 rounded transition-colors";
    const cursorClass = isEditMode ? "cursor-pointer" : "cursor-default";
    const blockClass = options.isBlock ? "block" : "";
    const editModeClasses = isEditMode 
      ? "bg-blue-50 border-2 border-dashed border-blue-300 hover:bg-blue-100" 
      : "";
    
    return `${baseClasses} ${cursorClass} ${blockClass} ${editModeClasses} ${options.textSize || ""}`;
  };

  // Helper to get field placeholder text
  const getFieldPlaceholder = (fieldName: string, value: any) => {
    if (value) return value;
    return isEditMode ? `Click to edit ${fieldName}...` : "—";
  };

  // Unified field renderer - handles both editing and display states
  const renderField = (field: string, rawValue: any, options: {
    isTextarea?: boolean;
    isBlock?: boolean;
    textSize?: string;
    displayValue?: any; // For processed values like arrays
    fieldLabel?: string; // For better placeholder text
    fixedWidth?: boolean; // For image URL field
  } = {}) => {
    const key = `${item.id}-${field}`;
    const isEditing = inlineEditing[key];
    const displayValue = options.displayValue !== undefined ? options.displayValue : rawValue;
    const fieldLabel = options.fieldLabel || field;
    
    // If currently being edited, show input/textarea
    if (isEditing) {
      const Component = options.isTextarea ? Textarea : Input;
      const inputClassName = options.isTextarea 
        ? "min-h-[60px]" 
        : options.fixedWidth 
          ? "w-full" 
          : "";
      
      return (
        <Component
          value={tempValues[key] || ''}
          onChange={(e) => setTempValues(prev => ({ ...prev, [key]: e.target.value }))}
          onKeyDown={(e) => handleInlineKeyDown(e, field)}
          onBlur={() => handleInlineBlur(field)}
          autoFocus
          className={inputClassName}
        />
      );
    }
    
    // Show clickable field for editing
    const spanClassName = options.fixedWidth 
      ? `${getEditableFieldStyles(options)} truncate w-full block`
      : getEditableFieldStyles(options);
    
    return (
      <span
        onClick={() => handleInlineEdit(field, rawValue)}
        className={spanClassName}
        title={isEditMode ? `Click to edit this field${rawValue ? ': ' + rawValue : ''}` : `Enter edit mode to edit this field${rawValue ? ': ' + rawValue : ''}`}
      >
        {getFieldPlaceholder(fieldLabel, displayValue)}
      </span>
    );
  };

  return (
    <Card className={`mb-4 transition-all duration-200 relative ${
      isEditMode 
        ? "border-2 border-blue-400 shadow-lg bg-blue-50/20" 
        : "border border-gray-200 hover:shadow-md"
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="p-1"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
            <CardTitle className="text-lg">
              {renderField('name', getDisplayValue('name'), { fieldLabel: 'name' })}
            </CardTitle>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {item.category}
              </Badge>
              {getDisplayValue('ingredients') && Array.isArray(getDisplayValue('ingredients')) && getDisplayValue('ingredients').length > 0 && (
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500 truncate block">
                    {getDisplayValue('ingredients').join(', ')}
                  </span>
                </div>
              )}
              {isEditMode && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300 flex-shrink-0">
                  ✏️ Edit Mode
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-semibold text-green-600">
              ${renderField('price', getDisplayValue('price'), { fieldLabel: 'price' })}
            </span>
            
            {isEditMode ? (
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveClick}
                    className={`h-7 px-2 text-xs transition-all ${
                      isValidForSave 
                        ? 'bg-green-50 hover:bg-green-100' 
                        : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-300'
                    }`}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelClick}
                    className={`h-7 px-2 text-xs transition-all ${
                      isNewItem && !hasBeenSaved 
                        ? 'bg-yellow-50 hover:bg-yellow-100 border-yellow-300' 
                        : ''
                    }`}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="h-7 px-2 text-xs text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50"
                    title="Delete item"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
                
                {/* Message for Save button */}
                {showSaveMessage && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">⚠️</span>
                      <span>Please fill out the required fields: <strong>Name</strong> and <strong>Price</strong></span>
                    </div>
                  </div>
                )}
                
                {/* Message for Cancel button */}
                {showCancelMessage && (
                  <div className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">💡</span>
                      <span>Save your changes first, then you can cancel. Or use <strong>Delete</strong> to discard this card.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // If card is collapsed, expand it first
                    if (!isExpanded) {
                      onToggleExpanded();
                    }
                    onEdit();
                  }}
                  className="px-2 py-1"
                  title="Toggle edit mode"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Footer teaser when collapsed - makes expansion obvious */}
      {!isExpanded && (
        <div 
          onClick={onToggleExpanded}
          className={`px-4 py-2 cursor-pointer transition-colors ${
            isEditMode 
              ? "bg-blue-50 border-t-2 border-dashed border-blue-300 hover:bg-blue-100"
              : "bg-gray-50 border-t border-gray-100 hover:bg-gray-100"
          }`}
        >
          <div className={`flex items-center justify-center gap-2 text-sm ${
            isEditMode ? "text-blue-700" : "text-gray-600"
          }`}>
            <Eye className="h-4 w-4" />
            <span>Click to view description, ingredients, sizes, and more details</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      )}
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="flex gap-4">
            {/* Left side - Image */}
            <div className="flex-shrink-0 w-48">
              <div>
                <label className="text-sm font-medium text-gray-600">Image</label>
                <div className="mt-1">
                  {renderField('image', getDisplayValue('image'), { 
                    isBlock: true, 
                    fieldLabel: 'image URL',
                    fixedWidth: true
                  })}
                  {getDisplayValue('image') && (
                    <div className="mt-2">
                      <img 
                        src={getDisplayValue('image')} 
                        alt={item.name || 'Menu item'} 
                        className={`w-full h-32 object-cover rounded-lg border transition-all ${
                          isEditMode 
                            ? 'cursor-pointer hover:opacity-75 hover:border-blue-300' 
                            : ''
                        }`}
                        onClick={() => isEditMode && handleInlineEdit('image', getDisplayValue('image'))}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        title={isEditMode ? "Click to edit image URL" : ""}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - All other fields */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Translation</label>
                <div className="mt-1">
                  {renderField('translation', getDisplayValue('translation'), { 
                    isBlock: true, 
                    fieldLabel: 'translation' 
                  })}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <div className="mt-1">
                  {renderField('description', getDisplayValue('description'), { 
                    isTextarea: true, 
                    isBlock: true, 
                    fieldLabel: 'description' 
                  })}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Meats</label>
                  <div className="mt-1">
                    {renderField('meats', 
                      Array.isArray(item.meats) ? item.meats.join(', ') : item.meats || '', 
                      { 
                        isBlock: true, 
                        textSize: 'text-sm',
                        displayValue: Array.isArray(item.meats) ? item.meats.join(', ') : item.meats,
                        fieldLabel: 'meats' 
                      }
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Sizes</label>
                  <div className="mt-1">
                    {renderField('sizes', 
                      Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes || '', 
                      { 
                        isBlock: true, 
                        textSize: 'text-sm',
                        displayValue: Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes,
                        fieldLabel: 'sizes' 
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          
          {/* Footer for collapsing when expanded */}
          <div 
            onClick={onToggleExpanded}
            className={`-mx-6 -mb-6 mt-4 px-4 py-2 cursor-pointer transition-colors ${
              isEditMode 
                ? "bg-blue-50 border-t-2 border-dashed border-blue-300 hover:bg-blue-100"
                : "bg-gray-50 border-t border-gray-100 hover:bg-gray-100"
            }`}
          >
            <div className={`flex items-center justify-center gap-2 text-sm ${
              isEditMode ? "text-blue-700" : "text-gray-600"
            }`}>
              <EyeOff className="h-4 w-4" />
              <span>Click to collapse details</span>
              <ChevronUp className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}