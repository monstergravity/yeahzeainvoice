import React, { useState } from 'react';
import { Check, X, Gift, Users, Award, ChevronDown, ArrowRight, Menu, Share2, Copy, Twitter, Facebook, Linkedin, Link as LinkIcon, ShieldAlert, Map, Mail, BrainCircuit, FileSpreadsheet } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-50 border-b border-gray-100 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xl font-bold flex items-center gap-2">
               <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-white font-bold text-xl">Y</div>
               <span>yeahzea<sup className="text-xs text-gray-500 ml-0.5">®</sup></span>
            </button>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('product')} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Product
              </button>
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
                Pricing
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-sm text-gray-500">
              Expense Manager
            </span>
            <button 
                onClick={onEnterApp}
                className="bg-black text-white hover:bg-gray-800 px-6 py-2.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              Try Now
            </button>
            <button className="md:hidden text-gray-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu />
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 py-4 px-6 flex flex-col gap-4 shadow-lg">
                <button onClick={() => scrollToSection('product')} className="text-left text-gray-600 font-medium">Product</button>
                <button onClick={() => scrollToSection('features')} className="text-left text-gray-600 font-medium">Features</button>
                <button onClick={() => scrollToSection('pricing')} className="text-left text-gray-600 font-medium">Pricing</button>
            </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-gray-900 tracking-tight leading-tight">
            Travel Expense & Reimbursement <br className="hidden md:block" /> made simple.
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 mb-6 max-w-3xl mx-auto leading-relaxed">
          Snap a photo, auto-process instantly. The smartest way to manage expenses.
          </p>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Travel Expense Management • Reimbursement Automation • Foreign Invoice Translation • AI Compliance Audit • Automated Travel Expense Reports
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
                onClick={onEnterApp}
                className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 px-8 py-4 rounded-full text-lg font-medium transition-all transform hover:-translate-y-1 shadow-xl"
            >
                Upload Receipt
            </button>
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              View Demo <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Product Showcase / Features 1 */}
      <section id="product" className="py-24 px-6 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">Automate Travel Expense Reimbursement for Asia Business Trips</h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Your employees return from Asia business trips with travel expense receipts in Japanese, Chinese, Korean, or Thai. Finance teams can't understand what was purchased or the expense purpose, causing reimbursement delays and errors. Yeahzea's AI translates foreign invoices, identifies purchase items, and clarifies expense purpose - enabling faster travel expense reimbursement processing.
            </p>
            <div className="flex flex-col gap-3 pt-4">
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={14} /></div>
                    <span><strong>Travel expense automation:</strong> Automates entire travel expense reimbursement workflow</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={14} /></div>
                    <span><strong>Foreign language invoice translation:</strong> Reads travel expense invoices in Japanese, Chinese, Korean, Thai, and more</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={14} /></div>
                    <span><strong>Reimbursement expense identification:</strong> Automatically identifies what was purchased and expense purpose for reimbursement</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={14} /></div>
                    <span><strong>Faster reimbursement processing:</strong> Enables proper accounting and faster travel expense reimbursement</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={14} /></div>
                    <span>Multi-currency travel expense support with automatic conversion</span>
                </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-full blur-3xl opacity-30"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 aspect-square flex flex-col items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                {/* Mock UI Element */}
                <div className="w-full max-w-xs bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                        <span className="text-4xl">🧾</span>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                        <div className="flex justify-between pt-2">
                             <div className="h-3 bg-gray-100 rounded w-1/4"></div>
                             <div className="h-3 bg-green-100 rounded w-1/4"></div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features 2: Auto-generate */}
      <section className="py-24 px-6 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative">
             <div className="absolute -inset-4 bg-gradient-to-l from-orange-100 to-pink-100 rounded-full blur-3xl opacity-30"></div>
             <div className="relative bg-gray-50 rounded-3xl shadow-xl p-8 border border-gray-100 aspect-square flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm mb-4 border border-gray-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Processing Complete</span>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-xs mx-auto">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                            <div className="font-bold text-lg">Expense Report</div>
                            <div className="text-xs bg-gray-100 px-2 py-1 rounded">PDF</div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Total</span> <span className="font-bold">$1,240.50</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Items</span> <span>12</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Status</span> <span className="text-green-600 font-medium">Approved</span></div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">Auto-generate reports.</h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Create comprehensive reimbursement reports in seconds. Supports both PDF and Excel export formats for maximum compatibility.
            </p>
             <button onClick={onEnterApp} className="text-brand-green font-semibold hover:text-green-700 flex items-center gap-2 mt-2 group">
                Try creating a report <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* NEW: AI Analyst Spotlight */}
      <section className="py-24 px-6 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium border border-red-100 mb-2">
                <ShieldAlert size={16} />
                <span>AI Expense Compliance Audit</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">Reduce Travel Expense Costs with AI Reimbursement Audit</h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Yeahzea's AI Analyst automatically scans every travel expense receipt for personal expenses like alcohol and tobacco. When detected, it flags them as non-reimbursable and warns employees before reimbursement processing. This helps small businesses reduce travel expense costs by preventing reimbursement of personal expenses and ensures compliance with company travel expense policies.
            </p>
            <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-600"><ShieldAlert size={12} /></div>
                    <span><strong>Personal expense detection:</strong> Automatically identifies alcohol, tobacco, and other non-reimbursable items</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Check size={12} /></div>
                    <span><strong>Cost reduction:</strong> Prevents erroneous reimbursements and reduces business expenses</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><ShieldAlert size={12} /></div>
                    <span><strong>Compliance assurance:</strong> Ensures company expense policies are followed automatically</span>
                </div>
            </div>
             <button onClick={onEnterApp} className="text-brand-green font-semibold hover:text-green-700 flex items-center gap-2 mt-2 group">
                See AI Audit in action <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-purple-100 to-red-100 rounded-full blur-3xl opacity-30"></div>
             <div className="relative bg-white rounded-3xl shadow-xl p-8 border border-gray-100 aspect-square flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                {/* Mock UI for Audit */}
                <div className="w-full max-w-xs bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gray-900 p-4 flex items-center justify-between text-white">
                        <div className="font-bold flex items-center gap-2">
                             <BrainCircuit size={18} className="text-brand-green" />
                             AI Analyst
                        </div>
                        <div className="text-xs bg-white/20 px-2 py-0.5 rounded">Active</div>
                    </div>
                    <div className="p-4 space-y-4">
                        {/* Item 1: Warning */}
                        <div className="flex gap-3 items-start p-3 bg-red-50 rounded-lg border border-red-100">
                            <div className="mt-0.5 text-red-500"><ShieldAlert size={16} /></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-gray-800">Izakaya Tokyo</span>
                                    <span className="text-sm font-bold text-gray-800">$120</span>
                                </div>
                                <p className="text-xs text-red-600 font-medium">Alcohol detected (Sake)</p>
                            </div>
                        </div>
                        
                        {/* Item 2: Valid */}
                        <div className="flex gap-3 items-start p-3 bg-green-50 rounded-lg border border-green-100 opacity-60">
                            <div className="mt-0.5 text-green-500"><Check size={16} /></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-gray-800">Taxi Service</span>
                                    <span className="text-sm font-bold text-gray-800">$45</span>
                                </div>
                                <p className="text-xs text-green-600">Valid business expense</p>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section - NEW */}
      <section className="py-24 px-6 md:px-8 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Solving Small Business Expense Management Pain Points</h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
              Small businesses struggle with manual expense processing and foreign invoices from Asia trips. Finance teams can't process what they don't understand. Yeahzea automates expense management at low cost, translating foreign invoices and auditing compliance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8">
              <div className="text-4xl mb-4">🌏</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Travel Expense Reimbursement Delays from Foreign Invoices</h3>
              <p className="text-gray-600 leading-relaxed">
                Employees return from Asia business trips with travel expense receipts in Japanese, Chinese, Korean, or Thai. Finance teams can't process reimbursement expenses because they don't know what was purchased or the expense purpose. Yeahzea translates foreign invoices and identifies expense purpose automatically, enabling faster reimbursement.
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8">
              <div className="text-4xl mb-4">⏱️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Manual Travel Expense Processing Delays Reimbursement</h3>
              <p className="text-gray-600 leading-relaxed">
                Small business finance teams waste hours manually processing travel expenses and reimbursement expense data, especially for foreign invoices from Asia trips. This delays reimbursements and creates bottlenecks. Yeahzea automates travel expense and reimbursement management at low cost, reducing processing time by 80% and enabling faster reimbursements.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-8">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Personal Expenses Get Reimbursed</h3>
              <p className="text-gray-600 leading-relaxed">
                Without proper expense audit, personal expenses like alcohol and tobacco get reimbursed, increasing business costs. Yeahzea's AI Analyst automatically detects non-reimbursable items, flags them, and warns employees - helping small businesses reduce expenses and ensure compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Grid (Updated bg to white to alternate) */}
      <section id="features" className="py-24 px-6 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">More Than Just a Receipt Scanner</h2>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    Advanced AI features designed for small business expense management and international business travel.
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* AI Audit */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <ShieldAlert size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">AI Travel Expense Audit & Reimbursement Compliance</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Automatically audits travel expenses and detects personal expenses like alcohol and tobacco on receipts. Flags non-reimbursable items and warns employees before reimbursement processing, helping small businesses reduce travel expense costs and ensure reimbursement policy compliance.
                    </p>
                </div>

                {/* Foreign Invoice Translation */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <BrainCircuit size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Travel Expense Invoice Translation</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Translates travel expense invoices from Asia business trips (Japanese, Chinese, Korean, Thai). Identifies purchase items and expense purpose for reimbursement processing, enabling finance teams to process travel expense receipts that were previously unreadable.
                    </p>
                </div>

                {/* Expense Purpose Identification */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Reimbursement Expense Purpose Identification</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Automatically identifies what was purchased and why from foreign travel expense invoices. Solves the problem of finance teams not understanding reimbursement expense purpose, enabling proper accounting and faster travel expense reimbursement processing.
                    </p>
                </div>

                 {/* Low-Cost Automation */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-brand-green/50 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Map size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Low-Cost Travel Expense & Reimbursement Automation</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        Affordable travel expense and reimbursement automation solution for small businesses. Reduces finance team workload by 80%, eliminates manual travel expense data entry, and streamlines reimbursement workflows - all at a fraction of enterprise expense management solution costs.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 md:px-8 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gray-800 to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">Save time,<br/>get paid faster.</h2>
            <p className="text-xl text-gray-400 leading-relaxed mb-8">
              Ditch the tedious manual spreadsheets. Yeahzea helps you get reimbursed quickly with zero hassle.
            </p>
            <div className="flex gap-8">
                <div>
                    <div className="text-4xl font-bold text-brand-green mb-1">3s</div>
                    <div className="text-sm text-gray-400">Processing Time</div>
                </div>
                <div>
                    <div className="text-4xl font-bold text-brand-green mb-1">99%</div>
                    <div className="text-sm text-gray-400">Accuracy</div>
                </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
             <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[100px] border-b-white/10 backdrop-blur-md transform rotate-45"></div>
             <div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[70px] border-b-brand-green/80 backdrop-blur-md -ml-8 mb-12"></div>
          </div>
        </div>
      </section>

      {/* Registration CTA */}
      <section className="py-32 px-6 md:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">Start worry-free reimbursement.</h2>
          <p className="text-xl text-gray-500 mb-12">Sign up to manage your travel expenses effortlessly today.</p>
          <button 
            onClick={onEnterApp}
            className="bg-black text-white hover:bg-gray-800 px-10 py-5 rounded-full text-lg font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Register Now
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-4 text-gray-900">Pricing Plans</h2>
            <p className="text-xl text-gray-500">Choose between Free or Premium.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 hover:border-gray-200 transition-colors">
              <div className="mb-8">
                <div className="inline-block px-3 py-1 bg-gray-200 rounded-full text-xs font-bold text-gray-600 mb-4">STARTER</div>
                <p className="text-5xl font-bold mb-2 text-gray-900">Free</p>
                <p className="text-gray-500 mb-8">Forever free for individuals.</p>
                
                <div className="space-y-4">
                  <PricingFeature included>Basic OCR Recognition</PricingFeature>
                  <PricingFeature included>20 Receipts / month</PricingFeature>
                  <PricingFeature included>1 Month History Storage</PricingFeature>
                  <PricingFeature included>One-click PDF Generation</PricingFeature>
                  <PricingFeature included>Watermarked Reports</PricingFeature>

                  <div className="pt-6 border-t border-gray-200 mt-6">
                    <p className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Not Included</p>
                    <PricingFeature>Team Collaboration</PricingFeature>
                    <PricingFeature>Custom Categories</PricingFeature>
                    <PricingFeature>Receipt Image Cloud Storage</PricingFeature>
                  </div>
                </div>
              </div>
              <button
                onClick={onEnterApp}
                className="w-full rounded-full py-4 text-base font-medium border border-gray-300 hover:bg-white hover:shadow-md transition-all bg-transparent text-gray-900"
              >
                Try for Free
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-black text-white rounded-3xl p-10 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 bg-brand-green text-white text-xs font-bold px-4 py-1 rounded-bl-xl">RECOMMENDED</div>
              <div className="mb-8 relative z-10">
                <div className="inline-block px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300 mb-4">PREMIUM LITE</div>
                <div className="mb-2">
                  <span className="text-5xl font-bold">$2.99</span>
                  <span className="text-xl text-gray-400">/mo</span>
                </div>
                <p className="text-gray-400 mb-8">or $29/year (save 20%)</p>

                <div className="space-y-4">
                  <PricingFeature included dark>Unlimited Receipts</PricingFeature>
                  <PricingFeature included dark>12 Months History Storage</PricingFeature>
                  <PricingFeature included dark>Custom Category Tags</PricingFeature>
                  <PricingFeature included dark>Batch Upload & Processing</PricingFeature>
                  <PricingFeature included dark>Advanced Excel/PDF Export</PricingFeature>
                  <PricingFeature included dark>AI Compliance Audit</PricingFeature>
                  <PricingFeature included dark>Priority Processing</PricingFeature>
                </div>
              </div>
              <button 
                onClick={onEnterApp}
                className="w-full bg-brand-green text-white hover:bg-green-600 rounded-full py-4 text-base font-bold transition-colors relative z-10"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-32 px-6 md:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6 shadow-lg">
              <Gift size={16} />
              <span>Refer Friends, Both Win</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">Share to Earn Free Credits</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Share Yeahzea on social media. When a friend signs up via your link, both of you get 10 free receipt credits instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <ReferralCard icon={<Users size={32} />} title="Invite Friends" desc="Share your exclusive link with colleagues or friends." />
            <ReferralCard icon={<Check size={32} />} title="Friend Registers" desc="Friend successfully signs up via your link." />
            <ReferralCard icon={<Gift size={32} />} title="Get Rewarded" desc="Both receive 10 free receipt credits automatically." />
          </div>

          <div className="bg-black text-white rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10">
                <Award className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
                <h3 className="text-3xl font-bold mb-4">Monthly Leaderboard Rewards</h3>
                <p className="text-gray-300 mb-8 max-w-lg mx-auto text-lg">Top 10 referrers each month get free Premium access for a year.</p>
                <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="bg-white text-black hover:bg-gray-100 rounded-full px-10 py-4 text-base font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
                >
                  <Share2 size={20} />
                  Start Sharing
                </button>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specs */}
      <section className="py-24 px-6 md:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Technical Security</h2>
            <p className="text-lg text-gray-500">Professional technology you can trust.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StatCard number="99%" title="Scanning Accuracy" desc="Advanced OCR ensures precise data extraction." />
            <StatCard number="<3s" title="Generation Speed" desc="Intelligent algorithms process reports in seconds." />
            <StatCard number="99%" title="Data Security" desc="Bank-grade encryption keeps your data private." />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6 md:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">FAQ</h2>
            <p className="text-lg text-gray-500">Everything you need to know about Yeahzea.</p>
          </div>

          <div className="space-y-4">
            <AccordionItem question="How do I upload receipts?">
                You can upload receipts by taking a photo or uploading a file (JPG, PNG, PDF). The system automatically extracts details like merchant, date, and amount using Google Gemini AI.
            </AccordionItem>
            <AccordionItem question="Does it really generate reports automatically?">
                Yes! Once your receipts are uploaded, Yeahzea automatically organizes them into a report. You can group them by trip and export a professional PDF in one click.
            </AccordionItem>
            <AccordionItem question="Who is Yeahzea for?">
                Yeahzea is perfect for small businesses that need low-cost travel expense and reimbursement automation, especially those with employees traveling to Asia for business. Ideal for small business finance departments struggling with foreign language travel expense invoices, reimbursement expense purpose identification, and manual travel expense processing.
            </AccordionItem>
            <AccordionItem question="How does Yeahzea automate travel expense reimbursement?">
                Yeahzea automates the entire travel expense reimbursement process. Employees upload receipts from business trips, AI translates foreign language invoices, identifies expense purpose for reimbursement, and generates automated travel expense reports. Finance teams can process reimbursements faster with proper accounting details.
            </AccordionItem>
            <AccordionItem question="Can Yeahzea handle travel expenses from Asia business trips?">
                Yes! Yeahzea specializes in processing travel expenses from Asia business trips. It translates foreign language travel expense invoices (Japanese, Chinese, Korean, Thai), identifies what was purchased and the expense purpose for reimbursement, converts currencies automatically, and creates compliant travel expense reports for faster reimbursement processing.
            </AccordionItem>
            <AccordionItem question="How does Yeahzea help with reimbursement expense management?">
                Yeahzea automates reimbursement expense management for small businesses at low cost. It eliminates manual travel expense data entry, translates foreign invoices, identifies reimbursement expense purpose, audits personal expenses, and generates automated reports - reducing reimbursement processing time by 80% and enabling faster reimbursements.
            </AccordionItem>
            <AccordionItem question="Does Yeahzea audit travel expenses for reimbursement compliance?">
                Yes. Yeahzea's AI Analyst automatically audits all travel expenses for reimbursement, detecting personal expenses like alcohol and tobacco. It flags non-reimbursable items, warns employees before reimbursement processing, and ensures compliance with company travel expense policies - helping small businesses reduce costs and prevent erroneous reimbursements.
            </AccordionItem>
            <AccordionItem question="Is Yeahzea affordable for small business travel expense management?">
                Yes! Yeahzea is designed as a low-cost travel expense and reimbursement automation solution for small businesses. It eliminates manual travel expense invoice processing, reduces finance team workload by 80%, and helps prevent erroneous reimbursements - all at an affordable price point compared to enterprise travel expense management solutions.
            </AccordionItem>
            <AccordionItem question="Is my data safe?">
                Absolutely. We use enterprise-grade encryption for all data storage and transmission. We strictly adhere to privacy regulations and never share your data with third parties.
            </AccordionItem>
            <AccordionItem question="What is the difference between Free and Premium?">
                The Free plan gives you 20 receipts/month, perfect for light use. Premium offers unlimited uploads, long-term storage, custom categories, and advanced export features for power users.
            </AccordionItem>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 md:px-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 bg-brand-green rounded-md flex items-center justify-center text-white font-bold text-xs">Y</div>
               <span className="text-xl font-bold text-gray-900">yeahzea</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
                Simplifying expense management for modern teams. Built with love and AI.
            </p>
          </div>

          <div className="flex flex-wrap gap-20">
            <div className="flex flex-col gap-4">
              <h3 className="text-gray-900 font-bold mb-1">Company</h3>
              <FooterLink>About Us</FooterLink>
              <FooterLink>Product</FooterLink>
              <FooterLink>Pricing</FooterLink>
              <FooterLink>Careers</FooterLink>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-gray-900 font-bold mb-1">Support</h3>
              <FooterLink>Help Center</FooterLink>
              <FooterLink>Contact Us</FooterLink>
              <FooterLink>Privacy & Terms</FooterLink>
              <a href="mailto:bryan@whatown.com" className="text-gray-500 text-sm hover:text-brand-green transition-colors">bryan@whatown.com</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-100 text-center md:text-left text-sm text-gray-400">
            © 2024 Yeahzea Inc. All rights reserved.
        </div>
      </footer>
      
      {/* Social Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </div>
  );
};

const ShareModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const referralLink = "https://yeahzea.com/invite/u/goodfoodgramz";
    const shareText = "I use Yeahzea to manage my travel expenses and it's a game changer! Use my link to get 10 free credits.";

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Yeahzea Expense Manager',
                    text: shareText,
                    url: referralLink,
                });
            } catch (err: any) {
                // Catch user cancellation without logging an error
                if (err.name !== 'AbortError') {
                    console.error("Error sharing", err);
                }
            }
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={24} />
                </button>

                <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Invite Friends</h3>
                <p className="text-gray-500 text-center mb-8">Share your link. When they sign up, you both get 10 free credits!</p>

                <div className="space-y-4 mb-8">
                    {typeof navigator.share === 'function' && (
                        <button 
                            onClick={handleNativeShare}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                            <Share2 size={18} />
                            Share via...
                        </button>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                         <a 
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-500 transition-colors group"
                         >
                             <Twitter className="text-gray-700 group-hover:text-blue-500" />
                             <span className="text-xs font-medium">X (Twitter)</span>
                         </a>
                         <a 
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                         >
                             <Facebook className="text-gray-700 group-hover:text-blue-700" />
                             <span className="text-xs font-medium">Facebook</span>
                         </a>
                         <a 
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                         >
                             <Linkedin className="text-gray-700 group-hover:text-blue-600" />
                             <span className="text-xs font-medium">LinkedIn</span>
                         </a>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="bg-white border border-gray-200 rounded p-1.5">
                        <LinkIcon size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs text-gray-400 font-medium uppercase">Your Referral Link</p>
                        <p className="text-sm text-gray-800 truncate font-medium">{referralLink}</p>
                    </div>
                    <button 
                        onClick={handleCopy}
                        className={`p-2 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Components

const PricingFeature: React.FC<{ included?: boolean; children: React.ReactNode; dark?: boolean }> = ({ included, children, dark }) => (
  <div className="flex items-start gap-3">
    {included ? (
      <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${dark ? 'text-brand-green' : 'text-gray-800'}`} />
    ) : (
      <X className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-300" />
    )}
    <span className={`${included ? (dark ? 'text-gray-100' : 'text-gray-700') : 'text-gray-400'}`}>{children}</span>
  </div>
);

const ReferralCard: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-700">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const StatCard: React.FC<{ number: string; title: string; desc: string }> = ({ number, title, desc }) => (
  <div className="text-center p-6">
    <div className="text-5xl font-bold mb-4 text-brand-green">{number}</div>
    <div className="text-lg font-bold mb-2 text-gray-900">{title}</div>
    <p className="text-sm text-gray-500">{desc}</p>
  </div>
);

const AccordionItem: React.FC<{ question: string; children: React.ReactNode }> = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{question}</span>
        <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`px-6 text-gray-600 leading-relaxed transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-48 py-4 border-t border-gray-100' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
};

const FooterLink: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button className="text-gray-500 text-sm hover:text-black transition-colors text-left">
    {children}
  </button>
);