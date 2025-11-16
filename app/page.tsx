'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Upload, Palette, User, Briefcase, FileText, Image as ImageIcon, Sparkles } from 'lucide-react'

interface PortfolioData {
  template: string
  name: string
  profession: string
  bio: string
  profileImage: string
  skills: string[]
  bgColor: string
  textColor: string
  accentColor: string
  gallery: string[]
}

interface Message {
  type: 'bot' | 'user'
  content: string
  options?: string[]
  inputType?: 'text' | 'textarea' | 'file' | 'color' | 'skills'
  field?: keyof PortfolioData
}

const templates = [
  { id: 'minimal', name: 'Minimal', desc: 'Clean and simple' },
  { id: 'modern', name: 'Modern', desc: 'Bold and vibrant' },
  { id: 'creative', name: 'Creative', desc: 'Artistic layout' }
]

export default function PortfolioBuilder() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', content: '👋 Hi! I\'ll help you build your portfolio. Let\'s start by choosing a template:', options: templates.map(t => t.name) }
  ])
  const [inputValue, setInputValue] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    template: '',
    name: '',
    profession: '',
    bio: '',
    profileImage: '',
    skills: [],
    bgColor: '#ffffff',
    textColor: '#1f2937',
    accentColor: '#6366f1',
    gallery: []
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const conversationFlow = [
    { field: 'template' as keyof PortfolioData, message: 'Great choice! Now, what\'s your name?', inputType: 'text' as const },
    { field: 'name' as keyof PortfolioData, message: 'Nice to meet you! What\'s your profession or title?', inputType: 'text' as const },
    { field: 'profession' as keyof PortfolioData, message: 'Perfect! Let\'s upload your profile picture:', inputType: 'file' as const },
    { field: 'profileImage' as keyof PortfolioData, message: 'Looking good! Tell me about yourself (your bio):', inputType: 'textarea' as const },
    { field: 'bio' as keyof PortfolioData, message: 'What are your top skills? (separate with commas)', inputType: 'skills' as const },
    { field: 'skills' as keyof PortfolioData, message: 'Want to customize colors? Pick a background color:', inputType: 'color' as const },
    { field: 'bgColor' as keyof PortfolioData, message: 'Great! Now choose your text color:', inputType: 'color' as const },
    { field: 'textColor' as keyof PortfolioData, message: 'And finally, pick an accent color:', inputType: 'color' as const },
    { field: 'accentColor' as keyof PortfolioData, message: '✨ Your portfolio is ready! Want to add images to your gallery?', inputType: 'file' as const, isGallery: true }
  ]

  const handleTemplateSelect = (template: string) => {
    const selectedTemplate = templates.find(t => t.name === template)?.id || 'minimal'
    setPortfolio(prev => ({ ...prev, template: selectedTemplate }))
    setMessages(prev => [...prev,
      { type: 'user', content: template },
      { type: 'bot', content: conversationFlow[0].message, inputType: conversationFlow[0].inputType }
    ])
    setCurrentStep(1)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (isGallery) {
          setPortfolio(prev => ({ ...prev, gallery: [...prev.gallery, result] }))
          setMessages(prev => [...prev,
            { type: 'user', content: '📷 Image uploaded' },
            { type: 'bot', content: 'Image added! Upload another or type "done" to finish.', inputType: 'file', isGallery: true }
          ])
        } else {
          setPortfolio(prev => ({ ...prev, profileImage: result }))
          proceedToNextStep('📷 Profile image uploaded')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const proceedToNextStep = (userMessage: string) => {
    if (currentStep < conversationFlow.length) {
      const nextStep = conversationFlow[currentStep]
      setMessages(prev => [...prev,
        { type: 'user', content: userMessage },
        { type: 'bot', content: nextStep.message, inputType: nextStep.inputType, field: nextStep.field }
      ])
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const currentFlow = conversationFlow[currentStep - 1]

    if (currentFlow.inputType === 'skills') {
      const skillsArray = inputValue.split(',').map(s => s.trim()).filter(Boolean)
      setPortfolio(prev => ({ ...prev, skills: skillsArray }))
      proceedToNextStep(inputValue)
    } else if (currentFlow.field && currentFlow.field !== 'profileImage' && currentFlow.field !== 'gallery') {
      setPortfolio(prev => ({ ...prev, [currentFlow.field]: inputValue }))
      proceedToNextStep(inputValue)
    }

    setInputValue('')
  }

  const handleColorChange = (color: string, field: keyof PortfolioData) => {
    setPortfolio(prev => ({ ...prev, [field]: color }))
    setTimeout(() => {
      proceedToNextStep(`🎨 ${color}`)
    }, 300)
  }

  const renderInput = () => {
    if (currentStep === 0) return null

    const currentFlow = conversationFlow[currentStep - 1]

    if (currentFlow.inputType === 'file') {
      return (
        <div className="chat-input-container">
          <input
            ref={currentFlow.isGallery ? galleryInputRef : fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, currentFlow.isGallery)}
            style={{ display: 'none' }}
          />
          <div className="flex gap-2 w-full">
            <button
              onClick={() => currentFlow.isGallery ? galleryInputRef.current?.click() : fileInputRef.current?.click()}
              className="upload-button"
            >
              <Upload size={18} />
              Upload Image
            </button>
            {currentFlow.isGallery && (
              <button
                onClick={() => {
                  setMessages(prev => [...prev,
                    { type: 'user', content: 'Done' },
                    { type: 'bot', content: '🎉 Your portfolio is complete! You can continue editing anytime.' }
                  ])
                  setCurrentStep(prev => prev + 1)
                }}
                className="done-button"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )
    }

    if (currentFlow.inputType === 'color') {
      return (
        <div className="color-input-container">
          <input
            type="color"
            value={portfolio[currentFlow.field as keyof PortfolioData] as string}
            onChange={(e) => handleColorChange(e.target.value, currentFlow.field!)}
            className="color-picker"
          />
          <span className="color-label">{portfolio[currentFlow.field as keyof PortfolioData]}</span>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit} className="chat-input-container">
        {currentFlow.inputType === 'textarea' ? (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your answer..."
            className="chat-textarea"
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your answer..."
            className="chat-input"
          />
        )}
        <button type="submit" className="send-button">
          <Send size={18} />
        </button>
      </form>
    )
  }

  return (
    <div className="app-container">
      {/* Portfolio Preview */}
      <div className="preview-container" style={{
        backgroundColor: portfolio.bgColor,
        color: portfolio.textColor
      }}>
        {portfolio.template === '' ? (
          <div className="empty-state">
            <Sparkles size={64} style={{ color: portfolio.accentColor }} />
            <h1>Start Building Your Portfolio</h1>
            <p>Click the chat button below to get started!</p>
          </div>
        ) : (
          <div className={`portfolio-${portfolio.template}`}>
            {/* Header */}
            <header className="portfolio-header">
              {portfolio.profileImage && (
                <div className="profile-image-container">
                  <img src={portfolio.profileImage} alt={portfolio.name} className="profile-image" />
                </div>
              )}
              <div className="header-content">
                <h1 className="portfolio-name">{portfolio.name || 'Your Name'}</h1>
                <p className="portfolio-profession" style={{ color: portfolio.accentColor }}>
                  {portfolio.profession || 'Your Profession'}
                </p>
              </div>
            </header>

            {/* Bio Section */}
            {portfolio.bio && (
              <section className="portfolio-section">
                <h2 className="section-title" style={{ color: portfolio.accentColor }}>About Me</h2>
                <p className="bio-text">{portfolio.bio}</p>
              </section>
            )}

            {/* Skills Section */}
            {portfolio.skills.length > 0 && (
              <section className="portfolio-section">
                <h2 className="section-title" style={{ color: portfolio.accentColor }}>Skills</h2>
                <div className="skills-grid">
                  {portfolio.skills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="skill-badge"
                      style={{
                        backgroundColor: portfolio.accentColor + '20',
                        borderColor: portfolio.accentColor
                      }}
                    >
                      <Sparkles size={16} style={{ color: portfolio.accentColor }} />
                      {skill}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery Section */}
            {portfolio.gallery.length > 0 && (
              <section className="portfolio-section">
                <h2 className="section-title" style={{ color: portfolio.accentColor }}>Gallery</h2>
                <div className="gallery-grid">
                  {portfolio.gallery.map((img, idx) => (
                    <div key={idx} className="gallery-item">
                      <img src={img} alt={`Gallery ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Floating Chat Widget */}
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          <MessageCircle size={24} />
        </button>
      )}

      {isOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <div className="chat-header-content">
              <MessageCircle size={20} />
              <span>Portfolio Builder</span>
            </div>
            <button className="close-button" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.type}`}>
                <div className="message-content">
                  {msg.content}
                </div>
                {msg.options && (
                  <div className="options-grid">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        className="option-button"
                        onClick={() => handleTemplateSelect(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            {renderInput()}
          </div>
        </div>
      )}

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          position: relative;
        }

        .preview-container {
          min-height: 100vh;
          padding: 40px 20px;
          transition: all 0.3s ease;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          text-align: center;
          gap: 20px;
          opacity: 0.6;
        }

        .empty-state h1 {
          font-size: 2.5rem;
          font-weight: 700;
        }

        .empty-state p {
          font-size: 1.25rem;
          color: var(--text-light);
        }

        .portfolio-minimal,
        .portfolio-modern,
        .portfolio-creative {
          max-width: 900px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease;
        }

        .portfolio-header {
          text-align: center;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
        }

        .profile-image-container {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid currentColor;
          box-shadow: var(--shadow-lg);
          animation: scaleIn 0.5s ease;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .portfolio-name {
          font-size: 3rem;
          font-weight: 700;
          animation: slideUp 0.5s ease;
        }

        .portfolio-profession {
          font-size: 1.5rem;
          font-weight: 500;
          animation: slideUp 0.5s ease 0.1s backwards;
        }

        .portfolio-section {
          margin: 60px 0;
          padding: 0 20px;
          animation: slideUp 0.5s ease;
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 30px;
          text-align: center;
        }

        .bio-text {
          font-size: 1.125rem;
          line-height: 1.8;
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
        }

        .skills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          max-width: 700px;
          margin: 0 auto;
        }

        .skill-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 12px;
          border: 2px solid;
          font-weight: 500;
          transition: transform 0.2s ease;
          animation: scaleIn 0.3s ease;
        }

        .skill-badge:hover {
          transform: translateY(-2px);
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          max-width: 900px;
          margin: 0 auto;
        }

        .gallery-item {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: transform 0.3s ease;
          animation: scaleIn 0.5s ease;
        }

        .gallery-item:hover {
          transform: scale(1.05);
        }

        .gallery-item img {
          width: 100%;
          height: 250px;
          object-fit: cover;
          display: block;
        }

        .chat-toggle {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          border: none;
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
          z-index: 1000;
        }

        .chat-toggle:hover {
          transform: scale(1.1);
        }

        .chat-widget {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 400px;
          height: 600px;
          background: white;
          border-radius: 20px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          animation: slideUp 0.3s ease;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: white;
          border-radius: 20px 20px 0 0;
        }

        .chat-header-content {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .close-button {
          background: transparent;
          border: none;
          color: white;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .message {
          animation: slideUp 0.3s ease;
        }

        .message-bot .message-content {
          background: #f3f4f6;
          color: var(--text-dark);
          padding: 12px 16px;
          border-radius: 16px 16px 16px 4px;
          max-width: 85%;
          line-height: 1.5;
        }

        .message-user .message-content {
          background: var(--primary);
          color: white;
          padding: 12px 16px;
          border-radius: 16px 16px 4px 16px;
          max-width: 85%;
          margin-left: auto;
          line-height: 1.5;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .option-button {
          padding: 10px 16px;
          border: 2px solid var(--primary);
          background: white;
          color: var(--primary);
          border-radius: 12px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .option-button:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
        }

        .chat-footer {
          padding: 20px;
          border-top: 1px solid var(--border);
        }

        .chat-input-container {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .chat-input,
        .chat-textarea {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid var(--border);
          border-radius: 12px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
          resize: none;
        }

        .chat-input:focus,
        .chat-textarea:focus {
          outline: none;
          border-color: var(--primary);
        }

        .send-button {
          padding: 12px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .send-button:hover {
          background: var(--primary-dark);
        }

        .upload-button {
          flex: 1;
          padding: 12px 20px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .upload-button:hover {
          background: var(--primary-dark);
        }

        .done-button {
          padding: 12px 20px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .done-button:hover {
          background: #059669;
        }

        .color-input-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .color-picker {
          width: 60px;
          height: 45px;
          border: 2px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
        }

        .color-label {
          font-family: monospace;
          font-size: 0.875rem;
          color: var(--text-light);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 768px) {
          .chat-widget {
            width: calc(100vw - 40px);
            height: calc(100vh - 40px);
            bottom: 20px;
            right: 20px;
          }

          .portfolio-name {
            font-size: 2rem;
          }

          .portfolio-profession {
            font-size: 1.25rem;
          }

          .section-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}
