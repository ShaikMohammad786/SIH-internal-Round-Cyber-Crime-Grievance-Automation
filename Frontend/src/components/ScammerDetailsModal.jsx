import React, { useState, useEffect } from 'react';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import { X, AlertTriangle, Search, Save, User, Phone, Mail, CreditCard, MapPin, FileText } from 'lucide-react';

const ScammerDetailsModal = ({ caseId, isOpen, onClose, onScammerCreated }) => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    email: '',
    upiId: '',
    bankAccount: '',
    ifscCode: '',
    name: '',
    address: '',
    evidenceType: 'screenshot'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingScammer, setExistingScammer] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        phoneNumber: '',
        email: '',
        upiId: '',
        bankAccount: '',
        ifscCode: '',
        name: '',
        address: '',
        evidenceType: 'screenshot'
      });
      setError('');
      setExistingScammer(null);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phoneNumber && !formData.email && !formData.upiId && !formData.bankAccount) {
      setError('Please provide at least one contact method (phone, email, UPI, or bank account)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await userProfilesAPI.createScammer({
        ...formData,
        caseId: caseId
      });

      if (response.success) {
        alert('Scammer details saved successfully!');
        if (onScammerCreated) {
          onScammerCreated(response.scammerId);
        }
        onClose();
      } else {
        setError(response.message || 'Failed to save scammer details');
      }
    } catch (error) {
      setError(error.message || 'Failed to save scammer details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchExisting = async () => {
    if (!formData.phoneNumber && !formData.email && !formData.upiId && !formData.bankAccount) {
      setError('Please enter at least one detail to search');
      return;
    }

    try {
      setLoading(true);
      const query = formData.phoneNumber || formData.email || formData.upiId || formData.bankAccount;
      const response = await userProfilesAPI.searchScammers(query);
      
      if (response.success && response.scammers.length > 0) {
        setExistingScammer(response.scammers[0]);
        setFormData(prev => ({
          ...prev,
          name: response.scammers[0].name || '',
          address: response.scammers[0].address || ''
        }));
      } else {
        setExistingScammer(null);
        alert('No existing records found for this scammer.');
      }
    } catch (error) {
      console.error('Error searching scammers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-3xl flex-col bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
             <h2 className="text-lg font-bold text-slate-900">Collect Scammer Details</h2>
             <p className="text-sm text-slate-500">Enter known information about the suspect</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 max-h-[80vh]">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
               <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
               <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {existingScammer && (
            <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-200">
               <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Existing Scammer Found</h3>
               </div>
              <p className="text-sm text-amber-700">This scammer has been reported in <span className="font-bold">{existingScammer.totalCases}</span> other case(s).</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Info Section */}
            <div>
               <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Phone className="h-4 w-4" /> Contact Information
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                     <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                           type="tel"
                           name="phoneNumber"
                           value={formData.phoneNumber}
                           onChange={handleInputChange}
                           placeholder="+91 98765 43210"
                           className="block w-full rounded-md border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                           type="email"
                           name="email"
                           value={formData.email}
                           onChange={handleInputChange}
                           placeholder="scammer@example.com"
                           className="block w-full rounded-md border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">UPI ID</label>
                     <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                           type="text"
                           name="upiId"
                           value={formData.upiId}
                           onChange={handleInputChange}
                           placeholder="scammer@paytm"
                           className="block w-full rounded-md border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Bank Account</label>
                     <input
                        type="text"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleInputChange}
                        placeholder="1234567890"
                        className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
                     <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        placeholder="SBIN0001234"
                        className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                     />
                  </div>
               </div>
            </div>

            {/* Personal Details Section */}
            <div>
               <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="h-4 w-4" /> Personal Details
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Scammer Name</label>
                     <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Known name or alias"
                        className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Primary Evidence Type</label>
                     <div className="relative">
                        <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select
                           name="evidenceType"
                           value={formData.evidenceType}
                           onChange={handleInputChange}
                           className="block w-full rounded-md border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white"
                        >
                           <option value="screenshot">Screenshot</option>
                           <option value="bank_statement">Bank Statement</option>
                           <option value="call_recording">Call Recording</option>
                           <option value="email_evidence">Email Evidence</option>
                           <option value="upi_transaction">UPI Transaction</option>
                           <option value="other">Other</option>
                        </select>
                     </div>
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Address / Location</label>
                     <div className="relative">
                         <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                         <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Any known address or location details..."
                            rows="3"
                            className="block w-full rounded-md border-0 py-2 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 resize-none"
                         />
                     </div>
                  </div>
               </div>
            </div>
          </form>
        </div>

        <div className="border-t border-slate-200 p-6 bg-slate-50 flex items-center justify-end gap-3">
            <button
               type="button"
               onClick={handleSearchExisting}
               disabled={loading}
               className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
               <Search className="h-4 w-4" />
               {loading ? 'Searching...' : 'Search Existing'}
            </button>
            <button
               onClick={handleSubmit}
               disabled={loading}
               className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
               <Save className="h-4 w-4" />
               {loading ? 'Saving...' : 'Save Details'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScammerDetailsModal;
