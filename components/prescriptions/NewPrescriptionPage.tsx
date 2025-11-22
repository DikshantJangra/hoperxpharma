"use client"

import { useState, useEffect } from "react"
import { FiSearch, FiHelpCircle, FiPhone, FiMessageSquare, FiAlertTriangle, FiCheck, FiPrinter, FiSend, FiClock, FiChevronRight, FiMic, FiInfo, FiX } from "react-icons/fi"
import { HiOutlineDocumentText } from "react-icons/hi"
import PrescriptionCard from "./PrescriptionCard"
import DrugRow from "./DrugRow"
import BatchModal from "./BatchModal"
import PatientDrawer from "./PatientDrawer"
import LabelModal from "./LabelModal"

export default function NewPrescriptionPage() {
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showPatientDrawer, setShowPatientDrawer] = useState(false)
  const [showLabelModal, setShowLabelModal] = useState(false)
  const [counsellingNotes, setCounsellingNotes] = useState("")
  const [verified, setVerified] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showUndo, setShowUndo] = useState(false)

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        document.getElementById("global-search")?.focus()
      }
      if (e.key === "s" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        // Add start fill logic
      }
      if (e.key === "b" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowBatchModal(true)
      }
      if (e.key === "l" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setShowLabelModal(true)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleFinalize()
      }
      if (e.shiftKey && e.key === "?") {
        e.preventDefault()
        setShowShortcuts(!showShortcuts)
      }
    }

    window.addEventListener("keydown", handleKeyboard)
    return () => window.removeEventListener("keydown", handleKeyboard)
  }, [showShortcuts])

  const handleFinalize = () => {
    if (!verified) {
      alert("Please verify dosage and interactions before finalizing")
      return
    }
    if (confirm("Finalize & Mark Filled — This action will notify the patient and deduct stock. Continue?")) {
      console.log("Finalized")
      setShowUndo(true)
      setTimeout(() => setShowUndo(false), 6000)
    }
  }

  const handleUndo = () => {
    console.log("Undo finalize")
    setShowUndo(false)
  }

  return (
    <div className="h-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Prescriptions <FiChevronRight className="inline mx-1" /> <span className="text-gray-900 font-medium">New</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md font-medium">OCR</button>
                <button className="px-3 py-1.5 hover:bg-gray-100 rounded-md">eRx</button>
                <button className="px-3 py-1.5 hover:bg-gray-100 rounded-md">Manual</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="global-search"
                  type="text"
                  placeholder="Search... (Press /)"
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <button onClick={() => setShowShortcuts(!showShortcuts)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FiHelpCircle className="text-gray-600" size={20} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button onClick={() => setShowPatientDrawer(true)} className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">JD</div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Anoop Jangra</div>
                <div className="text-xs text-gray-500">45/M • +1 234-567-8900</div>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Aetna</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">VIP</span>
              </div>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg"><FiPhone className="text-gray-600" size={18} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg"><FiMessageSquare className="text-gray-600" size={18} /></button>
            <div className="ml-auto text-xs text-gray-500"><FiClock className="inline mr-1" />Last sync: 03:12 PM</div>
          </div>
        </div>
      </header>

      <div className="flex gap-6 p-6 pb-28">
        <div className="flex-1 space-y-6">
          <PrescriptionCard />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Panel</h3>
            <div className="space-y-3">
              <DrugRow
                drug={{
                  id: "1",
                  name: "Atorvastatin",
                  strength: "10mg",
                  form: "Tablet",
                  qtyPrescribed: 30,
                  qtyToDispense: 30,
                  sig: "Take 1 tablet daily at bedtime",
                  daysSupply: 30,
                  status: "in-stock",
                  batchId: "B2025-01",
                  price: 15.99,
                  gst: 2.4
                }}
                onPickBatch={() => setShowBatchModal(true)}
              />
              <DrugRow
                drug={{
                  id: "2",
                  name: "Metformin",
                  strength: "500mg",
                  form: "Tablet",
                  qtyPrescribed: 60,
                  qtyToDispense: 60,
                  sig: "Take 1 tablet twice daily with meals",
                  daysSupply: 30,
                  status: "in-stock",
                  batchId: "B2024-33",
                  price: 8.5,
                  gst: 1.28,
                  interactions: ["Atorvastatin - Low risk"]
                }}
                onPickBatch={() => setShowBatchModal(true)}
              />
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="text-amber-600 mt-0.5" size={20} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-amber-900">High Severity Interaction</div>
                  <div className="text-sm text-amber-700 mt-1">Atorvastatin + Metformin: Requires mandatory acknowledgement.</div>
                </div>
                <button className="text-sm text-white bg-red-600 hover:bg-red-700 font-medium px-3 py-1 rounded-md">Override</button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="text-gray-900">$24.49</span></div>
                <div className="flex justify-between"><span className="text-gray-600">GST (15%)</span><span className="text-gray-900">$3.68</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Insurance (Aetna)</span><span className="text-green-600">-$20.00</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                  <span className="text-gray-900">Patient OOP</span><span className="text-gray-900">$8.17</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Final Check & Counselling</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                <span className="text-sm text-gray-700"><span className="font-medium text-gray-900">I have verified dosage and interactions</span> — Required before finalizing</span>
              </label>
              <textarea value={counsellingNotes} onChange={(e) => setCounsellingNotes(e.target.value)} placeholder="Add counselling notes (optional)..." className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
              <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                <FiMic /> Record voice note
              </button>
            </div>
          </div>
        </div>

        <div className="w-[400px] flex-shrink-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Patient Summary</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 text-xs mb-1">Allergies</div>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">Penicillin</span>
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">Sulfa drugs</span>
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">Chronic Conditions</div>
                <div className="text-gray-900">Type 2 Diabetes, Hypertension</div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View full history →</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <FiSend size={18} /><span className="text-sm font-medium">Send Ready SMS/WhatsApp</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <HiOutlineDocumentText size={18} /><span className="text-sm font-medium">Create PO for Low Stock</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                <FiInfo size={18} /><span className="text-sm font-medium">Drug Info Lookup</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Inventory Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Atorvastatin 10mg</span>
                <span className="text-green-600 font-medium">245 units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Metformin 500mg</span>
                <span className="text-green-600 font-medium">180 units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 z-50">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">RX#1234 • 2 items • Prescriber: Dr. Patel</div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium">Save Draft</button>
            <button className="px-4 py-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg text-sm font-medium">Hold</button>
            <button onClick={() => setShowLabelModal(true)} className="px-4 py-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-medium flex items-center gap-2">
              <FiPrinter size={16} />Print Label (L)
            </button>
            <button onClick={handleFinalize} disabled={!verified} className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2">
              <FiCheck size={16} />Finalize & Mark Filled (Ctrl+Enter)
            </button>
          </div>
        </div>
      </div>

      {showBatchModal && <BatchModal onClose={() => setShowBatchModal(false)} />}
      {showPatientDrawer && <PatientDrawer onClose={() => setShowPatientDrawer(false)} />}
      {showLabelModal && <LabelModal onClose={() => setShowLabelModal(false)} />}

      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                <button onClick={() => setShowShortcuts(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <FiX size={20} />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <ShortcutSection title="Actions">
                <ShortcutItem keys={["S"]} description="Start Fill" />
                <ShortcutItem keys={["B"]} description="Open Batch selector" />
                <ShortcutItem keys={["L"]} description="Open Label print" />
                <ShortcutItem keys={["Ctrl","Enter"]} description="Finalize & Mark Filled" />
              </ShortcutSection>
              <ShortcutSection title="Navigation">
                <ShortcutItem keys={["/"]} description="Global search" />
                <ShortcutItem keys={["g","p"]} description="Go to Prescriptions" />
                <ShortcutItem keys={["n"]} description="Next Rx in queue" />
                <ShortcutItem keys={["p"]} description="Previous Rx" />
              </ShortcutSection>
              <ShortcutSection title="General">
                <ShortcutItem keys={["Shift", "?"]} description="Show this help" />
                <ShortcutItem keys={["Esc"]} description="Close dialogs" />
              </ShortcutSection>
            </div>
          </div>
        </div>
      )}

      {showUndo && (
        <div className="fixed bottom-24 right-6 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
          <span>Prescription marked filled.</span>
          <button onClick={handleUndo} className="font-semibold text-blue-400 hover:text-blue-300">Undo</button>
        </div>
      )}
    </div>
  )
}

function ShortcutSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    )
}

function ShortcutItem({ keys, description }: { keys: string[], description: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{description}</span>
            <div className="flex items-center gap-1">
                {keys.map((key, idx) => (
                    <kbd key={idx} className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700">
                        {key}
                    </kbd>
                ))}
            </div>
        </div>
    )
}