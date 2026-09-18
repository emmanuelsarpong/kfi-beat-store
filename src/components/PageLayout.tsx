import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

export default function PageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground flex flex-col", className)}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
