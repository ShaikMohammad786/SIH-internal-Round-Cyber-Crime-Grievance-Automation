import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userProfilesAPI, createFormDataStructure, validateFormData } from "../utils/userProfilesAPI";
import { caseFlowAPI, createCompleteCaseData, CASE_FLOW_STEPS } from "../utils/caseFlowAPI";
import { addActivityHistory, getUser } from "../utils/auth";
import FormInput from "../components/FormInput";
import Header from "../components/Header";
// import { validateAadhaar, validatePAN, validatePhone, validateEmail, validateRequired } from "../utils/formUtils";
import "./RegisterCase.css";

const RegisterCase = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin and redirect
  useEffect(() => {
    const user = getUser();
    if (user && user.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [navigate]);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    aadhaarNumber: "",
    panNumber: "",
    otherGovernmentIds: "",
    
    // Contact Information
    primaryPhone: "",
    alternatePhone: "",
    email: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    
    // Incident Details
    incidentDate: "",
    incidentTime: "",
    scamType: "",
    incidentDescription: "",
    communicationMethod: "",
    scammerName: "",
    scammerPhone: "",
    scammerEmail: "",
    scammerWebsite: "",
    scammerBankAccount: "",
    moneyLost: "",
    sensitiveInfoShared: "",
    actionsTaken: "",
    
    // File Uploads
    evidenceFiles: []
  });

  const handleInputChange = (arg1, arg2) => {
    let fieldName;
    let fieldValue;

    // Support both (name, value) and native event signatures
    if (typeof arg1 === 'string') {
      fieldName = arg1;
      fieldValue = arg2;
    } else if (arg1 && arg1.target) {
      fieldName = arg1.target.name;
      fieldValue = arg1.target.value;
    }

    if (fieldName === undefined) return;

    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
    
    // Clear error when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }

    // Real-time validation for specific fields
    validateFieldInRealTime(fieldName, fieldValue);
    
    // Debug log for incident fields (remove in production)
    if (['incidentDescription', 'scammerName', 'scammerPhone', 'scammerEmail', 'moneyLost', 'incidentDate', 'scamType', 'communicationMethod'].includes(fieldName)) {
      console.log(`Real-time validation for ${fieldName}:`, fieldValue);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'audio/mpeg', 'audio/wav', 'audio/mp3',
        'video/mp4', 'video/avi', 'video/mov'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has an unsupported format.`);
        return false;
      }
      
      return true;
    });

    setFormData(prev => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...validFiles]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    return '📎';
  };

  const validateFieldInRealTime = (fieldName, fieldValue) => {
    let error = '';

    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        if (!fieldValue || fieldValue.trim() === '') {
          error = `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
        }
        break;
      case 'email':
        if (!fieldValue) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'phone':
      case 'primaryPhone':
        if (!fieldValue) {
          error = 'Phone number is required';
        } else {
          // Remove +91 prefix and spaces, then validate
          let cleaned = fieldValue.replace(/\s/g, '');
          if (cleaned.startsWith('+91')) {
            cleaned = cleaned.substring(3);
          }
          if (cleaned.length > 0 && cleaned.length !== 10) {
            error = 'Phone number must be 10 digits (excluding +91)';
          } else if (cleaned.length === 10 && !/^\d{10}$/.test(cleaned)) {
            error = 'Phone number must contain only digits';
          }
        }
        break;
      case 'alternatePhone':
        // Alternate phone is optional, but if provided, validate it
        if (fieldValue) {
          let cleaned = fieldValue.replace(/\s/g, '');
          if (cleaned.startsWith('+91')) {
            cleaned = cleaned.substring(3);
          }
          if (cleaned.length > 0 && cleaned.length !== 10) {
            error = 'Alternate phone number must be 10 digits (excluding +91)';
          } else if (cleaned.length === 10 && !/^\d{10}$/.test(cleaned)) {
            error = 'Alternate phone number must contain only digits';
          }
        }
        break;
      case 'aadhaarNumber':
        if (fieldValue) {
          const cleaned = fieldValue.replace(/\s/g, '');
          if (cleaned.length > 0 && cleaned.length !== 12) {
            error = 'Aadhaar number must be 12 digits';
          } else if (cleaned.length === 12 && !/^\d{12}$/.test(cleaned)) {
            error = 'Aadhaar number must contain only digits';
          }
        }
        break;
      case 'panNumber':
        if (fieldValue) {
          if (fieldValue.length > 0 && fieldValue.length !== 10) {
            error = 'PAN number must be 10 characters';
          } else if (fieldValue.length === 10 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(fieldValue)) {
            error = 'PAN must be in format: ABCDE1234F';
          }
        }
        break;
      case 'incidentDescription':
        if (fieldValue && fieldValue.trim() === '') {
          error = 'Incident description cannot be empty';
        }
        break;
      case 'scammerName':
        if (fieldValue && fieldValue.trim() === '') {
          error = 'Scammer name cannot be empty';
        }
        break;
      case 'scammerPhone':
        if (fieldValue) {
          // Remove +91 prefix and spaces, then validate
          let cleaned = fieldValue.replace(/\s/g, '');
          if (cleaned.startsWith('+91')) {
            cleaned = cleaned.substring(3);
          }
          if (cleaned.length > 0 && cleaned.length !== 10) {
            error = 'Scammer phone must be 10 digits (excluding +91)';
          } else if (cleaned.length === 10 && !/^\d{10}$/.test(cleaned)) {
            error = 'Scammer phone must contain only digits';
          }
        }
        break;
      case 'scammerEmail':
        if (fieldValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
          error = 'Please enter a valid scammer email address';
        }
        break;
      case 'moneyLost':
        if (fieldValue) {
          const amount = Number(String(fieldValue).replace(/[₹,\s]/g, '')) || 0;
          if (amount < 0) {
            error = 'Amount cannot be negative';
          }
        }
        break;
      case 'gender':
        if (!fieldValue) {
          error = 'Gender is required';
        }
        break;
      case 'nationality':
        if (!fieldValue || fieldValue.trim() === '') {
          error = 'Nationality is required';
        }
        break;
      case 'incidentDate':
        if (!fieldValue) {
          error = 'Incident date is required';
        }
        break;
      case 'scamType':
        if (!fieldValue) {
          error = 'Scam type is required';
        }
        break;
      case 'communicationMethod':
        if (!fieldValue) {
          error = 'Communication method is required';
        }
        break;
      case 'scammerWebsite':
        if (fieldValue && !/^https?:\/\/.+/.test(fieldValue) && !/^www\..+/.test(fieldValue)) {
          error = 'Please enter a valid website URL (starting with http:// or www.)';
        }
        break;
    }

    // Update error for this field
    if (error) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    } else {
      // Clear error if validation passes
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  // Adapter for native inputs still using event handlers
  // const handleNativeChange = (e) => {
  //   const { name, value } = e.target;
  //   handleInputChange(name, value);
  // };

  // Step validation functions
  const validateStep1 = (data) => {
    const errors = [];
    
    console.log('Validating step 1 with data:', data);
    
    // Personal Information - make some fields optional for testing
    if (!data.firstName?.trim()) errors.push('First name is required');
    if (!data.lastName?.trim()) errors.push('Last name is required');
    // if (!data.dateOfBirth) errors.push('Date of birth is required');
    // if (!data.gender) errors.push('Gender is required');
    // if (!data.nationality?.trim()) errors.push('Nationality is required');
    
    // Contact Information
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.primaryPhone?.trim()) errors.push('Primary phone is required');
    
    // Government IDs - make optional for testing
    // if (!data.aadhaarNumber?.trim()) errors.push('Aadhaar number is required');
    // if (!data.panNumber?.trim()) errors.push('PAN number is required');
    
    console.log('Step 1 validation errors:', errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateStep2 = (data) => {
    const errors = [];
    
    console.log('Validating step 2 with data:', data);
    
    // Incident Information - make some fields optional for testing
    if (!data.incidentDate) errors.push('Incident date is required');
    if (!data.scamType) errors.push('Scam type is required');
    if (!data.incidentDescription?.trim()) errors.push('Incident description is required');
    // if (!data.communicationMethod) errors.push('Communication method is required');
    
    // Scammer Information - make optional for testing
    // if (!data.scammerName?.trim()) errors.push('Scammer name is required');
    // if (!data.scammerPhone?.trim()) errors.push('Scammer phone is required');
    // if (!data.scammerEmail?.trim()) errors.push('Scammer email is required');
    
    // Financial Information - make optional for testing
    // const amount = Number(String(data.moneyLost || '0').replace(/[₹,\s]/g, '')) || 0;
    // if (!data.moneyLost || amount <= 0) errors.push('Amount lost is required and must be greater than 0');
    
    console.log('Step 2 validation errors:', errors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const nextStep = () => {
    console.log('Next step clicked from', currentStep);
    
    // Validate current step before proceeding
    if (currentStep === 1) {
      // Validate step 1 (Personal & Contact Info)
      const step1Validation = validateStep1(formData);
      if (!step1Validation.isValid) {
        console.log('Step 1 validation failed:', step1Validation.errors);
        const errors = {};
        step1Validation.errors.forEach(error => {
          // Map error messages to field names
          if (error.includes('First name')) errors.firstName = error;
          else if (error.includes('Last name')) errors.lastName = error;
          else if (error.includes('Date of birth')) errors.dateOfBirth = error;
          else if (error.includes('Gender')) errors.gender = error;
          else if (error.includes('Nationality')) errors.nationality = error;
          else if (error.includes('Email')) errors.email = error;
          else if (error.includes('Primary phone')) errors.primaryPhone = error;
          else if (error.includes('Aadhaar number')) errors.aadhaarNumber = error;
          else if (error.includes('PAN number')) errors.panNumber = error;
        });
        setFormErrors(errors);
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2 (Incident Details)
      const step2Validation = validateStep2(formData);
      if (!step2Validation.isValid) {
        console.log('Step 2 validation failed:', step2Validation.errors);
        const errors = {};
        step2Validation.errors.forEach(error => {
          // Map error messages to field names
          if (error.includes('Incident date')) errors.incidentDate = error;
          else if (error.includes('Scam type')) errors.scamType = error;
          else if (error.includes('Incident description')) errors.incidentDescription = error;
          else if (error.includes('Communication method')) errors.communicationMethod = error;
          else if (error.includes('Scammer name')) errors.scammerName = error;
          else if (error.includes('Scammer phone')) errors.scammerPhone = error;
          else if (error.includes('Scammer email')) errors.scammerEmail = error;
          else if (error.includes('Amount lost')) errors.moneyLost = error;
        });
        setFormErrors(errors);
        return;
      }
    }
    
    // Clear any previous errors
    setFormErrors({});
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const submitCase = async () => {
    console.log('🚀 Submit case clicked - Starting complete flow');
    setIsSubmitting(true);
    
    try {
      // Validate form data
      const validation = validateFormData(formData);
      console.log('Validation result:', validation);
      if (!validation.isValid) {
        console.log('Validation errors:', validation.errors);
        const errors = {};
        validation.errors.forEach(error => {
          const fieldName = error.toLowerCase().replace(' is required', '').replace(' ', '');
          errors[fieldName] = error;
        });
        setFormErrors(errors);
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Form validation passed, creating complete case data');

      // Create complete case data for the new flow system
      const completeCaseData = createCompleteCaseData(formData);
      console.log('📋 Complete case data created:', completeCaseData);

      // Submit case using the new complete flow system
      let response;
      try {
        console.log('🚀 Submitting to complete case flow...');
        response = await caseFlowAPI.submitCase(completeCaseData);
        console.log('✅ Complete case flow response:', response);
      } catch (apiErr) {
        console.error('❌ API error in complete case flow:', apiErr);
        setFormErrors({ submit: apiErr.message || 'Failed to submit case' });
        return;
      }
      
      if (response.success) {
        // Track activity
        const user = getUser();
        if (user) {
          addActivityHistory(user.id, {
            action: 'case_created_complete_flow',
            details: `Created case ${response.case.caseId} with complete automated flow`,
            page: '/register-case'
          });
        }
        
        // Navigate to dashboard with success message
        navigate('/dashboard', { 
          state: { 
            message: '🎉 Case submitted successfully! Complete automated flow has started.',
            caseId: response.case.caseId,
            hasProfile: true,
            flowStarted: true
          } 
        });
      }
    } catch (error) {
      console.error('❌ Failed to submit case:', error);
      setFormErrors({ submit: 'Failed to submit case: ' + error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <div className="form-section">
      <div className="section-header">
        <div className="section-icon">👤</div>
        <div>
          <h2>Victim Details</h2>
          <p>Your personal information and contact details</p>
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-header">
          <h3>Personal Information</h3>
        </div>

        <div className="form-grid">
          <FormInput
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            required={true}
            error={formErrors.firstName}
            placeholder="Enter your first name"
          />

          <FormInput
            name="middleName"
            label="Middle Name"
            value={formData.middleName}
            onChange={handleInputChange}
            error={formErrors.middleName}
          />

          <FormInput
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            required={true}
            error={formErrors.lastName}
            placeholder="Enter your last name"
          />

          <FormInput
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required={true}
            error={formErrors.dateOfBirth}
          />

          <FormInput
            name="gender"
            label="Gender"
            type="select"
            value={formData.gender}
            onChange={handleInputChange}
            required={true}
            error={formErrors.gender}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]}
          />

          <FormInput
            name="nationality"
            label="Nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            required={true}
            error={formErrors.nationality}
            helpText="Enter your nationality (e.g., Indian, American)"
          />

          <FormInput
            name="aadhaarNumber"
            label="Aadhaar Number"
            value={formData.aadhaarNumber}
            onChange={handleInputChange}
            required={true}
            error={formErrors.aadhaarNumber}
            helpText="Enter 12-digit Aadhaar number"
            />
          </div>

          <FormInput
            name="panNumber"
            label="PAN Number"
            value={formData.panNumber}
            onChange={handleInputChange}
            error={formErrors.panNumber}
            helpText="Enter 10-character PAN number"
          />

          <FormInput
            name="otherGovernmentIds"
            label="Other Government IDs"
            value={formData.otherGovernmentIds}
            onChange={handleInputChange}
            error={formErrors.otherGovernmentIds}
            helpText="Passport, SSN, Driver's License, etc."
            className="full-width"
          />
          </div>

      {/* Contact Information Section */}
      <div className="subsection">
        <div className="subsection-header">
          <h3>Contact Information</h3>
        </div>

        <div className="form-grid">
          <FormInput
            name="primaryPhone"
            label="Primary Phone Number"
            type="tel"
            value={formData.primaryPhone}
            onChange={handleInputChange}
            required={true}
            error={formErrors.primaryPhone}
            placeholder="Enter your phone number"
          />

          <FormInput
            name="alternatePhone"
            label="Alternate Phone Number"
            type="tel"
            value={formData.alternatePhone}
            onChange={handleInputChange}
            error={formErrors.alternatePhone}
          />

          <FormInput
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required={true}
            error={formErrors.email}
            className="full-width"
          />

          <div className="subsection-header">
            <h4>Residential Address</h4>
          </div>

          <FormInput
            name="streetAddress"
            label="Street Address"
            value={formData.streetAddress}
            onChange={handleInputChange}
            required={true}
            error={formErrors.streetAddress}
            helpText="House/Flat No., Street Name"
            className="full-width"
          />

          <FormInput
            name="city"
            label="City"
            value={formData.city}
            onChange={handleInputChange}
            required={true}
            error={formErrors.city}
          />

          <FormInput
            name="state"
            label="State"
            value={formData.state}
            onChange={handleInputChange}
            required={true}
            error={formErrors.state}
          />

          <FormInput
            name="postalCode"
            label="ZIP/Postal Code"
            value={formData.postalCode}
            onChange={handleInputChange}
            required={true}
            error={formErrors.postalCode}
            helpText="6-digit postal code"
          />

          <FormInput
            name="country"
            label="Country"
            value={formData.country}
            onChange={handleInputChange}
            required={true}
            error={formErrors.country}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-section">
      <div className="section-header">
        <div className="section-icon">⚠️</div>
        <div>
          <h2>Incident Details</h2>
          <p>Details about the scam incident and evidence</p>
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-header">
          <h3>Incident Information</h3>
        </div>

        <div className="form-grid">
          <FormInput
            name="incidentDate"
            label="Date of Incident"
            type="date"
            value={formData.incidentDate}
            onChange={handleInputChange}
            required={true}
            error={formErrors.incidentDate}
          />

          <FormInput
            name="incidentTime"
            label="Time of Incident"
            type="time"
            value={formData.incidentTime}
            onChange={handleInputChange}
            required={true}
            error={formErrors.incidentTime}
          />

          <FormInput
            name="scamType"
            label="Type of Scam"
            type="select"
            value={formData.scamType}
            onChange={handleInputChange}
            required={true}
            error={formErrors.scamType}
            options={[
              { value: '', label: 'Select scam type' },
              { value: 'upi-fraud', label: 'UPI Fraud' },
              { value: 'investment-scam', label: 'Investment Scam' },
              { value: 'romance-scam', label: 'Romance Scam' },
              { value: 'phishing', label: 'Phishing' },
              { value: 'fake-calls', label: 'Fake Calls' },
              { value: 'online-shopping', label: 'Online Shopping Fraud' },
              { value: 'job-scam', label: 'Job Scam' },
              { value: 'other', label: 'Other' }
            ]}
          />

          <FormInput
            name="incidentDescription"
            label="Description of Incident"
            type="textarea"
            value={formData.incidentDescription}
            onChange={handleInputChange}
            required={true}
            error={formErrors.incidentDescription}
            placeholder="Describe what happened in detail. Include dates, times, amounts, and any relevant information."
            className="full-width"
          />

          <FormInput
            name="communicationMethod"
            label="Communication Method"
            type="select"
            value={formData.communicationMethod}
            onChange={handleInputChange}
            required={true}
            error={formErrors.communicationMethod}
            options={[
              { value: '', label: 'How did the scammer contact you?' },
              { value: 'phone-call', label: 'Phone Call' },
              { value: 'sms', label: 'SMS' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'email', label: 'Email' },
              { value: 'social-media', label: 'Social Media' },
              { value: 'website', label: 'Website' },
              { value: 'in-person', label: 'In Person' },
              { value: 'other', label: 'Other' }
            ]}
          />
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-header">
          <h3>Scammer Information</h3>
          <p>Provide any information you have about the scammer (optional but helpful)</p>
        </div>

        <div className="form-grid">
          <FormInput
            name="scammerName"
            label="Name or Alias Used"
            value={formData.scammerName}
            onChange={handleInputChange}
            placeholder="Name the scammer used"
            error={formErrors.scammerName}
            helpText="Any name or alias the scammer used"
          />

          <FormInput
            name="scammerPhone"
            label="Phone Number(s)"
            type="tel"
            value={formData.scammerPhone}
            onChange={handleInputChange}
            placeholder="Scammer's phone number"
            error={formErrors.scammerPhone}
            helpText="Phone number used by the scammer"
          />

          <FormInput
            name="scammerEmail"
            label="Email Address(es)"
            type="email"
            value={formData.scammerEmail}
            onChange={handleInputChange}
            placeholder="Scammer's email"
            error={formErrors.scammerEmail}
            helpText="Email address used by the scammer"
          />

          <FormInput
            name="scammerWebsite"
            label="Website/Social Media Handles"
            value={formData.scammerWebsite}
            onChange={handleInputChange}
            placeholder="Website URL, social media profiles, etc."
            error={formErrors.scammerWebsite}
            helpText="Website or social media profiles used"
          />

          <FormInput
            name="scammerBankAccount"
            label="Bank Account or UPI ID"
            value={formData.scammerBankAccount}
            onChange={handleInputChange}
            placeholder="Bank account number, UPI ID, etc."
            error={formErrors.scammerBankAccount}
            helpText="Bank account details provided by scammer"
            className="full-width"
          />
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-header">
          <h3>Money/Information Lost</h3>
        </div>

        <div className="form-grid">
          <FormInput
            name="moneyLost"
            label="Amount of Money Lost"
            type="text"
            value={formData.moneyLost}
            onChange={handleInputChange}
            required={true}
            error={formErrors.moneyLost}
            placeholder="Enter the amount you lost"
            helpText="Enter the total amount in your local currency"
          />

          <FormInput
            name="sensitiveInfoShared"
            label="Sensitive Information Shared"
            type="textarea"
            value={formData.sensitiveInfoShared}
            onChange={handleInputChange}
            error={formErrors.sensitiveInfoShared}
            placeholder="List any sensitive information you shared (e.g., card details, OTPs, ID numbers, passwords)"
            className="full-width"
          />

          <FormInput
            name="actionsTaken"
            label="Actions Already Taken"
            type="textarea"
            value={formData.actionsTaken}
            onChange={handleInputChange}
            error={formErrors.actionsTaken}
            placeholder="Describe any actions you've already taken (e.g., reported to bank, blocked cards, informed police, contacted telecom provider)"
            className="full-width"
          />
        </div>
      </div>

      <div className="subsection">
        <div className="subsection-header">
          <h3>Evidence Files</h3>
          <p>Upload any supporting documents, screenshots, or files related to the incident</p>
        </div>

        <div className="file-upload-section">
          <div className="file-upload-area">
            <input
              type="file"
              id="evidenceFiles"
              name="evidenceFiles"
              multiple
              accept="image/*,application/pdf,.doc,.docx,audio/*,video/*"
              onChange={handleFileUpload}
              className="file-input"
            />
            <label htmlFor="evidenceFiles" className="file-upload-label">
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>Click to upload files</strong>
                <span>or drag and drop files here</span>
              </div>
              <div className="upload-hint">
                Supported formats: Images, PDF, Documents, Audio, Video (Max 10MB each)
              </div>
            </label>
          </div>

          {formData.evidenceFiles.length > 0 && (
            <div className="uploaded-files">
              <h4>Uploaded Files ({formData.evidenceFiles.length})</h4>
              <div className="file-list">
                {formData.evidenceFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-icon">{getFileIcon(file.type)}</span>
                      <div className="file-details">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={() => removeFile(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-section">
      <div className="section-header">
        <div className="section-icon">✓</div>
        <div>
          <h2>Review & Submit</h2>
          <p>Confirm your details and privacy preferences</p>
        </div>
      </div>

      <div className="review-section">
        <div className="review-header">
          <div className="review-icon">✓</div>
          <div>
            <h3>Review Your Case Details</h3>
            <p>Please review all information before submitting. You can go back to make changes if needed.</p>
          </div>
        </div>

        <div className="review-content">
          <div className="review-subsection">
            <div className="review-subsection-header">
              <h4>Personal Information</h4>
            </div>
            <div className="review-grid">
              <div className="review-column">
                <div className="review-item">
                  <span className="review-label">Full Name:</span>
                  <span className="review-value">
                    {formData.firstName || formData.lastName 
                      ? `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()
                      : 'Not provided'
                    }
                  </span>
                </div>
                <div className="review-item">
                  <span className="review-label">Gender:</span>
                  <span className="review-value">{formData.gender || 'Not specified'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Primary Phone:</span>
                  <span className="review-value">{formData.primaryPhone || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Address:</span>
                  <span className="review-value">
                    {formData.streetAddress || formData.city 
                      ? `${formData.streetAddress}, ${formData.city}, ${formData.state}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '')
                      : 'Not provided'
                    }
                  </span>
                </div>
              </div>
              <div className="review-column">
                <div className="review-item">
                  <span className="review-label">Date of Birth:</span>
                  <span className="review-value">{formData.dateOfBirth || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Nationality:</span>
                  <span className="review-value">{formData.nationality || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Email:</span>
                  <span className="review-value">{formData.email || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="review-subsection">
            <div className="review-subsection-header">
              <h4>Incident Details</h4>
            </div>
            <div className="review-grid">
              <div className="review-column">
                <div className="review-item">
                  <span className="review-label">Date & Time:</span>
                  <span className="review-value">
                    {formData.incidentDate || formData.incidentTime 
                      ? `${formData.incidentDate} ${formData.incidentTime}`.trim()
                      : 'Not provided'
                    }
                  </span>
                </div>
                <div className="review-item">
                  <span className="review-label">Communication Method:</span>
                  <span className="review-value">{formData.communicationMethod || 'Not specified'}</span>
                </div>
              </div>
              <div className="review-column">
                <div className="review-item">
                  <span className="review-label">Scam Type:</span>
                  <span className="review-badge">{formData.scamType || 'Not specified'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Amount Lost:</span>
                  <span className="review-badge">{formData.moneyLost || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="privacy-section">
        <h4>Privacy & Data Usage</h4>
        <ul>
          <li>Your case will be assigned a unique case ID for tracking purposes</li>
          <li>Personal information will be shared only with relevant authorities for investigation</li>
          <li>You will receive status updates via your registered email and phone number</li>
          <li>Case details may be anonymized and used for awareness and prevention purposes</li>
        </ul>
      </div>

      <div className="notice-section">
        <h4>Important Notice</h4>
        <ul>
          <li>Once submitted, you cannot edit your case details</li>
          <li>Ensure all information is accurate and complete</li>
          <li>False reporting is a criminal offense</li>
          <li>You may be contacted by authorities for additional information</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="register-page">
      <Header loggedIn={true} username={(getUser() && (getUser().name || getUser().username)) || 'User'} />

      <main className="register-main">
        <div className="back-link" onClick={() => navigate('/dashboard')}>
          <span className="back-icon">←</span>
          Back to Dashboard
        </div>

        <div className="page-header">
          <h1>Register New Case</h1>
          <p>Report a scam incident through our secure step-by-step process</p>
        </div>

        <div className="progress-section">
          <div className="progress-info">
            <span>Step {currentStep} of 3</span>
            <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
          
          {/* Step indicators with validation status */}
          <div className="step-indicators">
            <div className={`step-indicator ${currentStep === 1 ? 'active' : ''} ${Object.keys(formErrors).some(key => ['firstName', 'lastName', 'email', 'primaryPhone', 'aadhaarNumber', 'panNumber'].includes(key)) ? 'error' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Personal Info</span>
            </div>
            <div className={`step-indicator ${currentStep === 2 ? 'active' : ''} ${Object.keys(formErrors).some(key => ['incidentDate', 'scamType', 'incidentDescription', 'scammerName', 'scammerPhone', 'scammerEmail', 'moneyLost'].includes(key)) ? 'error' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Incident Details</span>
            </div>
            <div className={`step-indicator ${currentStep === 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Review & Submit</span>
            </div>
          </div>
        </div>

        <div className="form-container">
          {formErrors.submit && (
            <div className="form-error-banner">
              <span className="error-icon">⚠️</span>
              {formErrors.submit}
            </div>
          )}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        <div className="form-actions">
          {currentStep > 1 && (
            <button className="btn-secondary" onClick={prevStep}>
              <span className="btn-icon">←</span>
              Previous
            </button>
          )}
          {currentStep < 3 ? (
            <button className="btn-primary" onClick={nextStep}>
              Next Step
              <span className="btn-icon">→</span>
            </button>
          ) : (
            <button 
              type="button"
              className="btn-success" 
              onClick={() => { console.log('Submit button onClick'); submitCase(); }}
              disabled={isSubmitting}
            >
              <span className="btn-icon">{isSubmitting ? '⏳' : '✓'}</span>
              {isSubmitting ? 'Submitting...' : 'Submit Case'}
            </button>
          )}
        </div>

        <div className="help-section">
          <div className="help-content">
            <h3>Need Help?</h3>
            <p>
              Our case registration process is designed to be comprehensive yet easy to follow. 
              Take your time and provide as much detail as possible for better case handling.
            </p>
            <button className="help-btn">View Help Guide</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterCase;
  