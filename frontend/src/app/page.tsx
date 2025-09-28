import React from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-10">

      <h1 className="text-6xl font-[var(--font-bebas-neue)] text-white drop-shadow-lg text-center">
        Welcome to Zen UI
      </h1>

      <p className="text-xl font-[var(--font-poppins)] text-gray-300 max-w-xl text-center">
        A simple page to showcase your beautiful fonts with Wire One as layout font and Zen Loop for buttons.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {["Fast", "Responsive", "Beautiful"].map((feature) => (
          <div key={feature} className="card bg-gray-900 shadow-xl rounded-2xl hover:scale-105 transform transition-transform">
            <div className="card-body items-center text-center">
              <h2 className="card-title text-2xl font-[var(--font-wire-one)] text-purple-400">{feature}</h2>
              <p className="text-gray-400 font-[var(--font-poppins)]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. {feature} design guaranteed!
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6 mt-8">
        <button className="btn btn-primary font-[var(--font-zen-loop)] px-6 py-3">
          Get Started
        </button>
        <button className="btn btn-outline btn-secondary font-[var(--font-zen-loop)] px-6 py-3">
          Learn More
        </button>
      </div>
    </main>
  );
}
