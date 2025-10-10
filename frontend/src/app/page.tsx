import Link from "next/link"
import { Activity, Shield, BarChart3, Server, Terminal, ArrowRight, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-8">
              <Activity className="w-5 h-5" />
              <span className="text-sm font-semibold">OpSentrix Monitoring</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Monitor Your Infrastructure
              <br />
              <span className="text-gray-300/20">With Confidence</span>
            </h1>

            <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              Deploy lightweight agents across your infrastructure and get real-time insights into performance, health,
              and resource utilization.
            </p>

            <Link
              href="/dashboard"
              className="btn btn-primary btn-lg gap-2 text-base font-semibold px-8 hover:scale-105 transition-transform"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Uptime</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">&lt;50ms</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Response Time</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-base-200 rounded-2xl p-8 border border-base-300 hover:border-primary/50 transition-all">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Real-Time Metrics</h3>
            <p className="text-gray-400 leading-relaxed">
              Monitor CPU, memory, disk, and processes with live updates and beautiful visualizations.
            </p>
          </div>

          <div className="bg-base-200 rounded-2xl p-8 border border-base-300 hover:border-primary/50 transition-all">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Terminal className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">One-Line Deploy</h3>
            <p className="text-gray-400 leading-relaxed">
              Deploy agents instantly with a single Docker command. No complex setup required.
            </p>
          </div>

          <div className="bg-base-200 rounded-2xl p-8 border border-base-300 hover:border-primary/50 transition-all">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Secure by Default</h3>
            <p className="text-gray-400 leading-relaxed">
              Token-based authentication and encrypted connections keep your data safe.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-base-200 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Get Started in 3 Steps</h2>
            <p className="text-xl text-gray-400">From zero to monitoring in under 5 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold text-white shadow-lg shadow-primary/20">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Create Agent</h3>
                <p className="text-gray-400">Click "Add Agent" in the dashboard to generate your unique token</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold text-white shadow-lg shadow-primary/20">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Run Docker Command</h3>
                <p className="text-gray-400">Copy and paste the command on your server to deploy the agent</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 text-2xl font-bold text-white shadow-lg shadow-primary/20">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Start Monitoring</h3>
                <p className="text-gray-400">View real-time metrics and insights in your dashboard immediately</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">Built for Modern Infrastructure</h2>
            <p className="text-xl text-gray-400 mb-8">
              Whether you're running a single server or managing hundreds of nodes, OpSentrix scales with your needs.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Lightweight Agents</h4>
                  <p className="text-gray-400">Minimal resource footprint on your servers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Historical Data</h4>
                  <p className="text-gray-400">Track trends and analyze performance over time</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Beautiful Dashboards</h4>
                  <p className="text-gray-400">Intuitive visualizations that make sense</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-base-200 rounded-2xl p-8 border border-base-300">
            <div className="bg-base-300 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5  text-gray-400" />
                <span className="text-sm font-mono text-gray-400">terminal</span>
              </div>
              <code className="text-sm text-gray-300 font-mono block whitespace-pre-wrap break-all">
                docker run -d \{"\n"}
                {"  "}--name agent-1 \{"\n"}
                {"  "}-e AGENT_TOKEN="your-token" \{"\n"}
                {"  "}-e AGENT_NAME="production-1" \{"\n"}
                {"  "}etherealfrost019/opsentrix-agent:latest
              </code>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-base-200 py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <Server className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Monitor Your Infrastructure?</h2>
          <p className="text-xl text-gray-400 mb-10">Start monitoring in minutes. No credit card required.</p>
          <Link
            href="/dashboard"
            className="btn btn-primary btn-lg gap-2 text-base font-semibold px-8 hover:scale-105 transition-transform"
          >
            Launch Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <footer className="border-t border-base-300 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Activity className="w-6 h-6" />
            <span className="text-xl font-bold text-white">OpSentrix</span>
          </div>
          <p className="text-center text-gray-500 text-sm">Real-time infrastructure monitoring made simple</p>
        </div>
      </footer>
    </div>
  )
}
