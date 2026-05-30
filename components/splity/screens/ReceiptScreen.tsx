"use client";

import { useState, useEffect, useRef } from "react";
import { useBillStore } from "@/stores/bill-store";
import { Icon } from "@/components/splity/Icon";
import { Dock } from "@/components/splity/Dock";
import { ScreenHead } from "@/components/splity/ScreenHead";
import { scanReceipt } from "@/lib/api";
import { normalizeOcrResponse } from "@/lib/ocr";
import type { StoreReceipt, StoreLineItem } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const r2 = (n: number) => Math.round(n * 100) / 100;

// Subtotal is always derived from items. Total is derived from all fields.
function applyDerived(r: StoreReceipt): StoreReceipt {
  const subtotal = r2(r.items.reduce((s, it) => s + it.price, 0));
  const total = r2(subtotal + r.tax + r.tip - r.discount);
  return { ...r, subtotal, total };
}

function genId() {
  return `item-${Math.random().toString(36).slice(2, 9)}`;
}

// ── ScanUpload ────────────────────────────────────────────────────────────────

function ScanUpload({ onFile }: { onFile: (f: File) => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center px-[18px] pb-6">
      <label className="w-full cursor-pointer">
        <div className="border-2 border-dashed border-sp-hairline-2 rounded-sp-lg flex flex-col items-center gap-4 py-14 bg-sp-surface">
          <div className="w-14 h-14 rounded-full bg-sp-accent-tint flex items-center justify-center">
            <Icon name="camera" size={26} className="text-sp-accent" />
          </div>
          <div className="text-center">
            <div className="text-[16px] font-bold text-sp-text">
              Tap to scan receipt
            </div>
            <div className="text-[13px] text-sp-text-faint mt-1">
              JPG · PNG · HEIC · PDF
            </div>
          </div>
        </div>
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="sr-only"
          data-testid="file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
    </div>
  );
}

// ── ScanLoading ───────────────────────────────────────────────────────────────

function ScanLoading() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4 text-sp-text-dim"
      data-testid="scan-loading"
    >
      <div className="w-10 h-10 border-[2.5px] border-sp-accent border-t-transparent rounded-full animate-spin" />
      <span className="text-[15px] font-semibold">Reading receipt…</span>
    </div>
  );
}

// ── ImageSlot ─────────────────────────────────────────────────────────────────

function ImageSlot({
  src,
  place,
  itemCount,
  onRetake,
}: {
  src: string;
  place: string;
  itemCount: number;
  onRetake: () => void;
}) {
  return (
    <div className="bg-sp-surface border border-sp-hairline rounded-sp-lg p-[13px] flex items-center gap-[13px] mb-4">
      <div className="w-[54px] h-[64px] flex-none rounded-sp-sm overflow-hidden bg-sp-surface-2 border border-sp-hairline">
        <img src={src} alt="Receipt scan" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-sp-text truncate">
          {place || "Receipt"}
        </div>
        <div className="text-[13px] text-sp-text-dim mt-0.5">
          {itemCount} item{itemCount !== 1 ? "s" : ""} detected
        </div>
      </div>
      <button
        onClick={onRetake}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-sp-text-dim border border-sp-hairline-2 rounded-sp-sm px-3 py-2 bg-sp-surface-2"
      >
        <Icon name="camera" size={15} />
        Retake
      </button>
    </div>
  );
}

// ── ItemRow ───────────────────────────────────────────────────────────────────
// The edit container uses onBlur + relatedTarget to detect focus leaving the
// row, so both name and price inputs stay open until the user is truly done.

function ItemRow({
  item,
  isEditing,
  onStartEdit,
  onSave,
  onDelete,
}: {
  item: StoreLineItem;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (name: string, price: number) => void;
  onDelete: () => void;
}) {
  const [localName, setLocalName] = useState(item.name);
  const [localPrice, setLocalPrice] = useState(item.price.toFixed(2));
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  // Sync local state only when edit mode opens (not on every item change).
  useEffect(() => {
    if (isEditing) {
      setLocalName(item.name);
      setLocalPrice(item.price.toFixed(2));
      nameRef.current?.focus();
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  function commitAndClose() {
    onSave(localName.trim() || item.name, parseFloat(localPrice) || 0);
  }

  if (isEditing) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-[10px] border-b border-sp-hairline last:border-0"
        onBlur={(e) => {
          // Only exit when focus leaves the entire row container.
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            commitAndClose();
          }
        }}
      >
        <input
          ref={nameRef}
          className="flex-1 bg-sp-surface-hi rounded-[8px] px-2.5 py-1.5 text-[15px] font-semibold text-sp-text focus:outline-none"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") priceRef.current?.focus();
            if (e.key === "Escape") commitAndClose();
          }}
          aria-label="Item name"
        />
        <input
          ref={priceRef}
          className="w-[72px] bg-sp-surface-hi rounded-[8px] px-2.5 py-1.5 text-[15px] font-bold text-sp-text text-right focus:outline-none font-num"
          value={localPrice}
          onChange={(e) => setLocalPrice(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitAndClose();
            if (e.key === "Escape") commitAndClose();
          }}
          inputMode="decimal"
          aria-label="Item price"
        />
        <button
          onClick={onDelete}
          className="text-sp-text-faint ml-1"
          aria-label={`Delete ${item.name}`}
        >
          <Icon name="x" size={17} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStartEdit}
      className="w-full flex items-center px-4 py-[13px] border-b border-sp-hairline last:border-0 text-left"
    >
      <span className="flex-1 text-[15px] font-semibold text-sp-text">
        {item.name}
      </span>
      <span className="text-sp-text-faint mr-3">
        <Icon name="edit" size={15} />
      </span>
      <span className="font-num text-[15.5px] font-bold text-sp-text min-w-[56px] text-right">
        ${item.price.toFixed(2)}
      </span>
    </button>
  );
}

// ── TotalLine ─────────────────────────────────────────────────────────────────

function TotalLine({
  label,
  value,
  rate,
  strong,
  accent,
  editable,
  onChange,
}: {
  label: string;
  value: number;
  rate?: string;
  strong?: boolean;
  accent?: boolean;
  editable?: boolean;
  onChange?: (v: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [local, setLocal] = useState("");

  const abs = Math.abs(value).toFixed(2);

  return (
    <div
      className={`flex items-center px-4 py-[13px] ${strong ? "" : "border-b border-sp-hairline"}`}
    >
      <span
        className={`flex-1 ${strong ? "text-[17px] font-extrabold" : "text-[15px] font-semibold"} text-sp-text`}
      >
        {label}
      </span>
      {rate && (
        <span className="text-[11px] font-bold tracking-[0.04em] text-sp-accent bg-sp-accent-tint rounded-full px-[8px] py-[3px] mr-2">
          {rate}
        </span>
      )}
      {editable && onChange ? (
        <div className="flex items-center">
          {accent && (
            <span className="text-sp-accent text-[15.5px] font-bold mr-0.5">
              −
            </span>
          )}
          <span
            className={`${accent ? "text-sp-accent" : "text-sp-text"} text-[15.5px] font-bold font-num`}
          >
            $
          </span>
          <input
            className={`w-[64px] bg-transparent text-right focus:outline-none font-bold font-num text-[15.5px] ${accent ? "text-sp-accent" : "text-sp-text"}`}
            value={focused ? local : abs}
            onFocus={() => {
              setLocal(abs);
              setFocused(true);
            }}
            onBlur={() => {
              setFocused(false);
              onChange(parseFloat(local) || 0);
            }}
            onChange={(e) => setLocal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            inputMode="decimal"
            aria-label={label}
          />
        </div>
      ) : (
        <span
          className={`font-num font-bold ${strong ? "text-[20px]" : "text-[15.5px]"} ${accent ? "text-sp-accent" : "text-sp-text"}`}
        >
          {accent && value > 0 ? "−" : ""}${abs}
        </span>
      )}
    </div>
  );
}

// ── ReceiptScreen ─────────────────────────────────────────────────────────────

export function ReceiptScreen() {
  const inputMode = useBillStore((s) => s.inputMode);
  const receipt = useBillStore((s) => s.receipt);
  const setReceipt = useBillStore((s) => s.setReceipt);
  const nextStep = useBillStore((s) => s.nextStep);

  const [status, setStatus] = useState<"uploading" | "scanning" | "reviewing">(
    inputMode === "manual" ? "reviewing" : "uploading"
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    const url = imageUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [imageUrl]);

  // Writes a partial update to the store, auto-deriving subtotal and total.
  function patch(updates: Partial<StoreReceipt>) {
    const next = applyDerived({ ...receipt, ...updates });
    setReceipt(next);
  }

  async function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStatus("scanning");
    setOcrError(null);
    try {
      const raw = await scanReceipt(file);
      const normalized = normalizeOcrResponse(raw);
      patch(normalized);
      setStatus("reviewing");
    } catch {
      setOcrError("Couldn't read the receipt. Enter values manually below.");
      setStatus("reviewing");
    }
  }

  function handleRetake() {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setReceipt({ subtotal: 0, tax: 0, tip: 0, discount: 0, total: 0, place: "", items: [] });
    setStatus("uploading");
  }

  function addItem() {
    const newItem: StoreLineItem = { id: genId(), name: "New item", price: 0 };
    patch({ items: [...receipt.items, newItem] });
    setEditingItemId(newItem.id);
  }

  function saveItem(id: string, name: string, price: number) {
    patch({
      items: receipt.items.map((it) =>
        it.id === id ? { ...it, name, price: r2(price) } : it
      ),
    });
    setEditingItemId(null);
  }

  function deleteItem(id: string) {
    patch({ items: receipt.items.filter((it) => it.id !== id) });
    setEditingItemId(null);
  }

  const taxRate = receipt.subtotal
    ? ((receipt.tax / receipt.subtotal) * 100).toFixed(1) + "%"
    : undefined;
  const tipRate = receipt.subtotal
    ? ((receipt.tip / receipt.subtotal) * 100).toFixed(1) + "%"
    : undefined;

  if (status === "uploading") {
    return (
      <>
        <ScanUpload onFile={handleFile} />
        <Dock
          primary={{
            label: "Enter manually",
            onClick: () => setStatus("reviewing"),
          }}
        />
      </>
    );
  }

  if (status === "scanning") {
    return <ScanLoading />;
  }

  const showImageSlot = inputMode === "scan" && !!imageUrl;

  return (
    <>
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden px-[18px] pb-6"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="animate-sp-in">
          <ScreenHead
            eyebrow="Step 2 · Review"
            title="Check the receipt"
            sub={
              showImageSlot
                ? "OCR filled this in. Tap any value to fix a misread before we do the math."
                : "Enter your items and totals, then tap Looks right to continue."
            }
          />

          {ocrError && (
            <div className="mb-4 bg-sp-surface border border-sp-hairline rounded-sp-md px-4 py-3 text-[13.5px] text-sp-text-dim flex items-start gap-2">
              <Icon
                name="info"
                size={15}
                className="mt-0.5 flex-none text-sp-accent"
              />
              {ocrError}
            </div>
          )}

          {showImageSlot && (
            <ImageSlot
              src={imageUrl!}
              place={receipt.place}
              itemCount={receipt.items.length}
              onRetake={handleRetake}
            />
          )}

          {/* Items card */}
          <div className="bg-sp-surface border border-sp-hairline rounded-sp-lg mb-4 overflow-hidden shadow-sp-card-sm">
            {receipt.items.length === 0 && (
              <p className="px-4 py-[13px] text-[14px] text-sp-text-faint">
                No items yet.
              </p>
            )}
            {receipt.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                isEditing={editingItemId === item.id}
                onStartEdit={() => setEditingItemId(item.id)}
                onSave={(name, price) => saveItem(item.id, name, price)}
                onDelete={() => deleteItem(item.id)}
              />
            ))}
            <button
              onClick={addItem}
              className="w-full flex items-center gap-2 px-4 py-[13px] text-sp-accent text-[14px] font-semibold"
            >
              <Icon name="plus" size={16} />
              Add item
            </button>
          </div>

          {/* Totals card */}
          <div className="bg-sp-surface border border-sp-hairline rounded-sp-lg mb-4 overflow-hidden shadow-sp-card-sm">
            {/* Subtotal: derived from items, read-only */}
            <TotalLine label="Subtotal" value={receipt.subtotal} />
            <TotalLine
              label="Tax"
              value={receipt.tax}
              rate={taxRate}
              editable
              onChange={(v) => patch({ tax: v })}
            />
            <TotalLine
              label="Tip"
              value={receipt.tip}
              rate={tipRate}
              editable
              onChange={(v) => patch({ tip: v })}
            />
            <TotalLine
              label="Discount"
              value={receipt.discount}
              accent
              editable
              onChange={(v) => patch({ discount: v })}
            />
            <div className="mx-4 border-t border-sp-hairline-2" />
            <TotalLine label="Total" value={receipt.total} strong />
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 text-sp-text-dim">
            <Icon name="info" size={15} className="mt-0.5 flex-none" />
            <span className="text-[12.5px] leading-[1.45]">
              Rates are derived from the printed amounts
              {taxRate && tipRate && (
                <>
                  {" — "}tax{" "}
                  <strong className="text-sp-accent">{taxRate}</strong>, tip{" "}
                  <strong className="text-sp-accent">{tipRate}</strong>
                </>
              )}{" "}
              — then applied to each person&apos;s items.
            </span>
          </div>
        </div>
      </div>

      <Dock
        primary={{
          label: (
            <>
              Looks right <Icon name="arrow" size={19} />
            </>
          ),
          onClick: nextStep,
        }}
      />
    </>
  );
}
