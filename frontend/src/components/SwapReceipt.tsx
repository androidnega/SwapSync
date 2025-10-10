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
          lineHeight: '1.3',
          backgroundColor: '#fff'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '2px dashed #000', paddingBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{companyName}</h2>
            {companyAddress && <p style={{ margin: '2px 0', fontSize: '9px' }}>{companyAddress}</p>}
            {companyPhone && <p style={{ margin: '2px 0', fontSize: '9px' }}>Tel: {companyPhone}</p>}
            <p style={{ margin: '4px 0 0 0', fontSize: '8px', fontStyle: 'italic' }}>Powered by SwapSync</p>
          </div>

          {/* Receipt Type */}
          <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#f0f0f0', padding: '5px', borderRadius: '3px' }}>
            PHONE SWAP RECEIPT
          </div>

          {/* Receipt Info */}
          <div style={{ marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Swap #:</span>
              <span style={{ fontWeight: 'bold' }}>SWAP-{String(swapData.id).padStart(4, '0')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Date:</span>
              <span>{formatDate(swapData.created_at)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Customer:</span>
              <span>{swapData.customer_name}</span>
            </div>
            {swapData.customer_phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Phone:</span>
                <span>{swapData.customer_phone}</span>
              </div>
            )}
            {swapData.served_by && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Served By:</span>
                <span>{swapData.served_by}</span>
              </div>
            )}
          </div>

          {/* Trade-In Phone */}
          <div style={{ borderTop: '2px dashed #000', padding: '8px 0', marginBottom: '8px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              📲 Trade-In Phone
            </h3>
            <div style={{ fontSize: '11px' }}>
              <div style={{ marginBottom: '3px' }}>
                <span style={{ fontWeight: 'bold' }}>{swapData.given_phone_description}</span>
              </div>
              {swapData.given_phone_imei && (
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '3px' }}>
                  IMEI: {swapData.given_phone_imei}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span>Trade-In Value:</span>
                <span style={{ fontWeight: 'bold' }}>₵{swapData.given_phone_value.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* New Phone */}
          <div style={{ borderTop: '2px dashed #000', padding: '8px 0', marginBottom: '8px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              📱 New Phone Received
            </h3>
            <div style={{ fontSize: '11px' }}>
              <div style={{ marginBottom: '3px' }}>
                <span style={{ fontWeight: 'bold' }}>{swapData.new_phone_description}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span>Phone Value:</span>
                <span style={{ fontWeight: 'bold' }}>₵{swapData.new_phone_value.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div style={{ borderTop: '2px solid #000', paddingTop: '10px', fontSize: '11px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold' }}>PAYMENT SUMMARY</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>New Phone Value:</span>
              <span>₵{swapData.new_phone_value.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#2e7d32' }}>
              <span>Trade-In Credit:</span>
              <span>-₵{swapData.given_phone_value.toFixed(2)}</span>
            </div>
            {swapData.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#d32f2f' }}>
                <span>Additional Discount:</span>
                <span>-₵{swapData.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '2px solid #000', fontSize: '13px', fontWeight: 'bold' }}>
              <span>BALANCE PAID:</span>
              <span>₵{swapData.balance_paid.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '11px', borderTop: '2px dashed #000', paddingTop: '10px' }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Thank you for your swap!</p>
            <p style={{ margin: '0', fontSize: '10px' }}>Please keep this receipt for your records</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '10px', fontStyle: 'italic' }}>
              Trade-in phones cannot be returned
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwapReceipt;

