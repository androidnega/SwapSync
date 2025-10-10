import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface PendingResaleReceiptProps {
  swapData: {
    id: number;
    customer_name?: string;
    given_phone_description: string;
    given_phone_value: number;
    given_phone_imei?: string;
    created_at: string;
  };
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

const PendingResaleReceipt: React.FC<PendingResaleReceiptProps> = ({
  swapData,
  companyName = 'Your Shop',
  companyPhone,
  companyAddress
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Pending-Resale-${swapData.id}`,
  });

  return (
    <>
      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium text-xs transition-colors"
      >
        Print
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
          <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', backgroundColor: '#fff3cd', padding: '5px', borderRadius: '3px', border: '1px dashed #ffc107' }}>
            PENDING RESALE
          </div>

          {/* Receipt Info */}
          <div style={{ marginBottom: '10px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Swap ID:</span>
              <span style={{ fontWeight: 'bold' }}>SWAP-{String(swapData.id).padStart(4, '0')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Date:</span>
              <span>{formatDate(swapData.created_at)}</span>
            </div>
            {swapData.customer_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Customer:</span>
                <span>{swapData.customer_name}</span>
              </div>
            )}
          </div>

          {/* Trade-In Phone */}
          <div style={{ borderTop: '2px dashed #000', padding: '8px 0', marginBottom: '8px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              📲 Trade-In Phone (Pending Resale)
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '3px' }}>
                <span>Expected Value:</span>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>₵{swapData.given_phone_value.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{ borderTop: '2px solid #ffc107', paddingTop: '10px', marginTop: '15px', backgroundColor: '#fff9e6', padding: '8px', borderRadius: '3px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
              ⏳ AWAITING RESALE
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '10px', textAlign: 'center', color: '#666' }}>
              This phone is available for resale
            </p>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '11px', borderTop: '2px dashed #000', paddingTop: '10px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '10px' }}>Internal Use Only</p>
            <p style={{ margin: '0', fontSize: '10px', fontStyle: 'italic' }}>
              Print Date: {new Date().toLocaleString('en-GB')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PendingResaleReceipt;

