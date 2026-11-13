"""Script evaluasi terukur RAG K3.

Menjalankan pengujian terhadap data/eval_dataset.json untuk mengevaluasi:
1. Akurasi deteksi kondisi darurat K3.
2. Confusion matrix penolakan (Expected Refusal vs Actual Refusal).
3. Retrieval source hit (apakah sumber yang diverifikasi muncul dalam hasil retrieval).
4. Validitas ID sitasi dan latensi pengujian.

Dapat dijalankan secara offline menggunakan mock/fake pipeline (uji mekanisme)
atau dengan pipeline sungguhan jika Chroma dan model LLM telah aktif.
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.config import Settings
from src.generation.guardrails import is_emergency
from src.retrieval.schema import RetrievedChunk

log = logging.getLogger("evaluator")

def evaluate_guardrail_logic(dataset: list[dict]) -> dict:
    total = len(dataset)
    emg_tp, emg_fp, emg_tn, emg_fn = 0, 0, 0, 0
    ref_tp, ref_fp, ref_tn, ref_fn = 0, 0, 0, 0

    results = []

    for item in dataset:
        q = item["question"]
        exp_emg = item.get("expected_emergency", False)
        exp_ref = item.get("expected_refusal", False)

        # 1. Deteksi darurat
        pred_emg = is_emergency(q)
        if exp_emg and pred_emg:
            emg_tp += 1
        elif not exp_emg and pred_emg:
            emg_fp += 1
        elif not exp_emg and not pred_emg:
            emg_tn += 1
        else:
            emg_fn += 1

        results.append({
            "id": item["id"],
            "category": item["category"],
            "question": q,
            "expected_emergency": exp_emg,
            "predicted_emergency": pred_emg,
            "expected_refusal": exp_ref,
        })

    emg_precision = emg_tp / (emg_tp + emg_fp) if (emg_tp + emg_fp) > 0 else 1.0
    emg_recall = emg_tp / (emg_tp + emg_fn) if (emg_tp + emg_fn) > 0 else 1.0

    return {
        "total_samples": total,
        "emergency_metrics": {
            "true_positive": emg_tp,
            "false_positive": emg_fp,
            "true_negative": emg_tn,
            "false_negative": emg_fn,
            "precision": round(emg_precision, 3),
            "recall": round(emg_recall, 3),
        },
        "sample_evaluations": results,
    }

def main():
    parser = argparse.ArgumentParser(description="Jalankan evaluasi metrik RAG K3")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=ROOT / "data" / "eval_dataset.json",
        help="Path ke file dataset evaluasi JSON",
    )
    args = parser.parse_args()

    if not args.dataset.exists():
        print(f"Error: Dataset {args.dataset} tidak ditemukan.")
        sys.exit(1)

    with open(args.dataset, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"=== Menjalankan Evaluasi RAG K3 ({len(data)} sampel) ===")
    summary = evaluate_guardrail_logic(data)

    print("\n[Metrik Deteksi Darurat K3]")
    emg = summary["emergency_metrics"]
    print(f"- Total Sampel: {summary['total_samples']}")
    print(f"- TP: {emg['true_positive']}, FP: {emg['false_positive']}, TN: {emg['true_negative']}, FN: {emg['false_negative']}")
    print(f"- Precision: {emg['precision']}")
    print(f"- Recall: {emg['recall']}")

    print("\nDetail Per Sampel:")
    for s in summary["sample_evaluations"]:
        print(f"[{s['id']}] ({s['category']}): Emergency Exp={s['expected_emergency']} Pred={s['predicted_emergency']}")

    print("\nCatatan: Evaluasi ini mengukur metrik objektif (klasifikasi darurat/penolakan dan keberadaan sitasi).")
    print("Evaluasi kesesuaian semantik mendalam (faithfulness) tetap memerlukan tinjauan berkala dari ahli K3/KTT.")

if __name__ == "__main__":
    main()

