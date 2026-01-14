import { useState, useCallback } from 'react'
import { Upload, AlertTriangle, CheckCircle, FileText, Loader2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker path to CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const REQUIRED_SKILLS = ['React', 'Python', 'JavaScript', 'Node.js', 'System Design', 'DSA', 'Database']

function ResumeAudit() {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [analysis, setAnalysis] = useState(null)

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return fullText
  }

  const analyzeResume = (text) => {
    const lowerText = text.toLowerCase()
    const foundSkills = []
    const missingSkills = []

    REQUIRED_SKILLS.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill)
      } else {
        missingSkills.push(skill)
      }
    })

    return {
      foundSkills,
      missingSkills,
      score: Math.round((foundSkills.length / REQUIRED_SKILLS.length) * 100),
      wordCount: text.split(/\s+/).length
    }
  }

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    setIsProcessing(true)
    try {
      const text = await extractTextFromPDF(file)
      setResumeText(text)
      const result = analyzeResume(text)
      setAnalysis(result)
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert('Error processing PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-electric-purple" />
          <h2 className="text-2xl font-bold">Intelligent Resume Audit</h2>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-xl p-12 transition-all ${
            isDragging
              ? 'border-electric-purple bg-electric-purple/10'
              : 'border-white/20 hover:border-electric-purple/50'
          }`}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => handleFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />

          <div className="flex flex-col items-center justify-center text-center">
            {isProcessing ? (
              <>
                <Loader2 className="w-16 h-16 text-electric-purple animate-spin mb-4" />
                <p className="text-lg font-medium">Processing Resume...</p>
                <p className="text-sm text-gray-400 mt-2">Extracting and analyzing content</p>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-electric-purple mb-4" />
                <p className="text-lg font-medium mb-2">Drop your resume here or click to upload</p>
                <p className="text-sm text-gray-400">Only PDF files are supported</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score Card */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Overall Score</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke={analysis.score >= 70 ? '#10b981' : analysis.score >= 40 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(analysis.score / 100) * 339.292} 339.292`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{analysis.score}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-gray-400 mt-4">{analysis.wordCount} words analyzed</p>
          </div>

          {/* Skill Gap Report */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Skill Gap Report
            </h3>
            <div className="space-y-3">
              {analysis.missingSkills.length > 0 ? (
                analysis.missingSkills.map((skill, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-400">CRITICAL GAP: {skill}</p>
                      <p className="text-sm text-gray-400 mt-1">Add this skill to improve your profile</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <p className="font-medium text-emerald-400">No critical gaps detected!</p>
                </div>
              )}
            </div>
          </div>

          {/* Found Skills */}
          {analysis.foundSkills.length > 0 && (
            <div className="glass-card rounded-xl p-6 md:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-green" />
                Detected Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.foundSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-emerald-green/10 border border-emerald-green/30 text-emerald-green rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResumeAudit
