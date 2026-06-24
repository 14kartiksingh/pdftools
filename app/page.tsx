import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import RecentDocuments from "./components/RecentDocuments"

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export default async function HomePage() {
  const session = await auth()
  
  const userFiles = await prisma.file.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  
  const fileCount = await prisma.file.count({
    where: { userId: session?.user?.id }
  })
  
  const storageUsedAggregate = await prisma.file.aggregate({
    where: { userId: session?.user?.id },
    _sum: { fileSize: true }
  })
  const storageUsed = storageUsedAggregate._sum.fileSize || 0
  const storageLimit = 2147483648 // 2GB

  return (
    <main className="max-w-[1440px] mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24">
      {/* Dashboard Sidebar / Status */}
      <aside className="lg:col-span-3 space-y-6">
        {/* Profile Summary */}
        <div className="bg-surface-container p-6 border border-outline-variant rounded-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded bg-surface-variant flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <p className="font-title-md text-title-md leading-tight">{session?.user?.name || 'User'}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">Free Account</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between font-label-md text-label-md uppercase tracking-wider">
              <span className="text-on-surface-variant">Cloud Storage</span>
              <span className="text-primary font-bold">{formatBytes(storageUsed)} / {formatBytes(storageLimit)}</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary-container" style={{ width: `${Math.min((storageUsed/storageLimit)*100, 100)}%` }}></div>
            </div>
          </div>
          <button className="w-full mt-6 border border-outline-variant hover:bg-surface-container-high transition-colors text-on-surface py-2 rounded font-label-md text-label-md uppercase font-bold">
            Manage Files
          </button>
        </div>

        {/* Mini Tool Stats */}
        <div className="bg-surface-container p-6 border border-outline-variant rounded-lg">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md">PDFs Uploaded</span>
              <span className="font-mono-sm text-mono-sm bg-surface-variant px-2 py-0.5 rounded">{fileCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body-md text-body-md">AI Insights</span>
              <span className="font-mono-sm text-mono-sm bg-surface-variant px-2 py-0.5 rounded">0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="lg:col-span-9 space-y-8">
        {/* Quick Actions Grid */}
        <section>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link href="/tools/merge-pdf" className="group flex flex-col items-center justify-center p-4 bg-surface border border-outline-variant hover:border-primary-container transition-all aspect-square rounded-lg text-center">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-surface-container rounded border border-outline-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined">call_merge</span>
              </div>
              <span className="font-title-sm text-title-sm">Merge</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Combine PDFs</span>
            </Link>
            
            <Link href="/tools/split-pdf" className="group flex flex-col items-center justify-center p-4 bg-surface border border-outline-variant hover:border-primary-container transition-all aspect-square rounded-lg text-center">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-surface-container rounded border border-outline-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined">call_split</span>
              </div>
              <span className="font-title-sm text-title-sm">Split</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Separate PDFs</span>
            </Link>

            <Link href="/tools/extract-pages" className="group flex flex-col items-center justify-center p-4 bg-surface border border-outline-variant hover:border-primary-container transition-all aspect-square rounded-lg text-center">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-surface-container rounded border border-outline-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined">file_copy</span>
              </div>
              <span className="font-title-sm text-title-sm">Extract</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Select Pages</span>
            </Link>

            <Link href="/tools/delete-pages" className="group flex flex-col items-center justify-center p-4 bg-surface border border-outline-variant hover:border-primary-container transition-all aspect-square rounded-lg text-center">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-surface-container rounded border border-outline-variant group-hover:bg-error-container group-hover:text-on-error-container transition-colors">
                <span className="material-symbols-outlined">delete</span>
              </div>
              <span className="font-title-sm text-title-sm">Delete</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Remove Pages</span>
            </Link>

            <Link href="/tools/rotate-pdf" className="group flex flex-col items-center justify-center p-4 bg-surface border border-outline-variant hover:border-primary-container transition-all aspect-square rounded-lg text-center">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-surface-container rounded border border-outline-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined">rotate_right</span>
              </div>
              <span className="font-title-sm text-title-sm">Rotate</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Adjust Angle</span>
            </Link>

            <Link href="/tools/optimize-pdf" className="group flex flex-col items-center justify-center p-4 bg-surface border border-outline-variant hover:border-primary-container transition-all aspect-square rounded-lg text-center">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-surface-container rounded border border-outline-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined">compress</span>
              </div>
              <span className="font-title-sm text-title-sm">Optimize</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Rebuild Structure</span>
            </Link>

            <Link href="/tools/pdf-to-image" className="group flex flex-col items-center justify-center p-4 bg-surface border border-outline-variant hover:border-primary-container transition-all aspect-square rounded-lg text-center">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-surface-container rounded border border-outline-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined">image</span>
              </div>
              <span className="font-title-sm text-title-sm">PDF to Image</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Extract JPEGs</span>
            </Link>

            <Link href="/tools/image-to-pdf" className="group flex flex-col items-center justify-center p-4 bg-surface border border-outline-variant hover:border-primary-container transition-all aspect-square rounded-lg text-center">
              <div className="w-12 h-12 mb-3 flex items-center justify-center bg-surface-container rounded border border-outline-variant group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <span className="material-symbols-outlined">collections</span>
              </div>
              <span className="font-title-sm text-title-sm">Image to PDF</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">Combine Images</span>
            </Link>
          </div>
        </section>

        {/* AI CTA Section */}
        <section className="relative overflow-hidden studio-gradient p-8 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-primary-container shadow-2xl">
          <div className="relative z-10 max-w-lg">
            <span className="bg-on-primary-fixed text-primary px-3 py-1 rounded-full font-label-md text-label-md font-bold uppercase tracking-widest border border-primary">Studio Intelligence</span>
            <h3 className="font-display-lg text-display-lg text-white mt-4 leading-tight">Summarize Instantly with AI.</h3>
            <p className="font-body-lg text-body-lg text-primary-fixed mt-2">Extract key insights, action items, and data points from complex documents in seconds. Powered by Studio GPT.</p>
            <button className="mt-8 bg-white text-on-primary-container px-6 py-3 rounded font-label-md text-label-md font-bold uppercase tracking-widest hover:bg-primary-fixed transition-colors">
              Launch AI Tool
            </button>
          </div>
          <div className="relative z-10 w-full md:w-1/3 h-48 md:h-64 flex items-center justify-center opacity-80">
            <span className="material-symbols-outlined text-[120px] text-white/20 animate-pulse">psychology</span>
          </div>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        </section>

        {/* Recent Documents */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg">Recent Documents</h2>
            <button className="text-primary font-label-md text-label-md uppercase font-bold tracking-wider hover:underline">View All</button>
          </div>
          <RecentDocuments initialFiles={userFiles} />
        </section>
      </div>

      <Link href="/tools/merge-pdf" className="fixed bottom-20 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-primary-container text-on-primary-container rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 600" }}>add</span>
        <span className="absolute right-16 bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded text-label-md font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">New PDF</span>
      </Link>
    </main>
  );
}
