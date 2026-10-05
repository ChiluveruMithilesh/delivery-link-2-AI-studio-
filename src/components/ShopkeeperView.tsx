import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UnitType, TripStop } from '../types';
import { GoogleMapView } from './GoogleMapView';
import { generateSignedBillCanvas, downloadPhotograph } from '../utils/billGenerator';
import {
  Store,
  KeyRound,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  Package,
  Compass,
  UploadCloud,
  FileText,
  Camera,
  Download,
  Lock,
  Unlock,
  Eye,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';

export const ShopkeeperView: React.FC = () => {
  const { currentUser, trips, orders, createOrderRequest, updateStopStatus, uploadSignedBillPhoto, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'track' | 'order' | 'history'>('track');

  // Form for ordering stock
  const [itemsDescription, setItemsDescription] = useState('Parle-G 100g (10 cartons) & Tata Salt 1kg (5 bags)');
  const [quantity, setQuantity] = useState(15);
  const [unitType, setUnitType] = useState<UnitType>('cartons');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'same_day'>('urgent');

  // Interactive Checklist State for physical items verification
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [billSignedConfirmed, setBillSignedConfirmed] = useState(false);

  // Uploaded photo state (data URL or file)
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Selected stop override (for demo switching between stops if desired)
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find trips relevant to this shopkeeper
  // Check active in-progress or assigned trips
  const candidateTrips = trips.filter(
    (t) => t.status === 'in_progress' || t.status === 'assigned' || t.status === 'completed'
  );

  // Preferred trip: the in_progress one first, or any with pending/arrived stops
  const activeTrip =
    candidateTrips.find((t) => t.status === 'in_progress') ||
    candidateTrips.find((t) => t.status === 'assigned') ||
    candidateTrips[0];

  // List of all stops in active trip
  const allStopsInTrip = activeTrip?.stops || [];

  // Determine current stop
  let myStop: TripStop | undefined;
  if (selectedStopId && activeTrip) {
    myStop = activeTrip.stops.find((s) => s.id === selectedStopId);
  }
  if (!myStop && activeTrip) {
    // Look for stop matching user code or first non-delivered stop
    myStop =
      activeTrip.stops.find((s) => s.shopkeeperCode === currentUser.userCode) ||
      activeTrip.stops.find((s) => s.status === 'arrived') ||
      activeTrip.stops.find((s) => s.status === 'en_route') ||
      activeTrip.stops.find((s) => s.status !== 'delivered') ||
      activeTrip.stops[0];
  }

  // Parse individual items from description for checklist
  const parsedItems = myStop?.itemsDescription
    ? myStop.itemsDescription.split(/,|&|\+/).map((item) => item.trim()).filter(Boolean)
    : [`${myStop?.quantity || 1} ${myStop?.unitType || 'boxes'} FMCG Stock`];

  const allItemsChecked =
    parsedItems.length > 0 &&
    parsedItems.every((item) => checkedItems[item] === true);

  // Handle checking/unchecking items
  const toggleItemCheck = (item: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleCheckAllItems = () => {
    const updated: { [key: string]: boolean } = {};
    parsedItems.forEach((it) => {
      updated[it] = true;
    });
    setCheckedItems(updated);
    setBillSignedConfirmed(true);
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPhotoUrl(reader.result as string);
      setUploadedFileName(file.name);
      showToast(`Selected photograph: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Instant sample signed bill generator (for fast testing without hunting for an image)
  const handleGenerateSampleSignedBill = () => {
    if (!myStop || !activeTrip) return;
    const sampleUrl = generateSignedBillCanvas({
      tripId: activeTrip.id,
      stopSequence: myStop.sequenceNumber,
      shopCode: myStop.shopkeeperCode,
      shopName: myStop.shopName,
      shopAddress: myStop.address,
      distributorName: activeTrip.distributorName,
      distributorAddress: activeTrip.pickupAddress,
      itemsDescription: myStop.itemsDescription || `${myStop.quantity} ${myStop.unitType}`,
      quantity: myStop.quantity,
      unitType: myStop.unitType,
      signeeName: currentUser.fullName || 'Venkat Reddy',
    });

    setUploadedPhotoUrl(sampleUrl);
    setUploadedFileName(`Signed_Bill_${myStop.shopkeeperCode}_${activeTrip.id}.png`);
    setBillSignedConfirmed(true);
    handleCheckAllItems();
    showToast('Generated realistic signed delivery bill photograph!');
  };

  // Submit signed bill to distributor and trigger OTP generation
  const handleUploadAndGenerateOtp = () => {
    if (!activeTrip || !myStop) return;
    if (!uploadedPhotoUrl) {
      showToast('Please take or upload a photograph of the signed bill first.');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      uploadSignedBillPhoto(activeTrip.id, myStop.id, uploadedPhotoUrl, uploadedFileName);
      setIsUploading(false);
    }, 400);
  };

  const handleSimulateArrival = () => {
    if (!activeTrip || !myStop) return;
    updateStopStatus(activeTrip.id, myStop.id, 'arrived');
    showToast(`Driver marked as Arrived at ${myStop.shopName}!`);
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    showToast('OTP copied to clipboard!');
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderRequest({
      distributorId: 'user-dist-1',
      distributorName: 'Sri Balaji FMCG Wholesalers',
      itemsDescription,
      quantity: Number(quantity),
      unitType,
      urgency,
    });
    setActiveTab('history');
  };

  const myOrders = orders.filter((o) => o.shopkeeperId === currentUser.id || true);

  // Workflow progress calculation for current stop
  const isDriverArrived = myStop ? myStop.status === 'arrived' || myStop.status === 'delivered' : false;
  const isSignedBillUploaded = Boolean(myStop?.signedBillPhotoUrl || myStop?.otpGenerated);
  const isDeliveryCompleted = myStop?.status === 'delivered';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">
                  {currentUser.businessName || 'Sri Krishna Kirana & General Store'}
                </h1>
                <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded border border-emerald-300">
                  Code: {currentUser.userCode || 'SHP-101'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  Verified Retailer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Owner: {currentUser.fullName} • Phone: {currentUser.phone} • Hyderabad FMCG Network
              </p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                💡 Standard Protocol: When auto driver arrives, check items against bill, sign the physical bill, and upload the photograph to generate your Handover OTP.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('order')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Request Stock Replenishment</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('track')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'track'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Live Inbound Delivery & Proof</span>
          {activeTrip && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'order'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Send Order Request
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Stock Orders & Invoices ({myOrders.length})
        </button>
      </div>

      {/* TAB 1: LIVE INBOUND DELIVERY TRACKING, SIGNED BILL UPLOAD & OTP */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {activeTrip && myStop ? (
            <>
              {/* Delivery Stop Selector (if multiple stops in trip) */}
              {allStopsInTrip.length > 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-700">Active Delivery Route ({activeTrip.id}):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {allStopsInTrip.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStopId(st.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          (myStop?.id === st.id)
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Stop #{st.sequenceNumber}: {st.shopkeeperCode} ({st.status})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4-Step Visual Workflow Progress Bar */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Mandatory Delivery Protocol (Anti-Tamper Flow)
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Trip {activeTrip.id} • Stop #{myStop.sequenceNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Step 1 */}
                  <div
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isDriverArrived
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50/80 border-amber-300 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Step 1</span>
                      {isDriverArrived ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      )}
                    </div>
                    <div className="text-xs font-bold">Auto Driver Arrives</div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {isDriverArrived ? 'Driver arrived with bill' : 'Driver en route to shop'}
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSignedBillUploaded || (allItemsChecked && billSignedConfirmed)
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                        : isDriverArrived
                        ? 'bg-blue-50/80 border-blue-300 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Step 2</span>
                      {isSignedBillUploaded || (allItemsChecked && billSignedConfirmed) ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="text-xs font-bold">Check Items & Sign Bill</div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Verify boxes & sign paper bill
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSignedBillUploaded
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                        : isDriverArrived
                        ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Step 3</span>
                      {isSignedBillUploaded ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <UploadCloud className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="text-xs font-bold">Upload Signed Bill Photo</div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {isSignedBillUploaded ? 'Photo sent to distributor' : 'Upload proof before OTP'}
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isDeliveryCompleted
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                        : isSignedBillUploaded
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/50'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Step 4</span>
                      {isSignedBillUploaded ? (
                        <Unlock className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4 opacity-50" />
                      )}
                    </div>
                    <div className="text-xs font-bold">OTP Generated for Handover</div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {isDeliveryCompleted
                        ? 'Handover completed'
                        : isSignedBillUploaded
                        ? 'Unlocked! Share with driver'
                        : 'Locked until bill upload'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Layout: Two Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Interactive Bill Verification, Photo Upload & OTP */}
                <div className="lg:col-span-7 space-y-6">

                  {/* 1. OTP STATUS / SHOWCASE CARD */}
                  {!isSignedBillUploaded ? (
                    /* LOCKED OTP CARD (Before Signed Bill Photo Upload) */
                    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-3 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <Lock className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                              Delivery Handover OTP (Locked)
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Generated only after signed bill photo is uploaded
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                          PRE-CONDITION
                        </span>
                      </div>

                      <div className="py-4 bg-slate-800/80 rounded-xl border border-slate-700 text-center space-y-2">
                        <div className="font-mono text-3xl font-black tracking-widest text-slate-500 blur-xs select-none">
                          ••••••
                        </div>
                        <p className="text-xs text-amber-200/90 font-medium px-4">
                          🔒 The 6-digit OTP will automatically generate as soon as you check the items on the bill, sign the physical copy, and upload its photograph below.
                        </p>
                      </div>

                      {!isDriverArrived && (
                        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Driver is en route to your location. When they arrive, proceed with signing the bill.</span>
                          </div>
                          <button
                            onClick={handleSimulateArrival}
                            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                          >
                            Simulate Driver Arrival
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* UNLOCKED OTP CARD (After Signed Bill Photo Uploaded) */
                    <div className="bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
                            <KeyRound className="w-5 h-5" />
                          </span>
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                              <span>Delivery Handover OTP</span>
                              <span className="bg-emerald-400/30 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                Generated & Active
                              </span>
                            </div>
                            <span className="text-[11px] text-emerald-200">
                              Signed bill sent to distributor • Ready for handover
                            </span>
                          </div>
                        </div>

                        {myStop.status === 'delivered' ? (
                          <span className="bg-emerald-900/60 text-emerald-200 text-xs px-2.5 py-1 rounded-full font-bold border border-emerald-400/40 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Delivered
                          </span>
                        ) : (
                          <span className="bg-amber-400 text-slate-950 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">
                            Share with Driver
                          </span>
                        )}
                      </div>

                      {/* Giant OTP Display */}
                      <div className="text-center py-4 bg-white/10 rounded-xl backdrop-blur-xs border border-white/25 space-y-2">
                        <span className="text-xs text-emerald-100 block font-medium">
                          Share this 6-digit code with auto driver {activeTrip.driverName || 'Ramesh'}
                        </span>
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white drop-shadow-sm">
                            {myStop.deliveryOtp}
                          </div>
                          <button
                            onClick={() => handleCopyOtp(myStop.deliveryOtp)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all"
                            title="Copy OTP"
                          >
                            {copiedOtp ? <Check className="w-5 h-5 text-emerald-200" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100/90 pt-1">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-300" />
                          <span>Signed Bill Proof sent to <strong>{activeTrip.distributorName}</strong></span>
                        </span>
                        {myStop.signedBillPhotoUrl && (
                          <button
                            onClick={() => downloadPhotograph(myStop.signedBillPhotoUrl!, myStop.signedBillFileName || 'Signed_Bill_Proof.png')}
                            className="inline-flex items-center gap-1 font-semibold text-white underline underline-offset-2 hover:text-emerald-200"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Your Copy
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. STEP 2: CHECK ITEMS & SIGN PHYSICAL BILL SECTION */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            1
                          </span>
                          <h2 className="text-sm font-bold text-slate-900">
                            Check Items on Physical Delivery Bill
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          The auto driver will hand over the paper challan. Verify items physically before signing.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleCheckAllItems}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg transition"
                      >
                        ✓ Mark All Verified
                      </button>
                    </div>

                    {/* Items Checklist Table */}
                    <div className="space-y-2">
                      {parsedItems.map((item, idx) => {
                        const isChecked = Boolean(checkedItems[item]);
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleItemCheck(item)}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-50/60 border-emerald-300 text-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-3" />}
                              </div>
                              <span className="text-xs font-medium">{item}</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                isChecked
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isChecked ? 'Verified' : 'Pending Check'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Consignment Overview */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <span>Total Load: </span>
                        <strong className="text-slate-900 font-bold">
                          {myStop.quantity} {myStop.unitType}
                        </strong>
                        <span className="text-slate-400 ml-2">• Destination: {myStop.address}</span>
                      </div>
                      <span className="font-mono text-emerald-700 font-semibold">
                        {Object.values(checkedItems).filter(Boolean).length}/{parsedItems.length} items checked
                      </span>
                    </div>

                    {/* Signature Declaration Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={billSignedConfirmed}
                          onChange={(e) => setBillSignedConfirmed(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                          <strong>Shopkeeper Physical Signature Confirmation:</strong> I have physically inspected all items, confirmed package seals with driver {activeTrip.driverName || 'Ramesh'}, and signed the paper delivery bill with my pen.
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 3. STEP 3: UPLOAD PHOTOGRAPH OF SIGNED BILL */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                            2
                          </span>
                          <h2 className="text-sm font-bold text-slate-900">
                            Upload Photograph of Signed Delivery Bill
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Upload the photo of the signed bill so it is sent to the distributor as Proof of Delivery (PoD).
                        </p>
                      </div>

                      {/* Fast demo testing button */}
                      <button
                        type="button"
                        onClick={handleGenerateSampleSignedBill}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition"
                        title="Auto-generates a realistic signed bill photo to test immediately"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Use Sample Signed Bill Photo</span>
                      </button>
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Photo Upload Zone / Preview */}
                    {!uploadedPhotoUrl && !myStop.signedBillPhotoUrl ? (
                      /* Empty Upload Box */
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-emerald-50/20 space-y-3"
                      >
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Click to Capture or Upload Signed Bill Photo
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Supports Camera Snapshot, JPEG, PNG, or WEBP (Max 10MB)
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <span className="text-xs text-emerald-700 font-semibold bg-emerald-100/70 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Browse Device / Camera</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Photo Uploaded / Active Preview */
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-20 h-24 rounded-xl border border-slate-300 overflow-hidden bg-slate-900 shrink-0 shadow-xs">
                              <img
                                src={uploadedPhotoUrl || myStop.signedBillPhotoUrl}
                                alt="Signed Bill Photograph"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewModalOpen(true)}
                                className="absolute inset-0 bg-slate-950/40 hover:bg-slate-950/60 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                title="View Full Photograph"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {uploadedFileName || myStop.signedBillFileName || 'Signed_Delivery_Bill.png'}
                                </span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                  {isSignedBillUploaded ? 'Dispatched' : 'Ready to Send'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Signed by: {currentUser.fullName || 'Shopkeeper'} • {new Date().toLocaleDateString('en-IN')}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setPreviewModalOpen(true)}
                                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Photo</span>
                                </button>
                                <span className="text-slate-300">•</span>
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-800"
                                >
                                  Retake / Replace
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              downloadPhotograph(
                                uploadedPhotoUrl || myStop.signedBillPhotoUrl!,
                                uploadedFileName || 'Signed_Bill.png'
                              )
                            }
                            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-2xs"
                            title="Download Photograph"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Primary Submission Action Button (Only if not yet uploaded) */}
                    {!isSignedBillUploaded ? (
                      <div className="pt-2">
                        <button
                          type="button"
                          id="submit-signed-bill-btn"
                          disabled={!uploadedPhotoUrl || isUploading}
                          onClick={handleUploadAndGenerateOtp}
                          className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs ${
                            uploadedPhotoUrl && !isUploading
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-emerald-600/20'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                              <span>Sending Signed Bill to Distributor & Generating OTP...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-4 h-4" />
                              <span>Upload Signed Bill & Generate Delivery Handover OTP</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        <p className="text-[11px] text-slate-400 text-center mt-2">
                          Once confirmed, the photo is sent directly to distributor <strong>{activeTrip.distributorName}</strong> and your 6-digit OTP will be unlocked.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Success:</strong> Photograph sent to distributor! Provide your 6-digit OTP to the auto driver above.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Driver & Trip Info + Live Google Map */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Delivery Consignment & Driver Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded ${
                            myStop.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : myStop.status === 'arrived'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {myStop.status === 'delivered'
                            ? 'Delivered & Completed'
                            : myStop.status === 'arrived'
                            ? 'Vehicle Arrived at Shop'
                            : 'En Route to Shop'}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">
                          {activeTrip.distributorName}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Pickup: {activeTrip.pickupAddress}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Stop Order</span>
                        <strong className="text-sm font-mono text-slate-800">
                          Stop #{myStop.sequenceNumber} of {activeTrip.totalStops}
                        </strong>
                      </div>
                    </div>

                    {/* Auto Driver Details */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-base shadow-2xs">
                          🛺
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {activeTrip.driverName || 'Driver Assigned'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Auto: <span className="font-mono font-bold text-slate-800">{activeTrip.driverVehicleNumber || 'TS 09 UA 4521'}</span>
                          </div>
                        </div>
                      </div>

                      {activeTrip.driverPhone && (
                        <a
                          href={`tel:${activeTrip.driverPhone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-blue-600 transition-colors shadow-2xs"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Driver</span>
                        </a>
                      )}
                    </div>

                    {/* Goods Breakdown */}
                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                      <span className="font-bold text-slate-800 block">Package Cargo in Auto:</span>
                      <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                        {myStop.itemsDescription || activeTrip.goodsDescription}
                      </p>
                    </div>
                  </div>

                  {/* Live Google Maps Tracker */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-emerald-600" />
                        Google Maps Live Vehicle GPS Tracker
                      </h3>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Live GPS
                      </span>
                    </div>

                    <GoogleMapView
                      pickup={{
                        lat: activeTrip.pickupLat,
                        lng: activeTrip.pickupLng,
                        address: activeTrip.pickupAddress,
                        label: 'Place A (Godown)',
                      }}
                      stops={activeTrip.stops}
                      routePlan={activeTrip.routePlan}
                      currentDriverLat={activeTrip.currentDriverLat}
                      currentDriverLng={activeTrip.currentDriverLng}
                      heightClass="h-72"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Active Inbound Trips */
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-bold text-slate-800">No Inbound Deliveries Active</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                There are currently no active FMCG dispatches scheduled for your store right now. You can send a replenishment request to your distributor anytime.
              </p>
              <button
                onClick={() => setActiveTab('order')}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <span>Request Inventory Stock</span>
              </button>
            </div>
          )}

          {/* Full High-Resolution Photo Preview Modal */}
          {previewModalOpen && (uploadedPhotoUrl || myStop?.signedBillPhotoUrl) && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-5 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Signed Delivery Bill Photograph</h3>
                      <p className="text-[11px] text-slate-500">
                        Official Proof of Delivery (PoD) • Consignee: {myStop?.shopName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
                  <img
                    src={uploadedPhotoUrl || myStop?.signedBillPhotoUrl}
                    alt="Full Signed Delivery Bill"
                    className="max-h-[60vh] object-contain rounded shadow-lg"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Verified with blue ballpoint pen signature and store acknowledgement.
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadPhotograph(
                          uploadedPhotoUrl || myStop?.signedBillPhotoUrl!,
                          uploadedFileName || 'Signed_Bill_Proof.png'
                        )
                      }
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Photograph</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SEND STOCK ORDER REQUEST */}
      {activeTab === 'order' && (
        <form onSubmit={handleOrderSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Send FMCG Stock Replenishment Request</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Send your required inventory to your distributor wholesale godown. They will include it in their next multi-stop auto delivery trip.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Wholesaler / Distributor</label>
              <select className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white">
                <option value="user-dist-1">Sri Balaji FMCG Wholesalers (Begum Bazar, Hyderabad)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Items Description & Brands</label>
              <textarea
                rows={3}
                value={itemsDescription}
                onChange={(e) => setItemsDescription(e.target.value)}
                required
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200"
                  />
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as UnitType)}
                    className="text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="cartons">Cartons</option>
                    <option value="bags">Bags</option>
                    <option value="tins">Tins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="normal">Normal (Next Day)</option>
                  <option value="urgent">Urgent (Within 4 Hours)</option>
                  <option value="same_day">Same Day Evening</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              Submit Stock Order Request
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: ORDER REQUESTS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Your Store Stock Orders</h2>

          <div className="space-y-3">
            {myOrders.map((ord) => (
              <div key={ord.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{ord.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        ord.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    {ord.itemsDescription} ({ord.quantity} {ord.unitType})
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sent to: {ord.distributorName} • Urgency: {ord.urgency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
