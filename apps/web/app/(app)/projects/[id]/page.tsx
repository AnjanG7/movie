'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, DollarSign, Clock, Film, Edit, Trash2, AlertCircle, FileText, ShoppingCart, Wallet, TrendingUp, Package, Megaphone, Save, X, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const API_BASE_URL = 'http://localhost:4000/api'

// Types matching Prisma schema exactly
interface PhaseEntity {
  id: string
  name: string
  orderNo?: number
  projectId: string
}

interface FinancingSource {
  id: string
  type: string
  amount: number
  rate?: number
  fees?: number
  totalDrawn?: number
  remaining?: number
  schedule?: any
  createdAt: string
  drawdowns?: Drawdown[]
}

interface Drawdown {
  id: string
  date: string
  amount: number
  source?: { type: string }
}

interface PurchaseOrder {
  id: string
  poNo: string
  vendor?: { name: string }
  amount: number
  status: string
  createdAt: string
}

interface BudgetVersion {
  id: string
  version: string
  type: string
  grandTotal?: number
  lines?: BudgetLineItem[]
}

interface BudgetLineItem {
  id: string
  phase: string
  department?: string
  name: string
  qty: number
  rate: number
  taxPercent: number
}

interface Project {
  id: string
  title: string
  baseCurrency: string
  timezone: string
  status: string
  ownerId?: string
  createdAt: string
  updatedAt?: string
  phases?: PhaseEntity[]
  budgetVersions?: BudgetVersion[]
  financingSources?: FinancingSource[]
}

export default function ProjectProfilePage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  // Form state for editing
  const [editFormData, setEditFormData] = useState({
    title: '',
    baseCurrency: 'USD',
    timezone: 'Asia/Kathmandu',
    status: 'planning'
  })

  // Fetch project details
  const fetchProject = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in.')
          router.push('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success && result.data) {
        const projectData: Project = {
          id: result.data.id,
          title: result.data.title,
          baseCurrency: result.data.baseCurrency || 'USD',
          timezone: result.data.timezone || 'Asia/Kathmandu',
          status: result.data.status || 'planning',
          ownerId: result.data.ownerId,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
          phases: result.data.phases || [],
          financingSources: result.data.financingSources || [],
          budgetVersions: result.data.budgetVersions || []
        }
        setProject(projectData)
        
        // Initialize edit form with current data
        setEditFormData({
          title: projectData.title,
          baseCurrency: projectData.baseCurrency,
          timezone: projectData.timezone,
          status: projectData.status
        })
      } else {
        throw new Error(result.message || 'Failed to fetch project')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError(error instanceof Error ? error.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) fetchProject()
  }, [projectId])

  // Handle edit form input changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle update project
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert('Authentication required. Please log in.')
          router.push('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        alert('Project updated successfully!')
        setShowEditModal(false)
        fetchProject() // Refresh project data
      } else {
        alert(result.message || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete project
  const handleDeleteProject = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          alert('Authentication required. Please log in.')
          router.push('/login')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        alert('Project deleted successfully!')
        router.push('/projects')
      } else {
        alert(result.message || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project. Please check your authentication and try again.')
    } finally {
      setSubmitting(false)
      setShowDeleteModal(false)
    }
  }

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return project?.baseCurrency 
      ? `${project.baseCurrency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Format date helper
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return ''
    }
  }

  // Download comprehensive project PDF
  const downloadProjectPDF = async () => {
    if (!project) return

    setDownloadingPDF(true)
    try {
      // Fetch all project data
      const [budgetRes, financingRes, drawdownsRes, posRes, quotationsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects/${projectId}/budget`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_BASE_URL}/projects/${projectId}/financing-sources`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_BASE_URL}/projects/${projectId}/drawdowns`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_BASE_URL}/projects/${projectId}/purchase-orders`, { credentials: 'include' }).catch(() => null),
        fetch(`${API_BASE_URL}/projects/${projectId}/quotations`, { credentials: 'include' }).catch(() => null)
      ])

      const budgetData = budgetRes?.ok ? await budgetRes.json() : null
      const financingData = financingRes?.ok ? await financingRes.json() : null
      const drawdownsData = drawdownsRes?.ok ? await drawdownsRes.json() : null
      const posData = posRes?.ok ? await posRes.json() : null
      const quotationsData = quotationsRes?.ok ? await quotationsRes.json() : null

      // Extract data with proper null checks and defaults
      let budgetVersions: BudgetVersion[] = []
      if (budgetData?.success && budgetData?.data?.versions) {
        budgetVersions = budgetData.data.versions.map((v: any) => ({
          ...v,
          lines: Array.isArray(v.lines) ? v.lines : []
        }))
      }

      const financingSources: FinancingSource[] = financingData?.success 
        ? financingData.data.map((f: any) => ({
            ...f,
            amount: f.amount || 0,
            totalDrawn: f.totalDrawn || 0,
            remaining: f.remaining || 0
          }))
        : []

      const drawdowns: Drawdown[] = drawdownsData?.success 
        ? drawdownsData.data.map((d: any) => ({
            ...d,
            amount: d.amount || 0
          }))
        : []

      // Handle the purchaseOrders structure with correct field names
      const purchaseOrders: PurchaseOrder[] = posData?.success && posData?.data?.purchaseOrders 
        ? posData.data.purchaseOrders.map((po: any) => ({
            poNo: po.poNo || 'N/A',
            vendor: po.vendor ? { name: po.vendor.name || 'N/A' } : { name: 'N/A' },
            amount: po.amount || 0,
            status: po.status || 'Unknown',
            createdAt: po.createdAt || '',
            id: po.id
          }))
        : []

      // Handle quotations - filter by type QUOTE
      let quotations: any[] = []
      if (quotationsData?.success && Array.isArray(quotationsData.data)) {
        quotations = quotationsData.data
          .filter((item: any) => item.type === 'QUOTE')
          .map((q: any) => ({
            version: q.version || 'N/A',
            createdBy: q.createdBy || 'N/A',
            grandTotal: q.grandTotal || 0,
            acceptedAt: q.acceptedAt ? 'Accepted' : 'Pending',
            updatedAt: q.updatedAt || ''
          }))
      }

      // Generate PDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Colors
      const colors = {
        primary: [34, 197, 94] as [number, number, number],
        secondary: [59, 130, 246] as [number, number, number],
        accent: [168, 85, 247] as [number, number, number],
        text: [30, 41, 59] as [number, number, number],
        lightText: [100, 116, 139] as [number, number, number],
        lightBg: [248, 250, 252] as [number, number, number],
        border: [226, 232, 240] as [number, number, number]
      }

      let yPos = 20

      // HEADER
      doc.setFillColor(...colors.primary)
      doc.rect(0, 0, pageWidth, 60, 'F')
      doc.setFontSize(32)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text('📽️', 15, 25)
      doc.text('PROJECT OVERVIEW', 35, 25)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('Film Finance Management System', 35, 35)
      doc.setFontSize(10)
      doc.text(new Date().toLocaleDateString(), pageWidth - 15, 25, { align: 'right' })
      yPos = 70

      // PROJECT INFO
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.primary)
      doc.text('PROJECT INFORMATION', 15, yPos)
      yPos += 8
      doc.setFillColor(...colors.lightBg)
      doc.setDrawColor(...colors.border)
      doc.roundedRect(15, yPos, pageWidth - 30, 50, 2, 2, 'FD')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Project Title:', 20, yPos + 8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(project.title, 50, yPos + 8)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Status:', 20, yPos + 16)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(project.status.charAt(0).toUpperCase() + project.status.slice(1), 50, yPos + 16)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Currency:', 20, yPos + 24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(project.baseCurrency, 50, yPos + 24)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Timezone:', 20, yPos + 32)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(project.timezone, 50, yPos + 32)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Created:', 20, yPos + 40)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(formatDate(project.createdAt), 50, yPos + 40)

      // Right column
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Project ID:', 110, yPos + 8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      const shortId = project.id.substring(0, 8)
      doc.text(shortId, 140, yPos + 8)

      if (project.updatedAt) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...colors.lightText)
        doc.text('Last Updated:', 110, yPos + 16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.text)
        doc.text(formatDate(project.updatedAt), 140, yPos + 16)
      }
      yPos = 58 + 50

      // FINANCIAL SUMMARY
      const workingBudget = budgetVersions.find(v => v.type === 'WORKING')
      let totalBudget = 0
      if (workingBudget && Array.isArray(workingBudget.lines)) {
        totalBudget = workingBudget.lines.reduce((sum, line) => 
          sum + (line.qty || 0) * (line.rate || 0) * (1 + (line.taxPercent || 0) / 100), 0
        )
      }

      const totalFinancing = financingSources.reduce((sum, f) => sum + (f.amount || 0), 0)
      const totalDrawn = financingSources.reduce((sum, f) => sum + (f.totalDrawn || 0), 0)
      const totalRemaining = financingSources.reduce((sum, f) => sum + (f.remaining || 0), 0)
      const totalPOAmount = purchaseOrders.reduce((sum, po) => sum + (po.amount || 0), 0)
      const totalQuotationAmount = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.primary)
      doc.text('FINANCIAL SUMMARY', 15, yPos)
      yPos += 8
      doc.setFillColor(...colors.lightBg)
      doc.roundedRect(15, yPos, pageWidth - 30, 45, 2, 2, 'FD')

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      
      // Left Column
      doc.text('Total Budget:', 20, yPos + 8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(formatCurrency(totalBudget), 20, yPos + 14)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Total Financing:', 20, yPos + 24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(34, 197, 94) 
      doc.text(formatCurrency(totalFinancing), 20, yPos + 30)

      // Middle Column
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Financing Used:', 80, yPos + 8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(220, 38, 38)
      doc.text(formatCurrency(totalDrawn), 80, yPos + 14)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Remaining:', 80, yPos + 24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(34, 197, 94)
      doc.text(formatCurrency(totalRemaining), 80, yPos + 30)

      // Right Column
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('PO Total:', 140, yPos + 8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(formatCurrency(totalPOAmount), 140, yPos + 14)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...colors.lightText)
      doc.text('Quotation Total:', 140, yPos + 24)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...colors.text)
      doc.text(formatCurrency(totalQuotationAmount), 140, yPos + 30)

      yPos += 53

      // PHASES
      if (project.phases && project.phases.length > 0) {
        if (yPos > pageHeight - 80) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.primary)
        doc.text('PRODUCTION PHASES', 15, yPos)
        yPos += 5
        const phaseData = project.phases.map(p => [p.name, p.orderNo ? p.orderNo.toString() : 'N/A'])
        autoTable(doc, {
          startY: yPos,
          head: [['Phase Name', 'Details']],
          body: phaseData,
          theme: 'striped',
          headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 8 }
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      }

      // BUDGET BREAKDOWN
      if (workingBudget && Array.isArray(workingBudget.lines) && workingBudget.lines.length > 0) {
        if (yPos > pageHeight - 80) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.primary)
        doc.text('BUDGET BREAKDOWN', 15, yPos)
        yPos += 5
        const budgetData = workingBudget.lines.slice(0, 20).map(line => [
          line.phase,
          line.department || '',
          line.name,
          (line.qty || 0).toString(),
          formatCurrency(line.rate || 0),
          `${line.taxPercent || 0}%`,
          formatCurrency((line.qty || 0) * (line.rate || 0) * (1 + (line.taxPercent || 0) / 100))
        ])
        autoTable(doc, {
          startY: yPos,
          head: [['Phase', 'Dept', 'Item', 'Qty', 'Rate', 'Tax', 'Total']],
          body: budgetData,
          theme: 'striped',
          headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          columnStyles: { 3: { halign: 'center' }, 4: { halign: 'right' }, 5: { halign: 'center' }, 6: { halign: 'right' } }
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      }

      // NEW PAGE FOR FINANCING
      doc.addPage()
      yPos = 20

      // FINANCING SOURCES
      if (financingSources.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.primary)
        doc.text('FINANCING SOURCES', 15, yPos)
        yPos += 5
        const financingData = financingSources.map(f => [
          f.type,
          formatCurrency(f.amount),
          formatCurrency(f.totalDrawn || 0),
          formatCurrency(f.remaining || 0),
          f.rate ? `${f.rate}%` : '',
          f.fees ? formatCurrency(f.fees) : ''
        ])
        autoTable(doc, {
          startY: yPos,
          head: [['Type', 'Allocated', 'Used', 'Remaining', 'Rate', 'Fees']],
          body: financingData,
          theme: 'striped',
          headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'center' }, 5: { halign: 'right' } }
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      }

      // DRAWDOWN HISTORY
      if (drawdowns.length > 0) {
        if (yPos > pageHeight - 80) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.primary)
        doc.text('DRAWDOWN HISTORY', 15, yPos)
        yPos += 5
        const drawdownData = drawdowns.slice(0, 15).map(d => [
          d.source?.type || 'N/A',
          formatDate(d.date),
          formatCurrency(d.amount)
        ])
        autoTable(doc, {
          startY: yPos,
          head: [['Source Type', 'Date', 'Amount']],
          body: drawdownData,
          theme: 'striped',
          headStyles: { fillColor: colors.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } }
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      }

      // PURCHASE ORDERS
      if (purchaseOrders.length > 0) {
        if (yPos > pageHeight - 80) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.primary)
        doc.text('PURCHASE ORDERS', 15, yPos)
        yPos += 5
        const poData = purchaseOrders.slice(0, 15).map(po => [
          po.poNo,
          po.vendor?.name || 'N/A',
          formatCurrency(po.amount),
          po.status,
          formatDate(po.createdAt)
        ])
        autoTable(doc, {
          startY: yPos,
          head: [['PO Number', 'Vendor', 'Amount', 'Status', 'Date']],
          body: poData,
          theme: 'striped',
          headStyles: { fillColor: colors.accent, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 2: { halign: 'right' }, 4: { halign: 'center' } }
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      }

      // QUOTATIONS
      if (quotations.length > 0) {
        if (yPos > pageHeight - 80) {
          doc.addPage()
          yPos = 20
        }
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...colors.primary)
        doc.text('QUOTATIONS', 15, yPos)
        yPos += 5
        const quotationData = quotations.slice(0, 15).map(q => [
          q.version,
          q.createdBy,
          formatCurrency(q.grandTotal),
          q.acceptedAt,
          formatDate(q.updatedAt)
        ])
        autoTable(doc, {
          startY: yPos,
          head: [['Quote #', 'Vendor', 'Amount', 'Status', 'Valid Until']],
          body: quotationData,
          theme: 'striped',
          headStyles: { fillColor: colors.secondary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 8 },
          columnStyles: { 2: { halign: 'right' }, 4: { halign: 'center' } }
        })
      }

      // FOOTER ON ALL PAGES
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setDrawColor(...colors.border)
        doc.setLineWidth(0.5)
        doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...colors.lightText)
        doc.text(`${project.title} - Project Overview Report`, pageWidth / 2, pageHeight - 13, { align: 'center' })
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 13, { align: 'right' })
        doc.text(`Generated ${new Date().toLocaleDateString()}`, 15, pageHeight - 13)
      }

      // Download the PDF
      doc.save(`${project.title.replace(/[^a-z0-9]/gi, '-')}-Project-Report-${Date.now()}.pdf`)
      alert('Project PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloadingPDF(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'paused': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Project</h3>
          <p className="text-red-700">{error || 'Project not found'}</p>
          {error?.includes('Authentication') && (
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </button>
      </div>

      {/* Project Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Film className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadProjectPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 px-4 py-2 text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              {downloadingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Base Currency</p>
              <p className="text-lg font-semibold text-gray-900">{project.baseCurrency}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Timezone</p>
              <p className="text-lg font-semibold text-gray-900">{project.timezone}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Created</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(project.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<Link href={`/quotations?projectId=${projectId}`} className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-400 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quotations</h3>
                <p className="text-sm text-gray-600">Manage investor quotes</p>
              </div>
            </div>
          </Link>
          <Link href={`/budget?projectId=${projectId}`} className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-green-400 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Budget</h3>
                <p className="text-sm text-gray-600">Track expenses</p>
              </div>
            </div>
          </Link>
          <Link href={`/purchase-orders?projectId=${projectId}`} className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-orange-400 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Purchase Orders</h3>
                <p className="text-sm text-gray-600">Manage POs</p>
              </div>
            </div>
          </Link>
          <Link href={`/cashflow?projectId=${projectId}`} className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-teal-400 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                <Wallet className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Cashflow</h3>
                <p className="text-sm text-gray-600">Weekly planning</p>
              </div>
            </div>
          </Link>
          <Link href={`/projects/${projectId}/waterfall`} className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-indigo-400 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Waterfall</h3>
                <p className="text-sm text-gray-600">Investor distributions</p>
              </div>
            </div>
          </Link>
          <Link href={`/post-production?projectId=${projectId}`} className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-purple-400 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Post Production</h3>
                <p className="text-sm text-gray-600">VFX, Sound, Editing</p>
              </div>
            </div>
          </Link>
          <Link href={`/publicity?projectId=${projectId}`} className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-pink-400 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                <Megaphone className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Publicity</h3>
                <p className="text-sm text-gray-600">Campaign management</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Additional Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Phases */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Production Phases</h2>
          {project.phases && project.phases.length > 0 ? (
            <div className="space-y-2">
              {project.phases.map((phase, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{phase.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No phases added yet</p>
          )}
        </div>

        {/* Financing Sources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financing Sources</h2>
          {project.financingSources && project.financingSources.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {project.financingSources.map((source, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{source.type}</p>
                    <p className="text-lg font-bold text-green-600">
                      {project.baseCurrency} {source.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {source.rate && (
                    <p className="text-xs text-gray-600">Rate: {source.rate}%</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No financing sources added yet</p>
          )}
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        Last updated: {formatDate(project.createdAt)}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Project</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Currency</label>
                <select
                  name="baseCurrency"
                  value={editFormData.baseCurrency}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="NPR">NPR - Nepali Rupee</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  name="timezone"
                  value={editFormData.timezone}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Asia/Kathmandu">Asia/Kathmandu</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Project</h2>
                <p className="text-gray-600">
                  Are you sure you want to delete <strong>{project.title}</strong>? This action cannot be undone and will permanently remove all associated data.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {submitting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
