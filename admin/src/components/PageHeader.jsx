import React from 'react';

export default function PageHeader({ title, subtitle }) {
  return (
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-950 font-urbanist">
          {title || "Platform Summary Dashboard"}
        </h1>
        <p class="text-sm font-medium text-slate-500 mt-1">
          {subtitle || "Real-time viewer engagement, active subscriptions, revenue growth, and video status."}
        </p>
      </div>
    </div>
  );
}
