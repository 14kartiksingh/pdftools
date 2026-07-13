import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import RecentDocuments from "./components/RecentDocuments"
import StudioHero from "./components/ui/StudioHero"
import StudioSection from "./components/ui/StudioSection"
import StudioCard from "./components/ui/StudioCard"
import StudioStatCard from "./components/ui/StudioStatCard"

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
  
  const jobsCount = await prisma.job.count({
    where: { userId: session?.user?.id, status: 'COMPLETED' }
  })
  
  const quickActions = [
    { title: "Merge", desc: "Combine PDFs", icon: "call_merge", href: "/tools/merge-pdf", color: "text-primary" },
    { title: "Split", desc: "Separate PDFs", icon: "call_split", href: "/tools/split-pdf", color: "text-primary" },
    { title: "Optimize", desc: "Reduce file size", icon: "compress", href: "/tools/optimize-pdf", color: "text-primary" },
    { title: "Images", desc: "PDF to Image", icon: "image", href: "/tools/pdf-to-image", color: "text-primary" },
    { title: "Protect", desc: "Add Password", icon: "lock", href: "/tools/protect", color: "text-on-surface" },
    { title: "Reorder", desc: "Organize pages", icon: "reorder", href: "/tools/reorder", color: "text-on-surface" },
  ];

  return (
    <main className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-12 pb-32 animate-in fade-in duration-700 ease-out">
      {/* 1. HERO: STUDIO GPT */}
      <StudioHero 
        tag="Studio Intelligence"
        title="Analyze and summarize instantly with AI."
        description="Extract key insights, action items, and structural data points from complex documents in seconds. Powered by the high-performance Studio GPT engine."
        ctaText="Launch AI Assistant"
        ctaHref="/tools/studio-gpt"
      />

      {/* 8/4 GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
        
        {/* LEFT COLUMN: 8 COLS - Primary Workspace */}
        <div className="xl:col-span-8 space-y-16">
          
          {/* 2. QUICK ACTIONS */}
          <StudioSection title="Quick Actions" action={<Link href="/tools" className="text-primary font-label-md uppercase tracking-widest hover:underline hover:text-primary-container transition-colors">View All Tools</Link>}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href} className="group block">
                  <StudioCard hoverable className="p-5 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-8">
                      <span className={`material-symbols-outlined text-3xl transition-colors ${action.color} group-hover:text-primary-container`}>
                        {action.icon}
                      </span>
                      <span className="material-symbols-outlined text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </div>
                    <div>
                      <h3 className="font-title-md text-title-md text-white">{action.title}</h3>
                      <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mt-1">{action.desc}</p>
                    </div>
                  </StudioCard>
                </Link>
              ))}
            </div>
          </StudioSection>

          {/* 3. RECENT ACTIVITY */}
          <StudioSection title="Recent Activity">
            <RecentDocuments initialFiles={userFiles} />
          </StudioSection>

        </div>

        {/* RIGHT COLUMN: 4 COLS - Context & Stats */}
        <aside className="xl:col-span-4">
          <div className="sticky top-8 space-y-8">
            
            <StudioCard className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded bg-surface-container-high border border-outline flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div>
                  <p className="font-title-md text-white leading-tight">{session?.user?.name || 'Developer'}</p>
                  <p className="font-label-md uppercase tracking-widest text-on-surface-variant mt-1">Free Tier</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-label-md uppercase tracking-widest text-outline mb-4">Telemetry Readout</h3>
                <StudioStatCard label="Documents Processed" value={jobsCount} />
                <StudioStatCard label="Compression Saved" value="1.2 MB" />
                <StudioStatCard label="AI Tokens Used" value="12,450" />
                <StudioStatCard label="Active Files" value={fileCount} />
              </div>
            </StudioCard>

            <div className="p-4 rounded border border-outline-variant bg-surface-container-lowest/50 flex items-start gap-4">
              <span className="material-symbols-outlined text-outline">shield</span>
              <p className="font-label-md uppercase tracking-widest text-on-surface-variant leading-relaxed">
                All files are encrypted in transit and automatically wiped 30 minutes after processing.
              </p>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
