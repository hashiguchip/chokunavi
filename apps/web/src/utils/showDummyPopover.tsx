import { showPopover } from "@/libs/global-popover";

const content = (
  <>
    <p>こちらは雰囲気づくりの飾りです。</p>
    <p className="mt-1 text-[#aaa]">細部まで見ていただきありがとうございます。</p>
  </>
);

/**
 * ダミーリンク用のポップオーバーを表示する
 */
export function showDummyPopover(anchor: HTMLElement): void {
  showPopover({ content, anchor });
}
