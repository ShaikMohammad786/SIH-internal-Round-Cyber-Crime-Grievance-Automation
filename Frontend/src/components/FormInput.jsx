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
import './FormInput.css';

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

  // Update hasError when error prop changes
  useEffect(() => {
    setHasError(!!error);
  }, [error]);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    let formattedValue = inputValue;

    // Apply formatting based on field type
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

    // Call parent onChange
    onChange(e.target.name, formattedValue);

    // Validate field
    validateField(name, formattedValue);
  };

  const validateField = (fieldName, fieldValue) => {
    let validation = { isValid: true, message: '' };

    // Skip validation if field is empty and not required
    if (!fieldValue && !required) {
      setHasError(false);
      return;
    }

    // Apply specific validation based on field type
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
        // Alternate phone is optional, only validate if provided
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

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    validateField(name, value);
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

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`form-input ${hasError ? 'error' : ''} ${isFocused ? 'focused' : ''}`}
          required={required}
        >
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
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={inputConfig.placeholder}
          maxLength={inputConfig.maxLength}
          className={`form-input form-textarea ${hasError ? 'error' : ''} ${isFocused ? 'focused' : ''}`}
          required={required}
          rows={4}
        />
      );
    }

    return (
      <input
        type={inputConfig.type}
        name={name}
        value={value || ''}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={inputConfig.placeholder}
        maxLength={inputConfig.maxLength}
        className={`form-input ${hasError ? 'error' : ''} ${isFocused ? 'focused' : ''}`}
        required={required}
      />
    );
  };

  return (
    <div className={`form-group ${className} ${hasError ? 'has-error' : ''}`}>
      <label className="form-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      
      <div className="input-container">
        {icon && <div className="input-icon">{icon}</div>}
        {renderInput()}
        {maxLength && (
          <div className="char-count">
            {(value || '').length}/{maxLength}
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div className="help-text">
          {helpText}
        </div>
      )}
    </div>
  );
};

export default FormInput;

