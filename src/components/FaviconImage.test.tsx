import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FaviconImage } from "./FaviconImage";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    unoptimized?: boolean;
  }) => (
    <img alt={alt} src={src} {...props} />
  ),
}));

describe("FaviconImage", () => {
  it("在图片加载失败后，src 变化时会重新尝试渲染图片", () => {
    const { rerender } = render(
      <FaviconImage src="https://example.com/first.ico" alt="站点图标" size={24} />
    );

    const initialImage = screen.getByAltText("站点图标");
    fireEvent.error(initialImage);

    expect(screen.queryByAltText("站点图标")).not.toBeInTheDocument();

    rerender(<FaviconImage src="https://example.com/second.ico" alt="站点图标" size={24} />);

    expect(screen.getByAltText("站点图标")).toHaveAttribute(
      "src",
      "https://example.com/second.ico"
    );
  });
});
