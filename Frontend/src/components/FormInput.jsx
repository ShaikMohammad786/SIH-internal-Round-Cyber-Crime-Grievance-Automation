import React, { useState, useEffect } from 'react';
import { 
  formatAadhaarNumber, 
  formatPANNumber, 
  formatPhoneNumber, 
  formatPincode, 
  formatAmount,
  validateAadhaar,
  validatePAN,
  validatePhone,
  validateEmail,
  validatePincode,
  validateAmount,
  validateRequired,
  validateDate,
  INPUT_CONFIGS
} from '../utils/formUtils';
import { AlertCircle } from 'lucide-react';

const FormInput = ({ 
  name, 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error = '',
  maxLength,
  className = '',
  icon = null,
  helpText = '',
  options = [] // For select inputs
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(!!error);

  useEffect(() => {
    setHasError(!!error);
  }, [error]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    let formattedValue = inputValue;

    switch (name) {
      case 'aadhaarNumber':
        formattedValue = formatAadhaarNumber(inputValue);
        break;
      case 'panNumber':
        formattedValue = formatPANNumber(inputValue);
        break;
      case 'phone':
      case 'alternatePhone':
      case 'emergencyContactPhone':
        formattedValue = formatPhoneNumber(inputValue);
        break;
      case 'pincode':
      case 'currentPincode':
      case 'permanentPincode':
      case 'incidentPincode':
        formattedValue = formatPincode(inputValue);
        break;
      case 'financialLoss':
      case 'amount':
        formattedValue = formatAmount(inputValue);
        break;
      default:
        formattedValue = inputValue;
    }

    onChange(e.target.name, formattedValue);
    validateField(name, formattedValue);
  };

  const validateField = (fieldName, fieldValue) => {
    let validation = { isValid: true, message: '' };

    if (!fieldValue && !required) {
      setHasError(false);
      return;
    }

    switch (fieldName) {
      case 'aadhaarNumber':
        validation = validateAadhaar(fieldValue);
        break;
      case 'panNumber':
        validation = validatePAN(fieldValue);
        break;
      case 'phone':
      case 'emergencyContactPhone':
        validation = validatePhone(fieldValue);
        break;
      case 'alternatePhone':
        if (fieldValue && fieldValue.trim()) {
          validation = validatePhone(fieldValue);
        } else {
          validation = { isValid: true, message: '' };
        }
        break;
      case 'email':
        validation = validateEmail(fieldValue);
        break;
      case 'pincode':
      case 'currentPincode':
      case 'permanentPincode':
      case 'incidentPincode':
        validation = validatePincode(fieldValue);
        break;
      case 'financialLoss':
      case 'amount':
        validation = validateAmount(fieldValue);
        break;
      case 'incidentDate':
        validation = validateDate(fieldValue);
        break;
      default:
        validation = validateRequired(fieldValue, label || fieldName);
    }

    setHasError(!validation.isValid);
  };

  const getInputConfig = () => {
    return INPUT_CONFIGS[name] || {
      type: type,
      placeholder: placeholder,
      maxLength: maxLength,
      required: required
    };
  };

  const inputConfig = getInputConfig();

  // Tailwind classes based on state
  const baseInputClasses = "block w-full rounded-md border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all duration-200";
  const errorInputClasses = "text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500";
  const iconPaddingClass = icon ? "pl-10" : "pl-3";
  
  // Special font classes for specific inputs
  const isMonospace = ['aadhaarNumber', 'panNumber', 'pincode', 'currentPincode', 'permanentPincode'].includes(name);
  const fontClass = isMonospace ? "font-mono tracking-wider" : "";
  const isCurrency = ['financialLoss', 'amount'].includes(name);
  const currencyClass = isCurrency ? "font-semibold text-emerald-700" : "";

  const renderInput = () => {
    const commonProps = {
      name,
      value: value || '',
      onChange: handleInputChange,
      onFocus: () => setIsFocused(true),
      onBlur: () => {
        setIsFocused(false);
        validateField(name, value);
      },
      required,
      className: `${baseInputClasses} ${hasError ? errorInputClasses : ''} ${iconPaddingClass} ${fontClass} ${currencyClass}`
    };

    if (type === 'select') {
      return (
        <select {...commonProps}>
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          placeholder={inputConfig.placeholder}
          maxLength={inputConfig.maxLength}
          rows={4}
          className={`${commonProps.className} resize-y min-h-[100px]`}
        />
      );
    }

    return (
      <input
        type={inputConfig.type}
        {...commonProps}
        placeholder={inputConfig.placeholder}
        maxLength={inputConfig.maxLength}
      />
    );
  };

  return (
    <div className={`mb-5 ${className}`}>
      <label className={`block text-sm font-medium leading-6 mb-1.5 ${hasError ? 'text-red-600' : 'text-slate-900'}`}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-slate-500 sm:text-sm">{icon}</span>
          </div>
        )}
        
        {renderInput()}
        
        {maxLength && !hasError && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-xs text-slate-400">
              {(value || '').length}/{maxLength}
            </span>
          </div>
        )}

        {hasError && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="mt-2 text-xs text-slate-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormInput;
