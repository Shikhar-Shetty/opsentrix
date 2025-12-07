'use client'
import React from 'react'
import { Activity, LogIn, UserPlus } from 'lucide-react'
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'

function ClerkUI() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-base-300 bg-base-100/80 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {}
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-base-content">OpSentrix</span>
                    </div>

                    {}
                    <div className="flex items-center gap-3">
                        <SignedOut>
                            <SignInButton>
                                <button className="btn btn-ghost btn-sm sm:btn-md gap-2 text-base-content/80 hover:text-base-content font-semibold group">
                                    <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="hidden sm:inline">Sign In</span>
                                </button>
                            </SignInButton>
                            <SignUpButton>
                                <button className="btn btn-primary btn-sm sm:btn-md gap-2 font-semibold shadow-lg hover:shadow-primary/25 transition-all duration-300 group">
                                    <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Sign Up
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-full">
                                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                                    <span className="text-xs font-semibold text-success">Active</span>
                                </div>
                                <UserButton />
                            </div>
                        </SignedIn>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default ClerkUI