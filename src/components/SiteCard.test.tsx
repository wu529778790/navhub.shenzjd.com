import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SiteCard } from "./SiteCard";
import { useSiteOperations } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/contexts/DataContext", () => ({
  useSiteOperations: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
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
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseSiteOperations = vi.mocked(useSiteOperations);
const mockUseAuth = vi.mocked(useAuth);

describe("SiteCard", () => {
  beforeEach(() => {
    mockUseSiteOperations.mockReturnValue({
      updateSite: vi.fn(),
      deleteSite: vi.fn(),
      addSite: vi.fn(),
    });

    mockUseAuth.mockReturnValue({
      isGuestMode: false,
    } as ReturnType<typeof useAuth>);
  });

  it("点击三点菜单按钮显示编辑和删除选项", () => {
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

    // 点击三点菜单按钮
    const menuButton = screen.getByLabelText("更多操作");
    fireEvent.click(menuButton);

    // 验证菜单出现
    expect(screen.getByRole("menu", { name: "站点操作菜单" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "编辑" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
  });

  it("点击卡片打开链接", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const { container } = render(
      <SiteCard
        id="site-1"
        title="示例站点"
        url="https://example.com"
        favicon=""
        categoryId="default"
        view="grid"
      />
    );

    // 点击卡片容器（通过 class 找到）
    const card = container.querySelector(".site-card")!;
    fireEvent.click(card);

    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer"
    );
    openSpy.mockRestore();
  });
});
