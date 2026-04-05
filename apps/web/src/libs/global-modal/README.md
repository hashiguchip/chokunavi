# Global Modal Library

zustand ベースのスタック可能なグローバルモーダルライブラリ。
Next.js App Router 対応。

## セットアップ

Root layout に `<GlobalModalHost />` を配置:

```tsx
// app/layout.tsx
import { GlobalModalHost } from "@/libs/global-modal";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GlobalModalHost />
      </body>
    </html>
  );
}
```

## 基本的な使い方

### モーダルを開く

```tsx
import { openModal, closeModal } from "@/libs/global-modal";

// モーダルコンポーネント
function AlertModal({ message }: { message: string }) {
  return (
    <div className="space-y-4">
      <p>{message}</p>
      <button onClick={closeModal}>閉じる</button>
    </div>
  );
}

// 呼び出し側
function MyComponent() {
  const handleClick = () => {
    openModal(AlertModal, { message: "こんにちは！" });
  };

  return <button onClick={handleClick}>モーダルを開く</button>;
}
```

### 確認モーダルの例

```tsx
import { openModal, closeModal } from "@/libs/global-modal";

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
}

function ConfirmModal({ title, message, onConfirm }: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    closeModal();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p>{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={closeModal}
          className="px-4 py-2 rounded bg-gray-200"
        >
          キャンセル
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 rounded bg-blue-500 text-white"
        >
          確認
        </button>
      </div>
    </div>
  );
}

// 使用例
function DeleteButton() {
  const handleDelete = () => {
    openModal(ConfirmModal, {
      title: "削除確認",
      message: "本当に削除しますか？この操作は取り消せません。",
      onConfirm: () => {
        console.log("削除実行");
      },
    });
  };

  return <button onClick={handleDelete}>削除</button>;
}
```

## スタック動作

複数のモーダルを積み上げることができます:

```tsx
import { openModal, closeModal, closeAll } from "@/libs/global-modal";

function ModalA() {
  return (
    <div>
      <h2>モーダル A</h2>
      <button onClick={() => openModal(ModalB)}>
        モーダル B を開く
      </button>
      <button onClick={closeModal}>閉じる</button>
    </div>
  );
}

function ModalB() {
  return (
    <div>
      <h2>モーダル B（A の上に表示）</h2>
      <button onClick={closeModal}>閉じる（B だけ）</button>
      <button onClick={closeAll}>全て閉じる</button>
    </div>
  );
}

// A を開く → B を開く → closeModal() で B だけ閉じる → A が表示される
openModal(ModalA);
```

## API

### `openModal(Component, props?, options?)`

モーダルを開く。スタックに追加される。

```ts
const modalId = openModal(MyModal, { foo: "bar" }, { closeOnEsc: false });
```

**戻り値**: `string` - モーダルID

### `closeModal()`

最上位（一番上）のモーダルを閉じる。

### `closeById(id)`

指定IDのモーダルを閉じる。スタックの途中でも可能。

```ts
const id = openModal(MyModal);
// ...
closeById(id);
```

### `closeAll()`

全てのモーダルを閉じる。

### `replaceModal(Component, props?, options?)`

最上位のモーダルを差し替える。

```ts
// ステップ1 → ステップ2 に遷移（履歴を残さない）
replaceModal(Step2Modal, { data: formData });
```

## Options

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| `scrollLock` | `boolean` | `true` | body のスクロールをロックするか |
| `closeOnEsc` | `boolean` | `true` | ESC キーで閉じるか |
| `closeOnOverlay` | `boolean` | `true` | オーバーレイクリックで閉じるか |

```tsx
// 重要な確認モーダル（誤クリック防止）
openModal(ImportantModal, props, {
  closeOnEsc: false,
  closeOnOverlay: false,
});
```

## GlobalModalHost Props

| Props | 型 | デフォルト | 説明 |
|-------|-----|----------|------|
| `renderAll` | `boolean` | `false` | 全モーダルをレンダリングするか（デフォルトは最上位のみ） |

```tsx
// 全てのモーダルをレンダリング（z-index で積み上げ）
<GlobalModalHost renderAll />
```

## Hooks

zustand store を直接使用することも可能:

```tsx
import { useModalStore } from "@/libs/global-modal";

function ModalCounter() {
  const stack = useModalStore((state) => state.stack);
  return <span>開いているモーダル: {stack.length}</span>;
}
```

## 型安全

`openModal` はジェネリクスで props の型を推論します:

```tsx
interface MyModalProps {
  title: string;
  count: number;
}

function MyModal({ title, count }: MyModalProps) {
  return <div>{title}: {count}</div>;
}

// 型エラー: count が string
openModal(MyModal, { title: "Test", count: "not a number" });

// OK
openModal(MyModal, { title: "Test", count: 42 });
```

## アニメーション

モーダルは開く時にフェードイン + スケールアニメーションが適用されます:
- オーバーレイ: 200ms でフェードイン
- コンテンツ: 200ms で `scale(0.95)` → `scale(1)` + フェードイン

カスタマイズしたい場合は `GlobalModalHost.tsx` の CSS を調整してください。
