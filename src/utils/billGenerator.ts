/**
 * Utility to generate a realistic signed FMCG delivery invoice / challan image
 * and trigger instant browser downloads for proof of delivery.
 */

export interface InvoiceData {
  tripId: string;
  stopSequence: number;
  shopCode: string;
  shopName: string;
  shopAddress: string;
  distributorName: string;
  distributorAddress?: string;
  itemsDescription: string;
  quantity: number;
  unitType: string;
  dateStr?: string;
  signeeName?: string;
}

export function generateSignedBillCanvas(data: InvoiceData): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - Off-white parchment invoice paper
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, 800, 1000);

  // Border & margins
  ctx.strokeStyle = '#2b394a';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, 740, 940);

  // Inner border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(38, 38, 724, 924);

  // Header banner
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(40, 40, 720, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FMCG WHOLESALE DELIVERY CHALLAN & TAX INVOICE', 400, 78);

  // Distributor Info (Top Left)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.fillText(data.distributorName || 'Sri Balaji FMCG Wholesalers', 55, 135);

  ctx.fillStyle = '#475569';
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  ctx.fillText(data.distributorAddress || 'Wholesale Godown #14, Begum Bazar, Hyderabad', 55, 155);
  ctx.fillText('GSTIN: 36AABCS1429K1Z5 • Phone: +91 98480 12345', 55, 172);

  // Invoice Details Box (Top Right)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(490, 115, 270, 75);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(490, 115, 270, 75);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`CHALLAN NO: CH-${data.tripId.replace('TRIP-', '')}-0${data.stopSequence}`, 505, 137);
  ctx.fillText(`TRIP ID: ${data.tripId}`, 505, 155);
  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`DATE: ${data.dateStr || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 505, 173);

  // Divider
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(55, 205);
  ctx.lineTo(745, 205);
  ctx.stroke();

  // Consignee / Retailer Box
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(55, 220, 690, 85);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(55, 220, 690, 85);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText('CONSIGNEE / KIRANA STORE DETAILS:', 70, 242);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.fillText(data.shopName, 70, 265);

  ctx.fillStyle = '#475569';
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${data.shopAddress} • UNIQUE CODE: ${data.shopCode}`, 70, 285);

  // Items Table Header
  const tableY = 325;
  ctx.fillStyle = '#334155';
  ctx.fillRect(55, tableY, 690, 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.fillText('SL', 70, tableY + 21);
  ctx.fillText('ITEM / CARGO DESCRIPTION', 115, tableY + 21);
  ctx.fillText('QTY', 520, tableY + 21);
  ctx.fillText('PACK UNIT', 585, tableY + 21);
  ctx.fillText('VERIFIED', 665, tableY + 21);

  // Items Rows
  const items = data.itemsDescription.split(/,|&|\+/).map(i => i.trim()).filter(Boolean);
  const rows = items.length > 0 ? items : [data.itemsDescription];

  let currentY = tableY + 32;
  rows.forEach((item, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(55, currentY, 690, 38);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(55, currentY, 690, 38);

    ctx.fillStyle = '#0f172a';
    ctx.font = '13px "Segoe UI", Arial, sans-serif';
    ctx.fillText(String(idx + 1), 72, currentY + 24);
    ctx.fillText(item, 115, currentY + 24);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    const splitQty = Math.max(1, Math.round(data.quantity / rows.length));
    ctx.fillText(`${splitQty}`, 525, currentY + 24);

    ctx.fillStyle = '#475569';
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.fillText(data.unitType, 590, currentY + 24);

    // Green checkmark
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.fillText('✔ OK', 670, currentY + 24);

    currentY += 38;
  });

  // Total Summary row
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(55, currentY, 690, 35);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(55, currentY, 690, 35);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText('TOTAL CONSIGNMENT LOAD:', 115, currentY + 23);
  ctx.fillText(`${data.quantity} ${data.unitType}`, 525, currentY + 23);
  ctx.fillStyle = '#059669';
  ctx.fillText('VERIFIED', 665, currentY + 23);

  currentY += 55;

  // Physical Goods Handover Declaration
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(55, currentY, 690, 65);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1;
  ctx.strokeRect(55, currentY, 690, 65);

  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.fillText('RECEIVER ACKNOWLEDGEMENT & DECLARATION:', 70, currentY + 22);

  ctx.fillStyle = '#78350f';
  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('I have received the above goods in good order and condition from the auto driver.', 70, currentY + 40);
  ctx.fillText('Count and package seal verified against wholesale delivery challan.', 70, currentY + 55);

  currentY += 95;

  // Blue Official Stamp Box (Hyderabad Retailer Stamp)
  ctx.save();
  ctx.translate(130, currentY + 40);
  ctx.rotate(-0.06);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-80, -35, 175, 70);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(data.shopCode, 7, -15);
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillText('GOODS RECEIVED', 7, 5);
  ctx.fillText('VERIFIED & CHECKED', 7, 22);
  ctx.restore();

  // Shopkeeper Signature Section (Blue Ballpoint Pen cursive simulation)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.fillText('SIGNATURE OF SHOPKEEPER:', 440, currentY);

  // Cursive Pen Signature
  ctx.save();
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  // Simulated cursive "Venkat Reddy" signature line
  ctx.moveTo(445, currentY + 38);
  ctx.bezierCurveTo(460, currentY + 15, 480, currentY + 45, 500, currentY + 28);
  ctx.bezierCurveTo(520, currentY + 12, 530, currentY + 40, 560, currentY + 30);
  ctx.bezierCurveTo(580, currentY + 10, 610, currentY + 35, 630, currentY + 22);
  ctx.bezierCurveTo(650, currentY + 10, 670, currentY + 40, 690, currentY + 25);
  ctx.stroke();

  // Signature underline loop
  ctx.beginPath();
  ctx.moveTo(440, currentY + 48);
  ctx.bezierCurveTo(530, currentY + 54, 620, currentY + 44, 700, currentY + 48);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'italic 16px "Georgia", serif';
  ctx.fillText(data.signeeName || 'Venkat Reddy', 485, currentY + 36);

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(440, currentY + 55);
  ctx.lineTo(720, currentY + 55);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`Authorized Receiver • ${data.shopName}`, 440, currentY + 70);
  ctx.fillText(`Signed Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 440, currentY + 86);

  // Footer Watermark
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Generated via DeliveryLink Hyderabad FMCG Logistics Portal • Official Electronic Proof of Delivery (e-PoD)', 400, 955);

  return canvas.toDataURL('image/png');
}

/**
 * Triggers clean browser download of any image or photograph URL
 */
export function downloadPhotograph(photoUrl: string, fileName: string) {
  if (!photoUrl) return;

  // If it's a data URL, download directly via anchor
  if (photoUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = fileName.endsWith('.png') || fileName.endsWith('.jpg') ? fileName : `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // If it's an external URL, fetch blob to avoid browser opening in new tab
  fetch(photoUrl)
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName.endsWith('.png') || fileName.endsWith('.jpg') ? fileName : `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      // Fallback direct link
      const link = document.createElement('a');
      link.href = photoUrl;
      link.target = '_blank';
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
}
