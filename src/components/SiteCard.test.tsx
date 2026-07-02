import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteCard } from "./SiteCard";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";

/**
 * 真实集成测试 - 不使用 Mock
 * 测试 SiteCard 在真实 Context 环境下的行为
 */
describe("SiteCard", () => {
  const renderWithProviders = (props: Parameters<typeof SiteCard>[0]) => {
    return render(
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <SiteCard {...props} />
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    );
  };

  it("点击三点菜单按钮显示编辑和删除选项", () => {
    renderWithProviders({
      id: "site-1",
      title: "示例站点",
      url: "https://example.com",
      favicon: "",
      categoryId: "default",
      view: "grid"
    });

    // 点击三点菜单按钮
    const menuButton = screen.getByLabelText("更多操作");
    fireEvent.click(menuButton);

    // 验证菜单出现（使用 Portal 渲染到 body）
    expect(screen.getByRole("menu", { name: "站点操作菜单" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "编辑" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeInTheDocument();
  });

  it("点击卡片打开链接", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const { container } = renderWithProviders({
      id: "site-1",
      title: "示例站点",
      url: "https://example.com",
      favicon: "",
      categoryId: "default",
      view: "grid"
    });

    // 点击卡片容器
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
