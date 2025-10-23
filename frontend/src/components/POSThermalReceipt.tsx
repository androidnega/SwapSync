/**
 * POS Thermal Receipt Component
 * Styled like a real 80mm thermal printer receipt
 */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

interface POSReceiptItem {
  product_name: string;
  product_brand?: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
}

interface POSReceiptProps {
  transactionId: string;
  customerName: string;
  customerPhone: string;
  items: POSReceiptItem[];
  subtotal: number;
  overallDiscount: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  companyName: string;
  sellerName?: string;
  onClose: () => void;
  onPrint?: () => void;
  onResendSMS?: () => void;
}

const POSThermalReceipt: React.FC<POSReceiptProps> = ({
  transactionId,
  customerName,
  customerPhone,
  items,
  subtotal,
  overallDiscount,
  totalAmount,
  paymentMethod,
  createdAt,
  companyName,
  sellerName,
  onClose,
  onPrint,
  onResendSMS
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePrint = () => {
    window.print();
    if (onPrint) onPrint();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center print:hidden">
          <h3 className="text-lg font-bold text-gray-800">Receipt</h3>
          <div className="flex gap-2">
            {onResendSMS && (
              <button
                onClick={onResendSMS}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Resend SMS"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            )}
            <button
              onClick={handlePrint}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
              title="Print Receipt"
            >
              <FontAwesomeIcon icon={faPrint} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Thermal Receipt Design - Full width with proper margins */}
        <div className="px-6 py-4 bg-white font-mono text-sm w-full">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-1">{companyName}</h2>
            <div className="border-t border-b border-dashed border-gray-400 py-2 my-2">
              <p className="font-bold">SALES RECEIPT</p>
            </div>
          </div>

          {/* Transaction Info */}
          <div className="mb-4 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Receipt #:</span>
              <span className="font-bold text-sm">{transactionId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Date:</span>
              <span>{formatDate(createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Customer:</span>
              <span className="text-right max-w-[60%] break-words">{customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Phone:</span>
              <span>{customerPhone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Payment:</span>
              <span className="uppercase font-semibold">{paymentMethod}</span>
            </div>
            {sellerName && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Sold by:</span>
                <span className="font-bold text-blue-600">{sellerName}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 my-3"></div>

          {/* Items List */}
          <div className="mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 w-1/2">Item</th>
                  <th className="text-center py-2 w-1/6">Qty</th>
                  <th className="text-right py-2 w-1/6">Price</th>
                  <th className="text-right py-2 w-1/6">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td colSpan={4} className="pt-3 pb-1 font-semibold text-sm">
                        {item.product_name}
                        {item.product_brand && (
                          <span className="text-gray-600 font-normal"> ({item.product_brand})</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td></td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">₵{item.unit_price.toFixed(2)}</td>
                      <td className="text-right py-1 font-semibold">₵{item.subtotal.toFixed(2)}</td>
                    </tr>
                    {item.discount_amount > 0 && (
                      <tr>
                        <td colSpan={3} className="text-right text-xs text-red-600 py-1">
                          Item Discount:
                        </td>
                        <td className="text-right text-xs text-red-600 py-1">
                          -₵{item.discount_amount.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-dashed border-gray-400 my-3"></div>

          {/* Totals */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="font-medium">Subtotal:</span>
              <span className="font-semibold">₵{subtotal.toFixed(2)}</span>
            </div>
            {overallDiscount > 0 && (
              <div className="flex justify-between items-center text-red-600 py-1">
                <span className="font-medium">Overall Discount:</span>
                <span className="font-semibold">-₵{overallDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t-2 border-gray-400 pt-3 mt-3">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>TOTAL:</span>
                <span>₵{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-400 my-4"></div>

          {/* Footer */}
          <div className="text-center text-xs space-y-2">
            <p className="font-medium">Thank you for your purchase!</p>
            <p className="font-bold text-sm">{companyName}</p>
            <p className="text-xs text-gray-600 mt-4">Powered by SwapSync POS</p>
          </div>

          {/* Items Count */}
          <div className="text-center text-xs mt-4 pt-2 border-t border-dashed border-gray-300 text-gray-500">
            {items.length} item(s) | Total Qty: {items.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSThermalReceipt;

