/**
 * 可排序站点列表组件 - 使用 @dnd-kit
 */

"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSites } from "@/contexts/SitesContext";
import { SiteCard } from "@/components/SiteCard";
import { AddSiteCard } from "@/components/AddSiteCard";

interface Site {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  sort?: number;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  sort: number;
  sites: Site[];
}

interface SortableSitesProps {
  category: {
    id: string;
    name: string;
    icon?: string;
    sort?: number;
    sites: Array<{
      id: string;
      title: string;
      url: string;
      favicon?: string;
      sort?: number;
    }>;
  };
  allCategories: any[];
  onSiteChange: () => void;
  view?: 'grid' | 'list';
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function SortableSites({ category, allCategories, onSiteChange, view = 'grid' }: SortableSitesProps) {
  const { updateSites, isGuestMode } = useSites();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 拖动 5px 后才开始拖拽，避免误触点击
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = category.sites.findIndex((site) => site.id === active.id);
    const newIndex = category.sites.findIndex((site) => site.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 重新排序站点
    const newSites = [...category.sites];
    const [removed] = newSites.splice(oldIndex, 1);
    newSites.splice(newIndex, 0, removed);

    // 更新排序索引
    newSites.forEach((site, index) => {
      site.sort = index;
    });

    // 更新分类数据
    const newCategories = allCategories.map((c) =>
      c.id === category.id ? { ...c, sites: newSites } : c
    );

    await updateSites(newCategories);
    onSiteChange();
  };

  // 网格视图布局
  if (view === 'grid') {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={category.sites.map((site) => site.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mt-2 w-full">
            {category.sites.map((site) => (
              <SortableItem key={site.id} id={site.id}>
                <SiteCard
                  id={site.id}
                  title={site.title}
                  url={site.url}
                  favicon={site.favicon}
                  categoryId={category.id}
                  index={category.sites.findIndex((s) => s.id === site.id)}
                  onSiteChange={onSiteChange}
                  view="grid"
                />
              </SortableItem>
            ))}

            {/* 添加站点卡片 */}
            {!isGuestMode && (
              <div className="w-[100px] h-[100px] flex-shrink-0">
                <AddSiteCard
                  activeCategory={category.id}
                  onSuccess={onSiteChange}
                  view="grid"
                />
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // 列表视图布局
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={category.sites.map((site) => site.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 mt-2">
          {category.sites.map((site) => (
            <SortableItem key={site.id} id={site.id}>
              <SiteCard
                id={site.id}
                title={site.title}
                url={site.url}
                favicon={site.favicon}
                categoryId={category.id}
                index={category.sites.findIndex((s) => s.id === site.id)}
                onSiteChange={onSiteChange}
                view="list"
              />
            </SortableItem>
          ))}

          {/* 添加站点卡片 */}
          {!isGuestMode && (
            <AddSiteCard
              activeCategory={category.id}
              onSuccess={onSiteChange}
              view="list"
            />
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
