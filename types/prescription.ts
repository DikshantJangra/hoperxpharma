export interface Drug {
  id: string
  name: string
  strength: string
  form: string
  qtyPrescribed: number
  qtyToDispense: number
  sig: string
  daysSupply: number
  status: "in-stock" | "partial" | "out-of-stock"
  batchId?: string
  interactions?: string[]
  allergyMatch?: boolean
  price: number
  gst: number
  controlled?: boolean
}

export interface Prescription {
  id: string
  patientId: string
  prescriberId: string
  timestamp: string
  source: "ocr" | "e-rx" | "manual"
  drugs: Drug[]
  status: "draft" | "in-progress" | "on-hold" | "awaiting-auth" | "partial-filled" | "completed"
  refillNumber?: number
  totalRefills?: number
}

export interface Batch {
  id: string
  batchNumber: string
  qtyAvailable: number
  expiryDate: string
  mrp: number
  cost: number
  location: string
  recommended?: boolean
  expiryWarning?: boolean
  temperatureSensitive?: boolean
}

export interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  email: string
  address: string
  allergies: string[]
  chronicConditions: string[]
  insurance?: {
    provider: string
    policyNumber: string
    groupNumber: string
    validUntil: string
    status: "active" | "inactive"
  }
}

export interface Prescriber {
  id: string
  name: string
  clinic: string
  phone: string
  licenseNumber: string
}
