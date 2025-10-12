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

  const subtotal = saleData.quantity * saleData.unit_price;
  const tax = 0; // Add tax calculation if needed
  const grandTotal = saleData.total_amount;

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

          {/* Receipt Info - Date and Receipt Number */}
          <div style={{ fontSize: '9px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Date:</span>
              <span>{formatDate(saleData.created_at)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Receipt #:</span>
              <span style={{ fontWeight: 'bold' }}>SALE-{String(saleData.id).padStart(4, '0')}</span>
            </div>
            {saleData.served_by && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Cashier:</span>
                <span>{saleData.served_by}</span>
              </div>
            )}
            {saleData.customer_name && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Customer:</span>
                  <span>{saleData.customer_name}</span>
                </div>
                {saleData.customer_phone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Phone:</span>
                    <span>{saleData.customer_phone}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Items Table Header */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50% 15% 17% 18%',
              fontSize: '9px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              <div style={{ textAlign: 'left' }}>ITEM</div>
              <div style={{ textAlign: 'center' }}>QTY</div>
              <div style={{ textAlign: 'right' }}>PRICE</div>
              <div style={{ textAlign: 'right' }}>TOTAL</div>
            </div>

            {/* Item Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50% 15% 17% 18%',
              fontSize: '10px',
              marginBottom: '2px',
              alignItems: 'start'
            }}>
              <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
                <div style={{ fontWeight: 'bold' }}>{saleData.product_name}</div>
                {saleData.product_brand && (
                  <div style={{ fontSize: '8px', color: '#555' }}>
                    {saleData.product_brand}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>{saleData.quantity}</div>
              <div style={{ textAlign: 'right' }}>₵{saleData.unit_price.toFixed(2)}</div>
              <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                ₵{(saleData.quantity * saleData.unit_price).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Subtotal, Discount, Tax, Total */}
          <div style={{ fontSize: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span>Subtotal:</span>
              <span>₵{subtotal.toFixed(2)}</span>
            </div>
            {saleData.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Discount:</span>
                <span>-₵{saleData.discount_amount.toFixed(2)}</span>
              </div>
            )}
            {tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Tax:</span>
                <span>₵{tax.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Separator Line */}
          <div style={{ 
            borderTop: '1px solid #000', 
            margin: '8px 0' 
          }} />

          {/* Grand Total - Bold and Right Aligned */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 'bold',
            marginBottom: '10px',
            paddingTop: '4px'
          }}>
            <span>TOTAL:</span>
            <span>₵{grandTotal.toFixed(2)}</span>
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
              Goods sold are not returnable
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SaleReceipt;
