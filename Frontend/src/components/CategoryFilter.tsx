import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import {
  Zap,
  Gamepad2,
  Briefcase,
  Heart,
  Globe,
  Film,
  Microscope,
  Landmark,
  Earth,
  Grid3X3
} from "lucide-react";

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

const categories = [
  { id: "all", label: "View All", icon: Grid3X3 },
  { id: "general", label: "General", icon: Globe },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "technology", label: "Technology", icon: Zap },
  { id: "sports", label: "Sports", icon: Gamepad2 },
  { id: "entertainment", label: "Entertainment", icon: Film },
  { id: "health", label: "Health", icon: Heart },
  { id: "science", label: "Science", icon: Microscope },
  { id: "politics", label: "Politics", icon: Landmark },
  { id: "world", label: "World", icon: Earth },
];

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 mt-4 pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selected === cat.id;

          return (
            <motion.div
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onSelect(cat.id)}
                className={`gap-2 whitespace-nowrap ${
                  isSelected ? "shadow-card-hover" : ""
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default CategoryFilter;
