import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface SwapReceiptProps {
  swapData: {
    id: number;
    customer_name: string;
    customer_phone?: string;
    given_phone_description: string;
    given_phone_value: number;
    given_phone_imei?: string;
    new_phone_description: string;
    new_phone_value: number;
    balance_paid: number;
    discount_amount: number;
    total_transaction_value: number;
    created_at: string;
    served_by?: string;
  };
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

const SwapReceipt: React.FC<SwapReceiptProps> = ({
  swapData,
  companyName = 'Your Shop',
  companyPhone,
  companyAddress
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Swap-Receipt-${swapData.id}`,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
      >
        <span>🖨️</span>
        Print Receipt
      </button>

      {/* Hidden Receipt for Printing */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={receiptRef} style={{
          width: '58mm',
          padding: '5mm',
          fontFamily: 'monospace',
          fontSize: '11px',
          lineHeight: '1.4',
          backgroundColor: '#fff',
          color: '#000'
        }}>
          {/* Header - Centered */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '3px' }}>
              {companyName}
            </div>
            {companyAddress && (
              <div style={{ fontSize: '9px', marginBottom: '2px' }}>
                {companyAddress}
              </div>
            )}
            {companyPhone && (
              <div style={{ fontSize: '9px', marginBottom: '2px' }}>
                Tel: {companyPhone}
              </div>
            )}
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Receipt Type */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: '11px', 
            fontWeight: 'bold', 
            marginBottom: '8px' 
          }}>
            PHONE SWAP RECEIPT
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Receipt Info */}
          <div style={{ fontSize: '9px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Date:</span>
              <span>{formatDate(swapData.created_at)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Swap #:</span>
              <span style={{ fontWeight: 'bold' }}>SWAP-{String(swapData.id).padStart(4, '0')}</span>
            </div>
            {swapData.served_by && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Cashier:</span>
                <span>{swapData.served_by}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Customer:</span>
              <span>{swapData.customer_name}</span>
            </div>
            {swapData.customer_phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Phone:</span>
                <span>{swapData.customer_phone}</span>
              </div>
            )}
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Trade-In Phone */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
              TRADE-IN PHONE
            </div>
            <div style={{ fontSize: '10px', marginBottom: '3px' }}>
              {swapData.given_phone_description}
            </div>
            {swapData.given_phone_imei && (
              <div style={{ fontSize: '8px', color: '#555', marginBottom: '3px' }}>
                IMEI: {swapData.given_phone_imei}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px' }}>
              <span>Trade-In Credit:</span>
              <span style={{ fontWeight: 'bold' }}>₵{swapData.given_phone_value.toFixed(2)}</span>
            </div>
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* New Phone */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
              NEW PHONE RECEIVED
            </div>
            <div style={{ fontSize: '10px', marginBottom: '3px' }}>
              {swapData.new_phone_description}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px' }}>
              <span>Phone Value:</span>
              <span style={{ fontWeight: 'bold' }}>₵{swapData.new_phone_value.toFixed(2)}</span>
            </div>
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Payment Summary */}
          <div style={{ fontSize: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>New Phone Value:</span>
              <span>₵{swapData.new_phone_value.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Trade-In Credit:</span>
              <span>-₵{swapData.given_phone_value.toFixed(2)}</span>
            </div>
            {swapData.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Discount:</span>
                <span>-₵{swapData.discount_amount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Balance Paid - Bold and Right Aligned */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 'bold',
            marginBottom: '10px',
            paddingTop: '4px'
          }}>
            <span>BALANCE PAID:</span>
            <span>₵{swapData.balance_paid.toFixed(2)}</span>
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Footer - Centered */}
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '9px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
              Thank you for your purchase!
            </div>
            <div style={{ marginBottom: '3px', fontSize: '8px' }}>
              Please keep this receipt for your records
            </div>
            <div style={{ fontSize: '8px', fontStyle: 'italic' }}>
              Trade-in phones cannot be returned
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SwapReceipt;
