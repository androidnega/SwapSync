import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

interface SaleReceiptProps {
  saleData: {
    id: number;
    product_name: string;
    product_brand?: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_amount: number;
    customer_name?: string;
    customer_phone?: string;
    created_at: string;
    served_by?: string;
  };
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

const SaleReceipt: React.FC<SaleReceiptProps> = ({
  saleData,
  companyName = 'Your Shop',
  companyPhone,
  companyAddress
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${saleData.id}`,
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
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2"
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
          <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '2px dashed #000', paddingBottom: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{companyName}</h2>
            {companyAddress && <p style={{ margin: '2px 0', fontSize: '9px' }}>{companyAddress}</p>}
            {companyPhone && <p style={{ margin: '2px 0', fontSize: '9px' }}>Tel: {companyPhone}</p>}
            <p style={{ margin: '4px 0 0 0', fontSize: '8px', fontStyle: 'italic' }}>Powered by SwapSync</p>
          </div>

          {/* Receipt Info */}
          <div style={{ marginBottom: '8px', fontSize: '9px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Receipt:</span>
              <span style={{ fontWeight: 'bold' }}>SALE-{String(saleData.id).padStart(4, '0')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Date:</span>
              <span>{formatDate(saleData.created_at)}</span>
            </div>
            {saleData.customer_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Customer:</span>
                <span>{saleData.customer_name}</span>
              </div>
            )}
            {saleData.customer_phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Phone:</span>
                <span>{saleData.customer_phone}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '8px 0' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 'bold' }}>ITEMS</h3>
            
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px', fontSize: '11px' }}>
                {saleData.product_name}
              </div>
              <div style={{ fontSize: '9px', color: '#666', marginBottom: '3px' }}>
                Product ID: PROD-{String(saleData.id).padStart(4, '0')}
              </div>
              {saleData.product_brand && (
                <div style={{ fontSize: '9px', color: '#666', marginBottom: '3px' }}>
                  Brand: {saleData.product_brand}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '5px' }}>
                <span>{saleData.quantity} x ₵{saleData.unit_price.toFixed(2)}</span>
                <span style={{ fontWeight: 'bold' }}>₵{(saleData.quantity * saleData.unit_price).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div style={{ marginTop: '8px', fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Subtotal:</span>
              <span>₵{(saleData.quantity * saleData.unit_price).toFixed(2)}</span>
            </div>
            {saleData.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#d32f2f' }}>
                <span>Discount:</span>
                <span>-₵{saleData.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '2px solid #000', fontSize: '12px', fontWeight: 'bold' }}>
              <span>TOTAL:</span>
              <span>₵{saleData.total_amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '9px', borderTop: '2px dashed #000', paddingTop: '8px' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '10px' }}>Thank you for your purchase!</p>
            <p style={{ margin: '0 0 6px 0', fontSize: '8px' }}>Please keep this receipt for your records</p>
            <p style={{ margin: '0', fontSize: '8px', fontStyle: 'italic' }}>
              Goods sold are not returnable
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SaleReceipt;

