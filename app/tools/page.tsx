import Link from "next/link";
import StudioSection from "../components/ui/StudioSection";
import StudioCard from "../components/ui/StudioCard";

type Tool = { title: string; desc: string; icon: string; href: string; color: string; featured?: boolean };
type Category = { title: string; tools: Tool[] };

export default function ToolsDirectoryPage() {
  const categories: Category[] = [
    {
      title: "AI Tools",
      tools: [
        { title: "Studio GPT", desc: "Summarize & analyze PDFs instantly.", icon: "psychology", href: "/tools/studio-gpt", color: "text-primary", featured: true },
      ]
    },
    {
      title: "Organize PDFs",
      tools: [
        { title: "Merge", desc: "Combine multiple PDFs into one.", icon: "call_merge", href: "/tools/merge-pdf", color: "text-on-surface" },
        { title: "Split", desc: "Separate a PDF into multiple files.", icon: "call_split", href: "/tools/split-pdf", color: "text-on-surface" },
        { title: "Extract", desc: "Extract specific pages from a PDF.", icon: "file_copy", href: "/tools/extract-pages", color: "text-on-surface" },
        { title: "Delete", desc: "Remove pages from a PDF.", icon: "delete", href: "/tools/delete-pages", color: "text-on-surface" },
        { title: "Reorder", desc: "Rearrange pages in a PDF.", icon: "reorder", href: "/tools/reorder", color: "text-on-surface" },
      ]
    },
    {
      title: "Edit PDFs",
      tools: [
        { title: "Rotate", desc: "Rotate pages in a PDF.", icon: "rotate_right", href: "/tools/rotate-pdf", color: "text-on-surface" },
        { title: "Page Numbers", desc: "Add page numbers to your PDF.", icon: "format_list_numbered", href: "/tools/page-numbers", color: "text-on-surface" },
        { title: "Watermark", desc: "Add text or image watermark.", icon: "branding_watermark", href: "/tools/watermark", color: "text-on-surface" },
      ]
    },
    {
      title: "Convert PDFs",
      tools: [
        { title: "Optimize", desc: "Compress and optimize PDF size.", icon: "compress", href: "/tools/optimize-pdf", color: "text-on-surface" },
        { title: "PDF to Image", desc: "Convert PDF pages to JPEGs.", icon: "image", href: "/tools/pdf-to-image", color: "text-on-surface" },
        { title: "Image to PDF", desc: "Convert images to a single PDF.", icon: "collections", href: "/tools/image-to-pdf", color: "text-on-surface" },
      ]
    },
    {
      title: "Security",
      tools: [
        { title: "Protect", desc: "Add a password to a PDF.", icon: "lock", href: "/tools/protect", color: "text-on-surface" },
        { title: "Unlock", desc: "Remove password from a PDF.", icon: "lock_open", href: "/tools/unlock", color: "text-on-surface" },
      ]
    }
  ];

  return (
    <main className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-16 pb-32 animate-in fade-in duration-700 ease-out">
      <Link href="/" className="inline-flex items-center text-primary font-bold uppercase text-label-md hover:underline mb-[-2rem]">
        <span className="material-symbols-outlined mr-2">arrow_back</span>
        Back to Dashboard
      </Link>
      
      {/* Header */}
      <section className="max-w-3xl">
        <h1 className="font-display-lg text-[40px] md:text-[56px] leading-[1.1] text-white mb-4 tracking-tight">
          Tool Directory
        </h1>
        <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed">
          Access the complete suite of PDF Studio utilities.
        </p>
      </section>

      {/* Categories */}
      <div className="space-y-16">
        {categories.map((category, idx) => (
          <StudioSection key={idx} title={category.title}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.tools.map((tool, tIdx) => (
                <Link key={tIdx} href={tool.href} className="group block h-full">
                  <StudioCard hoverable className={`p-6 h-full flex flex-col justify-between ${tool.featured ? 'border-primary/50 bg-gradient-to-br from-surface-container to-surface-container-high' : ''}`}>
                    <div className="flex items-start justify-between mb-8">
                      <span className={`material-symbols-outlined text-[32px] transition-colors ${tool.color} group-hover:text-primary-container`}>
                        {tool.icon}
                      </span>
                      {tool.featured && (
                         <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-mono-sm text-[10px] uppercase tracking-widest border border-primary/20">Featured</span>
                      )}
                      {!tool.featured && (
                         <span className="material-symbols-outlined text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity">
                           arrow_forward
                         </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-title-lg text-title-lg text-white">{tool.title}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">{tool.desc}</p>
                    </div>
                  </StudioCard>
                </Link>
              ))}
            </div>
          </StudioSection>
        ))}
      </div>
    </main>
  );
}
