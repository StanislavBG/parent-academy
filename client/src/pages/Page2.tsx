import { useItems } from "@/hooks/use-items";
import { CreateItemDialog } from "@/components/CreateItemDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, AlertCircle, FileText } from "lucide-react";

export default function Page2() {
  const { data: items, isLoading, error } = useItems();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Task Manager</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Track your progress and manage your daily items efficiently.
          </p>
        </div>
        <div className="flex-shrink-0">
          <CreateItemDialog />
        </div>
      </div>

      {/* Content Section */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-[200px] border-border/40 bg-card/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-2/3 rounded-lg" />
                    <Skeleton className="h-6 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-20 w-full rounded-lg" />
                  <Skeleton className="h-4 w-1/3 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-3xl border border-destructive/20 text-center">
            <div className="bg-white p-4 rounded-full shadow-lg mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-destructive mb-2">Failed to load items</h3>
            <p className="text-destructive/80 max-w-md mx-auto">
              We encountered an error while fetching your data. Please check your connection and try again.
            </p>
          </div>
        ) : items?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-secondary/20 rounded-3xl border border-dashed border-border">
            <div className="w-20 h-20 bg-background rounded-full shadow-sm flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold mb-2">No tasks found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              Your list is currently empty. Start by adding a new item to track your progress.
            </p>
            <CreateItemDialog />
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {items?.map((item) => (
              <motion.div key={item.id} variants={itemAnim} layout>
                <Card className="h-full group hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 bg-card border-border/60">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-primary/5 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <Badge 
                        variant={item.completed ? "default" : "outline"}
                        className={item.completed ? "bg-green-500 hover:bg-green-600" : "text-muted-foreground border-border"}
                      >
                        {item.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                      {item.description}
                    </p>

                    <div className="pt-4 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground">
                      <span>ID: #{item.id}</span>
                      <span className="font-medium">Task Item</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
