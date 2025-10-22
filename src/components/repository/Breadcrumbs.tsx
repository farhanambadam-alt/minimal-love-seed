import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Breadcrumbs({ currentPath, onNavigate }: BreadcrumbsProps) {
  const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : [];

  return (
    <nav aria-label="File path navigation" className="bg-secondary/20 rounded-lg px-4 py-3 sm:py-2.5">
      <div className="flex items-center gap-2 sm:gap-1.5 overflow-x-auto scrollbar-thin scroll-smooth">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate("")}
          className="h-9 sm:h-8 px-3 sm:px-2 hover:bg-secondary/70 text-foreground hover:text-foreground touch-manipulation active:scale-95 transition-transform flex-shrink-0 text-sm font-medium"
        >
          <Home className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1.5" />
          <span>Root</span>
        </Button>

        {pathSegments.map((segment, index) => {
          const path = pathSegments.slice(0, index + 1).join('/');
          const isLast = index === pathSegments.length - 1;

          return (
            <div key={path} className="flex items-center gap-2 sm:gap-1.5 flex-shrink-0">
              <span className="text-muted-foreground/70 text-sm font-medium flex-shrink-0">&gt;</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(path)}
                className={`h-9 sm:h-8 px-3 sm:px-2 hover:bg-secondary/70 touch-manipulation active:scale-95 transition-transform text-sm font-medium ${
                  isLast 
                    ? 'text-foreground bg-secondary/50' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="truncate max-w-[140px] sm:max-w-[120px]">{segment}</span>
              </Button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
