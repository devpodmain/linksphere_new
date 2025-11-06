import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, Users, BarChart3, QrCode, Shield, Zap } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Linksphere</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-secondary-600 hover:text-primary-600 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-secondary-600 hover:text-primary-600 transition-colors">
                Pricing
              </a>
              <a href="#support" className="text-secondary-600 hover:text-primary-600 transition-colors">
                Support
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-secondary-600 hover:text-primary-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-secondary-900 mb-6">
                One Link.
                <span className="text-primary-600"> Endless Connections.</span>
              </h1>
              <p className="text-xl text-secondary-600 mb-8 max-w-2xl">
                Create your digital identity with a beautiful profile page that showcases your links, 
                collaborations, and professional presence all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/signup"
                  className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center">
                  View Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-auto">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Smartphone className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">John Doe</h3>
                  <p className="text-primary-100 mb-4">Digital Creator & Entrepreneur</p>
                  <div className="space-y-3">
                    <div className="bg-white/20 rounded-lg p-3 flex items-center">
                      <div className="w-8 h-8 bg-white/30 rounded-full mr-3"></div>
                      <span className="text-sm">Instagram</span>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3 flex items-center">
                      <div className="w-8 h-8 bg-white/30 rounded-full mr-3"></div>
                      <span className="text-sm">LinkedIn</span>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3 flex items-center">
                      <div className="w-8 h-8 bg-white/30 rounded-full mr-3"></div>
                      <span className="text-sm">Portfolio</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Everything you need to build your digital presence
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              From personal branding to business profiles, Linksphere provides all the tools 
              you need to create a professional online presence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">Mobile-First Design</h3>
              <p className="text-secondary-600">
                Your profile looks perfect on any device with our responsive design that adapts to all screen sizes.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <QrCode className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">QR Code Generation</h3>
              <p className="text-secondary-600">
                Generate QR codes for easy sharing and offline promotion of your profile.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">Collaborations</h3>
              <p className="text-secondary-600">
                Showcase your partnerships and collaborations with custom branding and descriptions.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">Analytics</h3>
              <p className="text-secondary-600">
                Track your profile views and link clicks to understand your audience better.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">Secure & Private</h3>
              <p className="text-secondary-600">
                Your data is protected with enterprise-grade security and privacy controls.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">Lightning Fast</h3>
              <p className="text-secondary-600">
                Optimized for speed with global CDN and modern web technologies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Trusted by creators and businesses worldwide
            </h2>
            <p className="text-xl text-secondary-600">
              Join thousands of users who have built their digital presence with Linksphere
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">C</span>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Creator</h3>
              <p className="text-secondary-600 mb-4">
                "Linksphere helped me consolidate all my social media links into one beautiful profile. 
                My engagement increased by 40%!"
              </p>
              <p className="text-sm text-secondary-500">- Sarah Chen, Content Creator</p>
            </div>

            <div className="card text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">B</span>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Business</h3>
              <p className="text-secondary-600 mb-4">
                "Perfect for our team's business cards and email signatures. 
                Professional and easy to update."
              </p>
              <p className="text-sm text-secondary-500">- Mike Johnson, Startup Founder</p>
            </div>

            <div className="card text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">P</span>
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">Professional</h3>
              <p className="text-secondary-600 mb-4">
                "As a freelancer, Linksphere gives me a professional online presence 
                that impresses clients and generates leads."
              </p>
              <p className="text-sm text-secondary-500">- Alex Rodriguez, Freelancer</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start building your digital identity today.
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of users who have already created their perfect online presence.
          </p>
          <Link
            to="/signup"
            className="bg-white text-primary-600 hover:bg-primary-50 font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 inline-flex items-center"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Linksphere</h3>
              <p className="text-secondary-300">
                The ultimate platform for building your digital presence and connecting with your audience.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-secondary-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-secondary-300">
            <p>&copy; 2024 Linksphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


