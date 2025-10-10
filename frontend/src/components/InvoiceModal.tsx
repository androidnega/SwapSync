import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPrint, faDownload } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

interface InvoiceData {
  invoice_number: string;
  date: string;
  customer: {
    id: number;
    name: string;
    phone: string;
  };
  staff: {
    id: number | null;
    name: string | null;
  };
  transaction: {
    type: string;
    id: number;
  };
  pricing: {
    original_price: number;
    discount: number;
    cash_added: number;
    final_amount: number;
  };
  items: any;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, invoice }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(
        `/api/invoices/${invoice.invoice_number}/pdf`,
        { responseType: 'blob' }
      );
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Invoice / Receipt</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FontAwesomeIcon icon={faPrint} className="mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Download
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={printRef} className="p-8">
          {/* Company Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SwapSync</h1>
            <p className="text-gray-600">Phone Swapping & Repair Shop Management</p>
            <p className="text-sm text-gray-500 mt-1">Phone: +233 XXX XXX XXX | Email: info@swapsync.com</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Invoice To:</h3>
              <p className="font-semibold text-gray-900">{invoice.customer.name}</p>
              <p className="text-sm text-gray-600">Customer ID: #{invoice.customer.id}</p>
              <p className="text-sm text-gray-600">Phone: {invoice.customer.phone}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Invoice Details:</h3>
              <p className="font-semibold text-lg text-blue-600">{invoice.invoice_number}</p>
              <p className="text-sm text-gray-600">Date: {new Date(invoice.date).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Type: <span className="uppercase font-medium">{invoice.transaction.type}</span></p>
              {invoice.staff.name && (
                <p className="text-sm text-gray-600">Staff: {invoice.staff.name} (#{invoice.staff.id})</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.transaction.type === 'SWAP' && invoice.items.trade_in && (
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        Trade-In: {invoice.items.trade_in.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        GH₵{invoice.items.trade_in.value.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {invoice.transaction.type === 'SWAP' && invoice.items.new_phone && (
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        New Phone: {invoice.items.new_phone.brand} {invoice.items.new_phone.model}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        GH₵{invoice.items.new_phone.value.toFixed(2)}
                      </td>
                    </tr>
                  )}
                  {invoice.transaction.type === 'SALE' && invoice.items.phone && (
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {invoice.items.phone.brand} {invoice.items.phone.model} ({invoice.items.phone.condition})
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        GH₵{invoice.pricing.original_price.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Original Price:</span>
                <span className="font-medium">GH₵{invoice.pricing.original_price.toFixed(2)}</span>
              </div>
              
              {invoice.pricing.cash_added > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cash Added:</span>
                  <span className="font-medium">GH₵{invoice.pricing.cash_added.toFixed(2)}</span>
                </div>
              )}
              
              {invoice.pricing.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span className="font-medium">- GH₵{invoice.pricing.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-gray-300">
                <span>Total Amount:</span>
                <span className="text-green-600">GH₵{invoice.pricing.final_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Thank you for your business!</p>
            <p className="text-xs text-gray-500">
              This is a computer-generated invoice. For inquiries, contact us at support@swapsync.com
            </p>
            <p className="text-xs text-gray-400 mt-4">
              SwapSync - Phone Swapping & Repair Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;

