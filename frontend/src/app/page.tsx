"use client";
import { Activity, Shield, BarChart3, Server, Terminal, ArrowRight, CheckCircle2, Zap, Clock, Globe } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100">
      {}
      <div className="relative overflow-hidden">
        {}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 animate-pulse" style={{ animationDuration: '8s' }}></div>

        {}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.base-content/0.03)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.base-content/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 sm:pt-32 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            {}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full mb-8 hover:bg-primary/20 transition-all duration-300">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-semibold text-base-content">Enterprise Monitoring Platform</span>
            </div>

            {}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-base-content mb-6 leading-tight animate-fade-in">
              Monitor Your Infrastructure
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                With Confidence
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-base-content/70 mb-10 leading-relaxed max-w-2xl mx-auto">
              Deploy lightweight agents across your infrastructure and get real-time insights into performance, health,
              and resource utilization with industry-leading precision.
            </p>

            {}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <a
                href="/dashboard"
                className="btn btn-primary btn-lg gap-2 text-base font-semibold px-8 group hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#features"
                className="btn btn-outline btn-lg gap-2 text-base font-semibold px-8 hover:shadow-lg transition-all duration-300"
              >
                <Terminal className="w-5 h-5" />
                View Demo
              </a>
            </div>

            {}
            <div className="grid grid-cols-3 gap-4 text-secondary sm:gap-8 max-w-3xl mx-auto">
              <div className="card bg-base-200/50 backdrop-blur-sm border border-base-300 p-4 sm:p-6 hover:bg-base-200 transition-all duration-300 hover:scale-105">
                <div className="text-3xl sm:text-4xl text-gray-600 font-bold mb-2">99.9%</div>
                <div className="text-xs sm:text-sm text-base-content/60 uppercase tracking-wide font-semibold">Uptime SLA</div>
              </div>
              <div className="card bg-base-200/50 backdrop-blur-sm border border-base-300 p-4 sm:p-6 hover:bg-base-200 transition-all duration-300 hover:scale-105">
                <div className="text-3xl sm:text-4xl font-bold text-gray-600 mb-2">&lt;50ms</div>
                <div className="text-xs sm:text-sm text-base-content/60 uppercase tracking-wide font-semibold">Latency</div>
              </div>
              <div className="card bg-base-200/50 backdrop-blur-sm border border-base-300 p-4 sm:p-6 hover:bg-base-200 transition-all duration-300 hover:scale-105">
                <div className="text-3xl sm:text-4xl font-bold text-gray-600 mb-2">24/7</div>
                <div className="text-xs sm:text-sm text-base-content/60 uppercase tracking-wide font-semibold">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <div className="badge badge-primary badge-lg mb-4">Features</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-base-content mb-4">
            Everything You Need to Monitor
          </h2>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            Production-grade monitoring with enterprise features, designed for teams of all sizes
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <BarChart3 className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-3">Real-Time Metrics</h3>
            <p className="text-base-content/70 leading-relaxed">
              Monitor CPU, memory, disk, network, and processes with live updates and beautiful, actionable visualizations.
            </p>
          </div>

          <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <Zap className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-3">One-Line Deploy</h3>
            <p className="text-base-content/70 leading-relaxed">
              Deploy agents instantly with a single Docker command. Production-ready in seconds, no complex configuration.
            </p>
          </div>

          <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <Shield className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-3">Enterprise Security</h3>
            <p className="text-base-content/70 leading-relaxed">
              Token-based authentication, encrypted connections, and SOC 2 compliance keep your infrastructure data secure.
            </p>
          </div>

          <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <Clock className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-3">Historical Analytics</h3>
            <p className="text-base-content/70 leading-relaxed">
              Track trends, identify patterns, and analyze performance over time with unlimited data retention.
            </p>
          </div>

          <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <Globe className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-3">Multi-Region Support</h3>
            <p className="text-base-content/70 leading-relaxed">
              Deploy agents globally across multiple regions with unified monitoring and centralized management.
            </p>
          </div>

          <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
              <Server className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-3">Auto-Scaling Ready</h3>
            <p className="text-base-content/70 leading-relaxed">
              Seamlessly scales from a single server to thousands of nodes without performance degradation.
            </p>
          </div>
        </div>
      </div>

      {}
      <div className="bg-base-200 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge badge-primary badge-lg mb-4">Simple Setup</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-base-content mb-4">Get Started in Minutes</h2>
            <p className="text-lg sm:text-xl text-base-content/70">From zero to full monitoring in under 5 minutes</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 max-w-5xl mx-auto">
            <div className="relative">
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-black/20 text-gray-600 rounded-3xl flex items-center justify-center mb-6 text-2xl font-bold shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                  1
                </div>
                <h3 className="text-xl font-bold text-base-content mb-3">Create Agent</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Generate your unique authentication token from the dashboard with a single click
                </p>
              </div>
              <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-black/20 rounded-3xl flex items-center justify-center mb-6 text-2xl font-bold text-gray-600 shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                  2
                </div>
                <h3 className="text-xl font-bold text-base-content mb-3">Deploy Agent</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Run the Docker command on your servers to install and start monitoring instantly
                </p>
              </div>
              <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-black/20 rounded-3xl flex items-center justify-center mb-6 text-2xl font-bold text-gray-600 shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                  3
                </div>
                <h3 className="text-xl font-bold text-base-content mb-3">Monitor & Analyze</h3>
                <p className="text-base-content/70 leading-relaxed">
                  View real-time metrics, set alerts, and gain insights into your infrastructure health
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="badge badge-primary badge-lg mb-4">Developer Friendly</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-base-content mb-6">
              Built for Modern Infrastructure
            </h2>
            <p className="text-lg sm:text-xl text-base-content/70 mb-8 leading-relaxed">
              Whether you&apos;re running a single server or managing thousands of nodes across multiple regions, OpSentrix scales effortlessly with your infrastructure.
            </p>
            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-all duration-300">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-base-content mb-1 text-lg">Lightweight Agents</h4>
                  <p className="text-base-content/70">Minimal resource footprint with &lt;5MB memory usage per agent</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-all duration-300">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-base-content mb-1 text-lg">Advanced Alerting</h4>
                  <p className="text-base-content/70">Customizable thresholds with multi-channel notifications</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-all duration-300">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-base-content mb-1 text-lg">REST API Access</h4>
                  <p className="text-base-content/70">Full API for custom integrations and automation workflows</p>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 shadow-2xl hover:shadow-primary/10 transition-all duration-300">
              <div className="bg-base-300 rounded-xl p-6 border border-base-content/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-neutral" />
                    <span className="text-sm font-mono text-base-content/70 font-semibold">deployment.sh</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-error"></div>
                    <div className="w-3 h-3 rounded-full bg-warning"></div>
                    <div className="w-3 h-3 rounded-full bg-success"></div>
                  </div>
                </div>
                <div className="mockup-code bg-base-100 text-sm">
                  <pre data-prefix="$" className="text-neutral"><code className="text-neutral">docker run -d \</code></pre>
                  <pre data-prefix=""><code className="text-neutral">  --name opsentrix-agent \</code></pre>
                  <pre data-prefix=""><code className="text-neutral">  -e AGENT_TOKEN=&quot;sk_...&quot; \</code></pre>
                  <pre data-prefix=""><code className="text-neutral">  -e AGENT_NAME=&quot;prod-srv-01&quot; \</code></pre>
                  <pre data-prefix=""><code className="text-neutral">  etherealfrost019/opsentrix-agent</code></pre>
                  <pre data-prefix=">" className="text-success"><code>Agent deployed successfully!</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-primary/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Server className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-base-content mb-6">
            Ready to Elevate Your Monitoring?
          </h2>
          <p className="text-lg sm:text-xl text-base-content/70 mb-10 leading-relaxed">
            Join thousands of teams monitoring their infrastructure with OpSentrix. Start your free trial today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="btn btn-primary btn-lg gap-2 text-base font-semibold px-8 group hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/contact"
              className="btn btn-outline btn-lg gap-2 text-base font-semibold px-8 hover:shadow-lg transition-all duration-300"
            >
              Contact Sales
            </a>
          </div>
          <p className="text-sm text-base-content/50 mt-6">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>

      {}
      <footer className="border-t border-base-300 bg-base-200 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold text-base-content">OpSentrix</span>
            </div>
            <p className="text-center text-base-content/60 text-sm max-w-md">
              Enterprise-grade infrastructure monitoring. Real-time insights, minimal overhead.
            </p>
            <div className="flex gap-6 text-sm text-base-content/60">
              <a href="/docs" className="hover:text-primary transition-colors">Documentation</a>
              <a href="/pricing" className="hover:text-primary transition-colors">Pricing</a>
              <a href="/support" className="hover:text-primary transition-colors">Support</a>
              <a href="/privacy" className="hover:text-primary transition-colors">Privacy</a>
            </div>
            <p className="text-xs text-base-content/40 mt-4">
              © 2025 OpSentrix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}