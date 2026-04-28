import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SiteCard } from "./SiteCard";
import { useSites } from "@/contexts/SitesContext";

vi.mock("@/contexts/SitesContext", () => ({
  useSites: vi.fn(),
}));

vi.mock("@/components/FaviconImage", () => ({
  FaviconImage: ({ alt }: { alt: string }) => <div aria-label={alt} />,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open?: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: { open?: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  AlertDialogAction: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogCancel: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseSites = vi.mocked(useSites);

describe("SiteCard", () => {
  beforeEach(() => {
    mockUseSites.mockReturnValue({
      updateSite: vi.fn(),
      deleteSite: vi.fn(),
      isGuestMode: false,
    } as ReturnType<typeof useSites>);
  });

  it("右键站点卡片时显示自定义菜单", () => {
    render(
      <SiteCard
        id="site-1"
        title="示例站点"
        url="https://example.com"
        favicon=""
        categoryId="default"
        view="grid"
      />
    );

    const card = screen.getByLabelText(/示例站点 - 点击打开链接/);
    fireEvent.contextMenu(card);

    expect(screen.getByRole("menu", { name: "站点操作菜单" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "编辑 示例站点" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除 示例站点" })).toBeInTheDocument();
  });
});
