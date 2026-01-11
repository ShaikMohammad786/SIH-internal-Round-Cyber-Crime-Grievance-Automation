import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userProfilesAPI } from "../utils/userProfilesAPI";
import { caseFlowAPI, createCompleteCaseData } from "../utils/caseFlowAPI";
import { addActivityHistory, getUser } from "../utils/auth";
import FormInput from "../components/FormInput";
import Header from "../components/Header";
import { 
  User, MapPin, Calendar, FileText, Upload, Trash2, 
  Check, AlertTriangle, ShieldAlert, ArrowRight, ArrowLeft,
  Briefcase, Mail, Smartphone, Globe
} from "lucide-react";

const RegisterCase = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user && user.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "",
    dateOfBirth: "", gender: "", nationality: "",
    aadhaarNumber: "", panNumber: "", otherGovernmentIds: "",
    primaryPhone: "", alternatePhone: "", email: "",
    streetAddress: "", city: "", state: "", postalCode: "", country: "",
    incidentDate: "", incidentTime: "", scamType: "",
    incidentDescription: "", communicationMethod: "",
    scammerName: "", scammerPhone: "", scammerEmail: "",
    scammerWebsite: "", scammerBankAccount: "",
    moneyLost: "", sensitiveInfoShared: "", actionsTaken: "",
    evidenceFiles: []
  });

  const handleInputChange = (arg1, arg2) => {
    let fieldName, fieldValue;
    if (typeof arg1 === 'string') {
      fieldName = arg1; fieldValue = arg2;
    } else if (arg1?.target) {
      fieldName = arg1.target.name; fieldValue = arg1.target.value;
    }
    if (fieldName === undefined) return;

    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
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

  const validateStep1 = (data) => {
    const errors = [];
    if (!data.firstName?.trim()) errors.push('First name is required');
    if (!data.lastName?.trim()) errors.push('Last name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.primaryPhone?.trim()) errors.push('Primary phone is required');
    return { isValid: errors.length === 0, errors };
  };

  const validateStep2 = (data) => {
    const errors = [];
    if (!data.incidentDate) errors.push('Incident date is required');
    if (!data.scamType) errors.push('Scam type is required');
    if (!data.incidentDescription?.trim()) errors.push('Incident description is required');
    return { isValid: errors.length === 0, errors };
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const step1Validation = validateStep1(formData);
      if (!step1Validation.isValid) {
        const errors = {};
        step1Validation.errors.forEach(error => {
          if (error.includes('First name')) errors.firstName = error;
          else if (error.includes('Last name')) errors.lastName = error;
          else if (error.includes('Email')) errors.email = error;
          else if (error.includes('Primary phone')) errors.primaryPhone = error;
        });
        setFormErrors(errors);
        return;
      }
    } else if (currentStep === 2) {
      const step2Validation = validateStep2(formData);
      if (!step2Validation.isValid) {
        const errors = {};
        step2Validation.errors.forEach(error => {
          if (error.includes('Incident date')) errors.incidentDate = error;
          else if (error.includes('Scam type')) errors.scamType = error;
          else if (error.includes('Incident description')) errors.incidentDescription = error;
        });
        setFormErrors(errors);
        return;
      }
    }
    setFormErrors({});
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const submitCase = async () => {
    setIsSubmitting(true);
    try {
      // comprehensive validation before submission
      const errors = {};
      
      // Step 1: Personal Info
      if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) errors.gender = 'Gender is required';
      if (!formData.nationality?.trim()) errors.nationality = 'Nationality is required';
      if (!formData.aadhaarNumber?.trim()) errors.aadhaarNumber = 'Aadhaar number is required';
      if (!formData.primaryPhone?.trim()) errors.primaryPhone = 'Phone number is required';
      if (!formData.email?.trim()) errors.email = 'Email is required';
      if (!formData.streetAddress?.trim()) errors.streetAddress = 'Address is required';
      if (!formData.city?.trim()) errors.city = 'City is required';
      if (!formData.state?.trim()) errors.state = 'State is required';
      if (!formData.postalCode?.trim()) errors.postalCode = 'Pincode is required';
      if (!formData.country?.trim()) errors.country = 'Country is required';

      // Step 2: Incident Info
      if (!formData.incidentDate) errors.incidentDate = 'Incident date is required';
      if (!formData.incidentTime) errors.incidentTime = 'Incident time is required';
      if (!formData.scamType) errors.scamType = 'Scam type is required';
      if (!formData.communicationMethod) errors.communicationMethod = 'Communication method is required';
      if (!formData.incidentDescription?.trim()) errors.incidentDescription = 'Incident description is required';

      // Scammer Info (Optional by UI, but if partially filled, validate?) 
      // Current UI label says "Optional". We won't block submission for scammer details or money lost.
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        
        // Find the first error field to scroll to or determining which step to go back to
        const step1Fields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'nationality', 'aadhaarNumber', 'primaryPhone', 'email', 'streetAddress', 'city', 'state', 'postalCode', 'country'];
        const hasStep1Error = Object.keys(errors).some(key => step1Fields.includes(key));
        
        if (hasStep1Error) {
          setCurrentStep(1);
          alert('Please fix errors in Step 1');
        } else {
          setCurrentStep(2); // Assume incident details error
          alert('Please fix errors in Step 2');
        }
        
        setIsSubmitting(false);
        return;
      }

      // Convert files to base64 properly
      const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            data: reader.result,
            uploadedAt: new Date().toISOString()
          });
          reader.onerror = error => reject(error);
        });
      };

      const processedFiles = await Promise.all(formData.evidenceFiles.map(fileToBase64));
      
      const submissionData = {
        ...formData,
        evidenceFiles: processedFiles
      };

      const completeCaseData = createCompleteCaseData(submissionData);
      const response = await caseFlowAPI.submitCase(completeCaseData);
      
      if (response.success) {
        const user = getUser();
        if (user) {
          addActivityHistory(user.id, {
            action: 'case_created_complete_flow',
            details: `Created case ${response.case.caseId} with complete automated flow`,
            page: '/register-case'
          });
        }
        navigate('/dashboard', { 
          state: { 
            message: '🎉 Case submitted successfully! Complete automated flow has started.',
            caseId: response.case.caseId,
            flowStarted: true
          } 
        });
      }
    } catch (error) {
      console.error('Failed to submit case:', error);
      // specific error for submit button area or general alert
      alert('Failed to submit case: ' + (error.message || 'Unknown error'));
      setFormErrors({ submit: 'Failed to submit case: ' + error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">File a Complaint</h1>
          <p className="mt-2 text-lg text-slate-600">Provide details about the incident to start an investigation</p>
        </div>

        {/* Improved Step Indicators */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {[
              { id: 1, label: 'Victim Details', icon: User },
              { id: 2, label: 'Incident Details', icon: ShieldAlert },
              { id: 3, label: 'Review & Submit', icon: Check }
            ].map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="relative flex flex-col items-center group">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.id 
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className={`absolute -bottom-8 w-32 text-center text-sm font-medium transition-colors duration-300 ${
                    currentStep >= step.id ? 'text-indigo-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`h-1 flex-1 rounded-full mx-4 transition-all duration-500 ${
                    currentStep > index + 1 ? 'bg-indigo-600' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-semibold text-slate-900">Personal Information</h2>
                <p className="text-sm text-slate-500">Please provide your identification and contact details</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormInput name="firstName" label="First Name" value={formData.firstName} onChange={handleInputChange} required error={formErrors.firstName} />
                <FormInput name="middleName" label="Middle Name" value={formData.middleName} onChange={handleInputChange} error={formErrors.middleName} />
                <FormInput name="lastName" label="Last Name" value={formData.lastName} onChange={handleInputChange} required error={formErrors.lastName} />
                
                <FormInput name="dateOfBirth" label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={handleInputChange} required error={formErrors.dateOfBirth} />
                <FormInput name="gender" label="Gender" type="select" value={formData.gender} onChange={handleInputChange} required error={formErrors.gender} options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]} />
                <FormInput name="nationality" label="Nationality" value={formData.nationality} onChange={handleInputChange} required error={formErrors.nationality} />
                
                <FormInput name="aadhaarNumber" label="Aadhaar Number" value={formData.aadhaarNumber} onChange={handleInputChange} required error={formErrors.aadhaarNumber} icon={<FileText className="h-4 w-4"/>} />
                <FormInput name="panNumber" label="PAN Number" value={formData.panNumber} onChange={handleInputChange} error={formErrors.panNumber} icon={<FileText className="h-4 w-4"/>} />
                <FormInput name="otherGovernmentIds" label="Other Govt IDs" value={formData.otherGovernmentIds} onChange={handleInputChange} error={formErrors.otherGovernmentIds} />
              </div>

              <div className="border-b border-slate-100 pb-4 pt-4">
                <h3 className="text-lg font-medium text-slate-900">Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <FormInput name="primaryPhone" label="Primary Phone" value={formData.primaryPhone} onChange={handleInputChange} required error={formErrors.primaryPhone} icon={<Smartphone className="h-4 w-4"/>} />
                <FormInput name="alternatePhone" label="Alternate Phone" value={formData.alternatePhone} onChange={handleInputChange} error={formErrors.alternatePhone} icon={<Smartphone className="h-4 w-4"/>} />
                <FormInput name="email" label="Email Address" type="email" value={formData.email} onChange={handleInputChange} required error={formErrors.email} className="lg:col-span-1" icon={<Mail className="h-4 w-4"/>} />
                
                <FormInput name="streetAddress" label="Street Address" value={formData.streetAddress} onChange={handleInputChange} required error={formErrors.streetAddress} className="md:col-span-2 lg:col-span-3" icon={<MapPin className="h-4 w-4"/>} />
                
                <FormInput name="city" label="City" value={formData.city} onChange={handleInputChange} required error={formErrors.city} />
                <FormInput name="state" label="State" value={formData.state} onChange={handleInputChange} required error={formErrors.state} />
                <FormInput name="postalCode" label="Pincode" value={formData.postalCode} onChange={handleInputChange} required error={formErrors.postalCode} />
                <FormInput name="country" label="Country" value={formData.country} onChange={handleInputChange} required error={formErrors.country} />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-semibold text-slate-900">Incident Details</h2>
                <p className="text-sm text-slate-500">Tell us what happened and provide any evidence</p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormInput name="incidentDate" label="Date of Incident" type="date" value={formData.incidentDate} onChange={handleInputChange} required error={formErrors.incidentDate} />
                <FormInput name="incidentTime" label="Time of Incident" type="time" value={formData.incidentTime} onChange={handleInputChange} required error={formErrors.incidentTime} />
                
                <FormInput name="scamType" label="Type of Scam" type="select" value={formData.scamType} onChange={handleInputChange} required error={formErrors.scamType} 
                  options={[
                    { value: 'upi-fraud', label: 'UPI Fraud' },
                    { value: 'investment-scam', label: 'Investment Scam' },
                    { value: 'phishing', label: 'Phishing' },
                    { value: 'fake-calls', label: 'Fake Calls' },
                    { value: 'job-scam', label: 'Job Scam' },
                    { value: 'other', label: 'Other' }
                  ]} 
                />
                
                <FormInput name="communicationMethod" label="Communication Method" type="select" value={formData.communicationMethod} onChange={handleInputChange} required error={formErrors.communicationMethod}
                  options={[
                    { value: 'phone-call', label: 'Phone Call' },
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'email', label: 'Email' },
                    { value: 'website', label: 'Website' },
                    { value: 'other', label: 'Other' }
                  ]}
                />

                <div className="md:col-span-2">
                  <FormInput name="incidentDescription" label="Description of Incident" type="textarea" value={formData.incidentDescription} onChange={handleInputChange} required error={formErrors.incidentDescription} placeholder="Describe exactly what happened..." />
                </div>
              </div>

              <div className="border-b border-slate-100 pb-4 pt-4">
                <h3 className="text-lg font-medium text-slate-900">Scammer Details (Optional)</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormInput name="scammerName" label="Scammer Name" value={formData.scammerName} onChange={handleInputChange} error={formErrors.scammerName} />
                <FormInput name="scammerPhone" label="Scammer Phone" value={formData.scammerPhone} onChange={handleInputChange} error={formErrors.scammerPhone} />
                <FormInput name="scammerEmail" label="Scammer Email" value={formData.scammerEmail} onChange={handleInputChange} error={formErrors.scammerEmail} />
                <FormInput name="moneyLost" label="Amount Lost (₹)" value={formData.moneyLost} onChange={handleInputChange} error={formErrors.moneyLost} placeholder="0.00" />
                <FormInput name="scammerWebsite" label="Scammer Website" value={formData.scammerWebsite} onChange={handleInputChange} error={formErrors.scammerWebsite} className="md:col-span-2" icon={<Globe className="h-4 w-4"/>} />
              </div>

              <div className="border-b border-slate-100 pb-4 pt-4">
                <h3 className="text-lg font-medium text-slate-900">Evidence Upload</h3>
              </div>

              <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-colors hover:border-indigo-400 hover:bg-slate-100">
                <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="flex cursor-pointer flex-col items-center justify-center">
                  <Upload className="mb-3 h-10 w-10 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">Click to upload or drag and drop</span>
                  <span className="mt-1 text-xs text-slate-500">Images, PDFs, Audio, Video (Max 10MB)</span>
                </label>
              </div>

              {formData.evidenceFiles.length > 0 && (
                <div className="space-y-2">
                  {formData.evidenceFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(idx)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-semibold text-slate-900">Review & Submit</h2>
                <p className="text-sm text-slate-500">Please verify all details before submitting</p>
              </div>

              <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Legal Declaration</h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      By submitting this form, you declare that the information provided is true and accurate to the best of your knowledge. 
                      Filing a false complaint is a punishable offense.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-6">
                  <h3 className="mb-4 font-medium text-slate-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-500" /> Personal Details
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Name</dt><dd className="col-span-2 font-medium text-slate-900">{formData.firstName} {formData.lastName}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Phone</dt><dd className="col-span-2 text-slate-900">{formData.primaryPhone}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Email</dt><dd className="col-span-2 text-slate-900">{formData.email}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Address</dt><dd className="col-span-2 text-slate-900">{formData.city}, {formData.state}</dd></div>
                  </dl>
                </div>

                <div className="rounded-xl bg-slate-50 p-6">
                  <h3 className="mb-4 font-medium text-slate-900 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-500" /> Case Details
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Date</dt><dd className="col-span-2 font-medium text-slate-900">{formData.incidentDate}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Type</dt><dd className="col-span-2 text-slate-900 capitalize">{formData.scamType?.replace('-', ' ')}</dd></div>
                    <div className="grid grid-cols-3"><dt className="text-slate-500">Amount</dt><dd className="col-span-2 font-medium text-emerald-600">{formData.moneyLost ? `₹${formData.moneyLost}` : 'N/A'}</dd></div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            {currentStep > 1 ? (
              <button 
                onClick={prevStep}
                className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 3 ? (
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                type="button"
              >
                Next Step <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button 
                onClick={submitCase}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'} <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterCase;