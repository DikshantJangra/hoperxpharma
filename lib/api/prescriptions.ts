import { Prescription, Batch } from "@/types/prescription"

export async function getPrescription(id: string): Promise<Prescription> {
  const res = await fetch(`/api/prescriptions/${id}`)
  return res.json()
}

export async function createPrescription(data: Partial<Prescription>): Promise<Prescription> {
  const res = await fetch("/api/prescriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updatePrescription(id: string, data: Partial<Prescription>): Promise<Prescription> {
  const res = await fetch(`/api/prescriptions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function pickBatch(prescriptionId: string, items: Array<{ drugId: string; batchId: string; qty: number }>) {
  const res = await fetch(`/api/prescriptions/${prescriptionId}/pick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, userId: "current-user", device: "terminal-1" })
  })
  return res.json()
}

export async function finalizePrescription(prescriptionId: string, userId: string, pin?: string, notes?: string) {
  const res = await fetch(`/api/prescriptions/${prescriptionId}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, pin, notes })
  })
  return res.json()
}

export async function printLabel(prescriptionId: string, options: { template: string; copies: number; language: string }) {
  const res = await fetch("/api/label/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prescriptionId, ...options })
  })
  return res.json()
}

export async function sendNotification(prescriptionId: string, type: "sms" | "whatsapp" | "email") {
  const res = await fetch("/api/notifications/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prescriptionId, type })
  })
  return res.json()
}

export async function adjudicateInsurance(prescriptionId: string) {
  const res = await fetch("/api/insurance/adjudicate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prescriptionId })
  })
  return res.json()
}

export async function searchInventory(query: string): Promise<Batch[]> {
  const res = await fetch(`/api/inventory/search?q=${encodeURIComponent(query)}`)
  return res.json()
}

export async function uploadPrescriptionFile(patientId: string, file: File): Promise<{ id: string; url: string; ocrData?: any }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patientId', patientId);

  const res = await fetch("/api/prescriptions/upload", {
    method: "POST",
    body: formData
  });
  return res.json();
}
